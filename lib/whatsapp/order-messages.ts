import { formatMoney } from '@/lib/utils'

// Los montos del pedido (items.price, totals.*) están en unidades enteras de la moneda.

export interface OrderMsgItem {
  name: string
  qty: number
  price: number
  variantLabel?: string
}

export interface OrderMsgData {
  code: string
  storeName: string
  currency: string
  items: OrderMsgItem[]
  totals: { subtotal: number; shipping: number; discount: number; total: number }
  customer: { name: string; phone: string }
  delivery: { type: 'pickup' | 'delivery'; address?: string; notes?: string }
}

function itemsBlock(items: OrderMsgItem[], currency: string): string[] {
  return items.map(
    (i) =>
      `• x${i.qty} ${i.name}${i.variantLabel ? ` (${i.variantLabel})` : ''} — ${formatMoney(
        i.price * i.qty,
        currency,
      )}`,
  )
}

function totalsBlock(t: OrderMsgData['totals'], currency: string): string[] {
  return [
    `Subtotal: ${formatMoney(t.subtotal, currency)}`,
    t.shipping > 0 ? `Envío: ${formatMoney(t.shipping, currency)}` : null,
    t.discount > 0 ? `Descuento: -${formatMoney(t.discount, currency)}` : null,
    `*Total: ${formatMoney(t.total, currency)}*`,
  ].filter((l): l is string => l !== null)
}

function deliveryLine(d: OrderMsgData['delivery']): string[] {
  if (d.type === 'pickup') return ['🏬 Entrega: Recoger en tienda']
  const lines = [`📍 Entrega a domicilio: ${d.address ?? ''}`]
  if (d.notes) lines.push(`📝 Indicaciones: ${d.notes}`)
  return lines
}

/** Mensaje "Pedido creado" que la plataforma envía al WhatsApp de la TIENDA. */
export function buildOrderCreatedForStore(o: OrderMsgData): string {
  return [
    `🛎️ *Nuevo pedido en ${o.storeName}*`,
    `Pedido #${o.code}`,
    ``,
    `👤 Cliente: ${o.customer.name}`,
    `📞 Teléfono: ${o.customer.phone}`,
    ...deliveryLine(o.delivery),
    ``,
    `🧾 *Productos*`,
    ...itemsBlock(o.items, o.currency),
    ``,
    ...totalsBlock(o.totals, o.currency),
    ``,
    `Responde a este chat para gestionar el pedido.`,
  ].join('\n')
}

/** Mensaje "Pedido recibido" que la plataforma envía al WhatsApp del CLIENTE. */
export function buildOrderReceivedForCustomer(o: OrderMsgData): string {
  return [
    `✅ *¡Pedido recibido!*`,
    `Hola ${o.customer.name}, tu pedido en *${o.storeName}* fue registrado.`,
    `Pedido #${o.code}`,
    ``,
    `🧾 *Resumen*`,
    ...itemsBlock(o.items, o.currency),
    ``,
    ...totalsBlock(o.totals, o.currency),
    ``,
    ...deliveryLine(o.delivery),
    ``,
    `Te avisaremos cuando esté en camino. ¡Gracias por tu compra! 🙌`,
  ].join('\n')
}
