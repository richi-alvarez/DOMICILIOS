export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import { DesignEditor } from '@/components/design-editor/design-editor'
import { getBlocksForCatalog } from '@/lib/actions/design'

export const metadata: Metadata = { title: 'Diseño' }

async function getData(catalogId: string) {
  if (!process.env.DATABASE_URL) return { catalog: null, blocks: [] }
  try {
    const { db, catalogs } = await import('@/db')
    const { eq } = await import('drizzle-orm')
    const catalog = await db.query.catalogs.findFirst({ where: eq(catalogs.id, catalogId) })
    const blocks = await getBlocksForCatalog(catalogId)
    return { catalog, blocks }
  } catch {
    return { catalog: null, blocks: [] }
  }
}

export default async function DesignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { catalog, blocks } = await getData(id)

  if (!catalog) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm text-warm-500">
          {!process.env.DATABASE_URL
            ? 'Configura DATABASE_URL para usar el editor de diseño.'
            : 'Catálogo no encontrado.'}
        </p>
      </div>
    )
  }

  return (
    <DesignEditor
      catalogId={id}
      catalogSlug={catalog.slug}
      initialBlocks={blocks}
    />
  )
}
