import { formatMoney, formatDate, formatTime } from '@/lib/utils'

interface OrderItem {
  name: string
  qty: number
  price: number
  variantLabel?: string
}

interface OrderData {
  code: string
  createdAt: Date
  customer: { name: string; phone: string }
  delivery: { type: 'pickup' | 'delivery'; address?: string; notes?: string }
  items: OrderItem[]
  subtotal: number
  shipping: number
  discount: number
  total: number
  currency: string
}

interface CatalogContact {
  publicUrl: string
  whatsappPhone: string // E.164 without +
  currency: string
}

export function buildWhatsAppUrl(order: OrderData, catalog: CatalogContact) {
  const lines = [
    `¡Hola! Vengo de ${catalog.publicUrl}`,
    ``,
    `Número de pedido: ${order.code}`,
    ``,
    `🗓️ Fecha: ${formatDate(order.createdAt)}`,
    `🕐 Hora: ${formatTime(order.createdAt)}`,
    ``,
    `👤 Información del cliente`,
    `Nombre: ${order.customer.name}`,
    `Teléfono: ${order.customer.phone}`,
    ``,
    order.delivery.type === 'pickup'
      ? `El pedido se recogerá en tienda`
      : `📍 Dirección: ${order.delivery.address ?? ''}`,
    order.delivery.type === 'delivery' && order.delivery.notes
      ? `📝 Indicaciones: ${order.delivery.notes}`
      : null,
    ``,
    `📝 Pedido`,
    ``,
    ...order.items.map(
      (i) =>
        `x${i.qty} ${i.name}${i.variantLabel ? ` (${i.variantLabel})` : ''}   ${formatMoney(i.price * i.qty, order.currency)}`,
    ),
    ``,
    `💲 Costos`,
    ``,
    `Total parcial ${formatMoney(order.subtotal, order.currency)}`,
    order.shipping > 0 ? `Envío ${formatMoney(order.shipping, order.currency)}` : null,
    order.discount > 0 ? `Descuento -${formatMoney(order.discount, order.currency)}` : null,
    ``,
    `Costo total: ${formatMoney(order.total, order.currency)}`,
    ``,
    `👆 Envía este mensaje para crear tu pedido.`,
  ]
    .filter((l) => l !== null)
    .join('\n')

  return `https://api.whatsapp.com/send?phone=${catalog.whatsappPhone}&text=${encodeURIComponent(lines)}`
}
