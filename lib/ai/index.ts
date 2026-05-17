/**
 * AI Module Index
 * Exporta toda la funcionalidad de IA
 */

export { getAIProvider, clearAIProviderCache } from './providers'
export type { VisionAIProvider, VisionInput, RawProduct } from './providers/types'

export {
  MENU_SCAN_SYSTEM_PROMPT,
  createMenuScanUserPrompt,
  MENU_SCAN_FALLBACK_PROMPT,
} from './prompts'
