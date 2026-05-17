export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import { ProductsList } from './_components/products-list'

export const metadata: Metadata = { title: 'Productos' }

async function getData(catalogId: string) {
  if (!process.env.DATABASE_URL) return { catalog: null, products: [], categories: [] }
  try {
    const { db, products, catalogs, categories } = await import('@/db')
    const { eq, asc } = await import('drizzle-orm')
    const [catalog, productList, categoryList] = await Promise.all([
      db.query.catalogs.findFirst({ where: eq(catalogs.id, catalogId) }),
      db.query.products.findMany({ where: eq(products.catalogId, catalogId), orderBy: asc(products.position) }),
      db.query.categories.findMany({ where: eq(categories.catalogId, catalogId), orderBy: asc(categories.position) }),
    ])
    return { catalog, products: productList, categories: categoryList }
  } catch { return { catalog: null, products: [], categories: [] } }
}

export default async function ProductsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { catalog, products, categories } = await getData(id)

  const formattedProducts = products.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description ?? undefined,
    price: p.price / 100,
    compareAt: p.compareAt ? p.compareAt / 100 : undefined,
    stock: p.stock ?? undefined,
    sku: p.sku ?? undefined,
    categoryId: p.categoryId ?? undefined,
    active: p.active,
    tags: [],
  }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <ProductsList
        products={formattedProducts}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        catalogId={id}
        currency={catalog?.currency ?? 'COP'}
      />
    </div>
  )
}
