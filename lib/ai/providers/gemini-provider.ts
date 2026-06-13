import { GoogleGenerativeAI } from '@google/generative-ai'
import type { AIProvider, AIGenerationOptions, AIGenerationResponse } from '../types/ai-provider'

export class GeminiProvider implements AIProvider {
  name = 'gemini'

  isConfigured(): boolean {
    return !!process.env.GEMINI_API_KEY
  }

  validateConfig(): boolean {
    if (!this.isConfigured()) {
      console.warn('Gemini API key not configured')
      return false
    }
    return true
  }

  private getClient(): GoogleGenerativeAI {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not configured')
    }
    return new GoogleGenerativeAI(apiKey)
  }

  async generate(options: AIGenerationOptions): Promise<AIGenerationResponse> {
    try {
      if (!this.validateConfig()) {
        return {
          success: false,
          error: 'Gemini provider not configured',
        }
      }

      const modelName = options.model || 'gemini-1.5-flash'
      const client = this.getClient()
      const model = client.getGenerativeModel({
        model: modelName,
        systemInstruction: options.systemPrompt,
      })

      // Parts multimodales: texto + imagen (inlineData) si llega imagen.
      const parts: Array<Record<string, unknown>> = [{ text: options.userMessage }]
      if (options.imageBase64) {
        parts.push({
          inlineData: {
            mimeType: options.imageType || 'image/jpeg',
            data: options.imageBase64,
          },
        })
      }

      const response = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: parts as any,
          },
        ],
        generationConfig: {
          maxOutputTokens: options.maxTokens || 2048,
          temperature: options.temperature,
        },
      })

      const content = response.response.text()
      if (!content) {
        return {
          success: false,
          error: 'Empty response from Gemini',
        }
      }

      const usageMetadata = response.response.usageMetadata
      return {
        success: true,
        content,
        usage: {
          inputTokens: usageMetadata?.promptTokenCount || 0,
          outputTokens: usageMetadata?.candidatesTokenCount || 0,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error from Gemini',
      }
    }
  }
}
