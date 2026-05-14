import { NextRequest, NextResponse } from 'next/server'
import { db, catalogs, products, categories } from '@/db'
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

    // Obtener categorías y productos
    const cats = await db.query.categories.findMany({
      where: eq(categories.catalogId, catalog.id),
    })

    const prods = await db.query.products.findMany({
      where: eq(products.catalogId, catalog.id),
    })

    return NextResponse.json({
      id: catalog.id,
      slug: catalog.slug,
      name: catalog.name,
      description: catalog.description,
      currency: catalog.currency,
      language: catalog.language,
      categories: cats.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
      })),
      products: prods
        .filter((p) => p.active)
        .map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          description: p.description,
          price: p.price,
          compareAt: p.compareAt,
          stock: p.stock,
          categoryId: p.categoryId,
          images: p.imagesJson || [],
        })),
    })
  } catch (err) {
    console.error('[api/v1/catalogs]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
