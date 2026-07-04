export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { db, catalogs, memberships } from '@/db'
import { eq } from 'drizzle-orm'
import { getOrdersForCatalog } from '@/lib/actions/orders'
import { OrdersClient } from './orders-client'
import { Package } from 'lucide-react'
import { getT } from '@/lib/i18n/server'

export const metadata: Metadata = { title: 'Pedidos' }

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ status?: string; search?: string; from?: string; to?: string; page?: string }>
}

async function getCatalog(id: string, userId: string) {
  const membership = await db.query.memberships.findFirst({ where: eq(memberships.userId, userId) })
  if (!membership) return null
  const catalog = await db.query.catalogs.findFirst({ where: eq(catalogs.id, id) })
  if (!catalog || catalog.orgId !== membership.organizationId) return null
  return catalog
}

export default async function OrdersPage({ params, searchParams }: Props) {
  const { id } = await params
  const { status, search, from, to, page } = await searchParams

  const t = await getT()
  let orders: any[] = []
  let catalogName = ''
  let dbError = false

  try {
    const session = await auth()
    if (!session?.user?.id) notFound()

    const catalog = await getCatalog(id, session.user.id)
    if (!catalog) notFound()
    catalogName = catalog.name

    orders = await getOrdersForCatalog(id, {
      status,
      search,
      from,
      to,
      page: page ? parseInt(page) : 1,
    })
  } catch {
    dbError = true
  }

  if (dbError) {
    return (
      <div className="px-6 py-8">
        <h1 className="mb-1 font-display text-2xl font-bold text-night-900">{t('orders.title')}</h1>
        <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-warm-200 bg-white py-20 text-center">
          <Package className="h-12 w-12 text-warm-300" />
          <p className="text-night-500">{t('orders.dbError')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-night-900">{t('orders.title')}</h1>
          <p className="text-sm text-night-400">{catalogName}</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-lime-100 px-3 py-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime-500 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-lime-500" />
          </span>
          <span className="text-xs font-medium text-lime-700">{t('orders.receiving')}</span>
        </div>
      </div>

      <OrdersClient initialOrders={orders} catalogId={id} />
    </div>
  )
}
