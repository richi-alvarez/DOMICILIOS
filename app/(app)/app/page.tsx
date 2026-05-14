import type { Metadata } from 'next'
export const dynamic = 'force-dynamic'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Globe, ExternalLink, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PlanBadge } from '@/components/app/plan-badge'
import { UsageBar } from '@/components/app/usage-bar'
import { getOrgUsage } from '@/lib/actions/billing'
import { isAtLimit } from '@/lib/billing/limits'

export const metadata: Metadata = { title: 'Mis catálogos' }

async function getCatalogs(userId: string) {
  if (!process.env.DATABASE_URL) return []
  try {
    const { db, memberships, catalogs } = await import('@/db')
    const { eq } = await import('drizzle-orm')
    const membership = await db.query.memberships.findFirst({ where: eq(memberships.userId, userId) })
    if (!membership) return []
    return db.query.catalogs.findMany({ where: eq(catalogs.orgId, membership.organizationId) })
  } catch { return [] }
}

export default async function AppDashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const [catalogList, usage] = await Promise.all([
    getCatalogs(session.user.id),
    getOrgUsage(),
  ])

  // First-time user: redirect to onboarding
  if (catalogList.length === 0 && process.env.DATABASE_URL) {
    redirect('/app/onboarding')
  }

  const atCatalogLimit = usage ? isAtLimit(usage.catalogs.used, usage.catalogs.limit) : false

  return (
    <div className="px-6 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-night-800">Mis catálogos</h1>
          <p className="mt-0.5 text-sm text-warm-500">
            {catalogList.length === 0
              ? 'Crea tu primer catálogo digital'
              : `${catalogList.length} catálogo${catalogList.length > 1 ? 's' : ''}`}
          </p>
        </div>
        {atCatalogLimit ? (
          <Link href="/plans">
            <Button variant="outline">
              <Zap className="h-4 w-4 text-primary-500" /> Mejorar plan
            </Button>
          </Link>
        ) : (
          <Button asChild>
            <Link href="/app/catalogs/new">
              <Plus className="h-4 w-4" /> Nuevo catálogo
            </Link>
          </Button>
        )}
      </div>

      {/* Upgrade banner when at limit */}
      {atCatalogLimit && usage && (
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-center gap-3">
            <Zap className="h-5 w-5 text-amber-500 flex-shrink-0" />
            <p className="text-sm text-amber-800">
              Has alcanzado el límite de <strong>{usage.catalogs.limit} catálogo{usage.catalogs.limit !== 1 ? 's' : ''}</strong> del plan {usage.planName}.
            </p>
          </div>
          <Link href="/plans" className="ml-4 flex-shrink-0 text-sm font-bold text-amber-700 hover:underline">
            Ver planes →
          </Link>
        </div>
      )}

      {/* Plan usage summary (only when not at limit to avoid duplicate) */}
      {usage && !atCatalogLimit && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-warm-200 bg-white px-5 py-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold text-night-700">Plan actual</span>
              <PlanBadge plan={usage.planCode} />
            </div>
            <UsageBar
              label="Catálogos"
              used={usage.catalogs.used}
              limit={usage.catalogs.limit}
            />
          </div>
          {usage.planCode === 'free' && (
            <Link href="/plans" className="ml-4 flex-shrink-0 text-xs font-bold text-primary-500 hover:underline whitespace-nowrap">
              Mejorar plan →
            </Link>
          )}
        </div>
      )}

      {/* Catalog grid */}
      {catalogList.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-warm-200 bg-white py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100">
            <Globe className="h-8 w-8 text-primary-500" />
          </div>
          <h2 className="text-xl font-bold text-night-800">Crea tu primer catálogo</h2>
          <p className="mt-2 max-w-sm text-sm text-warm-500">
            Publica tu tienda en minutos. Agrega productos, personaliza el diseño y comparte el enlace.
          </p>
          <Button asChild className="mt-6">
            <Link href="/app/catalogs/new">
              <Plus className="h-4 w-4" /> Crear catálogo
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {catalogList.map((catalog) => (
            <Link
              key={catalog.id}
              href={`/app/catalogs/${catalog.id}`}
              className="group rounded-2xl border border-warm-200 bg-white p-5 shadow-card transition-shadow hover:shadow-elevated"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100">
                  <Globe className="h-6 w-6 text-primary-500" />
                </div>
                <Badge variant={catalog.status === 'published' ? 'lime' : 'muted'}>
                  {catalog.status === 'published' ? 'Publicado' : 'Borrador'}
                </Badge>
              </div>
              <h3 className="font-bold text-night-800 group-hover:text-primary-500 transition-colors">
                {catalog.name}
              </h3>
              <p className="mt-1 text-sm text-warm-400">/{catalog.slug}</p>
              {catalog.status === 'published' && (
                <div className="mt-3 flex items-center gap-1 text-xs text-primary-500">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Ver tienda pública
                </div>
              )}
            </Link>
          ))}

          {/* Add new card */}
          {!atCatalogLimit && (
            <Link
              href="/app/catalogs/new"
              className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-warm-200 p-5 text-warm-400 transition-colors hover:border-primary-300 hover:text-primary-500 min-h-[160px]"
            >
              <Plus className="mb-2 h-8 w-8" />
              <span className="text-sm font-medium">Nuevo catálogo</span>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
