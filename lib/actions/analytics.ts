'use server'

import { eq, and, gte, count } from 'drizzle-orm'
import { db, orders, analyticsEvents, catalogs } from '@/db'
import { auth } from '@/auth'
import { getOrgPlan } from '@/lib/billing/limits'

export interface AnalyticsData {
  pageViews: number
  productViews: number
  orderCount: number
  revenue: number
  currency: string
  conversionRate: number
  ordersByDay: { date: string; count: number }[]
  topProducts: { name: string; qty: number }[]
  ordersByStatus: { status: string; count: number }[]
}

export type AnalyticsResult =
  | ({ ok: true } & AnalyticsData)
  | { ok: false; error: 'unauthenticated' | 'not_found' | 'plan_required' }

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  pending_send: 'Pendiente',
  received: 'Recibido',
  preparing: 'Preparando',
  ready: 'Listo',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
}

export async function getAnalytics(catalogId: string, days = 30): Promise<AnalyticsResult> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'unauthenticated' }

  if (!process.env.DATABASE_URL) return { ok: false, error: 'plan_required' }

  const catalog = await db.query.catalogs.findFirst({ where: eq(catalogs.id, catalogId) })
  if (!catalog) return { ok: false, error: 'not_found' }

  const plan = await getOrgPlan(catalog.orgId)
  if (plan !== 'pro' && plan !== 'business') return { ok: false, error: 'plan_required' }

  const since = new Date()
  since.setDate(since.getDate() - days)
  since.setHours(0, 0, 0, 0)

  const [[pvRow], [prodViewRow], ordersInPeriod] = await Promise.all([
    db
      .select({ count: count() })
      .from(analyticsEvents)
      .where(and(
        eq(analyticsEvents.catalogId, catalogId),
        eq(analyticsEvents.type, 'page_view'),
        gte(analyticsEvents.ts, since),
      )),
    db
      .select({ count: count() })
      .from(analyticsEvents)
      .where(and(
        eq(analyticsEvents.catalogId, catalogId),
        eq(analyticsEvents.type, 'product_view'),
        gte(analyticsEvents.ts, since),
      )),
    db.query.orders.findMany({
      where: and(eq(orders.catalogId, catalogId), gte(orders.createdAt, since)),
    }),
  ])

  const pageViews = pvRow?.count ?? 0
  const productViews = prodViewRow?.count ?? 0

  const activeOrders = ordersInPeriod.filter((o) => o.status !== 'cancelled')
  const orderCount = activeOrders.length
  const revenue = activeOrders.reduce((sum, o) => {
    const t = o.totalsJson as { total?: number } | null
    return sum + (t?.total ?? 0)
  }, 0)
  const currency = (activeOrders[0]?.totalsJson as { currency?: string } | null)?.currency ?? catalog.currency ?? 'COP'
  const conversionRate = pageViews > 0 ? (orderCount / pageViews) * 100 : 0

  // Fill every day in the range
  const dayMap: Record<string, number> = {}
  for (const order of activeOrders) {
    const d = order.createdAt.toISOString().slice(0, 10)
    dayMap[d] = (dayMap[d] ?? 0) + 1
  }
  const ordersByDay: { date: string; count: number }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    ordersByDay.push({ date: dateStr, count: dayMap[dateStr] ?? 0 })
  }

  // Top products from orders items JSON
  const productMap: Record<string, { name: string; qty: number }> = {}
  for (const order of activeOrders) {
    const items = order.itemsJson as { productId: string; name: string; qty: number }[] | null
    for (const item of items ?? []) {
      if (!productMap[item.productId]) productMap[item.productId] = { name: item.name, qty: 0 }
      productMap[item.productId].qty += item.qty
    }
  }
  const topProducts = Object.values(productMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 6)

  // Orders by status (all statuses, including cancelled)
  const statusMap: Record<string, number> = {}
  for (const order of ordersInPeriod) {
    statusMap[order.status] = (statusMap[order.status] ?? 0) + 1
  }
  const ordersByStatus = Object.entries(statusMap).map(([status, count]) => ({
    status: STATUS_LABELS[status] ?? status,
    count,
  }))

  return {
    ok: true,
    pageViews,
    productViews,
    orderCount,
    revenue,
    currency,
    conversionRate,
    ordersByDay,
    topProducts,
    ordersByStatus,
  }
}
