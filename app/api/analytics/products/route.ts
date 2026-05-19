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
      return NextResponse.json({ topProducts: [] })
    }

    const catalogIds = orgCatalogs.map((c) => c.id)

    // Get all delivered orders for these catalogs
    const deliveredOrders = await db.query.orders.findMany({
      where: and(
        inArray(orders.catalogId, catalogIds),
        eq(orders.status, 'delivered'),
      ),
      columns: { itemsJson: true },
    })

    if (deliveredOrders.length === 0) {
      return NextResponse.json({ topProducts: [] })
    }

    // Aggregate product metrics
    const productMap = new Map<string, { count: number; revenue: number; orders: number }>()

    deliveredOrders.forEach((order) => {
      const items = order.itemsJson as any[]
      if (Array.isArray(items)) {
        items.forEach((item) => {
          const productName = item.name || 'Unknown'
          const productPrice = item.price || 0
          const qty = item.qty || 1

          const current = productMap.get(productName) || {
            count: 0,
            revenue: 0,
            orders: 0,
          }
          productMap.set(productName, {
            count: current.count + qty,
            revenue: current.revenue + productPrice * qty,
            orders: current.orders + 1,
          })
        })
      }
    })

    // Get top 10 products by revenue
    const topProducts = Array.from(productMap.entries())
      .map(([name, data]) => ({
        name,
        count: data.count,
        revenue: data.revenue,
        orders: data.orders,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    logger.info('Product analytics calculated', {
      orgId: membership.organizationId,
      productsCount: topProducts.length,
    })

    return NextResponse.json({ topProducts })
  } catch (error: any) {
    logger.error('[Analytics Products Error]', error)
    return NextResponse.json(
      { error: 'Failed to fetch product analytics' },
      { status: 500 },
    )
  }
}
