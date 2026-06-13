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

/** Resumen de ítems en una sola línea (apto para variables de plantilla). */
function itemsOneLine(items: OrderMsgItem[], currency: string): string {
  return (
    itemsBlock(items, currency)
      .map((l) => l.replace(/^•\s*/, ''))
      .join(' · ')
      .replace(/\s{2,}/g, ' ') || 'pedido'
  )
}

/** Entrega en una sola línea (apto para variables de plantilla). */
function deliveryOneLine(d: OrderMsgData['delivery']): string {
  if (d.type === 'pickup') return 'Recoger en tienda'
  const base = `A domicilio: ${d.address ?? ''}`.trim()
  const full = d.notes ? `${base} (Ind: ${d.notes})` : base
  return full.replace(/\s{2,}/g, ' ') || 'A domicilio'
}

/**
 * Parámetros {{1}}..{{7}} del template `nuevo_pedido_tienda` (UTILITY, es_CO):
 * {{1}} tienda · {{2}} código · {{3}} cliente · {{4}} teléfono · {{5}} entrega ·
 * {{6}} resumen de ítems · {{7}} total. (Una línea por variable, sin saltos.)
 */
export function buildOrderCreatedTemplateParams(o: OrderMsgData): string[] {
  return [
    o.storeName,
    o.code,
    o.customer.name || 'cliente',
    o.customer.phone || 's/n',
    deliveryOneLine(o.delivery),
    itemsOneLine(o.items, o.currency),
    formatMoney(o.totals.total, o.currency),
  ]
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

/**
 * Parámetros {{1}}..{{5}} del template `pedido_recibido` (UTILITY, es_CO):
 * {{1}} nombre del cliente · {{2}} tienda · {{3}} código · {{4}} resumen de ítems
 * (una sola línea) · {{5}} total.
 * Las variables de plantilla no admiten saltos de línea ni >4 espacios seguidos,
 * por eso el resumen de ítems va en una línea unida con separadores.
 */
export function buildOrderReceivedTemplateParams(o: OrderMsgData): string[] {
  const itemsSummary =
    itemsBlock(o.items, o.currency)
      .map((l) => l.replace(/^•\s*/, ''))
      .join(' · ')
      .replace(/\s{2,}/g, ' ') || 'tu pedido'
  return [
    o.customer.name || 'cliente',
    o.storeName,
    o.code,
    itemsSummary,
    formatMoney(o.totals.total, o.currency),
  ]
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
