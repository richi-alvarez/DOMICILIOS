export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { db, catalogs, memberships, subscriptions, plans } from '@/db'
import { eq } from 'drizzle-orm'
import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ReportGenerator } from '@/components/app/report-generator'

export const metadata: Metadata = { title: 'Reportes y exportación' }

interface Props {
  params: Promise<{ id: string }>
}

async function getCatalog(id: string, userId: string) {
  const membership = await db.query.memberships.findFirst({
    where: eq(memberships.userId, userId),
  })
  if (!membership) return null

  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.organizationId, membership.organizationId),
    columns: { planId: true },
  })

  if (!subscription) return 'plan_required'

  const plan = await db.query.plans.findFirst({
    where: eq(plans.id, subscription.planId),
    columns: { code: true },
  })

  if (!plan || plan.code === 'free') return 'plan_required'

  const catalog = await db.query.catalogs.findFirst({
    where: eq(catalogs.id, id),
  })
  if (!catalog || catalog.orgId !== membership.organizationId) return null
  return catalog
}

export default async function ReportsPage({ params }: Props) {
  const { id } = await params

  let catalog: any = null
  let dbError = false
  let planRequired = false

  try {
    const session = await auth()
    if (!session?.user?.id) notFound()
    catalog = await getCatalog(id, session.user.id)
    if (catalog === 'plan_required') {
      planRequired = true
    } else if (!catalog) {
      notFound()
    }
  } catch {
    dbError = true
  }

  if (dbError) {
    return (
      <div className="px-6 py-8">
        <h1 className="mb-2 font-display text-2xl font-bold text-night-900">Reportes</h1>
        <p className="text-sm text-night-400">Configura DATABASE_URL para usar reportes.</p>
      </div>
    )
  }

  if (planRequired) {
    return (
      <div className="px-6 py-8 max-w-2xl">
        <h1 className="text-2xl font-extrabold text-night-800">Reportes y exportación</h1>
        <p className="mt-1 mb-8 text-sm text-warm-500">Descarga reportes en Excel o PDF con análisis detallado de ventas.</p>

        <div className="rounded-2xl border-2 border-dashed border-warm-300 bg-warm-50 px-8 py-14 text-center">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-warm-200 text-warm-500">
            <Lock className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-extrabold text-night-800">Reportes disponibles en Pro y Business</h2>
          <p className="mt-2 text-sm text-warm-500 max-w-sm mx-auto">
            Mejora tu plan para acceder a reportes detallados en Excel y PDF de tus ventas y productos.
          </p>
          <Button asChild className="mt-6">
            <Link href="/app/billing">
              Mejorar plan
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="px-6 py-8 max-w-3xl">
      <h1 className="text-2xl font-extrabold text-night-800">Reportes y exportación</h1>
      <p className="mt-1 mb-6 text-sm text-warm-500">
        Descarga reportes en Excel o PDF con análisis detallado de ventas.
      </p>

      <ReportGenerator catalogId={id} />
    </div>
  )
}
