import { NextRequest, NextResponse } from 'next/server'
import { db, catalogs, products } from '@/db'
import { eq } from 'drizzle-orm'

export const runtime = 'nodejs'

interface Props {
  params: Promise<{ slug: string }>
}

export async function GET(req: NextRequest, { params }: Props) {
  try {
    const { slug } = await params

    const catalog = await db.query.catalogs.findFirst({
      where: eq(catalogs.slug, slug),
    })

    if (!catalog) {
      return NextResponse.json({ error: 'Catálogo no encontrado' }, { status: 404 })
    }

    const prods = await db.query.products.findMany({
      where: eq(products.catalogId, catalog.id),
    })

    const page = parseInt(req.nextUrl.searchParams.get('page') || '1')
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '20'), 100)
    const start = (page - 1) * limit

    const filtered = prods.filter((p) => p.active).slice(start, start + limit)

    return NextResponse.json({
      data: filtered.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: p.price,
        compareAt: p.compareAt,
        stock: p.stock,
        categoryId: p.categoryId,
        images: p.imagesJson || [],
        variants: p.variantsJson || [],
      })),
      pagination: {
        page,
        limit,
        total: prods.filter((p) => p.active).length,
      },
    })
  } catch (err) {
    console.error('[api/v1/catalogs/products]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
