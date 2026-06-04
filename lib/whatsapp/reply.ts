import { retryStrategy } from '@/lib/ai/retry-strategy'
import { AIProviderFactory } from '@/lib/ai/factory'

export interface ReplyContext {
  storeName: string
  aiPrompt?: string | null
  currency?: string
  order?: {
    code: string
    status: string
    total?: number
    items?: { name: string; qty: number }[]
  } | null
  /** Historial reciente (más antiguo primero) para dar contexto al bot. */
  history?: { sender: 'customer' | 'bot' | 'agent' | 'system'; body: string }[]
  userMessage: string
}

function buildSystemPrompt(ctx: ReplyContext): string {
  const lines = [
    `Eres el asistente de atención al cliente por WhatsApp de la tienda "${ctx.storeName}".`,
    `Responde en español, de forma breve, amable y útil. No inventes información que no tengas.`,
    `Si el cliente pide algo que requiere intervención humana (reclamos, cambios de pedido), indícale que un agente de la tienda lo atenderá pronto.`,
  ]
  if (ctx.aiPrompt) lines.push(`Instrucciones del comercio: ${ctx.aiPrompt}`)
  if (ctx.order) {
    const items = (ctx.order.items || []).map((i) => `${i.qty}x ${i.name}`).join(', ')
    lines.push(
      `Contexto del pedido asociado: #${ctx.order.code}, estado "${ctx.order.status}"${
        items ? `, productos: ${items}` : ''
      }.`,
    )
  }
  return lines.join('\n')
}

/** Genera una respuesta de texto para un mensaje entrante de WhatsApp usando el LLM. */
export async function generateWhatsAppReply(
  ctx: ReplyContext,
): Promise<{ success: boolean; content?: string; error?: string }> {
  if (!AIProviderFactory.hasAnyProvider()) {
    return { success: false, error: 'No hay proveedores de IA configurados' }
  }

  const systemPrompt = buildSystemPrompt(ctx)
  const historyText = (ctx.history || [])
    .slice(-10)
    .map((m) => `${m.sender === 'customer' ? 'Cliente' : 'Tienda'}: ${m.body}`)
    .join('\n')
  const userMessage = historyText
    ? `${historyText}\nCliente: ${ctx.userMessage}`
    : ctx.userMessage

  const result = await retryStrategy.executeWithRetry(
    'whatsapp-reply',
    { systemPrompt, userMessage, maxTokens: 300, temperature: 0.6 },
    { maxAttempts: 3 },
  )

  return { success: result.success, content: result.content?.trim(), error: result.error }
}
