import { NextRequest, NextResponse } from 'next/server'
import { db, catalogs } from '@/db'
import { eq } from 'drizzle-orm'
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

    // 4. Create order
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
