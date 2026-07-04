export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { db, catalogs, memberships } from '@/db'
import { eq } from 'drizzle-orm'
import { DomainEditor } from '@/components/app/domain-editor'
import { SettingsTabs } from '@/components/app/settings-tabs'
import { getSettingsTabs } from '../settings-tabs-config'
import { getT } from '@/lib/i18n/server'

export const metadata: Metadata = { title: 'Dominio personalizado' }

interface Props {
  params: Promise<{ id: string }>
}

async function getCatalog(id: string, userId: string) {
  const membership = await db.query.memberships.findFirst({ where: eq(memberships.userId, userId) })
  if (!membership) return null
  const catalog = await db.query.catalogs.findFirst({ where: eq(catalogs.id, id) })
  if (!catalog || catalog.orgId !== membership.organizationId) return null
  return catalog
}

export default async function DomainPage({ params }: Props) {
  const { id } = await params

  let catalog: any = null
  let dbError = false

  try {
    const session = await auth()
    if (!session?.user?.id) notFound()
    catalog = await getCatalog(id, session.user.id)
    if (!catalog) notFound()
  } catch {
    dbError = true
  }

  const t = await getT()

  if (dbError) {
    return (
      <div className="px-6 py-8">
        <h1 className="mb-2 font-display text-2xl font-bold text-night-900">{t('settings.domain.title')}</h1>
        <p className="text-sm text-night-400">{t('settings.domain.fallbackSubtitle')}</p>
      </div>
    )
  }

  const tabs = getSettingsTabs(id)

  return (
    <div className="px-6 py-8 max-w-3xl">
      <h1 className="text-2xl font-extrabold text-night-800">{t('settings.domain.title')}</h1>
      <p className="mt-1 mb-6 text-sm text-warm-500">{t('settings.domain.subtitle')}</p>

      <SettingsTabs tabs={tabs} />

      <DomainEditor catalogId={id} catalogName={catalog.slug} />
    </div>
  )
}
