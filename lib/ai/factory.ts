import type { AIProvider, SupportedProvider } from './types/ai-provider'
import { AnthropicProvider } from './providers/anthropic-provider'
import { OpenAIProvider } from './providers/openai-provider'
import { GeminiProvider } from './providers/gemini-provider'

export class AIProviderFactory {
  private static providers: Map<SupportedProvider, AIProvider> = new Map()

  static {
    this.initializeProviders()
  }

  private static initializeProviders(): void {
    this.providers.set('anthropic', new AnthropicProvider())
    this.providers.set('openai', new OpenAIProvider())
    this.providers.set('gemini', new GeminiProvider())
  }

  /**
   * Obtiene un proveedor específico por nombre
   */
  static getProvider(name: SupportedProvider): AIProvider {
    const provider = this.providers.get(name)
    if (!provider) {
      throw new Error(`Unknown AI provider: ${name}`)
    }
    return provider
  }

  /**
   * Obtiene el primer proveedor configurado en orden de preferencia
   */
  static getConfiguredProvider(
    preferred: SupportedProvider = 'anthropic',
    fallbacks: SupportedProvider[] = ['openai', 'gemini'],
  ): AIProvider {
    const providers = [preferred, ...fallbacks]

    for (const providerName of providers) {
      const provider = this.providers.get(providerName)
      if (provider && provider.isConfigured()) {
        console.log(`[AI] Using provider: ${providerName}`)
        return provider
      }
    }

    throw new Error(
      `No AI providers configured. Tried: ${providers.join(', ')}`,
    )
  }

  /**
   * Lista todos los proveedores disponibles
   */
  static listProviders(): Array<{
    name: SupportedProvider
    configured: boolean
    provider: AIProvider
  }> {
    return Array.from(this.providers.entries()).map(([name, provider]) => ({
      name,
      configured: provider.isConfigured(),
      provider,
    }))
  }

  /**
   * Valida que haya al menos un proveedor configurado
   */
  static hasAnyProvider(): boolean {
    return this.listProviders().some((p) => p.configured)
  }
}
