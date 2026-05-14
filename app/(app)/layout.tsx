import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { AppSidebar } from '@/components/app/app-sidebar'
import { getOrgPlan } from '@/lib/billing/limits'

export const dynamic = 'force-dynamic'

async function getLayoutData(userId: string) {
  try {
    if (!process.env.DATABASE_URL) return { catalogs: [], planCode: 'free' as const }
    const { db, memberships, catalogs } = await import('@/db')
    const { eq } = await import('drizzle-orm')
    const membership = await db.query.memberships.findFirst({ where: eq(memberships.userId, userId) })
    if (!membership) return { catalogs: [], planCode: 'free' as const }

    const [catalogList, planCode] = await Promise.all([
      db.query.catalogs.findMany({
        where: eq(catalogs.orgId, membership.organizationId),
        columns: { id: true, name: true, slug: true, status: true },
      }),
      getOrgPlan(membership.organizationId),
    ])

    return { catalogs: catalogList, planCode }
  } catch { return { catalogs: [], planCode: 'free' as const } }
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { catalogs, planCode } = await getLayoutData(session.user.id)

  return (
    <div className="flex h-screen overflow-hidden bg-warm-50">
      <AppSidebar
        catalogs={catalogs as { id: string; name: string; slug: string; status: 'draft' | 'published' | 'archived' }[]}
        userName={session.user?.name ?? undefined}
        userEmail={session.user?.email ?? undefined}
        planCode={planCode}
      />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
