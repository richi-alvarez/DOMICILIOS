import { auth } from '@/auth'
import { db, orders, catalogs, memberships } from '@/db'
import { eq, inArray, and, gte, lte } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { logger } from '@/lib/monitoring/logger'
import { checkRateLimit, rateLimitConfig } from '@/lib/api/rate-limit'
import { getClientIP } from '@/lib/api/get-client-ip'

export const runtime = 'nodejs'

const querySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  interval: z.enum(['day', 'week', 'month']).default('day'),
})

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

    const searchParams = request.nextUrl.searchParams
    const parsed = querySchema.safeParse({
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      interval: searchParams.get('interval'),
    })

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
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
      // No catalogs - return empty data
      return NextResponse.json({
        data: [],
        summary: {
          totalRevenue: 0,
          totalOrders: 0,
          avgDaily: 0,
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString(),
        },
      })
    }

    const catalogIds = orgCatalogs.map((c) => c.id)

    const startDate = parsed.data.startDate
      ? new Date(parsed.data.startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Default 30 days
    const endDate = parsed.data.endDate ? new Date(parsed.data.endDate) : new Date()

    // Get delivered orders in date range
    const deliveredOrders = await db.query.orders.findMany({
      where: and(
        inArray(orders.catalogId, catalogIds),
        eq(orders.status, 'delivered'),
        gte(orders.createdAt, startDate),
        lte(orders.createdAt, endDate),
      ),
      columns: {
        createdAt: true,
        totalsJson: true,
        customerJson: true,
      },
    })

    // Group by date based on interval
    const dataMap = new Map<
      string,
      { revenue: number; orders: number; customers: Set<string> }
    >()

    deliveredOrders.forEach((order) => {
      const date = new Date(order.createdAt)
      let key = ''

      if (parsed.data.interval === 'day') {
        key = date.toISOString().split('T')[0]
      } else if (parsed.data.interval === 'week') {
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        key = weekStart.toISOString().split('T')[0]
      } else if (parsed.data.interval === 'month') {
        key = date.toISOString().slice(0, 7)
      }

      if (!dataMap.has(key)) {
        dataMap.set(key, { revenue: 0, orders: 0, customers: new Set() })
      }

      const entry = dataMap.get(key)!
      const totals = order.totalsJson as any
      if (totals && typeof totals.total === 'number') {
        entry.revenue += totals.total
      }
      entry.orders += 1

      const customer = order.customerJson as any
      const customerKey = customer?.phone || customer?.email || 'unknown'
      entry.customers.add(customerKey)
    })

    // Convert to sorted array
    const data = Array.from(dataMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, stats]) => ({
        date,
        revenue: stats.revenue,
        orders: stats.orders,
        customers: stats.customers.size,
      }))

    // Calculate summary
    const totalRevenue = deliveredOrders.reduce((sum, o) => {
      const totals = o.totalsJson as any
      return sum + (totals?.total || 0)
    }, 0)
    const totalOrders = deliveredOrders.length
    const avgDaily = data.length > 0 ? totalRevenue / data.length : 0

    logger.info('Sales analytics calculated', {
      orgId: membership.organizationId,
      totalOrders,
      totalRevenue,
      interval: parsed.data.interval,
    })

    return NextResponse.json({
      data,
      summary: {
        totalRevenue,
        totalOrders,
        avgDaily: Math.round(avgDaily * 100) / 100,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    })
  } catch (error: any) {
    logger.error('[Analytics Sales Error]', error)
    return NextResponse.json(
      { error: 'Failed to fetch sales data' },
      { status: 500 },
    )
  }
}
