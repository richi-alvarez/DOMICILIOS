import { retryStrategy } from './retry-strategy'
import { PromptsService } from './prompts-service'
import type { SupportedProvider, AIGenerationResponse } from './types/ai-provider'

export interface CatalogGenerationOptions {
  businessName: string
  businessDescription: string
  businessType?: string
  provider?: SupportedProvider
  model?: string
  maxTokens?: number
  temperature?: number
  verbose?: boolean
}

export class CatalogGenerationService {
  /**
   * Genera estructura de catálogo con reintentos inteligentes
   * Intenta primero con la IA recomendada, luego fallbacks
   */
  static async generateCatalog(
    options: CatalogGenerationOptions,
  ): Promise<AIGenerationResponse & { attempts?: number; providersUsed?: string[] }> {
    try {
      const systemPrompt = PromptsService.getCatalogGenerationSystemPrompt()
      const userMessage = PromptsService.getCatalogGenerationUserMessage(
        options.businessName,
        options.businessDescription,
        options.businessType,
      )

      // Usar estrategia de reintentos inteligente
      const result = await retryStrategy.executeWithRetry(
        'catalog-generation',
        {
          systemPrompt,
          userMessage,
          maxTokens: options.maxTokens || 2048,
          temperature: options.temperature ?? 0.7,
        },
        {
          maxAttempts: 3,
          verbose: options.verbose || false,
        },
      )

      return {
        success: result.success,
        content: result.content,
        error: result.error,
        usage: result.usage,
        attempts: result.attempts,
        providersUsed: result.providersUsed,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}
