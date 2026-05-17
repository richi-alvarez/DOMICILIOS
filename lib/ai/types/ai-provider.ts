export interface AIMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AIGenerationOptions {
  model?: string
  maxTokens?: number
  temperature?: number
  systemPrompt: string
  userMessage: string
}

export interface AIGenerationResponse {
  success: boolean
  content?: string
  error?: string
  usage?: {
    inputTokens: number
    outputTokens: number
  }
}

export interface AIProvider {
  name: string
  isConfigured(): boolean
  generate(options: AIGenerationOptions): Promise<AIGenerationResponse>
  validateConfig(): boolean
}

export type SupportedProvider = 'anthropic' | 'openai' | 'gemini'

export const PROVIDER_MODELS: Record<SupportedProvider, string[]> = {
  anthropic: [
    'claude-opus-4-7-20250219',
    'claude-sonnet-4-6-20250514',
    'claude-haiku-4-5-20251001',
  ],
  openai: [
    'gpt-4-turbo',
    'gpt-4',
    'gpt-3.5-turbo',
  ],
  gemini: [
    'gemini-2.0-flash',
    'gemini-1.5-pro',
    'gemini-1.5-flash',
  ],
}
