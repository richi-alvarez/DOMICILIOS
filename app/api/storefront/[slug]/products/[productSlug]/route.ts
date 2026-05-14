import { NextRequest, NextResponse } from 'next/server'
import { getCatalogBySlug, getProductBySlug } from '@/lib/storefront/queries'

interface Params {
  slug: string
  productSlug: string
}

export async function GET(req: NextRequest, { params }: { params: Promise<Params> }) {
  const { slug, productSlug } = await params
  const catalog = await getCatalogBySlug(slug)
  if (!catalog) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const product = await getProductBySlug(catalog.id, productSlug)
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({
    catalog: { id: catalog.id, name: catalog.name, currency: catalog.currency },
    product,
  })
}
