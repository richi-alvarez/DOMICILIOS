import OpenAI from 'openai'
import type { AIProvider, AIGenerationOptions, AIGenerationResponse } from '../types/ai-provider'

export class OpenAIProvider implements AIProvider {
  name = 'openai'

  isConfigured(): boolean {
    return !!process.env.OPENAI_API_KEY
  }

  validateConfig(): boolean {
    if (!this.isConfigured()) {
      console.warn('OpenAI API key not configured')
      return false
    }
    return true
  }

  private getClient(): OpenAI {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not configured')
    }
    return new OpenAI({ apiKey })
  }

  async generate(options: AIGenerationOptions): Promise<AIGenerationResponse> {
    try {
      if (!this.validateConfig()) {
        return {
          success: false,
          error: 'OpenAI provider not configured',
        }
      }

      const client = this.getClient()
      // Si llega imagen, el mensaje del usuario es multimodal (texto + imagen).
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
        model: options.model || 'gpt-3.5-turbo',
        max_tokens: options.maxTokens || 2048,
        temperature: options.temperature,
        // La API de chat de OpenAI no acepta `system` como parámetro; el system
        // prompt debe ir como un mensaje con role 'system' al inicio.
        messages: [
          {
            role: 'system',
            content: options.systemPrompt,
          },
          {
            role: 'user',
            content: userContent,
          },
        ],
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        return {
          success: false,
          error: 'Empty response from OpenAI',
        }
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
        error: error instanceof Error ? error.message : 'Unknown error from OpenAI',
      }
    }
  }
}
