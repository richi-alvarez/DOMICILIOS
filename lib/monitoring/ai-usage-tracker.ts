/**
 * Track AI API usage and costs across all providers
 * Monitors token usage, generation times, and failures
 */

import { logger } from './logger'

export interface AIUsageRecord {
  provider: 'anthropic' | 'openai' | 'gemini'
  model: string
  promptTokens?: number
  completionTokens?: number
  totalTokens?: number
  durationMs: number
  success: boolean
  errorMessage?: string
  timestamp: Date
  estimatedCostUsd?: number
}

// Pricing models (as of May 2026)
const PRICING = {
  anthropic: {
    'claude-haiku-4-5-20251001': {
      inputPer1M: 0.8, // $0.80 per 1M input tokens
      outputPer1M: 4.0, // $4.00 per 1M output tokens
    },
    'claude-opus-4-7': {
      inputPer1M: 15.0,
      outputPer1M: 75.0,
    },
  },
  openai: {
    'gpt-3.5-turbo': {
      inputPer1M: 0.5,
      outputPer1M: 1.5,
    },
    'gpt-4': {
      inputPer1M: 30.0,
      outputPer1M: 60.0,
    },
  },
  gemini: {
    'gemini-1.5-flash': {
      inputPer1M: 0.0375, // Free tier counts too
      outputPer1M: 0.15,
    },
    'gemini-1.5-pro': {
      inputPer1M: 1.25,
      outputPer1M: 5.0,
    },
  },
}

class AIUsageTracker {
  private records: AIUsageRecord[] = []
  private maxRecordsInMemory = 200

  /**
   * Calculate estimated cost based on tokens and pricing
   */
  private calculateCost(
    provider: 'anthropic' | 'openai' | 'gemini',
    model: string,
    promptTokens: number,
    completionTokens: number,
  ): number {
    const providerPricing = PRICING[provider]
    if (!providerPricing) return 0

    const modelPricing = Object.values(providerPricing)[0] // Get first model as fallback
    if (!modelPricing) return 0

    const inputCost = (promptTokens / 1_000_000) * modelPricing.inputPer1M
    const outputCost = (completionTokens / 1_000_000) * modelPricing.outputPer1M

    return inputCost + outputCost
  }

  /**
   * Track AI API usage
   */
  trackUsage(
    provider: 'anthropic' | 'openai' | 'gemini',
    model: string,
    durationMs: number,
    success: boolean,
    errorMessage?: string,
    promptTokens?: number,
    completionTokens?: number,
  ) {
    let estimatedCostUsd = 0
    let totalTokens = 0

    if (success && promptTokens !== undefined && completionTokens !== undefined) {
      totalTokens = promptTokens + completionTokens
      estimatedCostUsd = this.calculateCost(provider, model, promptTokens, completionTokens)
    }

    const record: AIUsageRecord = {
      provider,
      model,
      promptTokens,
      completionTokens,
      totalTokens,
      durationMs,
      success,
      errorMessage,
      timestamp: new Date(),
      estimatedCostUsd,
    }

    this.records.push(record)

    // Keep only recent records
    if (this.records.length > this.maxRecordsInMemory) {
      this.records = this.records.slice(-this.maxRecordsInMemory)
    }

    // Log high-cost requests
    if (estimatedCostUsd > 0.10) {
      logger.warn('High-cost AI request', {
        provider,
        model,
        cost: estimatedCostUsd.toFixed(4),
        tokens: totalTokens,
        duration: durationMs,
      })
    }

    // Log failures
    if (!success) {
      logger.error('AI API failed', new Error(errorMessage || 'Unknown error'), {
        provider,
        model,
        duration: durationMs,
      })
    }

    return record
  }

  /**
   * Get usage statistics
   */
  getStats() {
    if (this.records.length === 0) {
      return {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        totalTokensUsed: 0,
        totalCostUsd: 0,
        averageDurationMs: 0,
        successRate: 0,
      }
    }

    const totalRequests = this.records.length
    const successfulRequests = this.records.filter((r) => r.success).length
    const failedRequests = totalRequests - successfulRequests
    const totalTokensUsed = this.records.reduce((sum, r) => sum + (r.totalTokens || 0), 0)
    const totalCostUsd = this.records.reduce((sum, r) => sum + (r.estimatedCostUsd || 0), 0)
    const averageDurationMs = Math.round(
      this.records.reduce((sum, r) => sum + r.durationMs, 0) / totalRequests,
    )
    const successRate = (successfulRequests / totalRequests) * 100

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      totalTokensUsed,
      totalCostUsd: parseFloat(totalCostUsd.toFixed(4)),
      averageDurationMs,
      successRate: parseFloat(successRate.toFixed(2)),
    }
  }

  /**
   * Get usage by provider
   */
  getStatsByProvider() {
    const providers = ['anthropic', 'openai', 'gemini'] as const

    return providers.map((provider) => {
      const providerRecords = this.records.filter((r) => r.provider === provider)

      if (providerRecords.length === 0) {
        return { provider, requests: 0, cost: 0, successRate: 0 }
      }

      const requests = providerRecords.length
      const cost = parseFloat(
        providerRecords.reduce((sum, r) => sum + (r.estimatedCostUsd || 0), 0).toFixed(4),
      )
      const successRate = parseFloat(
        ((providerRecords.filter((r) => r.success).length / requests) * 100).toFixed(2),
      )

      return { provider, requests, cost, successRate }
    })
  }

  /**
   * Get recent records for debugging
   */
  getRecentRecords(limit = 20) {
    return this.records.slice(-limit)
  }

  /**
   * Clear records (useful for testing)
   */
  clear() {
    this.records = []
  }
}

export const aiUsageTracker = new AIUsageTracker()
