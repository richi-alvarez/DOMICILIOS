/**
 * Tesseract OCR Provider
 * Implementación del OCR usando Tesseract.js con soporte multiidioma
 */

import type { OCRProvider, OCRResult } from '../types'

let workerInstance: any = null

async function getWorker(language: string = 'spa') {
  if (!workerInstance) {
    try {
      const { createWorker } = await import('tesseract.js')
      workerInstance = await createWorker(language, 1, {
        corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@v5/tesseract-core.wasm.js',
      })
    } catch (error) {
      console.error('[Tesseract] Failed to initialize worker:', error)
      throw new Error('Failed to initialize Tesseract OCR')
    }
  }
  return workerInstance
}

/**
 * Crea el adaptador de Tesseract OCR
 */
export async function createTesseractProvider(): Promise<OCRProvider> {
  return {
    name: 'tesseract',

    async extractText(base64Image: string, language: string = 'spa'): Promise<OCRResult> {
      const startTime = Date.now()

      try {
        const worker = await getWorker(language)

        // Convierte base64 a Data URL
        const dataUrl = `data:image/png;base64,${base64Image}`

        // Realiza OCR
        const result = await worker.recognize(dataUrl)

        const processingTime = Date.now() - startTime

        // Extrae datos
        const text = result.data.text || ''
        const confidence = result.data.confidence || 0

        // Extrae regiones si están disponibles
        const regions = (result.data.lines || []).map((line: any) => ({
          text: line.text,
          bbox: {
            x: line.bbox.x0,
            y: line.bbox.y0,
            w: line.bbox.x1 - line.bbox.x0,
            h: line.bbox.y1 - line.bbox.y0,
          },
          confidence: line.confidence || 0,
        }))

        return {
          text: text.trim(),
          confidence: Math.min(1, Math.max(0, confidence / 100)),
          regions,
          detectedLanguage: language,
          processingTime,
        }
      } catch (error) {
        console.error('[Tesseract] OCR failed:', error)
        return {
          text: '',
          confidence: 0,
          regions: [],
          detectedLanguage: language,
          processingTime: Date.now() - startTime,
        }
      }
    },

    async cleanup(): Promise<void> {
      if (workerInstance) {
        try {
          await workerInstance.terminate()
          workerInstance = null
        } catch (error) {
          console.error('[Tesseract] Cleanup failed:', error)
        }
      }
    },
  }
}
