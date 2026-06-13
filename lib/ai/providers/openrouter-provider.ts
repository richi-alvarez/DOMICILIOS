import OpenAI from 'openai'
import type { AIProvider, AIGenerationOptions, AIGenerationResponse } from '../types/ai-provider'

/**
 * Proveedor OpenRouter.
 *
 * OpenRouter expone una API compatible con la de OpenAI, así que reutilizamos
 * el SDK oficial de OpenAI apuntando a su baseURL. El modelo se controla con
 * OPENROUTER_MODEL (ej: "openai/gpt-4o-mini", "anthropic/claude-3.5-sonnet").
 */
export class OpenRouterProvider implements AIProvider {
  name = 'openrouter'

  private static readonly BASE_URL = 'https://openrouter.ai/api/v1'
  private static readonly DEFAULT_MODEL = 'openai/gpt-4o-mini'

  isConfigured(): boolean {
    return !!process.env.OPENROUTER_API_KEY
  }

  validateConfig(): boolean {
    if (!this.isConfigured()) {
      console.warn('OpenRouter API key not configured')
      return false
    }
    return true
  }

  private getClient(): OpenAI {
    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY not configured')
    }
    return new OpenAI({
      apiKey,
      baseURL: OpenRouterProvider.BASE_URL,
      // Cabeceras opcionales recomendadas por OpenRouter para atribución.
      defaultHeaders: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': process.env.NEXT_PUBLIC_APP_NAME || 'Domicilios',
      },
    })
  }

  async generate(options: AIGenerationOptions): Promise<AIGenerationResponse> {
    try {
      if (!this.validateConfig()) {
        return { success: false, error: 'OpenRouter provider not configured' }
      }

      const client = this.getClient()
      // OPENROUTER_MODEL tiene prioridad; si no, el modelo recomendado; si no, el default.
      const model = process.env.OPENROUTER_MODEL || options.model || OpenRouterProvider.DEFAULT_MODEL

      // Mensaje multimodal si llega imagen (formato compatible OpenAI).
      const userContent: OpenAI.Chat.ChatCompletionUserMessageParam['content'] = options.imageBase64
        ? [
            { type: 'text', text: options.userMessage },
            {
              type: 'image_url',
              image_url: {
                url: `data:${options.imageType || 'image/jpeg'};base64,${options.imageBase64}`,
                detail: 'high',
              },
            },
          ]
        : options.userMessage

      const response = await client.chat.completions.create({
        model,
        max_tokens: options.maxTokens || 2048,
        temperature: options.temperature,
        messages: [
          { role: 'system', content: options.systemPrompt },
          { role: 'user', content: userContent },
        ],
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        return { success: false, error: 'Empty response from OpenRouter' }
      }

      return {
        success: true,
        content,
        usage: {
          inputTokens: response.usage?.prompt_tokens || 0,
          outputTokens: response.usage?.completion_tokens || 0,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error from OpenRouter',
      }
    }
  }
}
