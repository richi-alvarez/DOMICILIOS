export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Plus, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProductActions } from './product-actions'
import { NewProductDialog } from './new-product-dialog'
import { formatMoney } from '@/lib/utils'

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

  return (
    <div className="px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-night-800">Productos</h1>
          <p className="mt-1 text-sm text-warm-500">{products.length} producto{products.length !== 1 ? 's' : ''}</p>
        </div>
        <NewProductDialog catalogId={id} categories={categories.map((c) => ({ id: c.id, name: c.name }))} />
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-warm-200 bg-white py-16 text-center">
          <Package className="mb-3 h-10 w-10 text-warm-300" />
          <h2 className="font-bold text-night-800">Sin productos aún</h2>
          <p className="mt-1 text-sm text-warm-500">Agrega tu primer producto para empezar a vender.</p>
          <NewProductDialog
            catalogId={id}
            categories={categories.map((c) => ({ id: c.id, name: c.name }))}
            trigger={
              <Button className="mt-4">
                <Plus className="h-4 w-4" /> Agregar producto
              </Button>
            }
          />
        </div>
      ) : (
        <div className="rounded-2xl border border-warm-200 bg-white shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-warm-100 bg-warm-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-warm-400">Producto</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-warm-400 hidden sm:table-cell">Categoría</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-warm-400">Precio</th>
                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-warm-400 hidden md:table-cell">Stock</th>
                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-warm-400">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-100">
              {products.map((product) => {
                const cat = categories.find((c) => c.id === product.categoryId)
                return (
                  <tr key={product.id} className="hover:bg-warm-50 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-night-800">{product.name}</p>
                        {product.sku && <p className="text-xs text-warm-400">SKU: {product.sku}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-warm-500">{cat?.name ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-night-800">
                      {formatMoney(product.price / 100, catalog?.currency ?? 'COP')}
                      {product.compareAt && (
                        <span className="ml-1 text-xs text-warm-400 line-through">
                          {formatMoney(product.compareAt / 100, catalog?.currency ?? 'COP')}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center hidden md:table-cell">
                      {product.stock !== null ? (
                        <span className={product.stock === 0 ? 'text-red-500 font-medium' : 'text-night-700'}>
                          {product.stock}
                        </span>
                      ) : (
                        <span className="text-warm-400">∞</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={product.active ? 'lime' : 'muted'}>
                        {product.active ? 'Activo' : 'Oculto'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <ProductActions
                        product={{
                          id: product.id,
                          name: product.name,
                          description: product.description ?? '',
                          price: product.price / 100,
                          compareAt: product.compareAt ? product.compareAt / 100 : undefined,
                          stock: product.stock ?? undefined,
                          sku: product.sku ?? '',
                          categoryId: product.categoryId ?? '',
                          active: product.active,
                        }}
                        catalogId={id}
                        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
