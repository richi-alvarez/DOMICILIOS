import { retryStrategy } from './retry-strategy'
import { PromptsService } from './prompts-service'
import { AIProviderFactory } from './factory'
import { getRecommendedModel } from './task-recommendations'
import type { SupportedProvider } from './types/ai-provider'

export interface ExtractedProduct {
  name: string
  description: string
  price: number
  category: string
  confidence?: number
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

    try {
      // Definir orden de proveedores
      const recommendedOrder: SupportedProvider[] = options.customProvider
        ? [options.customProvider]
        : ['anthropic', 'gemini', 'openai']

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
            'imagen de menú',
          )

          // Para proveedores que soportan vision, se debe manejar de forma específica
          // Este es un patrón base que debe ser extendido por cada proveedor
          const response = await aiProvider.generate({
            systemPrompt,
            userMessage,
            model: getRecommendedModel(provider, 'menu-extraction'),
            maxTokens: 4096,
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
   * Parsea la respuesta JSON de extracción
   */
  private static parseExtractionResponse(content: string): {
    products: ExtractedProduct[]
    totalProducts: number
    categories: string[]
    confidence: number
  } {
    try {
      const parsed = JSON.parse(content)

      return {
        products: (parsed.products || []).map((p: any) => ({
          name: p.name || '',
          description: p.description || '',
          price: typeof p.price === 'number' ? p.price : 0,
          category: p.category || 'General',
          confidence: p.confidence,
        })),
        totalProducts: parsed.totalProducts || 0,
        categories: parsed.categories || [],
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
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
