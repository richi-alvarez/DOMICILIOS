/**
 * OCR Providers Index
 * Factory para crear instancias de proveedores OCR
 */

import type { OCRProvider } from './types'
import { createTesseractProvider } from './tesseract/worker'
import { createPaddleOCRProvider } from './paddleocr/client'

/**
 * Tipos de proveedores OCR disponibles
 */
type OCRProviderType = 'tesseract' | 'paddleocr'

/**
 * Configuración global de OCR
 */
const ocrProviderCache: Map<OCRProviderType, OCRProvider> = new Map()

/**
 * Obtiene una instancia de proveedor OCR
 */
export async function getOCRProvider(
  type: OCRProviderType = 'tesseract',
): Promise<OCRProvider> {
  // Retorna caché si existe
  if (ocrProviderCache.has(type)) {
    return ocrProviderCache.get(type)!
  }

  let provider: OCRProvider

  switch (type) {
    case 'tesseract':
      provider = await createTesseractProvider()
      break

    case 'paddleocr':
      provider = await createPaddleOCRProvider()
      break

    default:
      throw new Error(`Unknown OCR provider: ${type}`)
  }

  ocrProviderCache.set(type, provider)
  return provider
}

/**
 * Intenta múltiples proveedores OCR en fallback chain
 * Útil para mayor disponibilidad
 */
export async function getOCRProviderWithFallback(
  preferred: OCRProviderType = 'tesseract',
  fallbacks: OCRProviderType[] = ['paddleocr'],
): Promise<OCRProvider> {
  const providers = [preferred, ...fallbacks]

  for (const providerType of providers) {
    try {
      console.log(`[OCR] Attempting provider: ${providerType}`)
      const provider = await getOCRProvider(providerType)
      console.log(`[OCR] Using provider: ${providerType}`)
      return provider
    } catch (error) {
      console.warn(`[OCR] Provider ${providerType} failed:`, error)
      continue
    }
  }

  throw new Error(
    `All OCR providers failed. Tried: ${providers.join(', ')}`,
  )
}

/**
 * Limpia recursos de OCR
 */
export async function cleanupOCRProviders(): Promise<void> {
  for (const provider of ocrProviderCache.values()) {
    if (provider.cleanup) {
      await provider.cleanup()
    }
  }
  ocrProviderCache.clear()
}

export type { OCRProvider }
export { type OCRResult, type TextRegion } from './types'
