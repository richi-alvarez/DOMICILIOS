export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { db, catalogs, memberships } from '@/db'
import { eq } from 'drizzle-orm'
import { WebhookManager } from '@/components/app/webhook-manager'

export const metadata: Metadata = { title: 'Webhooks' }

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

export default async function WebhooksPage({ params }: Props) {
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

  if (dbError) {
    return (
      <div className="px-6 py-8">
        <h1 className="mb-2 font-display text-2xl font-bold text-night-900">Webhooks</h1>
        <p className="text-sm text-night-400">Configura DATABASE_URL para usar webhooks.</p>
      </div>
    )
  }

  return (
    <div className="px-6 py-8 max-w-3xl">
      <h1 className="text-2xl font-extrabold text-night-800">Webhooks e integraciones</h1>
      <p className="mt-1 mb-6 text-sm text-warm-500">
        Recibe eventos en tiempo real en tu aplicación. Compatible con Zapier, Make, y más.
      </p>

      <WebhookManager catalogId={id} />
    </div>
  )
}
