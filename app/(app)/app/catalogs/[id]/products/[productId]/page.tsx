export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import { ProductForm } from '../_components/product-form'

export const metadata: Metadata = { title: 'Editar Producto' }

async function getData(catalogId: string, productId: string) {
  if (!process.env.DATABASE_URL) return { catalog: null, product: null, categories: [] }
  try {
    const { db, catalogs, categories, products } = await import('@/db')
    const { eq, asc } = await import('drizzle-orm')
    const [catalog, product, categoryList] = await Promise.all([
      db.query.catalogs.findFirst({ where: eq(catalogs.id, catalogId) }),
      db.query.products.findFirst({ where: eq(products.id, productId) }),
      db.query.categories.findMany({ where: eq(categories.catalogId, catalogId), orderBy: asc(categories.position) }),
    ])
    return { catalog, product, categories: categoryList }
  } catch { return { catalog: null, product: null, categories: [] } }
}

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string; productId: string }>
}) {
  const { id, productId } = await params
  const { catalog, product, categories } = await getData(id, productId)

  if (!product) {
    return <div className="p-6 text-center text-warm-500">Producto no encontrado</div>
  }

  // Imagen principal: primer elemento de imagesJson (string o {url}).
  const rawImages = Array.isArray(product.imagesJson) ? product.imagesJson : []
  const firstImg = rawImages[0] as string | { url?: string } | undefined
  const image = typeof firstImg === 'string' ? firstImg : firstImg?.url
  // Variantes existentes (objeto {colors,sizes} o [] si no hay).
  const v = product.variantsJson
  const variants =
    v && !Array.isArray(v) && typeof v === 'object'
      ? (v as { colors?: { name: string; hex: string; image?: string }[]; sizes?: string[] })
      : undefined

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <ProductForm
        catalogId={id}
        businessName={catalog?.name ?? 'Mi negocio'}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        currency={catalog?.currency ?? 'COP'}
        product={{
          id: product.id,
          name: product.name,
          description: product.description ?? undefined,
          price: product.price / 100,
          compareAt: product.compareAt ? product.compareAt / 100 : undefined,
          stock: product.stock ?? undefined,
          sku: product.sku ?? undefined,
          categoryId: product.categoryId ?? undefined,
          active: product.active,
          image,
          variants,
        }}
      />
    </div>
  )
}
