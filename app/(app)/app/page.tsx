import type { Metadata } from 'next'
export const dynamic = 'force-dynamic'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getOrgUsage } from '@/lib/actions/billing'
import { isAtLimit } from '@/lib/billing/limits'
import { canAccessAIFeatures } from '@/lib/actions/catalogs'
import { CatalogsPageWrapper } from '@/components/app/catalogs-page-wrapper'

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

  const [catalogList, usage, hasAIAccess] = await Promise.all([
    getCatalogs(session.user.id),
    getOrgUsage(),
    canAccessAIFeatures(),
  ])

  // First-time user: redirect to onboarding
  if (catalogList.length === 0 && process.env.DATABASE_URL) {
    redirect('/app/onboarding')
  }

  const atCatalogLimit = usage ? isAtLimit(usage.catalogs.used, usage.catalogs.limit) : false

  return (
    <CatalogsPageWrapper
      catalogList={catalogList}
      usage={usage}
      atCatalogLimit={atCatalogLimit}
      hasAIAccess={hasAIAccess}
    />
  )
}
