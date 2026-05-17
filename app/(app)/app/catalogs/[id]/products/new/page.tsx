export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import { ProductForm } from '../_components/product-form'

export const metadata: Metadata = { title: 'Nuevo Producto' }

async function getData(catalogId: string) {
  if (!process.env.DATABASE_URL) return { catalog: null, categories: [] }
  try {
    const { db, catalogs, categories } = await import('@/db')
    const { eq, asc } = await import('drizzle-orm')
    const [catalog, categoryList] = await Promise.all([
      db.query.catalogs.findFirst({ where: eq(catalogs.id, catalogId) }),
      db.query.categories.findMany({ where: eq(categories.catalogId, catalogId), orderBy: asc(categories.position) }),
    ])
    return { catalog, categories: categoryList }
  } catch { return { catalog: null, categories: [] } }
}

export default async function NewProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { catalog, categories } = await getData(id)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <ProductForm
        catalogId={id}
        businessName={catalog?.name ?? 'Mi negocio'}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        currency={catalog?.currency ?? 'COP'}
      />
    </div>
  )
}
