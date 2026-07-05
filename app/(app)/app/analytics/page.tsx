import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { db, memberships, catalogs, orders, subscriptions, plans } from '@/db'
import { eq, inArray, and } from 'drizzle-orm'
import { ArrowUp, DollarSign, ShoppingCart, Users, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard'
import { getT } from '@/lib/i18n/server'

export default async function AnalyticsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const t = await getT()

  // Get user's organization
  const membership = await db.query.memberships.findFirst({
    where: eq(memberships.userId, session.user.id),
    columns: { organizationId: true },
  })

  if (!membership) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">{t('analytics.orgNotFound')}</h1>
        </div>
      </div>
    )
  }

  // Check plan
  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.organizationId, membership.organizationId),
    columns: { planId: true },
  })

  if (!subscription) {
    return (
      <div className="px-6 py-8 max-w-2xl">
        <h1 className="text-2xl font-extrabold text-night-800">{t('analytics.title')}</h1>
        <p className="mt-1 mb-8 text-sm text-warm-500">{t('analytics.subtitle')}</p>

        <div className="rounded-2xl border-2 border-dashed border-warm-300 bg-warm-50 px-8 py-14 text-center">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-warm-200 text-warm-500">
            <Lock className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-extrabold text-night-800">{t('analytics.lockedTitle')}</h2>
          <p className="mt-2 text-sm text-warm-500 max-w-sm mx-auto">
            {t('analytics.lockedDesc')}
          </p>
          <Button asChild className="mt-6">
            <Link href="/app/billing">
              {t('analytics.upgrade')}
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const plan = await db.query.plans.findFirst({
    where: eq(plans.id, subscription.planId),
    columns: { code: true },
  })

  if (!plan || plan.code === 'free') {
    return (
      <div className="px-6 py-8 max-w-2xl">
        <h1 className="text-2xl font-extrabold text-night-800">{t('analytics.title')}</h1>
        <p className="mt-1 mb-8 text-sm text-warm-500">{t('analytics.subtitle')}</p>

        <div className="rounded-2xl border-2 border-dashed border-warm-300 bg-warm-50 px-8 py-14 text-center">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-warm-200 text-warm-500">
            <Lock className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-extrabold text-night-800">{t('analytics.lockedTitle')}</h2>
          <p className="mt-2 text-sm text-warm-500 max-w-sm mx-auto">
            {t('analytics.lockedDesc')}
          </p>
          <Button asChild className="mt-6">
            <Link href="/app/billing">
              {t('analytics.upgrade')}
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  // Get catalogs for this organization
  const orgCatalogs = await db.query.catalogs.findMany({
    where: eq(catalogs.orgId, membership.organizationId),
    columns: { id: true },
  })

  let totalRevenue = 0
  let orderCount = 0
  let uniqueCustomers = 0

  if (orgCatalogs.length > 0) {
    const catalogIds = orgCatalogs.map((c) => c.id)

    // Get delivered orders for summary
    const deliveredOrders = await db.query.orders.findMany({
      where: and(
        inArray(orders.catalogId, catalogIds),
        eq(orders.status, 'delivered'),
      ),
      columns: { totalsJson: true, customerJson: true },
      limit: 100,
    })

    const customerMap = new Map<string, boolean>()

    deliveredOrders.forEach((order) => {
      const totals = order.totalsJson as any
      if (totals?.total) totalRevenue += totals.total

      const customer = order.customerJson as any
      const customerKey = customer?.phone || customer?.email || 'unknown'
      customerMap.set(customerKey, true)
    })

    orderCount = deliveredOrders.length
    uniqueCustomers = customerMap.size
  }

  const avgOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-night-800">{t('analytics.title')}</h1>
        <p className="text-warm-600 mt-2">
          {t('analytics.subtitle')}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="rounded-lg border border-warm-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-warm-600">{t('analytics.totalRevenue')}</p>
              <p className="text-3xl font-bold text-night-800 mt-2">
                ${totalRevenue.toFixed(2)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </div>

        {/* Order Count */}
        <div className="rounded-lg border border-warm-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-warm-600">{t('analytics.completedOrders')}</p>
              <p className="text-3xl font-bold text-night-800 mt-2">
                {orderCount}
              </p>
            </div>
            <ShoppingCart className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        {/* Average Order Value */}
        <div className="rounded-lg border border-warm-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-warm-600">{t('analytics.avgOrder')}</p>
              <p className="text-3xl font-bold text-night-800 mt-2">
                ${avgOrderValue.toFixed(2)}
              </p>
            </div>
            <ArrowUp className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        {/* Unique Customers */}
        <div className="rounded-lg border border-warm-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-warm-600">{t('analytics.uniqueCustomers')}</p>
              <p className="text-3xl font-bold text-night-800 mt-2">
                {uniqueCustomers}
              </p>
            </div>
            <Users className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <AnalyticsDashboard organizationId={membership.organizationId} />
    </div>
  )
}
