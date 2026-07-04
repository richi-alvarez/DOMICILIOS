export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { db, catalogs, memberships } from '@/db'
import { eq } from 'drizzle-orm'
import { listConversations } from '@/lib/whatsapp/conversations'
import { isMetaConfigured, isStoreReplyEnabled } from '@/lib/whatsapp/meta-client'
import { SettingsTabs } from '@/components/app/settings-tabs'
import { getSettingsTabs } from '../settings-tabs-config'
import { WhatsappClient } from './whatsapp-client'
import { getT } from '@/lib/i18n/server'

export const metadata: Metadata = { title: 'WhatsApp' }

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

export default async function WhatsappSettingsPage({ params }: Props) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) notFound()

  const catalog = await getCatalog(id, session.user.id)
  if (!catalog) notFound()

  const conversations = await listConversations(id)
  const metaConfigured = isMetaConfigured()
  const t = await getT()

  return (
    <div className="px-6 py-8">
      <SettingsTabs tabs={getSettingsTabs(id)} />

      <div className="mb-4">
        <h1 className="font-display text-2xl font-bold text-night-900">{t('settings.whatsapp.title')}</h1>
        <p className="text-sm text-night-400">{t('settings.whatsapp.subtitle')}</p>
      </div>

      {!metaConfigured && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {t('settings.whatsapp.notConfiguredPre')}<code>META_ACCESS_TOKEN</code>
          {t('settings.whatsapp.notConfiguredMid')}
          <code>META_PHONE_NUMBER_ID</code>{t('settings.whatsapp.notConfiguredPost')}
        </div>
      )}

      <WhatsappClient
        catalogId={id}
        storeReplyFeatureEnabled={metaConfigured && isStoreReplyEnabled()}
        initialConversations={conversations.map((c) => ({
          id: c.id,
          customerPhone: c.customerPhone,
          customerName: c.customerName,
          mode: c.mode,
          storeReplyEnabled: c.storeReplyEnabled,
          lastMessageText: c.lastMessageText,
          lastMessageAt: c.lastMessageAt ? c.lastMessageAt.toISOString() : null,
        }))}
      />
    </div>
  )
}
