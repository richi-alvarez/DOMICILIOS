/**
 * AI Providers Index
 * Factory para crear instancias de proveedores de IA con visión
 */

import type { VisionAIProvider } from './types'
import { createClaudeProvider } from './claude/adapter'
import { createOpenAIProvider } from './openai/adapter'

/**
 * Tipos de proveedores IA disponibles
 */
type AIProviderType = 'claude' | 'openai'

/**
 * Configuración global de IA
 */
let aiProviderCache: Map<AIProviderType, VisionAIProvider> = new Map()

/**
 * Obtiene una instancia de proveedor IA
 */
export async function getAIProvider(
  type: AIProviderType = 'claude',
): Promise<VisionAIProvider> {
  // Retorna caché si existe
  if (aiProviderCache.has(type)) {
    return aiProviderCache.get(type)!
  }

  let provider: VisionAIProvider

  switch (type) {
    case 'claude':
      provider = await createClaudeProvider()
      break

    case 'openai':
      provider = await createOpenAIProvider()
      break

    default:
      throw new Error(`Unknown AI provider: ${type}`)
  }

  aiProviderCache.set(type, provider)
  return provider
}

/**
 * Intenta múltiples proveedores en fallback chain
 * Útil para mayor disponibilidad
 */
export async function getAIProviderWithFallback(
  preferred: AIProviderType = 'claude',
  fallbacks: AIProviderType[] = ['openai'],
): Promise<VisionAIProvider> {
  const providers = [preferred, ...fallbacks]

  for (const providerType of providers) {
    try {
      console.log(`[AI] Attempting provider: ${providerType}`)
      const provider = await getAIProvider(providerType)
      console.log(`[AI] Using provider: ${providerType}`)
      return provider
    } catch (error) {
      console.warn(`[AI] Provider ${providerType} failed:`, error)
      continue
    }
  }

  throw new Error(
    `All AI providers failed. Tried: ${providers.join(', ')}`,
  )
}

/**
 * Limpia caché de proveedores IA
 */
export function clearAIProviderCache(): void {
  aiProviderCache.clear()
}

export type { VisionAIProvider, VisionInput, RawProduct } from './types'
