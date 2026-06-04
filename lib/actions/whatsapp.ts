'use server'

import { eq } from 'drizzle-orm'
import { auth } from '@/auth'
import { db, catalogs, memberships, whatsappConversations } from '@/db'
import {
  listConversations,
  getMessages,
  getConversation,
  appendMessage,
  setMode,
} from '@/lib/whatsapp/conversations'
import { sendWhatsAppText } from '@/lib/whatsapp/meta-client'

async function getOwnedCatalog(catalogId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autenticado')
  const membership = await db.query.memberships.findFirst({
    where: eq(memberships.userId, session.user.id),
  })
  if (!membership) throw new Error('Sin organización')
  const catalog = await db.query.catalogs.findFirst({ where: eq(catalogs.id, catalogId) })
  if (!catalog || catalog.orgId !== membership.organizationId) throw new Error('No autorizado')
  return catalog
}

async function getOwnedConversation(conversationId: string) {
  const conv = await getConversation(conversationId)
  if (!conv) throw new Error('Conversación no encontrada')
  if (!conv.catalogId) throw new Error('Conversación sin comercio asignado')
  await getOwnedCatalog(conv.catalogId)
  return conv
}

export async function listConversationsAction(catalogId: string) {
  await getOwnedCatalog(catalogId)
  return listConversations(catalogId)
}

export async function getMessagesAction(conversationId: string) {
  await getOwnedConversation(conversationId)
  return getMessages(conversationId)
}

export async function setModeAction(conversationId: string, mode: 'ai' | 'human') {
  await getOwnedConversation(conversationId)
  await setMode(conversationId, mode)
  return { ok: true }
}

export async function sendManualReplyAction(conversationId: string, body: string) {
  const conv = await getOwnedConversation(conversationId)
  const text = body.trim()
  if (!text) return { error: 'Mensaje vacío' }

  const sent = await sendWhatsAppText(conv.customerPhone, text)
  await appendMessage({
    conversationId,
    direction: 'outbound',
    sender: 'agent',
    body: text,
    waMessageId: sent.messageId,
    status: sent.success ? 'sent' : 'failed',
  })

  if (!sent.success) return { error: `No se pudo enviar por WhatsApp: ${sent.error}`, saved: true }
  return { ok: true }
}
