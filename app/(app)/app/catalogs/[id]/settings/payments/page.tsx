export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { db, catalogs, memberships } from '@/db'
import { eq } from 'drizzle-orm'
import { SettingsTabs } from '@/components/app/settings-tabs'
import { getSettingsTabs } from '../settings-tabs-config'
import { getPaymentMethods } from '@/lib/actions/payments'
import { PaymentsForm } from './payments-form'
import { getT } from '@/lib/i18n/server'

export const metadata: Metadata = { title: 'Configuración de Pagos' }

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

export default async function PaymentsSettingsPage({ params }: Props) {
  const { id } = await params

  let catalog: any = null
  let paymentMethodData: any = null
  let dbError = false

  try {
    const session = await auth()
    if (!session?.user?.id) notFound()
    catalog = await getCatalog(id, session.user.id)
    if (!catalog) notFound()
    const methods = await getPaymentMethods(id)
    paymentMethodData = methods.find((m) => m.provider === 'stripe') ?? null
  } catch {
    dbError = true
  }

  const t = await getT()

  if (dbError) {
    return (
      <div className="px-6 py-8">
        <h1 className="mb-2 font-display text-2xl font-bold text-night-900">{t('settings.payments.title')}</h1>
        <p className="text-sm text-night-400">{t('settings.payments.fallbackSubtitle')}</p>
      </div>
    )
  }

  return (
    <div className="px-6 py-8">
      <SettingsTabs tabs={getSettingsTabs(id)} />
      <h1 className="mb-1 font-display text-2xl font-bold text-night-900">{t('settings.payments.title')}</h1>
      <p className="mb-8 text-sm text-night-400">{t('settings.payments.subtitle')}</p>
      <PaymentsForm catalogId={id} existing={paymentMethodData} />
    </div>
  )
}
