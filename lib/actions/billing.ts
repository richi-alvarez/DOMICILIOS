'use server'

import { eq, and, gte, count } from 'drizzle-orm'
import { db, catalogs, products, orders, memberships } from '@/db'
import { auth } from '@/auth'
import { getOrgPlan, PLAN_LIMITS, PLAN_NAMES, type PlanCode } from '@/lib/billing/limits'

export interface OrgUsage {
  planCode: PlanCode
  planName: string
  limits: typeof PLAN_LIMITS[PlanCode]
  catalogs: { used: number; limit: number }
  products: { used: number; limit: number }
  ordersThisMonth: { used: number; limit: number }
}

export async function getOrgUsage(): Promise<OrgUsage | null> {
  const session = await auth()
  if (!session?.user?.id) return null
  if (!process.env.DATABASE_URL) return null

  try {
    const membership = await db.query.memberships.findFirst({
      where: eq(memberships.userId, session.user.id as string),
    })
    if (!membership) return null

    const orgId = membership.organizationId
    const planCode = await getOrgPlan(orgId)
    const limits = PLAN_LIMITS[planCode]

    const [catalogRows, productRows] = await Promise.all([
      db.query.catalogs.findMany({
        where: eq(catalogs.orgId, orgId),
        columns: { id: true },
      }),
      db.query.products.findMany({
        where: eq(products.catalogId, catalogs.id as unknown as string),
        columns: { id: true },
      }).catch(() => []),
    ])

    const catalogIds = catalogRows.map((c) => c.id)

    // Count products across all catalogs
    let totalProducts = 0
    for (const catalogId of catalogIds) {
      const rows = await db.query.products.findMany({
        where: eq(products.catalogId, catalogId),
        columns: { id: true },
      })
      totalProducts += rows.length
    }

    // Count orders this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    let ordersThisMonth = 0
    if (catalogIds.length > 0) {
      for (const catalogId of catalogIds) {
        const rows = await db.query.orders.findMany({
          where: and(
            eq(orders.catalogId, catalogId),
            gte(orders.createdAt, startOfMonth),
          ),
          columns: { id: true },
        })
        ordersThisMonth += rows.length
      }
    }

    return {
      planCode,
      planName: PLAN_NAMES[planCode],
      limits,
      catalogs: { used: catalogRows.length, limit: limits.catalogs },
      products: { used: totalProducts, limit: limits.products },
      ordersThisMonth: { used: ordersThisMonth, limit: limits.ordersPerMonth },
    }
  } catch (err) {
    console.error('[getOrgUsage]', err)
    return null
  }
}

export async function checkCatalogLimit(): Promise<{ allowed: boolean; used: number; limit: number }> {
  const session = await auth()
  if (!session?.user?.id) return { allowed: false, used: 0, limit: 0 }
  if (!process.env.DATABASE_URL) return { allowed: true, used: 0, limit: 1 }

  try {
    const membership = await db.query.memberships.findFirst({
      where: eq(memberships.userId, session.user.id as string),
    })
    if (!membership) return { allowed: false, used: 0, limit: 0 }

    const orgId = membership.organizationId
    const planCode = await getOrgPlan(orgId)
    const limit = PLAN_LIMITS[planCode].catalogs

    const catalogRows = await db.query.catalogs.findMany({
      where: eq(catalogs.orgId, orgId),
      columns: { id: true },
    })

    const used = catalogRows.length
    return { allowed: limit === -1 || used < limit, used, limit }
  } catch {
    return { allowed: true, used: 0, limit: 1 }
  }
}
