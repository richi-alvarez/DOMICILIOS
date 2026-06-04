import { NextRequest, NextResponse } from 'next/server'
import { verifyMetaSignature, getVerifyToken, sendWhatsAppText } from '@/lib/whatsapp/meta-client'
import {
  resolveOrderForPhone,
  upsertConversation,
  appendMessage,
  getMessages,
} from '@/lib/whatsapp/conversations'
import { db, catalogs, whatsappMessages } from '@/db'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

/**
 * Verificación del webhook (Meta hace un GET al configurar la URL).
 * Devuelve hub.challenge si el verify_token coincide.
 */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  const mode = sp.get('hub.mode')
  const token = sp.get('hub.verify_token')
  const challenge = sp.get('hub.challenge')

  if (mode === 'subscribe' && token === getVerifyToken()) {
    return new NextResponse(challenge ?? '', { status: 200 })
  }
  return new NextResponse('Forbidden', { status: 403 })
}

/**
 * Recepción de eventos (mensajes entrantes y estados). Verifica la firma
 * x-hub-signature-256, guarda el mensaje, y —si el chat está en modo IA— responde
 * con el LLM. Si la conversación está asociada a un pedido, reenvía al WhatsApp
 * de la tienda. Responde 200 siempre y rápido.
 */
export async function POST(request: NextRequest) {
  const raw = await request.text()
  const signature = request.headers.get('x-hub-signature-256')

  if (!verifyMetaSignature(raw, signature)) {
    return new NextResponse('Invalid signature', { status: 401 })
  }

  let payload: any
  try {
    payload = JSON.parse(raw)
  } catch {
    return new NextResponse('Bad payload', { status: 400 })
  }

  try {
    const changes = payload?.entry?.flatMap((e: any) => e?.changes ?? []) ?? []
    for (const change of changes) {
      const value = change?.value
      const messages = value?.messages ?? []
      const contacts = value?.contacts ?? []
      const contactName = contacts?.[0]?.profile?.name as string | undefined

      for (const m of messages) {
        if (m?.type !== 'text' || !m?.text?.body) continue
        const fromPhone = m.from as string // E.164 sin '+'
        const body = m.text.body as string
        const waMessageId = m.id as string

        await handleInboundMessage({ fromPhone, body, waMessageId, contactName })
      }
    }
  } catch (err) {
    console.error('[whatsapp webhook] error procesando:', err)
    // No propagamos: respondemos 200 para que Meta no reintente en bucle.
  }

  return new NextResponse('ok', { status: 200 })
}

async function handleInboundMessage(input: {
  fromPhone: string
  body: string
  waMessageId: string
  contactName?: string
}) {
  // Dedup: si ya procesamos este mensaje (reintento de Meta), salir.
  const already = await db.query.whatsappMessages.findFirst({
    where: eq(whatsappMessages.waMessageId, input.waMessageId),
  })
  if (already) return

  // Resolver el comercio por el pedido más reciente del teléfono
  const order = await resolveOrderForPhone(input.fromPhone)

  const conv = await upsertConversation({
    customerPhone: input.fromPhone,
    catalogId: order?.catalogId ?? null,
    orderId: order?.id ?? null,
    customerName: input.contactName ?? null,
  })
  if (!conv) return

  // Guardar el mensaje entrante
  await appendMessage({
    conversationId: conv.id,
    direction: 'inbound',
    sender: 'customer',
    body: input.body,
    waMessageId: input.waMessageId,
  })

  const catalog = conv.catalogId
    ? await db.query.catalogs.findFirst({ where: eq(catalogs.id, conv.catalogId) })
    : null

  // Si la conversación está asociada a un pedido, notificar a la tienda
  if (catalog?.contactPhone) {
    const cc = (catalog.contactCountryCode || '+57').replace('+', '')
    const storePhone = `${cc}${catalog.contactPhone}`.replace(/[^\d]/g, '')
    await sendWhatsAppText(
      storePhone,
      `💬 Mensaje del cliente${conv.customerName ? ` ${conv.customerName}` : ''} (pedido #${order?.code ?? '—'}):\n"${input.body}"`,
    ).catch(() => {})
  }

  // Modo Humano: no auto-responder (el agente responde desde el dashboard)
  if (conv.mode !== 'ai') return

  // Modo IA: generar respuesta con el LLM
  const { generateWhatsAppReply } = await import('@/lib/whatsapp/reply')
  const history = (await getMessages(conv.id)).map((mm) => ({
    sender: mm.sender as 'customer' | 'bot' | 'agent' | 'system',
    body: mm.body,
  }))

  const reply = await generateWhatsAppReply({
    storeName: catalog?.name ?? 'la tienda',
    aiPrompt: catalog?.aiPrompt ?? undefined,
    currency: catalog?.currency,
    order: order
      ? {
          code: order.code,
          status: order.status,
          total: (order.totalsJson as any)?.total,
          items: (order.itemsJson as any[])?.map((i) => ({ name: i.name, qty: i.qty })) ?? [],
        }
      : null,
    history,
    userMessage: input.body,
  })

  if (reply.success && reply.content) {
    const sent = await sendWhatsAppText(input.fromPhone, reply.content)
    await appendMessage({
      conversationId: conv.id,
      direction: 'outbound',
      sender: 'bot',
      body: reply.content,
      waMessageId: sent.messageId,
      status: sent.success ? 'sent' : 'failed',
    })
  }
}
