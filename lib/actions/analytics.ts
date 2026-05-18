'use server'

import { auth } from '@/auth'
import { db, orders, catalogs, memberships } from '@/db'
import { eq, inArray, and, gte, lte } from 'drizzle-orm'

export async function getAnalyticsOverview() {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: 'No autenticado' }

    const membership = await db.query.memberships.findFirst({
      where: eq(memberships.userId, session.user.id),
      columns: { organizationId: true },
    })

    if (!membership) return { error: 'Organización no encontrada' }

    return getAnalyticsOverviewData(membership.organizationId)
  } catch (error: any) {
    console.error('Error in getAnalyticsOverview:', error)
    return { error: error.message || 'Error al obtener datos' }
  }
}

async function getAnalyticsOverviewData(organizationId: string) {
  const orgCatalogs = await db.query.catalogs.findMany({
    where: eq(catalogs.orgId, organizationId),
    columns: { id: true },
  })

    if (orgCatalogs.length === 0) {
      return {
        totalRevenue: 0,
        orderCount: 0,
        avgOrderValue: 0,
        uniqueCustomers: 0,
        repeatCustomerRate: 0,
        topProducts: [],
      }
    }

    const catalogIds = orgCatalogs.map((c) => c.id)
    const deliveredOrders = await db.query.orders.findMany({
      where: and(
        inArray(orders.catalogId, catalogIds),
        eq(orders.status, 'delivered'),
      ),
      columns: { id: true, totalsJson: true, itemsJson: true, customerJson: true },
    })

    if (deliveredOrders.length === 0) {
      return {
        totalRevenue: 0,
        orderCount: 0,
        avgOrderValue: 0,
        uniqueCustomers: 0,
        repeatCustomerRate: 0,
        topProducts: [],
      }
    }

    let totalRevenue = 0
    const customerMap = new Map<string, number>()
    const productMap = new Map<string, { count: number; revenue: number }>()

    deliveredOrders.forEach((order) => {
      const totals = order.totalsJson as any
      if (totals?.total) totalRevenue += totals.total

      const customer = order.customerJson as any
      const customerKey = customer?.phone || customer?.email || 'unknown'
      customerMap.set(customerKey, (customerMap.get(customerKey) || 0) + 1)

      const items = order.itemsJson as any[]
      if (Array.isArray(items)) {
        items.forEach((item) => {
          const name = item.name || 'Unknown'
          const current = productMap.get(name) || { count: 0, revenue: 0 }
          productMap.set(name, {
            count: current.count + (item.qty || 1),
            revenue: current.revenue + (item.price || 0) * (item.qty || 1),
          })
        })
      }
    })

    const orderCount = deliveredOrders.length
    const avgOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0
    const uniqueCustomers = customerMap.size

    const repeatCustomers = Array.from(customerMap.values()).filter(
      (count) => count > 1,
    ).length
    const repeatCustomerRate =
      uniqueCustomers > 0 ? repeatCustomers / uniqueCustomers : 0

    const topProducts = Array.from(productMap.entries())
      .map(([name, data]) => ({ name, count: data.count, revenue: data.revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

  return {
    totalRevenue,
    orderCount,
    avgOrderValue,
    uniqueCustomers,
    repeatCustomerRate: Math.round(repeatCustomerRate * 100) / 100,
    topProducts,
  }
}

export async function getSalesData(
  startDate?: string,
  endDate?: string,
  interval: 'day' | 'week' | 'month' = 'day',
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: 'No autenticado' }

    const membership = await db.query.memberships.findFirst({
      where: eq(memberships.userId, session.user.id),
      columns: { organizationId: true },
    })

    if (!membership) return { error: 'Organización no encontrada' }

    const orgCatalogs = await db.query.catalogs.findMany({
      where: eq(catalogs.orgId, membership.organizationId),
      columns: { id: true },
    })

    if (orgCatalogs.length === 0) {
      return {
        data: [],
        summary: {
          totalRevenue: 0,
          totalOrders: 0,
          avgDaily: 0,
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString(),
        },
      }
    }

    const catalogIds = orgCatalogs.map((c) => c.id)
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const end = endDate ? new Date(endDate) : new Date()

    const deliveredOrders = await db.query.orders.findMany({
      where: and(
        inArray(orders.catalogId, catalogIds),
        eq(orders.status, 'delivered'),
        gte(orders.createdAt, start),
        lte(orders.createdAt, end),
      ),
      columns: { createdAt: true, totalsJson: true, customerJson: true },
    })

    const dataMap = new Map<string, { revenue: number; orders: number; customers: Set<string> }>()

    deliveredOrders.forEach((order) => {
      const date = new Date(order.createdAt)
      let key = ''

      if (interval === 'day') {
        key = date.toISOString().split('T')[0]
      } else if (interval === 'week') {
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        key = weekStart.toISOString().split('T')[0]
      } else if (interval === 'month') {
        key = date.toISOString().slice(0, 7)
      }

      if (!dataMap.has(key)) {
        dataMap.set(key, { revenue: 0, orders: 0, customers: new Set() })
      }

      const entry = dataMap.get(key)!
      const totals = order.totalsJson as any
      if (totals?.total) entry.revenue += totals.total
      entry.orders += 1

      const customer = order.customerJson as any
      const customerKey = customer?.phone || customer?.email || 'unknown'
      entry.customers.add(customerKey)
    })

    const data = Array.from(dataMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, stats]) => ({
        date,
        revenue: stats.revenue,
        orders: stats.orders,
        customers: stats.customers.size,
      }))

    const totalRevenue = deliveredOrders.reduce((sum, o) => {
      const totals = o.totalsJson as any
      return sum + (totals?.total || 0)
    }, 0)
    const totalOrders = deliveredOrders.length
    const avgDaily = data.length > 0 ? totalRevenue / data.length : 0

    return {
      data,
      summary: {
        totalRevenue,
        totalOrders,
        avgDaily: Math.round(avgDaily * 100) / 100,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      },
    }
  } catch (error: any) {
    console.error('Error in getSalesData:', error)
    return { error: error.message || 'Error al obtener datos' }
  }
}

export async function getCustomerAnalytics() {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: 'No autenticado' }

    const membership = await db.query.memberships.findFirst({
      where: eq(memberships.userId, session.user.id),
      columns: { organizationId: true },
    })

    if (!membership) return { error: 'Organización no encontrada' }

    const orgCatalogs = await db.query.catalogs.findMany({
      where: eq(catalogs.orgId, membership.organizationId),
      columns: { id: true },
    })

    if (orgCatalogs.length === 0) {
      return {
        totalCustomers: 0,
        repeatCustomers: 0,
        avgLifetimeValue: 0,
        churnRate: 0,
        newCustomersThisMonth: 0,
        activeCustomersLastMonth: 0,
        topCustomers: [],
      }
    }

    const catalogIds = orgCatalogs.map((c) => c.id)
    const allOrders = await db.query.orders.findMany({
      where: and(
        inArray(orders.catalogId, catalogIds),
        eq(orders.status, 'delivered'),
      ),
      columns: { createdAt: true, totalsJson: true, customerJson: true },
    })

    if (allOrders.length === 0) {
      return {
        totalCustomers: 0,
        repeatCustomers: 0,
        avgLifetimeValue: 0,
        churnRate: 0,
        newCustomersThisMonth: 0,
        activeCustomersLastMonth: 0,
        topCustomers: [],
      }
    }

    const customerLTV = new Map<string, { ltv: number; orders: number; name: string }>()
    const customerFirstPurchase = new Map<string, Date>()
    const customerLastPurchase = new Map<string, Date>()

    allOrders.forEach((order) => {
      const customer = order.customerJson as any
      const customerKey = customer?.phone || customer?.email || 'unknown'
      const customerName = customer?.name || customerKey

      const existing = customerLTV.get(customerKey) || { ltv: 0, orders: 0, name: customerName }
      const totals = order.totalsJson as any
      if (totals?.total) existing.ltv += totals.total
      existing.orders += 1
      existing.name = customerName
      customerLTV.set(customerKey, existing)

      const createdAt = new Date(order.createdAt)
      if (!customerFirstPurchase.has(customerKey)) {
        customerFirstPurchase.set(customerKey, createdAt)
      }
      customerLastPurchase.set(customerKey, createdAt)
    })

    const totalCustomers = customerLTV.size
    const repeatCustomers = Array.from(customerLTV.values()).filter(
      (c) => c.orders > 1,
    ).length
    const avgLifetimeValue =
      totalCustomers > 0
        ? Array.from(customerLTV.values()).reduce((sum, c) => sum + c.ltv, 0) / totalCustomers
        : 0

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const activeCustomers = Array.from(customerLastPurchase.entries()).filter(
      ([_, date]) => date >= thirtyDaysAgo,
    ).length
    const churnedCustomers = totalCustomers - activeCustomers
    const churnRate =
      totalCustomers > 0
        ? Math.round((churnedCustomers / totalCustomers) * 100) / 100
        : 0

    const topCustomers = Array.from(customerLTV.entries())
      .sort(([, a], [, b]) => b.ltv - a.ltv)
      .slice(0, 5)
      .map(([key, data]) => ({
        id: key,
        name: data.name,
        ltv: data.ltv,
        orderCount: data.orders,
      }))

    const monthStart = new Date()
    monthStart.setDate(1)
    const newCustomersThisMonth = Array.from(customerFirstPurchase.entries()).filter(
      ([_, date]) => date >= monthStart,
    ).length

    return {
      totalCustomers,
      repeatCustomers,
      avgLifetimeValue: Math.round(avgLifetimeValue * 100) / 100,
      churnRate,
      newCustomersThisMonth,
      activeCustomersLastMonth: activeCustomers,
      topCustomers,
    }
  } catch (error: any) {
    console.error('Error in getCustomerAnalytics:', error)
    return { error: error.message || 'Error al obtener datos' }
  }
}
