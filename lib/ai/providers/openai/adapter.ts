/**
 * OpenAI Vision AI Provider
 * Implementación del proveedor de IA usando OpenAI GPT-4 Vision
 */

import type { VisionAIProvider, VisionInput, RawProduct } from '../types'
import {
  MENU_SCAN_SYSTEM_PROMPT,
  createMenuScanUserPrompt,
} from '../../prompts'

let clientInstance: any = null

async function getClient(): Promise<any> {
  if (!clientInstance) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set')
    }

    const { OpenAI } = await import('openai')
    clientInstance = new OpenAI({ apiKey })
  }

  return clientInstance
}

/**
 * Extrae el JSON del texto de respuesta de OpenAI
 */
function extractJSON(text: string): string {
  // Intenta encontrar JSON array
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (jsonMatch) {
    return jsonMatch[0]
  }

  // Intenta markdown code block
  const markdownMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (markdownMatch) {
    return markdownMatch[1].trim()
  }

  // Retorna el texto completo si no encontró marcas
  return text.trim()
}

/**
 * Convierte base64 a data URL para OpenAI
 */
function base64ToDataUrl(base64: string, mediaType: string): string {
  return `data:${mediaType};base64,${base64}`
}

/**
 * Crea el adaptador de OpenAI Vision
 */
export async function createOpenAIProvider(): Promise<VisionAIProvider> {
  return {
    name: 'openai',

    async extractProducts(input: VisionInput): Promise<RawProduct[]> {
      const client = await getClient()

      const userPrompt = createMenuScanUserPrompt(
        input.ocrText,
        input.metadata.fileName,
        input.metadata.pageNumber,
      )

      // Prepara media type
      const mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' =
        input.image.startsWith('/9j/') ? 'image/jpeg' : 'image/png'

      try {
        const response = await client.chat.completions.create({
          model: 'gpt-4-vision-preview',
          max_tokens: 4096,
          system: MENU_SCAN_SYSTEM_PROMPT,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image_url',
                  image_url: {
                    url: base64ToDataUrl(input.image, mediaType),
                    detail: 'high',
                  },
                },
                {
                  type: 'text',
                  text: userPrompt,
                },
              ],
            },
          ],
        })

        // Extrae el texto de la respuesta
        const textContent = response.choices[0]?.message?.content
        if (!textContent) {
          console.error('[OpenAI] No text content in response')
          return []
        }

        // Extrae JSON del texto
        const jsonText = extractJSON(textContent)

        // Parsea JSON
        let products: unknown
        try {
          products = JSON.parse(jsonText)
        } catch (parseError) {
          console.error('[OpenAI] Failed to parse JSON:', jsonText.substring(0, 200))
          return []
        }

        // Valida que sea array
        if (!Array.isArray(products)) {
          console.error('[OpenAI] Response is not an array')
          return []
        }

        // Convierte a RawProduct[]
        return products
          .map((item) => ({
            name: String(item.name || '').trim() || undefined,
            description: item.description ? String(item.description).trim() : undefined,
            price: typeof item.price === 'number' ? item.price : undefined,
            category: item.category ? String(item.category).trim() : undefined,
            confidence: item.confidence || 0.80,
          }))
          .filter((p) => p.name) // Filtra sin nombre
      } catch (error) {
        if (error instanceof Error) {
          console.error('[OpenAI] Extraction error:', error.message)
        }
        throw error
      }
    },
  }
}
