export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { db, catalogs, memberships } from '@/db'
import { and, eq } from 'drizzle-orm'
import { SettingsTabs } from '@/components/app/settings-tabs'
import { getSettingsTabs } from '../settings-tabs-config'
import { SalesTypeForm } from './sales-type-form'
import { DEFAULT_BOOKING, type BookingConfig } from '@/lib/booking/config'

export const metadata: Metadata = { title: 'Tipo de venta' }

interface Props {
  params: Promise<{ id: string }>
}

export default async function SalesTypePage({ params }: Props) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) notFound()

  const catalog = await db.query.catalogs.findFirst({ where: eq(catalogs.id, id) })
  if (!catalog) notFound()
  const member = await db.query.memberships.findFirst({
    where: and(eq(memberships.userId, session.user.id), eq(memberships.organizationId, catalog.orgId)),
  })
  if (!member) notFound()

  const settings = (catalog.settingsJson ?? {}) as Record<string, unknown>
  const booking = (settings.booking as BookingConfig) ?? DEFAULT_BOOKING
  const ctaLabel = (settings.ctaLabel as string) ?? ''

  return (
    <div className="px-6 py-8">
      <SettingsTabs tabs={getSettingsTabs(id)} />
      <h1 className="mb-1 font-display text-2xl font-bold text-night-900">Tipo de venta</h1>
      <p className="mb-8 text-sm text-night-400">
        Elige cómo opera este catálogo: vender productos (carrito) o agendar servicios (citas).
        Solo puedes seleccionar uno.
      </p>

      <SalesTypeForm
        catalogId={id}
        initial={{
          type: (catalog.type as 'products' | 'appointments') ?? 'products',
          ctaLabel,
          booking,
        }}
      />
    </div>
  )
}
