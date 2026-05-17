import { NextRequest, NextResponse } from 'next/server'
import { db, catalogs, orders } from '@/db'
import { eq } from 'drizzle-orm'
import { createOrder } from '@/lib/actions/orders'
import { logger } from '@/lib/monitoring/logger'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { catalogSlug, customerName, customerEmail, customerPhone, items, deliveryType, deliveryAddress } = body

    if (!catalogSlug || !customerName || !customerEmail) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 })
    }

    const catalog = await db.query.catalogs.findFirst({
      where: eq(catalogs.slug, catalogSlug),
    })

    if (!catalog) {
      return NextResponse.json({ error: 'Catalog not found' }, { status: 404 })
    }

    const result = await createOrder({
      catalogId: catalog.id,
      customer: {
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
      },
      items,
      delivery: {
        type: deliveryType || 'pickup',
        address: deliveryAddress,
      },
      channel: 'api',
    } as any)

    if ('error' in result) {
      return NextResponse.json({ error: 'Unable to create order' }, { status: 400 })
    }

    const order = result.order
    return NextResponse.json(
      {
        id: order.id,
        code: order.code,
      },
      { status: 201 },
    )
  } catch (err) {
    logger.error('Failed to create order via API', err)
    return NextResponse.json({ error: 'Unable to create order' }, { status: 500 })
  }
}
