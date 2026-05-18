'use server'

import { eq } from 'drizzle-orm'
import { auth } from '@/auth'
import { db, memberships } from '@/db'
import { getOrgPlan, PLAN_LIMITS } from '@/lib/billing/limits'

async function getOrgId(userId: string) {
  const membership = await db.query.memberships.findFirst({
    where: eq(memberships.userId, userId),
    columns: { organizationId: true },
  })
  return membership?.organizationId ?? null
}

export async function canAccessMonitoring(): Promise<boolean> {
  try {
    const session = await auth()
    if (!session?.user?.id) return false

    const orgId = await getOrgId(session.user.id)
    if (!orgId) return false

    const plan = await getOrgPlan(orgId)
    const limits = PLAN_LIMITS[plan]
    return limits.monitoringAccess ?? false
  } catch {
    return false
  }
}
