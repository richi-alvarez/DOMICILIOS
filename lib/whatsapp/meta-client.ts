import crypto from 'crypto'

/**
 * Cliente mínimo de la WhatsApp Cloud API oficial de Meta.
 * Auth por ACCESS_TOKEN permanente + PHONE_NUMBER_ID (sin QR ni sesión).
 * Endpoint: https://graph.facebook.com/{version}/{phoneNumberId}/messages
 */

const GRAPH_VERSION = process.env.META_GRAPH_VERSION || 'v21.0'

export function isMetaConfigured(): boolean {
  return !!(process.env.META_ACCESS_TOKEN && process.env.META_PHONE_NUMBER_ID)
}

/**
 * Si está activado, en modo Humano se reenvía el chat al WhatsApp de la tienda
 * y la tienda puede responder desde su propio número (además del panel).
 * Si está desactivado, el modo Humano se responde SOLO desde el panel admin.
 * Controlado por WHATSAPP_STORE_REPLY (true|1|yes|on).
 */
export function isStoreReplyEnabled(): boolean {
  return ['true', '1', 'yes', 'on'].includes((process.env.WHATSAPP_STORE_REPLY || '').toLowerCase())
}

/** Normaliza a E.164 sin '+' ni separadores (lo que espera la Cloud API en `to`). */
export function normalizePhone(phone: string): string {
  return (phone || '').replace(/[^\d]/g, '')
}

export interface SendResult {
  success: boolean
  messageId?: string
  error?: string
}

/** Envía un mensaje de texto libre. Sujeto a la ventana de 24h de Meta. */
export async function sendWhatsAppText(toPhone: string, body: string): Promise<SendResult> {
  const token = process.env.META_ACCESS_TOKEN
  const phoneNumberId = process.env.META_PHONE_NUMBER_ID
  if (!token || !phoneNumberId) {
    return { success: false, error: 'Meta WhatsApp no configurado (META_ACCESS_TOKEN / META_PHONE_NUMBER_ID)' }
  }

  const to = normalizePhone(toPhone)
  if (!to) return { success: false, error: 'Teléfono destino vacío/ inválido' }

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          type: 'text',
          text: { preview_url: false, body },
        }),
      },
    )

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      const msg = (data as any)?.error?.message || `HTTP ${res.status}`
      return { success: false, error: msg }
    }
    return { success: true, messageId: (data as any)?.messages?.[0]?.id }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error de red' }
  }
}

/**
 * Verifica la firma `x-hub-signature-256` del webhook con HMAC-SHA256(META_APP_SECRET).
 * `rawBody` debe ser el cuerpo crudo (string) tal como llegó.
 */
export function verifyMetaSignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.META_APP_SECRET
  if (!secret) return false // sin secreto no podemos validar → rechazar
  if (!signatureHeader) return false

  const expected =
    'sha256=' + crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex')

  // Comparación en tiempo constante
  const a = Buffer.from(signatureHeader)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

/** Token de verificación del webhook (GET hub.verify_token). */
export function getVerifyToken(): string {
  return process.env.META_VERIFY_TOKEN || 'domicilios_verify_token'
}
