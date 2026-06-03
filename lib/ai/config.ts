import type { SupportedProvider, PROVIDER_MODELS } from './types/ai-provider'

/**
 * Configuración global de IA
 */
export class AIConfig {
  /**
   * Proveedor preferido (puede ser overrideado por variable de entorno)
   */
  static getPreferredProvider(): SupportedProvider {
    const env = process.env.AI_PROVIDER as SupportedProvider | undefined
    if (env && ['anthropic', 'openai', 'gemini', 'openrouter'].includes(env)) {
      return env
    }
    return 'anthropic'
  }

  /**
   * Proveedores de fallback en orden de preferencia
   */
  static getFallbackProviders(): SupportedProvider[] {
    const env = process.env.AI_FALLBACK_PROVIDERS
    if (env) {
      return env.split(',').filter((p) => ['anthropic', 'openai', 'gemini', 'openrouter'].includes(p.trim())) as SupportedProvider[]
    }
    return ['openai', 'gemini']
  }

  /**
   * Obtiene el modelo default para un proveedor
   */
  static getDefaultModel(provider: SupportedProvider): string {
    const models: Record<SupportedProvider, string> = {
      anthropic: 'claude-haiku-4-5-20251001',
      openai: 'gpt-3.5-turbo',
      gemini: 'gemini-1.5-flash',
    }
    return models[provider]
  }

  /**
   * Max tokens default para generación
   */
  static getDefaultMaxTokens(): number {
    const env = process.env.AI_DEFAULT_MAX_TOKENS
    return env ? parseInt(env, 10) : 2048
  }

  /**
   * Temperature default para generación
   */
  static getDefaultTemperature(): number {
    const env = process.env.AI_DEFAULT_TEMPERATURE
    return env ? parseFloat(env) : 0.7
  }

  /**
   * Valida que todas las variables de entorno requeridas estén configuradas
   */
  static validateEnvironment(): {
    valid: boolean
    missing: string[]
    available: string[]
  } {
    const missing: string[] = []
    const available: string[] = []

    if (process.env.ANTHROPIC_API_KEY) {
      available.push('ANTHROPIC_API_KEY')
    } else {
      missing.push('ANTHROPIC_API_KEY')
    }

    if (process.env.OPENAI_API_KEY) {
      available.push('OPENAI_API_KEY')
    } else {
      missing.push('OPENAI_API_KEY')
    }

    if (process.env.GEMINI_API_KEY) {
      available.push('GEMINI_API_KEY')
    } else {
      missing.push('GEMINI_API_KEY')
    }

    // Al menos uno debe estar disponible
    const hasAnyKey = available.length > 0

    return {
      valid: hasAnyKey,
      missing: missing.filter((m) => !available.some((a) => a === m)),
      available,
    }
  }

  /**
   * Obtiene estadísticas de configuración
   */
  static getConfigStats(): {
    providersConfigured: number
    providersAvailable: string[]
    preferredProvider: string
    fallbackProviders: string[]
  } {
    const validation = this.validateEnvironment()
    return {
      providersConfigured: validation.available.length,
      providersAvailable: validation.available,
      preferredProvider: this.getPreferredProvider(),
      fallbackProviders: this.getFallbackProviders(),
    }
  }
}
