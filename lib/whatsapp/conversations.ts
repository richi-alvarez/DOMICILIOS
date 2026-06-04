import { db, whatsappConversations, whatsappMessages, orders } from '@/db'
import { eq, desc, and } from 'drizzle-orm'
import { normalizePhone } from './meta-client'

type Direction = 'inbound' | 'outbound'
type Sender = 'customer' | 'bot' | 'agent' | 'system'
type Mode = 'ai' | 'human'

function digits(p?: string | null): string {
  return (p || '').replace(/\D/g, '')
}

/** Compara teléfonos por sufijo de dígitos (el pedido guarda local, Meta da E.164). */
function phoneMatches(a?: string | null, b?: string | null): boolean {
  const da = digits(a)
  const db_ = digits(b)
  if (!da || !db_) return false
  const min = Math.min(da.length, db_.length, 10)
  return min >= 7 && da.slice(-min) === db_.slice(-min)
}

/** Busca el pedido más reciente cuyo teléfono de cliente coincide (por sufijo). */
export async function resolveOrderForPhone(phone: string) {
  const rows = await db.query.orders.findMany({
    orderBy: (t) => [desc(t.createdAt)],
    limit: 500,
  })
  for (const o of rows) {
    const cp = (o.customerJson as { phone?: string } | null)?.phone
    if (cp && phoneMatches(cp, phone)) return o
  }
  return null
}

export interface UpsertConversationInput {
  customerPhone: string
  catalogId?: string | null
  orderId?: string | null
  customerName?: string | null
}

/** Crea o recupera la conversación de un teléfono; completa catálogo/pedido/nombre si faltan. */
export async function upsertConversation(input: UpsertConversationInput) {
  const phone = normalizePhone(input.customerPhone)
  const existing = await db.query.whatsappConversations.findFirst({
    where: eq(whatsappConversations.customerPhone, phone),
  })

  if (existing) {
    const patch: Partial<typeof whatsappConversations.$inferInsert> = {}
    if (!existing.catalogId && input.catalogId) patch.catalogId = input.catalogId
    if (!existing.orderId && input.orderId) patch.orderId = input.orderId
    if (!existing.customerName && input.customerName) patch.customerName = input.customerName
    if (Object.keys(patch).length > 0) {
      patch.updatedAt = new Date()
      const [updated] = await db
        .update(whatsappConversations)
        .set(patch)
        .where(eq(whatsappConversations.id, existing.id))
        .returning()
      return updated
    }
    return existing
  }

  const [created] = await db
    .insert(whatsappConversations)
    .values({
      customerPhone: phone,
      catalogId: input.catalogId ?? null,
      orderId: input.orderId ?? null,
      customerName: input.customerName ?? null,
    })
    .returning()
  return created
}

export interface AppendMessageInput {
  conversationId: string
  direction: Direction
  sender: Sender
  body: string
  waMessageId?: string | null
  status?: string | null
}

/** Inserta un mensaje (idempotente por waMessageId) y actualiza el preview de la conversación. */
export async function appendMessage(input: AppendMessageInput) {
  if (input.waMessageId) {
    const dup = await db.query.whatsappMessages.findFirst({
      where: eq(whatsappMessages.waMessageId, input.waMessageId),
    })
    if (dup) return dup
  }

  const [msg] = await db
    .insert(whatsappMessages)
    .values({
      conversationId: input.conversationId,
      direction: input.direction,
      sender: input.sender,
      body: input.body,
      waMessageId: input.waMessageId ?? null,
      status: input.status ?? null,
    })
    .returning()

  await db
    .update(whatsappConversations)
    .set({ lastMessageAt: new Date(), lastMessageText: input.body.slice(0, 200), updatedAt: new Date() })
    .where(eq(whatsappConversations.id, input.conversationId))

  return msg
}

export async function getConversation(id: string) {
  return db.query.whatsappConversations.findFirst({ where: eq(whatsappConversations.id, id) })
}

export async function listConversations(catalogId: string) {
  return db.query.whatsappConversations.findMany({
    where: eq(whatsappConversations.catalogId, catalogId),
    orderBy: (t) => [desc(t.lastMessageAt)],
  })
}

export async function getMessages(conversationId: string) {
  return db.query.whatsappMessages.findMany({
    where: eq(whatsappMessages.conversationId, conversationId),
    orderBy: (t) => [t.createdAt],
  })
}

export async function setMode(conversationId: string, mode: Mode) {
  await db
    .update(whatsappConversations)
    .set({ mode, updatedAt: new Date() })
    .where(eq(whatsappConversations.id, conversationId))
}
