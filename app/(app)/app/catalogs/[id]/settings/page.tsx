export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { db, catalogs, memberships } from '@/db'
import { eq } from 'drizzle-orm'
import { DeliverySettingsForm } from './delivery-settings-form'
import { SettingsTabs } from '@/components/app/settings-tabs'
import { getSettingsTabs } from './settings-tabs-config'
import { DeleteCatalogModal } from './_components/delete-catalog-modal'
import { getOrgPlan, PLAN_LIMITS } from '@/lib/billing/limits'

export const metadata: Metadata = { title: 'Configuración de Entregas' }

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

export default async function SettingsPage({ params }: Props) {
  const { id } = await params

  let catalog: any = null
  let dbError = false
  let canDeleteCatalog = false

  try {
    const session = await auth()
    if (!session?.user?.id) notFound()
    catalog = await getCatalog(id, session.user.id)
    if (!catalog) notFound()

    // Check if user can delete catalogs based on plan
    const membership = await db.query.memberships.findFirst({
      where: eq(memberships.userId, session.user.id),
    })
    if (membership) {
      const plan = await getOrgPlan(membership.organizationId)
      const limits = PLAN_LIMITS[plan]
      canDeleteCatalog = limits.canDeleteCatalogs
    }
  } catch {
    dbError = true
  }

  if (dbError) {
    return (
      <div className="px-6 py-8">
        <h1 className="mb-2 font-display text-2xl font-bold text-night-900">Configuración</h1>
        <p className="text-sm text-night-400">Configura DATABASE_URL para editar la configuración.</p>
      </div>
    )
  }

  const settings = (catalog.settingsJson ?? {}) as Record<string, any>
  const delivery = settings.delivery ?? {}
  const hours = settings.hours ?? {}

  return (
    <div className="px-6 py-8">
      <SettingsTabs tabs={getSettingsTabs(id)} />
      <h1 className="mb-1 font-display text-2xl font-bold text-night-900">Entregas</h1>
      <p className="mb-8 text-sm text-night-400">Canal de pedidos, tipos de entrega y horarios de atención.</p>

      <DeliverySettingsForm
        catalogId={id}
        initial={{
          orderChannel: catalog.orderChannel ?? 'whatsapp',
          contactPhone: catalog.contactPhone ?? '',
          contactCountryCode: catalog.contactCountryCode ?? '+57',
          contactEmail: catalog.contactEmail ?? '',
          pickupEnabled: delivery.pickup_enabled ?? true,
          deliveryEnabled: delivery.delivery_enabled ?? false,
          deliveryFee: delivery.delivery_fee ?? 0,
          deliveryMinOrder: delivery.delivery_min_order ?? 0,
          dineInEnabled: delivery.dine_in_enabled ?? false,
          businessHours: hours,
        }}
      />

      {/* Danger Zone */}
      <div className="mt-12 pt-8 border-t border-red-200">
        <h2 className="text-lg font-semibold text-red-900 mb-4">Zona de Peligro</h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-red-900">Eliminar catálogo</h3>
              <p className="text-sm text-red-700 mt-1">
                Esta acción eliminará el catálogo y todos sus datos de forma permanente e irreversible.
              </p>
            </div>
            {canDeleteCatalog ? (
              <DeleteCatalogModal catalogId={id} catalogName={catalog.name} />
            ) : (
              <div className="text-sm text-red-600">
                <p className="font-medium">No disponible en tu plan</p>
                <p className="text-xs text-red-500 mt-1">Requiere plan Pro o superior</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
