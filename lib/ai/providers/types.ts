/**
 * Vision AI Provider Types
 * Abstracción para diferentes proveedores de IA con capacidad de visión
 */

export interface VisionInput {
  /** Imagen en base64 */
  image: string
  /** Texto extraído por OCR */
  ocrText: string
  /** Metadata de la imagen/documento */
  metadata: {
    fileName: string
    pageNumber?: number
    detectedLanguage?: string
    fileSize?: number
  }
}

export interface RawProduct {
  name: string
  description?: string
  price?: number
  category?: string
  confidence?: number
}

export interface VisionAIProvider {
  /** Nombre del proveedor */
  name: 'claude' | 'openai'
  /** Extrae productos de una imagen con IA multimodal */
  extractProducts(input: VisionInput): Promise<RawProduct[]>
}

export interface AIProviderConfig {
  apiKey: string
  model: string
  maxTokens?: number
  temperature?: number
}
