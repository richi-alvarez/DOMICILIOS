import { NextRequest, NextResponse } from 'next/server'
import { db, catalogs, orders } from '@/db'
import { eq } from 'drizzle-orm'
import { createOrder } from '@/lib/actions/orders'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { catalogSlug, customerName, customerEmail, customerPhone, items, deliveryType, deliveryAddress } = body

    // Validar catálogo
    const catalog = await db.query.catalogs.findFirst({
      where: eq(catalogs.slug, catalogSlug),
    })

    if (!catalog) {
      return NextResponse.json({ error: 'Catálogo no encontrado' }, { status: 404 })
    }

    // Crear orden
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
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    const order = result.order
    return NextResponse.json(
      {
        id: order.id,
        code: order.code,
      },
      { status: 201 },
    )
  } catch (err: any) {
    console.error('[api/v1/orders]', err)
    return NextResponse.json({ error: err.message || 'Error interno' }, { status: 500 })
  }
}
