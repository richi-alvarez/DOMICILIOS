import { retryStrategy } from './retry-strategy'
import { PromptsService } from './prompts-service'
import { AIProviderFactory } from './factory'
import { getRecommendedModel, getTaskRecommendation } from './task-recommendations'
import { parseAIJson } from './parse-json'
import type { SupportedProvider } from './types/ai-provider'

export interface ProductColor {
  name: string
  hex: string
}

export interface ExtractedProduct {
  name: string
  description: string
  price: number
  category: string
  confidence?: number
  /** Caja de la foto del producto: [x0, y0, x1, y1] en fracciones 0..1. */
  box?: [number, number, number, number]
  /** Colores detectados (solo si el producto muestra opciones de color). */
  colors?: ProductColor[]
  /** Tallas detectadas (solo si el producto muestra tallas). */
  sizes?: string[]
}

export interface MenuExtractionResult {
  success: boolean
  products: ExtractedProduct[]
  totalProducts: number
  categories: string[]
  confidence: number
  error?: string
  provider?: SupportedProvider
  attempts?: number
  providersUsed?: string[]
  timeMs?: number
}

/**
 * Normaliza la caja devuelta por el modelo a [x0,y0,x1,y1] en fracciones 0..1.
 * Tolera escala 0..1000 (estilo Gemini) y descarta cajas inválidas.
 */
function normalizeBox(raw: unknown): [number, number, number, number] | undefined {
  if (!Array.isArray(raw) || raw.length !== 4) return undefined
  let nums = raw.map((n) => Number(n))
  if (nums.some((n) => !isFinite(n))) return undefined

  // Si parece estar en escala 0..1000 (o píxeles grandes), normaliza dividiendo.
  if (nums.some((n) => n > 1.5)) {
    const scale = Math.max(...nums)
    if (scale > 0) nums = nums.map((n) => n / scale)
  }

  let [x0, y0, x1, y1] = nums
  // Asegura orden correcto y recorta a [0,1].
  if (x1 < x0) [x0, x1] = [x1, x0]
  if (y1 < y0) [y0, y1] = [y1, y0]
  x0 = Math.max(0, Math.min(1, x0))
  y0 = Math.max(0, Math.min(1, y0))
  x1 = Math.max(0, Math.min(1, x1))
  y1 = Math.max(0, Math.min(1, y1))

  // Descarta cajas degeneradas (muy pequeñas).
  if (x1 - x0 < 0.02 || y1 - y0 < 0.02) return undefined
  return [x0, y0, x1, y1]
}

/** Normaliza el array de colores devuelto por el modelo. undefined si no hay. */
function normalizeColors(raw: unknown): { name: string; hex: string }[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined
  const out: { name: string; hex: string }[] = []
  for (const c of raw) {
    const name = c?.name ? String(c.name).trim() : ''
    let hex = c?.hex ? String(c.hex).trim() : ''
    if (hex && !hex.startsWith('#')) hex = `#${hex}`
    // Valida hex tipo #RGB o #RRGGBB; si no, usa gris neutro pero conserva el nombre.
    if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex)) hex = '#cccccc'
    if (name || hex) out.push({ name: name || 'Color', hex })
  }
  return out.length ? out : undefined
}

/** Normaliza el array de tallas. undefined si no hay. */
function normalizeSizes(raw: unknown): string[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined
  const out = raw.map((s) => String(s).trim()).filter((s) => s.length > 0)
  return out.length ? Array.from(new Set(out)) : undefined
}

export interface MenuExtractionOptions {
  imageBase64?: string
  imageUrl?: string
  imagePath?: string
  imageType?: 'jpeg' | 'png' | 'gif' | 'webp'
  verbose?: boolean
  customProvider?: SupportedProvider
}

/**
 * Servicio de extracción de productos de menús/imágenes
 * Soporta múltiples proveedores con fallback automático
 */
export class MenuExtractionService {
  /**
   * Extrae productos de una imagen de menú con reintentos inteligentes
   */
  static async extractFromImage(
    imageData: string,
    imageType: string = 'image/jpeg',
    options: MenuExtractionOptions = {},
  ): Promise<MenuExtractionResult> {
    const startTime = Date.now()
    const normalizedType = imageType.startsWith('image/') ? imageType : `image/${imageType}`

    try {
      // Vía PREFERENTE: detección nativa de Gemini (box_2d). Da cajas ajustadas
      // SOLO al envase (texto/precio excluidos), imposible de lograr con el modo
      // chat. Si falla o no está GEMINI_API_KEY, se cae al multi-proveedor.
      if (!options.customProvider) {
        const native = await this.extractWithGeminiNative(imageData, normalizedType, options.verbose)
        if (native && native.length) {
          return {
            success: true,
            products: native,
            totalProducts: native.length,
            categories: [...new Set(native.map((p) => p.category))],
            confidence: 0.9,
            provider: 'gemini',
            attempts: 1,
            providersUsed: ['gemini-native'],
            timeMs: Date.now() - startTime,
          }
        }
      }

      // Definir orden de proveedores según task-recommendations.ts (no según .env)
      const rec = getTaskRecommendation('menu-extraction')
      const recommendedOrder: SupportedProvider[] = options.customProvider
        ? [options.customProvider]
        : [rec.primary, ...rec.fallbacks]

      let lastError = 'No error recorded'
      let lastAttempt = 0

      for (const provider of recommendedOrder) {
        lastAttempt++

        if (options.verbose) {
          console.log(
            `[MenuExtraction] Attempt ${lastAttempt} with ${provider}`,
          )
        }

        try {
          const aiProvider = AIProviderFactory.getProvider(provider)

          if (!aiProvider.isConfigured()) {
            throw new Error(`Provider ${provider} not configured`)
          }

          // Construir mensaje con imagen
          const systemPrompt = PromptsService.getMenuExtractionSystemPrompt()
          const userMessage = PromptsService.getMenuExtractionUserMessage(
            'imagen de catálogo/menú',
          )

          // La imagen se envía como contenido multimodal; cada proveedor la
          // adapta a su formato (image_url / inlineData / image block).
          const response = await aiProvider.generate({
            systemPrompt,
            userMessage,
            model: getRecommendedModel(provider, 'menu-extraction'),
            maxTokens: 4096,
            imageBase64: imageData,
            imageType: normalizedType as
              | 'image/jpeg'
              | 'image/png'
              | 'image/webp'
              | 'image/gif',
          })

          if (!response.success) {
            lastError = response.error || 'Unknown error'
            if (options.verbose) {
              console.warn(
                `[MenuExtraction] ${provider} failed: ${lastError}`,
              )
            }
            continue
          }

          if (!response.content) {
            lastError = 'Empty response'
            continue
          }

          // Parsear respuesta JSON
          const parsed = this.parseExtractionResponse(response.content)

          return {
            success: true,
            products: parsed.products,
            totalProducts: parsed.totalProducts,
            categories: parsed.categories,
            confidence: parsed.confidence,
            provider,
            attempts: lastAttempt,
            providersUsed: recommendedOrder.slice(0, lastAttempt),
            timeMs: Date.now() - startTime,
          }
        } catch (error) {
          lastError = error instanceof Error ? error.message : String(error)

          if (options.verbose) {
            console.error(
              `[MenuExtraction] ${provider} error: ${lastError}`,
            )
          }
        }

        // Esperar antes del siguiente intento
        if (lastAttempt < recommendedOrder.length) {
          await this.delay(500)
        }
      }

      return {
        success: false,
        products: [],
        totalProducts: 0,
        categories: [],
        confidence: 0,
        error: `All ${lastAttempt} attempts failed. Last error: ${lastError}`,
        attempts: lastAttempt,
        providersUsed: recommendedOrder.slice(0, lastAttempt),
        timeMs: Date.now() - startTime,
      }
    } catch (error) {
      return {
        success: false,
        products: [],
        totalProducts: 0,
        categories: [],
        confidence: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        timeMs: Date.now() - startTime,
      }
    }
  }

  /**
   * Extracción con la API NATIVA de Gemini (generateContent). Usa la capacidad
   * de detección de objetos (box_2d) que devuelve cajas ceñidas SOLO al envase,
   * por producto, junto con sus datos. Devuelve null si no hay clave o falla
   * (para que el llamador caiga al multi-proveedor). El box_2d viene como
   * [ymin, xmin, ymax, xmax] en 0..1000 y se convierte a [x0,y0,x1,y1] 0..1.
   */
  static async extractWithGeminiNative(
    imageBase64: string,
    mimeType: string,
    verbose = false,
  ): Promise<ExtractedProduct[] | null> {
    const key = process.env.GEMINI_API_KEY
    if (!key) return null
    const model = process.env.GEMINI_VISION_MODEL || 'gemini-2.5-flash-lite'
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`
    const body = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: PromptsService.getMenuExtractionDetectionPrompt() },
            { inlineData: { mimeType, data: imageBase64 } },
          ],
        },
      ],
      generationConfig: { temperature: 0, maxOutputTokens: 8192 },
    }

    try {
      let data: any = null
      for (let attempt = 0; attempt < 4; attempt++) {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        data = await res.json().catch(() => null)
        if (data?.error?.code === 503) {
          // Modelo sobrecargado: reintenta con backoff.
          await this.delay(3000)
          continue
        }
        break
      }

      if (data?.error) {
        if (verbose) console.warn('[MenuExtraction] Gemini native error:', data.error.message)
        return null
      }

      const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text
      if (!text) return null

      // Extracción robusta del array JSON (puede venir con fences/markdown).
      const start = text.indexOf('[')
      const end = text.lastIndexOf(']')
      if (start < 0 || end < 0) return null
      const arr = JSON.parse(text.slice(start, end + 1))
      if (!Array.isArray(arr)) return null

      const products: ExtractedProduct[] = []
      for (const p of arr) {
        const name = p?.name ? String(p.name).trim() : ''
        if (!name) continue

        let price = 0
        if (typeof p.price === 'number') price = p.price
        else if (p.price != null) {
          const mm = String(p.price).match(/\d+\.?\d*/)
          if (mm) price = parseFloat(mm[0])
        }

        // box_2d [ymin,xmin,ymax,xmax] 0..1000 → [x0,y0,x1,y1] fracciones 0..1
        let box: [number, number, number, number] | undefined
        const b = p.box_2d || p.box
        if (Array.isArray(b) && b.length === 4) {
          const [ymin, xmin, ymax, xmax] = b.map(Number)
          box = normalizeBox([xmin / 1000, ymin / 1000, xmax / 1000, ymax / 1000])
        }

        products.push({
          name,
          description: p.description ? String(p.description).trim() : '',
          price: isNaN(price) ? 0 : price,
          category: p.category ? String(p.category).trim() : 'General',
          box,
          colors: normalizeColors(p.colors),
          sizes: normalizeSizes(p.sizes),
        })
      }

      if (verbose) console.log(`[MenuExtraction] Gemini native: ${products.length} productos`)
      return products.length ? products : null
    } catch (err) {
      if (verbose) console.error('[MenuExtraction] Gemini native failed:', err)
      return null
    }
  }

  /**
   * Parsea la respuesta JSON de extracción
   */
  private static parseExtractionResponse(content: string): {
    products: ExtractedProduct[]
    totalProducts: number
    categories: string[]
    confidence: number
  } {
    try {
      // parseAIJson limpia fences markdown y extrae el primer bloque JSON.
      const parsed = parseAIJson<any>(content)
      // Acepta tanto un array suelto [...] como el objeto { products: [...] }.
      const rawList: any[] = Array.isArray(parsed) ? parsed : parsed?.products || []

      const products: ExtractedProduct[] = rawList.map((p: any) => {
        let price = 0
        if (typeof p.price === 'number') {
          price = p.price
        } else if (p.price != null) {
          const match = String(p.price).match(/\d+\.?\d*/)
          if (match) price = parseFloat(match[0])
        }
        return {
          name: p.name ? String(p.name).trim() : '',
          description: p.description ? String(p.description).trim() : '',
          price: isNaN(price) ? 0 : price,
          category: p.category ? String(p.category).trim() : 'General',
          confidence: p.confidence,
          box: normalizeBox(p.box),
          colors: normalizeColors(p.colors),
          sizes: normalizeSizes(p.sizes),
        }
      })

      const categories = Array.isArray(parsed?.categories)
        ? parsed.categories
        : [...new Set(products.map((p) => p.category))]

      return {
        products,
        totalProducts: products.length,
        categories,
        confidence: typeof parsed?.confidence === 'number' ? parsed.confidence : 0.9,
      }
    } catch (error) {
      console.error('[MenuExtraction] Failed to parse response:', error)
      return {
        products: [],
        totalProducts: 0,
        categories: [],
        confidence: 0,
      }
    }
  }

  /**
   * Valida y procesa los productos extraídos
   */
  static validateAndProcessProducts(
    products: ExtractedProduct[],
  ): {
    valid: ExtractedProduct[]
    invalid: ExtractedProduct[]
  } {
    const valid: ExtractedProduct[] = []
    const invalid: ExtractedProduct[] = []

    for (const product of products) {
      if (
        product.name &&
        product.name.trim().length > 0 &&
        product.price >= 0
      ) {
        valid.push(product)
      } else {
        invalid.push(product)
      }
    }

    return { valid, invalid }
  }

  /**
   * Agrupa productos por categoría
   */
  static groupProductsByCategory(
    products: ExtractedProduct[],
  ): Record<string, ExtractedProduct[]> {
    const grouped: Record<string, ExtractedProduct[]> = {}

    for (const product of products) {
      const category = product.category || 'General'
      if (!grouped[category]) {
        grouped[category] = []
      }
      grouped[category].push(product)
    }

    return grouped
  }

  /**
   * Calcula estadísticas de precios
   */
  static calculatePriceStats(products: ExtractedProduct[]): {
    min: number
    max: number
    average: number
    median: number
    count: number
  } {
    if (products.length === 0) {
      return { min: 0, max: 0, average: 0, median: 0, count: 0 }
    }

    const prices = products
      .filter((p) => p.price > 0)
      .map((p) => p.price)
      .sort((a, b) => a - b)

    const min = prices[0] || 0
    const max = prices[prices.length - 1] || 0
    const average = prices.reduce((a, b) => a + b, 0) / prices.length
    const median =
      prices.length % 2 === 0
        ? (prices[Math.floor(prices.length / 2) - 1] +
            prices[Math.floor(prices.length / 2)]) /
          2
        : prices[Math.floor(prices.length / 2)]

    return {
      min,
      max,
      average,
      median,
      count: prices.length,
    }
  }

  private static delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
