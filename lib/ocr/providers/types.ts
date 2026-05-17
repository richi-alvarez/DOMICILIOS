/**
 * OCR Provider Types
 * Abstracción para diferentes motores de OCR
 */

export interface TextRegion {
  /** Texto detectado */
  text: string
  /** Bounding box */
  bbox: {
    x: number
    y: number
    w: number
    h: number
  }
  /** Confianza de detección (0-1) */
  confidence: number
}

export interface OCRResult {
  /** Texto completo extraído */
  text: string
  /** Confianza general (0-1) */
  confidence: number
  /** Regiones de texto detectadas */
  regions: TextRegion[]
  /** Idioma detectado */
  detectedLanguage?: string
  /** Tiempo procesamiento (ms) */
  processingTime?: number
}

export interface OCRProvider {
  /** Nombre del proveedor */
  name: 'tesseract' | 'paddleocr'
  /** Extrae texto de una imagen base64 */
  extractText(base64Image: string, language?: string): Promise<OCRResult>
  /** Cleanup de recursos (opcional) */
  cleanup?(): Promise<void>
}

export interface OCRProviderConfig {
  language?: string
  tesseractPath?: string
  workerCount?: number
}
