export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { SettingsTabs } from '@/components/app/settings-tabs'
import { getSettingsTabs } from '../settings-tabs-config'
import { ThemeEditor } from '@/components/design-editor/theme-editor'
import { THEME_DEFAULTS, themeSchema } from '@/lib/design/theme'

export const metadata: Metadata = { title: 'Tema Visual' }

async function getData(id: string, userId: string) {
  if (!process.env.DATABASE_URL) return null
  try {
    const { db, catalogs, memberships } = await import('@/db')
    const { eq } = await import('drizzle-orm')
    const membership = await db.query.memberships.findFirst({ where: eq(memberships.userId, userId) })
    if (!membership) return null
    const catalog = await db.query.catalogs.findFirst({ where: eq(catalogs.id, id) })
    if (!catalog || catalog.orgId !== membership.organizationId) return null
    return catalog
  } catch {
    return null
  }
}

export default async function ThemePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  let catalog: Awaited<ReturnType<typeof getData>> = null

  try {
    const session = await auth()
    if (!session?.user?.id) notFound()
    catalog = await getData(id, session.user.id)
  } catch {
    // no-op: handled below
  }

  if (!catalog) {
    return (
      <div className="px-6 py-8">
        <h1 className="mb-2 font-display text-2xl font-bold text-night-900">Tema Visual</h1>
        <p className="text-sm text-night-400">
          {!process.env.DATABASE_URL
            ? 'Configura DATABASE_URL para editar el tema.'
            : 'Catálogo no encontrado.'}
        </p>
      </div>
    )
  }

  const parsed = themeSchema.safeParse(catalog.themeJson ?? {})
  const initialTheme = parsed.success ? parsed.data : THEME_DEFAULTS

  return (
    <div className="px-6 py-8">
      <SettingsTabs tabs={getSettingsTabs(id)} />
      <ThemeEditor
        catalogId={id}
        catalogSlug={catalog.slug}
        initial={{ ...initialTheme, customDomain: catalog.domain ?? '' }}
      />
    </div>
  )
}
