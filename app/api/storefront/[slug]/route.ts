import { NextRequest, NextResponse } from 'next/server'
import { getCatalogBySlug } from '@/lib/storefront/queries'

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const catalog = await getCatalogBySlug(slug)
  if (!catalog) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const deliveryCfg = (catalog.settingsJson?.delivery ?? {}) as {
    delivery_enabled?: boolean
    delivery_fee?: number
    delivery_min_order?: number
  }

  return NextResponse.json({
    catalog: {
      id: catalog.id,
      name: catalog.name,
      currency: catalog.currency,
      orderChannel: catalog.orderChannel,
      contactPhone: catalog.contactPhone,
      contactCountryCode: catalog.contactCountryCode,
      contactEmail: catalog.contactEmail,
      delivery: {
        enabled: deliveryCfg.delivery_enabled ?? true,
        fee: Number(deliveryCfg.delivery_fee ?? 0),
        minOrder: Number(deliveryCfg.delivery_min_order ?? 0),
      },
    },
  })
}
