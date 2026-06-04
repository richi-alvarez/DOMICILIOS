import type { SupportedProvider } from './types/ai-provider'

export type AITask =
  | 'catalog-generation'
  | 'menu-extraction'
  | 'product-extraction'
  | 'content-generation'
  | 'image-analysis'

interface TaskRecommendation {
  primary: SupportedProvider
  fallbacks: SupportedProvider[]
  reason: string
  requiresVision: boolean
}

/**
 * Recomendaciones inteligentes de IA por tipo de tarea
 * Considera: costo, velocidad, calidad y capacidades especiales
 */
// Orden de proveedores unificado para todas las tareas:
// OpenRouter → OpenAI → Gemini → Anthropic (definido por el usuario).
const DEFAULT_PROVIDER_ORDER = {
  primary: 'openrouter' as SupportedProvider,
  fallbacks: ['openai', 'gemini', 'anthropic'] as SupportedProvider[],
}

export const TASK_RECOMMENDATIONS: Record<AITask, TaskRecommendation> = {
  'catalog-generation': {
    ...DEFAULT_PROVIDER_ORDER,
    reason: 'Orden unificado: OpenRouter → OpenAI → Gemini → Anthropic',
    requiresVision: false,
  },

  'menu-extraction': {
    ...DEFAULT_PROVIDER_ORDER,
    reason: 'Orden unificado: OpenRouter → OpenAI → Gemini → Anthropic',
    requiresVision: true,
  },

  'product-extraction': {
    ...DEFAULT_PROVIDER_ORDER,
    reason: 'Orden unificado: OpenRouter → OpenAI → Gemini → Anthropic',
    requiresVision: true,
  },

  'image-analysis': {
    ...DEFAULT_PROVIDER_ORDER,
    reason: 'Orden unificado: OpenRouter → OpenAI → Gemini → Anthropic',
    requiresVision: true,
  },

  'content-generation': {
    ...DEFAULT_PROVIDER_ORDER,
    reason: 'Orden unificado: OpenRouter → OpenAI → Gemini → Anthropic',
    requiresVision: false,
  },
}

/**
 * Modelos recomendados por proveedor y tarea
 */
export const RECOMMENDED_MODELS: Record<SupportedProvider, Record<AITask, string>> = {
  anthropic: {
    'catalog-generation': 'claude-haiku-4-5-20251001',
    'menu-extraction': 'claude-opus-4-7-20250219',
    'product-extraction': 'claude-opus-4-7-20250219',
    'image-analysis': 'claude-opus-4-7-20250219',
    'content-generation': 'claude-sonnet-4-6-20250514',
  },

  openai: {
    'catalog-generation': 'gpt-4o-mini',
    'menu-extraction': 'gpt-4-turbo',
    'product-extraction': 'gpt-4-turbo',
    'image-analysis': 'gpt-4-turbo',
    'content-generation': 'gpt-4',
  },

  gemini: {
    // gemini-2.0-flash quedó obsoleto en el SDK (404). gemini-2.5-flash es el actual.
    'catalog-generation': 'gemini-2.5-flash',
    'menu-extraction': 'gemini-2.5-flash',
    'product-extraction': 'gemini-2.5-flash',
    'image-analysis': 'gemini-2.5-flash',
    'content-generation': 'gemini-2.5-flash',
  },

  // Defaults para OpenRouter. En la práctica los sobreescribe OPENROUTER_MODEL.
  openrouter: {
    'catalog-generation': 'openai/gpt-4o-mini',
    'menu-extraction': 'openai/gpt-4o',
    'product-extraction': 'openai/gpt-4o',
    'image-analysis': 'openai/gpt-4o',
    'content-generation': 'anthropic/claude-3.5-sonnet',
  },
}

/**
 * Configuración de costos aproximados (USD por 1M tokens)
 */
export const PROVIDER_COSTS: Record<SupportedProvider, { input: number; output: number }> = {
  anthropic: {
    input: 0.8,
    output: 4.0,
  },
  openai: {
    input: 0.5,
    output: 1.5,
  },
  gemini: {
    input: 0.075,
    output: 0.3,
  },
  // Aproximado; depende del modelo concreto elegido en OpenRouter.
  openrouter: {
    input: 0.15,
    output: 0.6,
  },
}

/**
 * Obtiene las recomendaciones para una tarea específica
 */
export function getTaskRecommendation(task: AITask): TaskRecommendation {
  return TASK_RECOMMENDATIONS[task]
}

/**
 * Obtiene el modelo recomendado para una tarea y proveedor
 */
export function getRecommendedModel(provider: SupportedProvider, task: AITask): string {
  return RECOMMENDED_MODELS[provider][task]
}

/**
 * Obtiene el costo estimado basado en tokens
 */
export function estimateCost(
  provider: SupportedProvider,
  inputTokens: number,
  outputTokens: number,
): number {
  const costs = PROVIDER_COSTS[provider]
  return (inputTokens * costs.input + outputTokens * costs.output) / 1_000_000
}

/**
 * Ordena proveedores por costo estimado
 */
export function sortProvidersByCost(
  providers: SupportedProvider[],
  inputTokens: number,
  outputTokens: number,
): Array<{ provider: SupportedProvider; cost: number }> {
  return providers
    .map((provider) => ({
      provider,
      cost: estimateCost(provider, inputTokens, outputTokens),
    }))
    .sort((a, b) => a.cost - b.cost)
}
