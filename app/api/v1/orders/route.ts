import { NextRequest, NextResponse } from 'next/server'
import { db, catalogs, organizations, subscriptions, plans, orders } from '@/db'
import { eq, and, gte, lte } from 'drizzle-orm'
import { createOrder } from '@/lib/actions/orders'
import { logger } from '@/lib/monitoring/logger'
import { CreateOrderSchema } from '@/lib/validators/schemas'
import { checkRateLimit, rateLimitConfig } from '@/lib/api/rate-limit'
import { getClientIP } from '@/lib/api/get-client-ip'
import { z } from 'zod'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    // 1. Rate limiting
    const ip = getClientIP(req)
    const rateLimitResult = await checkRateLimit(ip, rateLimitConfig.orders.limit, rateLimitConfig.orders.windowMs)

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitConfig.orders.message },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfter || 60),
          },
        }
      )
    }

    // 2. Input validation
    const body = await req.json()
    const validated = CreateOrderSchema.parse(body)

    // 3. Verify catalog exists
    const catalog = await db.query.catalogs.findFirst({
      where: eq(catalogs.slug, validated.catalogSlug),
    })

    if (!catalog) {
      return NextResponse.json(
        { error: 'Catalog not found' },
        { status: 404 }
      )
    }

    // 4. Check monthly order limit for free users
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, catalog.orgId),
      columns: { id: true },
    })

    if (org) {
      const subscription = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.organizationId, org.id),
        columns: { planId: true },
      })

      if (subscription) {
        const plan = await db.query.plans.findFirst({
          where: eq(plans.id, subscription.planId),
          columns: { code: true },
        })

        if (plan?.code === 'free') {
          const now = new Date()
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
          const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

          const monthlyOrderCount = await db.query.orders.findMany({
            where: and(
              eq(orders.catalogId, catalog.id),
              gte(orders.createdAt, monthStart),
              lte(orders.createdAt, monthEnd)
            ),
            columns: { id: true },
          })

          if (monthlyOrderCount.length >= 30) {
            return NextResponse.json(
              { error: 'Límite de 30 pedidos/mes alcanzado en el plan gratis. Mejora tu plan para recibir más pedidos.' },
              { status: 429 }
            )
          }
        }
      }
    }

    // 5. Create order
    const result = await createOrder({
      catalogId: catalog.id,
      customer: {
        name: validated.customerName,
        email: validated.customerEmail,
        phone: validated.customerPhone,
      },
      items: validated.items,
      delivery: {
        type: validated.deliveryType,
        address: validated.deliveryAddress,
      },
      channel: 'api',
    } as any)

    if ('error' in result) {
      return NextResponse.json(
        { error: 'Unable to create order' },
        { status: 400 }
      )
    }

    const order = result.order
    return NextResponse.json(
      {
        id: order.id,
        code: order.code,
      },
      { status: 201 }
    )
  } catch (err) {
    // Validation errors
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: err.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      )
    }

    logger.error('Failed to create order via API', err)
    return NextResponse.json(
      { error: 'Unable to create order' },
      { status: 500 }
    )
  }
}
