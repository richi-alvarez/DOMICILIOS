'use server'

import { eq, desc, and, gte, lte, sql } from 'drizzle-orm'
import { db, orders, catalogs, products } from '@/db'
import { generateOrderCode } from '@/lib/utils'
import { getNextOrderSequence } from '@/lib/storefront/queries'
import { calcTotals } from '@/lib/cart/totals'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { auth } from '@/auth'

const createOrderSchema = z.object({
  catalogId: z.string().uuid(),
  items: z.array(
    z.object({
      productId: z.string(),
      name: z.string(),
      price: z.number(),
      qty: z.number().min(1),
      variantLabel: z.string().optional(),
    }),
  ).min(1),
  delivery: z.object({
    type: z.enum(['pickup', 'delivery']),
    address: z.string().optional(),
    zone: z.string().optional(),
    fee: z.number().default(0),
  }),
  customer: z.object({
    name: z.string().min(2),
    phone: z.string().min(4),
    email: z.string().email().optional().or(z.literal('')),
  }),
})

export type CreateOrderPayload = z.infer<typeof createOrderSchema>

export async function createOrder(payload: CreateOrderPayload) {
  const parsed = createOrderSchema.safeParse(payload)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const { catalogId, items, delivery, customer } = parsed.data

  const catalog = await db.query.catalogs.findFirst({ where: eq(catalogs.id, catalogId) })
  if (!catalog || catalog.status !== 'published') {
    return { error: 'Catálogo no encontrado o no publicado' }
  }

  const seq = await getNextOrderSequence(catalogId)
  const code = generateOrderCode(catalogId, seq)
  const totals = calcTotals(items, delivery.fee)

  const [order] = await db
    .insert(orders)
    .values({
      code,
      catalogId,
      status: 'pending_send',
      customerJson: customer,
      itemsJson: items,
      deliveryJson: delivery,
      paymentJson: { method: 'pending', status: 'pending' },
      totalsJson: {
        subtotal: totals.subtotal,
        shipping: totals.shipping,
        discount: totals.discount,
        total: totals.total,
        currency: catalog.currency,
      },
    })
    .returning()

  // Deduct stock for products that track it
  for (const item of items) {
    await db
      .update(products)
      .set({ stock: sql`GREATEST(0, stock - ${item.qty})` })
      .where(and(eq(products.id, item.productId), sql`stock IS NOT NULL`))
  }

  // Notify merchant by email (fire-and-forget)
  if (catalog.contactEmail || catalog.orderChannel === 'email') {
    sendOrderNotificationEmail(catalog, order, items, customer, delivery).catch(() => {})
  }

  revalidatePath(`/app/catalogs/${catalogId}/orders`)
  return { order: { id: order.id, code: order.code } }
}

async function sendOrderNotificationEmail(
  catalog: { name: string; contactEmail: string | null; currency: string },
  order: { id: string; code: string },
  items: { name: string; qty: number; price: number }[],
  customer: { name: string; phone: string },
  delivery: { type: string },
) {
  try {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    const to = catalog.contactEmail ?? ''
    if (!to) return
    await resend.emails.send({
      from: 'WaStore <no-reply@wastore.app>',
      to,
      subject: `Nuevo pedido #${order.code} — ${catalog.name}`,
      html: `<p>Tienes un nuevo pedido <strong>#${order.code}</strong> de <strong>${customer.name}</strong> (${customer.phone}).</p>
<p>Entrega: ${delivery.type === 'pickup' ? 'Recoger en tienda' : 'A domicilio'}</p>
<ul>${items.map((i) => `<li>x${i.qty} ${i.name}</li>`).join('')}</ul>
<p>Revisa el panel de pedidos para gestionar este pedido.</p>`,
    })
  } catch {}
}

export async function markOrderWhatsAppSent(orderId: string) {
  await db
    .update(orders)
    .set({ status: 'received', whatsappSentAt: new Date() })
    .where(eq(orders.id, orderId))
}

export async function updateOrderStatus(orderId: string, status: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'No autenticado' }

  const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) })
  if (!order) return { error: 'Pedido no encontrado' }

  await db.update(orders).set({ status: status as any, updatedAt: new Date() }).where(eq(orders.id, orderId))
  revalidatePath(`/app/catalogs/${order.catalogId}/orders`)
  return { ok: true }
}

export async function deleteOrder(orderId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'No autenticado' }

  const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) })
  if (!order) return { error: 'Pedido no encontrado' }

  await db.delete(orders).where(eq(orders.id, orderId))
  revalidatePath(`/app/catalogs/${order.catalogId}/orders`)
  return { ok: true }
}

export async function getOrdersForCatalog(
  catalogId: string,
  opts: { status?: string; search?: string; from?: string; to?: string; page?: number; limit?: number } = {},
) {
  const { page = 1, limit = 20 } = opts
  const offset = (page - 1) * limit

  let where = eq(orders.catalogId, catalogId)
  if (opts.status && opts.status !== 'all') {
    where = and(where, eq(orders.status, opts.status as any)) as any
  }
  if (opts.from) {
    where = and(where, gte(orders.createdAt, new Date(opts.from))) as any
  }
  if (opts.to) {
    const toDate = new Date(opts.to)
    toDate.setHours(23, 59, 59, 999)
    where = and(where, lte(orders.createdAt, toDate)) as any
  }

  const rows = await db.query.orders.findMany({
    where,
    orderBy: [desc(orders.createdAt)],
    limit,
    offset,
  })

  // filter by code search client-side (simple approach)
  const filtered = opts.search
    ? rows.filter((r) => r.code.includes(opts.search!.toUpperCase()))
    : rows

  return filtered
}
