import { auth } from '@/auth'
import { db, orders, catalogs, memberships } from '@/db'
import { eq, inArray, and } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/monitoring/logger'
import { checkRateLimit, rateLimitConfig } from '@/lib/api/rate-limit'
import { getClientIP } from '@/lib/api/get-client-ip'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIP(request)
    const rateLimitResult = await checkRateLimit(ip, rateLimitConfig.api.limit, rateLimitConfig.api.windowMs)

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitConfig.api.message },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfter || 60),
          },
        }
      )
    }

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
      // No catalogs yet - return zero metrics
      return NextResponse.json({
        totalRevenue: 0,
        orderCount: 0,
        avgOrderValue: 0,
        uniqueCustomers: 0,
        repeatCustomerRate: 0,
        topProducts: [],
      })
    }

    const catalogIds = orgCatalogs.map((c) => c.id)

    // Get all delivered orders for these catalogs
    const deliveredOrders = await db.query.orders.findMany({
      where: and(
        inArray(orders.catalogId, catalogIds),
        eq(orders.status, 'delivered'),
      ),
      columns: {
        id: true,
        totalsJson: true,
        itemsJson: true,
        customerJson: true,
      },
    })

    if (deliveredOrders.length === 0) {
      // No orders yet - return zero metrics
      return NextResponse.json({
        totalRevenue: 0,
        orderCount: 0,
        avgOrderValue: 0,
        uniqueCustomers: 0,
        repeatCustomerRate: 0,
        topProducts: [],
      })
    }

    // Calculate metrics from orders
    let totalRevenue = 0
    const customerMap = new Map<string, number>() // phone/email -> count
    const productMap = new Map<string, { count: number; revenue: number }>()

    deliveredOrders.forEach((order) => {
      // Revenue
      const totals = order.totalsJson as any
      if (totals && typeof totals.total === 'number') {
        totalRevenue += totals.total
      }

      // Customer identification (phone or email)
      const customer = order.customerJson as any
      const customerKey = customer?.phone || customer?.email || 'unknown'
      customerMap.set(customerKey, (customerMap.get(customerKey) || 0) + 1)

      // Top products
      const items = order.itemsJson as any[]
      if (Array.isArray(items)) {
        items.forEach((item) => {
          const productName = item.name || 'Unknown'
          const productPrice = item.price || 0
          const qty = item.qty || 1
          const current = productMap.get(productName) || { count: 0, revenue: 0 }
          productMap.set(productName, {
            count: current.count + qty,
            revenue: current.revenue + productPrice * qty,
          })
        })
      }
    })

    const orderCount = deliveredOrders.length
    const avgOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0
    const uniqueCustomers = customerMap.size

    // Calculate repeat customer rate
    const repeatCustomers = Array.from(customerMap.values()).filter(
      (count) => count > 1,
    ).length
    const repeatCustomerRate =
      uniqueCustomers > 0 ? repeatCustomers / uniqueCustomers : 0

    // Top 5 products by revenue
    const topProducts = Array.from(productMap.entries())
      .map(([name, data]) => ({
        name,
        count: data.count,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    logger.info('Analytics overview calculated', {
      orgId: membership.organizationId,
      orderCount,
      totalRevenue,
      uniqueCustomers,
    })

    return NextResponse.json({
      totalRevenue,
      orderCount,
      avgOrderValue,
      uniqueCustomers,
      repeatCustomerRate: Math.round(repeatCustomerRate * 100) / 100,
      topProducts,
    })
  } catch (error: any) {
    logger.error('[Analytics Overview Error]', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics overview' },
      { status: 500 },
    )
  }
}
