import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { db, memberships, catalogs, orders } from '@/db'
import { eq, inArray, and } from 'drizzle-orm'
import { ArrowUp, DollarSign, ShoppingCart, Users } from 'lucide-react'
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard'

export default async function AnalyticsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  // Get user's organization
  const membership = await db.query.memberships.findFirst({
    where: eq(memberships.userId, session.user.id),
    columns: { organizationId: true },
  })

  if (!membership) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Organización no encontrada</h1>
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
        <h1 className="text-3xl font-bold text-night-800">Analytics</h1>
        <p className="text-warm-600 mt-2">
          Analiza el desempeño de tu negocio en tiempo real
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="rounded-lg border border-warm-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-warm-600">Ingresos totales</p>
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
              <p className="text-sm text-warm-600">Órdenes completadas</p>
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
              <p className="text-sm text-warm-600">Orden promedio</p>
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
              <p className="text-sm text-warm-600">Clientes únicos</p>
              <p className="text-3xl font-bold text-night-800 mt-2">
                {uniqueCustomers}
              </p>
            </div>
            <Users className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Dashboard Component */}
      <AnalyticsDashboard organizationId={membership.organizationId} />
    </div>
  )
}
