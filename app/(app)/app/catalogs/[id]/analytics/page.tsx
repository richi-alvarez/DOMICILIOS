export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Lock, TrendingUp, ShoppingBag, Eye, DollarSign, ArrowUpRight, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getAnalytics } from '@/lib/actions/analytics'
import { formatMoney } from '@/lib/utils'
import { getT } from '@/lib/i18n/server'

export const metadata: Metadata = { title: 'Estadísticas' }

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ days?: string }>
}

const DAY_OPTIONS = [7, 14, 30] as const
type DayOption = (typeof DAY_OPTIONS)[number]

const STATUS_COLORS: Record<string, string> = {
  Borrador: 'bg-warm-200 text-warm-700',
  Pendiente: 'bg-yellow-100 text-yellow-700',
  Recibido: 'bg-blue-100 text-blue-700',
  Preparando: 'bg-orange-100 text-orange-700',
  Listo: 'bg-lime-100 text-lime-700',
  Entregado: 'bg-green-100 text-green-700',
  Cancelado: 'bg-red-100 text-red-700',
}

function BarChart({ data, unitOne, unitMany }: { data: { date: string; count: number }[]; unitOne: string; unitMany: string }) {
  const max = Math.max(...data.map((d) => d.count), 1)
  // Show every 5th label to avoid crowding
  const step = data.length <= 14 ? 2 : 5

  return (
    <div className="w-full">
      <div className="flex items-end gap-[2px] h-36">
        {data.map((d, i) => {
          const pct = (d.count / max) * 100
          return (
            <div key={d.date} className="flex flex-1 flex-col items-center gap-0.5 group relative">
              {d.count > 0 && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 rounded bg-night-800 px-1.5 py-0.5 text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                  {d.count} {d.count !== 1 ? unitMany : unitOne}
                </div>
              )}
              <div
                className="w-full rounded-t-sm bg-primary-500 transition-all duration-300 group-hover:bg-primary-600"
                style={{ height: `${Math.max(pct, d.count > 0 ? 2 : 0)}%` }}
              />
            </div>
          )
        })}
      </div>
      {/* X axis labels */}
      <div className="flex items-end gap-[2px] mt-1">
        {data.map((d, i) => (
          <div key={d.date} className="flex-1 text-center">
            {i % step === 0 && (
              <span className="text-[9px] text-warm-400 leading-none">
                {d.date.slice(5)}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string
  value: string
  sub?: string
  icon: React.ElementType
  color: string
}) {
  return (
    <div className="rounded-2xl border border-warm-200 bg-white p-5">
      <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-4.5 w-4.5" />
      </div>
      <p className="text-xs font-medium text-warm-500 uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-2xl font-extrabold text-night-900">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-warm-400">{sub}</p>}
    </div>
  )
}

export default async function AnalyticsPage({ params, searchParams }: Props) {
  const { id } = await params
  const { days: daysParam } = await searchParams

  const days: DayOption = DAY_OPTIONS.includes(Number(daysParam) as DayOption)
    ? (Number(daysParam) as DayOption)
    : 30

  const result = await getAnalytics(id, days)
  const t = await getT()

  // Plan gate
  if (!result.ok && (result as any).error === 'plan_required') {
    return (
      <div className="px-6 py-8 max-w-2xl">
        <h1 className="text-2xl font-extrabold text-night-800">{t('analytics.statsTitle')}</h1>
        <p className="mt-1 mb-8 text-sm text-warm-500">{t('analytics.statsSubtitle')}</p>

        <div className="rounded-2xl border-2 border-dashed border-warm-300 bg-warm-50 px-8 py-14 text-center">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-warm-200 text-warm-500">
            <Lock className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-extrabold text-night-800">{t('analytics.statsLockedTitle')}</h2>
          <p className="mt-2 text-sm text-warm-500 max-w-sm mx-auto">
            {t('analytics.statsLockedDesc')}
          </p>
          <Button asChild className="mt-6">
            <Link href="/app/billing">
              <Zap className="h-4 w-4" /> {t('analytics.viewPlans')}
            </Link>
          </Button>

          {/* Blurred preview */}
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 blur-sm select-none pointer-events-none opacity-60">
            {[t('analytics.visits'), t('analytics.orders'), t('analytics.conversion'), t('analytics.revenue')].map((l) => (
              <div key={l} className="rounded-2xl border border-warm-200 bg-white p-5 text-left">
                <div className="mb-3 h-9 w-9 rounded-xl bg-warm-100" />
                <p className="text-xs font-medium text-warm-400 uppercase tracking-wide">{l}</p>
                <p className="mt-1 text-2xl font-extrabold text-night-200">—</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!result.ok) {
    return (
      <div className="px-6 py-8">
        <p className="text-sm text-warm-500">{t('analytics.loadError')}</p>
      </div>
    )
  }

  const {
    pageViews,
    productViews,
    orderCount,
    revenue,
    currency,
    conversionRate,
    ordersByDay,
    topProducts,
    ordersByStatus,
  } = result

  const maxProductQty = Math.max(...topProducts.map((p) => p.qty), 1)

  return (
    <div className="px-6 py-8 max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-night-800">{t('analytics.statsTitle')}</h1>
          <p className="mt-0.5 text-sm text-warm-500">{t('analytics.lastDaysPre')}{days}{t('analytics.lastDaysPost')}</p>
        </div>

        {/* Day range selector */}
        <div className="flex gap-1 rounded-xl bg-warm-100 p-1 text-sm">
          {DAY_OPTIONS.map((d) => (
            <Link
              key={d}
              href={`?days=${d}`}
              className={`rounded-lg px-3 py-1.5 font-semibold transition ${
                days === d
                  ? 'bg-white text-night-800 shadow-sm'
                  : 'text-warm-500 hover:text-night-700'
              }`}
            >
              {d}d
            </Link>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6">
        <KpiCard
          label={t('analytics.visits')}
          value={pageViews.toLocaleString('es')}
          sub={`${productViews.toLocaleString('es')}${t('analytics.productViewsSuffix')}`}
          icon={Eye}
          color="bg-blue-50 text-blue-600"
        />
        <KpiCard
          label={t('analytics.orders')}
          value={orderCount.toLocaleString('es')}
          sub={`${days}${t('analytics.daysSuffix')}`}
          icon={ShoppingBag}
          color="bg-primary-50 text-primary-600"
        />
        <KpiCard
          label={t('analytics.conversion')}
          value={`${conversionRate.toFixed(1)}%`}
          sub={t('analytics.convSub')}
          icon={TrendingUp}
          color="bg-lime-50 text-lime-700"
        />
        <KpiCard
          label={t('analytics.revenue')}
          value={formatMoney(revenue, currency)}
          sub={t('analytics.revSub')}
          icon={DollarSign}
          color="bg-green-50 text-green-700"
        />
      </div>

      {/* Chart + status row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-6">
        {/* Bar chart */}
        <div className="lg:col-span-2 rounded-2xl border border-warm-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-bold text-night-700 flex items-center gap-2">
            <ArrowUpRight className="h-4 w-4 text-primary-500" />
            {t('analytics.ordersPerDay')}
          </h2>
          {orderCount === 0 ? (
            <div className="flex h-36 items-center justify-center text-sm text-warm-400">
              {t('analytics.noOrdersPeriod')}
            </div>
          ) : (
            <BarChart data={ordersByDay} unitOne={t('orders.countOne')} unitMany={t('orders.countMany')} />
          )}
        </div>

        {/* Orders by status */}
        <div className="rounded-2xl border border-warm-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-bold text-night-700">{t('analytics.orderStatus')}</h2>
          {ordersByStatus.length === 0 ? (
            <p className="text-sm text-warm-400">{t('analytics.noOrders')}</p>
          ) : (
            <ul className="space-y-2.5">
              {ordersByStatus
                .sort((a, b) => b.count - a.count)
                .map(({ status, count }) => (
                  <li key={status} className="flex items-center justify-between text-sm">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        STATUS_COLORS[status] ?? 'bg-warm-100 text-warm-700'
                      }`}
                    >
                      {status}
                    </span>
                    <span className="font-bold text-night-800">{count}</span>
                  </li>
                ))}
            </ul>
          )}
        </div>
      </div>

      {/* Top products */}
      <div className="rounded-2xl border border-warm-200 bg-white p-6">
        <h2 className="mb-5 text-sm font-bold text-night-700">{t('analytics.topProducts')}</h2>
        {topProducts.length === 0 ? (
          <p className="text-sm text-warm-400">{t('analytics.noProductData')}</p>
        ) : (
          <ul className="space-y-3">
            {topProducts.map((p, i) => (
              <li key={p.name} className="flex items-center gap-4">
                <span className="w-5 text-right text-xs font-bold text-warm-400">{i + 1}</span>
                <div className="flex-1">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-medium text-night-700 truncate max-w-[60%]">{p.name}</span>
                    <span className="text-sm font-bold text-night-900">
                      {p.qty} {p.qty !== 1 ? t('analytics.unitMany') : t('analytics.unitOne')}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-warm-100">
                    <div
                      className="h-1.5 rounded-full bg-primary-500"
                      style={{ width: `${(p.qty / maxProductQty) * 100}%` }}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
