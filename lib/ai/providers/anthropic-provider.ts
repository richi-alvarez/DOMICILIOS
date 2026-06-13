import Anthropic from '@anthropic-ai/sdk'
import type { AIProvider, AIGenerationOptions, AIGenerationResponse } from '../types/ai-provider'

export class AnthropicProvider implements AIProvider {
  name = 'anthropic'

  isConfigured(): boolean {
    return !!process.env.ANTHROPIC_API_KEY
  }

  validateConfig(): boolean {
    if (!this.isConfigured()) {
      console.warn('Anthropic API key not configured')
      return false
    }
    return true
  }

  private getClient(): Anthropic {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured')
    }
    return new Anthropic({ apiKey })
  }

  async generate(options: AIGenerationOptions): Promise<AIGenerationResponse> {
    try {
      if (!this.validateConfig()) {
        return {
          success: false,
          error: 'Anthropic provider not configured',
        }
      }

      const client = this.getClient()
      // Contenido multimodal (imagen + texto) si llega imagen.
      const userContent: Anthropic.MessageParam['content'] = options.imageBase64
        ? [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: (options.imageType || 'image/jpeg') as
                  | 'image/jpeg'
                  | 'image/png'
                  | 'image/webp'
                  | 'image/gif',
                data: options.imageBase64,
              },
            },
            { type: 'text', text: options.userMessage },
          ]
        : options.userMessage

      const response = await client.messages.create({
        model: options.model || 'claude-haiku-4-5-20251001',
        max_tokens: options.maxTokens || 2048,
        temperature: options.temperature,
        system: options.systemPrompt,
        messages: [
          {
            role: 'user',
            content: userContent,
          },
        ],
      })

      const content = response.content[0]
      if (content.type !== 'text') {
        return {
          success: false,
          error: 'Invalid response type from Anthropic',
        }
      }

      return {
        success: true,
        content: content.text,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error from Anthropic',
      }
    }
  }
}
