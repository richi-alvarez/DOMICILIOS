export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import { LayoutGrid } from 'lucide-react'
import { CategoryList } from './category-list'
import { getT } from '@/lib/i18n/server'

export const metadata: Metadata = { title: 'Categorías' }

async function getCategories(catalogId: string) {
  if (!process.env.DATABASE_URL) return []
  try {
    const { db, categories } = await import('@/db')
    const { eq, asc } = await import('drizzle-orm')
    return db.query.categories.findMany({
      where: eq(categories.catalogId, catalogId),
      orderBy: asc(categories.position),
    })
  } catch { return [] }
}

export default async function CategoriesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const categoryList = (await getCategories(id)) as any[]
  const t = await getT()

  return (
    <div className="px-6 py-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-night-800">{t('categories.title')}</h1>
        <p className="mt-1 text-sm text-warm-500">{t('categories.subtitle')}</p>
      </div>

      <CategoryList
        catalogId={id}
        initialCategories={categoryList.map((c) => ({ id: c.id, name: c.name, slug: c.slug, active: c.active, position: c.position }))}
      />
    </div>
  )
}
