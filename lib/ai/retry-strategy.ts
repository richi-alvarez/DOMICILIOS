import { AIProviderFactory } from './factory'
import {
  getTaskRecommendation,
  getRecommendedModel,
  type AITask,
} from './task-recommendations'
import type { AIGenerationOptions, AIGenerationResponse, SupportedProvider } from './types/ai-provider'
import { aiUsageTracker } from '../monitoring/ai-usage-tracker'
import { logger } from '../monitoring/logger'

export interface RetryOptions {
  maxAttempts?: number
  delayMs?: number
  backoffMultiplier?: number
  verbose?: boolean
}

export interface RetryResult extends AIGenerationResponse {
  attempts: number
  providersUsed: string[]
  lastError?: string
  timeMs: number
}

/**
 * Estrategia inteligente de reintentos con fallback automático
 * Intenta con la IA recomendada, y si falla, prueba con otras
 */
export class RetryStrategy {
  private attempts: number = 0
  private providersUsed: string[] = []
  private startTime: number = 0

  /**
   * Ejecuta generación con reintentos inteligentes
   * Intenta primero con la IA recomendada para la tarea, luego fallbacks
   */
  async executeWithRetry(
    task: AITask,
    options: AIGenerationOptions,
    retryOpts: RetryOptions = {},
  ): Promise<RetryResult> {
    const maxAttempts = retryOpts.maxAttempts ?? 3
    const delayMs = retryOpts.delayMs ?? 500
    const backoffMultiplier = retryOpts.backoffMultiplier ?? 2
    const verbose = retryOpts.verbose ?? false

    this.startTime = Date.now()
    this.attempts = 0
    this.providersUsed = []

    // Obtener recomendaciones para esta tarea
    const recommendation = getTaskRecommendation(task)

    // Construir orden de intentos
    const providersToTry = [
      recommendation.primary,
      ...recommendation.fallbacks,
    ]

    let lastError = 'No error recorded'
    let lastResponse: AIGenerationResponse | null = null

    for (const provider of providersToTry) {
      if (this.attempts >= maxAttempts) {
        if (verbose) {
          console.log(`[RetryStrategy] Reached max attempts (${maxAttempts})`)
        }
        break
      }

      this.attempts++
      this.providersUsed.push(provider)

      if (verbose) {
        console.log(`[RetryStrategy] Attempt ${this.attempts}/${maxAttempts} with ${provider}`)
      }

      try {
        // Obtener proveedor
        const aiProvider = AIProviderFactory.getProvider(provider)

        // Validar que esté configurado
        if (!aiProvider.isConfigured()) {
          throw new Error(`Provider ${provider} not configured`)
        }

        // Obtener modelo recomendado
        const model = getRecommendedModel(provider, task)

        // Ejecutar generación
        const startProviderTime = Date.now()
        const response = await aiProvider.generate({
          ...options,
          model: options.model || model,
        })
        const duration = Date.now() - startProviderTime

        // Track AI usage
        aiUsageTracker.trackUsage(
          provider,
          options.model || model,
          duration,
          response.success,
          response.error,
          (response as any).promptTokens,
          (response as any).completionTokens,
        )

        // Si fue exitoso, retornar
        if (response.success) {
          if (verbose) {
            console.log(
              `[RetryStrategy] Success with ${provider} on attempt ${this.attempts}`,
            )
          }

          logger.info(`AI generation successful`, {
            provider,
            model: options.model || model,
            duration,
            attempts: this.attempts,
          })

          return {
            ...response,
            attempts: this.attempts,
            providersUsed: this.providersUsed,
            timeMs: Date.now() - this.startTime,
          }
        }

        lastResponse = response
        lastError = response.error || 'Unknown error'

        if (verbose) {
          console.warn(
            `[RetryStrategy] ${provider} failed: ${lastError}`,
          )
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error)

        if (verbose) {
          console.error(
            `[RetryStrategy] ${provider} error: ${lastError}`,
          )
        }
      }

      // Esperar antes del siguiente intento (con backoff exponencial)
      if (this.attempts < maxAttempts && this.attempts < providersToTry.length) {
        const waitTime = delayMs * Math.pow(backoffMultiplier, this.attempts - 1)

        if (verbose) {
          console.log(
            `[RetryStrategy] Waiting ${waitTime}ms before next attempt...`,
          )
        }

        await this.delay(waitTime)
      }
    }

    // Si llegamos aquí, todos los intentos fallaron
    return {
      success: false,
      error: `All ${this.attempts} attempts failed. Last error: ${lastError}`,
      attempts: this.attempts,
      providersUsed: this.providersUsed,
      lastError,
      timeMs: Date.now() - this.startTime,
    }
  }

  /**
   * Ejecuta con reintentos permitiendo especificar proveedores manualmente
   */
  async executeWithCustomProviders(
    providers: SupportedProvider[],
    options: AIGenerationOptions,
    retryOpts: RetryOptions = {},
  ): Promise<RetryResult> {
    const maxAttempts = retryOpts.maxAttempts ?? providers.length
    const delayMs = retryOpts.delayMs ?? 500
    const verbose = retryOpts.verbose ?? false

    this.startTime = Date.now()
    this.attempts = 0
    this.providersUsed = []

    let lastError = 'No error recorded'

    for (const provider of providers) {
      if (this.attempts >= maxAttempts) {
        break
      }

      this.attempts++
      this.providersUsed.push(provider)

      if (verbose) {
        console.log(
          `[RetryStrategy] Custom attempt ${this.attempts}/${maxAttempts} with ${provider}`,
        )
      }

      try {
        const aiProvider = AIProviderFactory.getProvider(provider)

        if (!aiProvider.isConfigured()) {
          throw new Error(`Provider ${provider} not configured`)
        }

        const response = await aiProvider.generate(options)

        if (response.success) {
          if (verbose) {
            console.log(`[RetryStrategy] Success with ${provider}`)
          }

          return {
            ...response,
            attempts: this.attempts,
            providersUsed: this.providersUsed,
            timeMs: Date.now() - this.startTime,
          }
        }

        lastError = response.error || 'Unknown error'

        if (verbose) {
          console.warn(`[RetryStrategy] ${provider} failed: ${lastError}`)
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error)

        if (verbose) {
          console.error(`[RetryStrategy] ${provider} error: ${lastError}`)
        }
      }

      if (this.attempts < maxAttempts && this.attempts < providers.length) {
        await this.delay(delayMs)
      }
    }

    return {
      success: false,
      error: `All ${this.attempts} attempts failed. Last error: ${lastError}`,
      attempts: this.attempts,
      providersUsed: this.providersUsed,
      lastError,
      timeMs: Date.now() - this.startTime,
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

/**
 * Instancia singleton del retry strategy
 */
export const retryStrategy = new RetryStrategy()
