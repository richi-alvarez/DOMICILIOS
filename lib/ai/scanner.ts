/**
 * Hybrid OCR + Vision AI Scanner
 * Orquesta el flujo completo de escaneo: OCR → AI Vision → normalización
 */

import { getOCRProvider } from '@/lib/ocr'
import { getAIProvider } from '@/lib/ai/providers'
import { validateAndNormalizeProducts } from '@/lib/validators'
import type { Product } from '@/lib/validators'
import type { RawProduct } from '@/lib/ai/providers/types'

export interface ScanOptions {
  /** Proveedor OCR a usar */
  ocrProvider?: 'tesseract' | 'paddleocr'
  /** Proveedor IA a usar */
  aiProvider?: 'claude' | 'openai'
  /** Idioma de OCR (default: 'spa') */
  language?: string
  /** Callback de progreso */
  onProgress?: (status: ScanProgressEvent) => void
}

export interface ScanProgressEvent {
  type:
    | 'file-start'
    | 'file-complete'
    | 'ocr-start'
    | 'ocr-complete'
    | 'ai-start'
    | 'ai-complete'
    | 'validation-start'
    | 'validation-complete'
    | 'error'
  fileName?: string
  pageNumber?: number
  totalPages?: number
  ocrText?: string
  productsDetected?: number
  error?: string
  processingTimeMs?: number
}

/**
 * Procesa una imagen individual a través del pipeline híbrido
 */
async function processSingleImage(
  file: File,
  options: ScanOptions = {},
): Promise<Product[]> {
  const { language = 'spa', onProgress } = options

  onProgress?.({
    type: 'ocr-start',
    fileName: file.name,
  })

  try {
    // 1. Convierte archivo a base64
    const buffer = await file.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')

    // 2. OCR extraction
    const ocrProvider = await getOCRProvider(options.ocrProvider || 'tesseract')
    const ocrResult = await ocrProvider.extractText(base64, language)

    onProgress?.({
      type: 'ocr-complete',
      fileName: file.name,
      ocrText: ocrResult.text.substring(0, 200),
      processingTimeMs: ocrResult.processingTime,
    })

    // 3. AI Vision extraction
    onProgress?.({
      type: 'ai-start',
      fileName: file.name,
    })

    const aiProvider = await getAIProvider(options.aiProvider || 'claude')
    const rawProducts = await aiProvider.extractProducts({
      image: base64,
      ocrText: ocrResult.text,
      metadata: {
        fileName: file.name,
        detectedLanguage: ocrResult.detectedLanguage || language,
      },
    })

    onProgress?.({
      type: 'ai-complete',
      fileName: file.name,
      productsDetected: rawProducts.length,
    })

    // 4. Validación y normalización
    onProgress?.({
      type: 'validation-start',
      fileName: file.name,
    })

    const validated = validateAndNormalizeProducts(rawProducts)

    onProgress?.({
      type: 'validation-complete',
      fileName: file.name,
      productsDetected: validated.length,
    })

    return validated
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    onProgress?.({
      type: 'error',
      fileName: file.name,
      error: errorMsg,
    })
    throw error
  }
}

/**
 * Elimina duplicados de un array de productos
 * Usa nombre y precio como clave de deduplicación
 */
function deduplicateProducts(products: Product[]): Product[] {
  const seen = new Set<string>()
  const deduplicated: Product[] = []

  for (const product of products) {
    // Clave: nombre normalizado + precio
    const key = `${product.name.toLowerCase().trim()}|${product.price}`

    if (!seen.has(key)) {
      seen.add(key)
      deduplicated.push(product)
    }
  }

  return deduplicated
}

/**
 * Escanea múltiples archivos (imágenes) a través del pipeline híbrido
 */
export async function scanMenuImages(
  files: File[],
  options: ScanOptions = {},
): Promise<Product[]> {
  const allProducts: Product[] = []

  for (const file of files) {
    options.onProgress?.({
      type: 'file-start',
      fileName: file.name,
    })

    try {
      const products = await processSingleImage(file, options)
      allProducts.push(...products)

      options.onProgress?.({
        type: 'file-complete',
        fileName: file.name,
        productsDetected: products.length,
      })
    } catch (error) {
      console.error(`[Scanner] Error processing ${file.name}:`, error)
      // Continúa con el siguiente archivo
    }
  }

  // Deduplica productos finales
  const deduplicated = deduplicateProducts(allProducts)

  return deduplicated
}

/**
 * Estadísticas de procesamiento
 */
export interface ScanStats {
  totalFiles: number
  totalProductsDetected: number
  totalProductsNormalized: number
  totalDuplicatesRemoved: number
  processingTimeMs: number
  errorCount: number
}

/**
 * Escanea con estadísticas detalladas
 */
export async function scanMenuImagesWithStats(
  files: File[],
  options: ScanOptions = {},
): Promise<{ products: Product[]; stats: ScanStats }> {
  const startTime = Date.now()
  const stats: ScanStats = {
    totalFiles: files.length,
    totalProductsDetected: 0,
    totalProductsNormalized: 0,
    totalDuplicatesRemoved: 0,
    processingTimeMs: 0,
    errorCount: 0,
  }

  const detectedCount = new Map<string, number>()
  let errorCount = 0

  const customOnProgress = (event: ScanProgressEvent) => {
    if (event.type === 'ai-complete' && event.productsDetected) {
      stats.totalProductsDetected += event.productsDetected
    }
    if (event.type === 'validation-complete' && event.productsDetected) {
      stats.totalProductsNormalized += event.productsDetected
    }
    if (event.type === 'error') {
      errorCount++
    }

    // Llamar callback original si existe
    options.onProgress?.(event)
  }

  try {
    const products = await scanMenuImages(files, {
      ...options,
      onProgress: customOnProgress,
    })

    stats.errorCount = errorCount
    stats.totalProductsNormalized = products.length
    stats.totalDuplicatesRemoved =
      stats.totalProductsDetected - stats.totalProductsNormalized
    stats.processingTimeMs = Date.now() - startTime

    return { products, stats }
  } catch (error) {
    stats.processingTimeMs = Date.now() - startTime
    stats.errorCount++
    throw error
  }
}
