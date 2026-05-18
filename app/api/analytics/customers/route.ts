import { auth } from '@/auth'
import { db, orders, catalogs, memberships } from '@/db'
import { eq, inArray, and } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/monitoring/logger'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's organization
    const membership = await db.query.memberships.findFirst({
      where: eq(memberships.userId, session.user.id),
      columns: { organizationId: true },
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'No organization found' },
        { status: 404 },
      )
    }

    // Get all catalogs for this organization
    const orgCatalogs = await db.query.catalogs.findMany({
      where: eq(catalogs.orgId, membership.organizationId),
      columns: { id: true },
    })

    if (orgCatalogs.length === 0) {
      // No catalogs - return zero metrics
      return NextResponse.json({
        totalCustomers: 0,
        repeatCustomers: 0,
        avgLifetimeValue: 0,
        churnRate: 0,
        newCustomersThisMonth: 0,
        activeCustomersLastMonth: 0,
        topCustomers: [],
      })
    }

    const catalogIds = orgCatalogs.map((c) => c.id)

    // Get all delivered orders for these catalogs
    const allOrders = await db.query.orders.findMany({
      where: and(
        inArray(orders.catalogId, catalogIds),
        eq(orders.status, 'delivered'),
      ),
      columns: {
        createdAt: true,
        totalsJson: true,
        customerJson: true,
      },
    })

    if (allOrders.length === 0) {
      // No orders - return zero metrics
      return NextResponse.json({
        totalCustomers: 0,
        repeatCustomers: 0,
        avgLifetimeValue: 0,
        churnRate: 0,
        newCustomersThisMonth: 0,
        activeCustomersLastMonth: 0,
        topCustomers: [],
      })
    }

    // Calculate customer metrics
    const customerLTV = new Map<string, { ltv: number; orders: number; name: string }>()
    const customerFirstPurchase = new Map<string, Date>()
    const customerLastPurchase = new Map<string, Date>()

    allOrders.forEach((order) => {
      const customer = order.customerJson as any
      const customerKey = customer?.phone || customer?.email || 'unknown'
      const customerName = customer?.name || customerKey

      const existing = customerLTV.get(customerKey) || { ltv: 0, orders: 0, name: customerName }
      const totals = order.totalsJson as any
      if (totals && typeof totals.total === 'number') {
        existing.ltv += totals.total
      }
      existing.orders += 1
      existing.name = customerName // Update with latest name
      customerLTV.set(customerKey, existing)

      const createdAt = new Date(order.createdAt)
      if (!customerFirstPurchase.has(customerKey)) {
        customerFirstPurchase.set(customerKey, createdAt)
      }
      customerLastPurchase.set(customerKey, createdAt)
    })

    // Get unique and repeat customers
    const totalCustomers = customerLTV.size
    const repeatCustomers = Array.from(customerLTV.values()).filter(
      (c) => c.orders > 1,
    ).length
    const avgLifetimeValue =
      totalCustomers > 0
        ? Array.from(customerLTV.values()).reduce((sum, c) => sum + c.ltv, 0) /
          totalCustomers
        : 0

    // Calculate churn (customers with no purchase in last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const activeCustomers = Array.from(customerLastPurchase.entries()).filter(
      ([_, date]) => date >= thirtyDaysAgo,
    ).length
    const churnedCustomers = totalCustomers - activeCustomers
    const churnRate =
      totalCustomers > 0
        ? Math.round((churnedCustomers / totalCustomers) * 100) / 100
        : 0

    // Get top customers
    const topCustomers = Array.from(customerLTV.entries())
      .sort(([, a], [, b]) => b.ltv - a.ltv)
      .slice(0, 5)
      .map(([key, data]) => ({
        id: key,
        name: data.name,
        ltv: data.ltv,
        orderCount: data.orders,
      }))

    // Count new customers this month
    const monthStart = new Date()
    monthStart.setDate(1)
    const newCustomersThisMonth = Array.from(customerFirstPurchase.entries()).filter(
      ([_, date]) => date >= monthStart,
    ).length

    logger.info('Customer analytics calculated', {
      orgId: membership.organizationId,
      totalCustomers,
      avgLifetimeValue,
    })

    return NextResponse.json({
      totalCustomers,
      repeatCustomers,
      avgLifetimeValue: Math.round(avgLifetimeValue * 100) / 100,
      churnRate,
      newCustomersThisMonth,
      activeCustomersLastMonth: activeCustomers,
      topCustomers,
    })
  } catch (error: any) {
    logger.error('[Analytics Customers Error]', error)
    return NextResponse.json(
      { error: 'Failed to fetch customer analytics' },
      { status: 500 },
    )
  }
}
