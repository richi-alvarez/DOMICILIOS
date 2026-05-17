/**
 * Claude Vision AI Provider
 * Implementación del proveedor de IA usando Claude con capacidades de visión
 */

import Anthropic from '@anthropic-ai/sdk'
import type { VisionAIProvider, VisionInput, RawProduct } from '../types'
import {
  MENU_SCAN_SYSTEM_PROMPT,
  createMenuScanUserPrompt,
} from '../../prompts'

let clientInstance: Anthropic | null = null

function getClient(): Anthropic {
  if (!clientInstance) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set')
    }
    clientInstance = new Anthropic({ apiKey })
  }
  return clientInstance
}

/**
 * Extrae el JSON del texto de respuesta de Claude
 * Maneja markdown, comentarios, etc.
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
 * Crea el adaptador de Claude Vision
 */
export async function createClaudeProvider(): Promise<VisionAIProvider> {
  return {
    name: 'claude',

    async extractProducts(input: VisionInput): Promise<RawProduct[]> {
      const client = getClient()

      const userPrompt = createMenuScanUserPrompt(
        input.ocrText,
        input.metadata.fileName,
        input.metadata.pageNumber,
      )

      try {
        const response = await client.messages.create({
          model: 'claude-opus-4-7',
          max_tokens: 4096,
          system: MENU_SCAN_SYSTEM_PROMPT,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: input.image.startsWith('/9j/')
                      ? 'image/jpeg'
                      : 'image/png',
                    data: input.image,
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
        const textBlock = response.content.find((block) => block.type === 'text')
        if (!textBlock || textBlock.type !== 'text') {
          console.error('[Claude] No text content in response')
          return []
        }

        // Extrae JSON del texto
        const jsonText = extractJSON(textBlock.text)

        // Parsea JSON
        let products: unknown
        try {
          products = JSON.parse(jsonText)
        } catch (parseError) {
          console.error('[Claude] Failed to parse JSON:', jsonText.substring(0, 200))
          return []
        }

        // Valida que sea array
        if (!Array.isArray(products)) {
          console.error('[Claude] Response is not an array')
          return []
        }

        // Convierte a RawProduct[]
        return products.map((item) => ({
          name: String(item.name || '').trim() || undefined,
          description: item.description ? String(item.description).trim() : undefined,
          price: typeof item.price === 'number' ? item.price : undefined,
          category: item.category ? String(item.category).trim() : undefined,
          confidence: item.confidence || 0.85, // Asume alta confianza de Claude
        })).filter((p) => p.name) // Filtra sin nombre
      } catch (error) {
        if (error instanceof Error) {
          console.error('[Claude] Extraction error:', error.message)
        }
        throw error
      }
    },
  }
}
