import { PLAN_LIMITS } from './constants'
import type { PlanCode } from './constants'

export type { PlanCode, PlanLimits } from './constants'
export { PLAN_LIMITS, PLAN_NAMES, PLAN_COLORS, formatLimit, isAtLimit, usagePercent } from './constants'

export async function getOrgPlan(orgId: string): Promise<PlanCode> {
  if (!process.env.DATABASE_URL) return 'free'
  try {
    const { db, subscriptions, plans } = await import('@/db')
    const { eq, and } = await import('drizzle-orm')
    const sub = await db.query.subscriptions.findFirst({
      where: and(
        eq(subscriptions.organizationId, orgId),
      ),
    })
    if (!sub) return 'free'
    const plan = await db.query.plans.findFirst({ where: eq(plans.id, sub.planId) })
    const code = plan?.code as PlanCode | undefined
    if (code && code in PLAN_LIMITS) return code
    return 'free'
  } catch {
    return 'free'
  }
}
