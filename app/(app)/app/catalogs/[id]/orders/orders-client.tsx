'use client'

import { useState, useTransition } from 'react'
import { formatMoney, formatDate } from '@/lib/utils'
import { OrderDetailDialog } from './order-detail-dialog'
import { updateOrderStatus } from '@/lib/actions/orders'
import { Eye, Download } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter, useSearchParams } from 'next/navigation'
import { useI18n } from '@/lib/i18n/context'

// Solo estilos por estado; el label se resuelve con t('orders.status.<key>').
const STATUS_STYLE: Record<string, string> = {
  pending_send: 'bg-yellow-100 text-yellow-700',
  received:     'bg-blue-100 text-blue-700',
  preparing:    'bg-orange-100 text-orange-700',
  ready:        'bg-lime-100 text-lime-700',
  delivered:    'bg-green-100 text-green-700',
  cancelled:    'bg-red-100 text-red-600',
}

interface Order {
  id: string
  code: string
  status: string
  createdAt: Date
  customerJson: unknown
  itemsJson: unknown
  deliveryJson: unknown
  totalsJson: unknown
  paymentJson: unknown
}

interface Props {
  initialOrders: Order[]
  catalogId: string
}

export function OrdersClient({ initialOrders, catalogId }: Props) {
  const { t, tRaw } = useI18n()
  const statusLabel = (k: string) => t(`orders.status.${k}`)
  const router = useRouter()
  const searchParams = useSearchParams()
  const [orders, setOrders] = useState(initialOrders)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isPending, startTransition] = useTransition()

  const status = searchParams.get('status') ?? 'all'
  const search = searchParams.get('search') ?? ''
  const from = searchParams.get('from') ?? ''
  const to = searchParams.get('to') ?? ''

  function applyFilter(key: string, val: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (val) params.set(key, val)
    else params.delete(key)
    router.replace(`?${params.toString()}`)
  }

  function handleStatusChange(orderId: string, newStatus: string) {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)))
  }

  function handleDeleted(orderId: string) {
    setOrders((prev) => prev.filter((o) => o.id !== orderId))
  }

  function handleInlineStatus(orderId: string, newStatus: string) {
    startTransition(async () => {
      const res = await updateOrderStatus(orderId, newStatus)
      if (res?.error) {
        toast.error(res.error)
      } else {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)))
      }
    })
  }

  function exportCsv() {
    const rows = [
      tRaw('orders.csvHeaders') as string[],
      ...orders.map((o) => {
        const customer = o.customerJson as { name?: string }
        const totals = o.totalsJson as { total?: number; currency?: string }
        return [
          o.code,
          formatDate(o.createdAt),
          customer.name ?? '',
          totals.total ?? 0,
          STATUS_STYLE[o.status] ? statusLabel(o.status) : o.status,
        ]
      }),
    ]
    const csv = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${t('orders.csvFilePrefix')}-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          value={status}
          onChange={(e) => applyFilter('status', e.target.value)}
          className="rounded-lg border border-warm-200 bg-white px-3 py-2 text-sm text-night-700 focus:outline-none focus:ring-1 focus:ring-primary-400"
        >
          <option value="all">{t('orders.allStatuses')}</option>
          {Object.keys(STATUS_STYLE).map((v) => (
            <option key={v} value={v}>{statusLabel(v)}</option>
          ))}
        </select>

        <input
          type="text"
          placeholder={t('orders.searchPlaceholder')}
          defaultValue={search}
          onChange={(e) => applyFilter('search', e.target.value)}
          className="rounded-lg border border-warm-200 bg-white px-3 py-2 text-sm text-night-700 placeholder-night-300 focus:outline-none focus:ring-1 focus:ring-primary-400"
        />

        <input
          type="date"
          defaultValue={from}
          onChange={(e) => applyFilter('from', e.target.value)}
          className="rounded-lg border border-warm-200 bg-white px-3 py-2 text-sm text-night-700 focus:outline-none focus:ring-1 focus:ring-primary-400"
        />
        <input
          type="date"
          defaultValue={to}
          onChange={(e) => applyFilter('to', e.target.value)}
          className="rounded-lg border border-warm-200 bg-white px-3 py-2 text-sm text-night-700 focus:outline-none focus:ring-1 focus:ring-primary-400"
        />

        <button
          type="button"
          onClick={exportCsv}
          className="ml-auto flex items-center gap-1.5 rounded-lg border border-warm-200 bg-white px-3 py-2 text-sm text-night-600 hover:bg-warm-50"
        >
          <Download className="h-4 w-4" />
          {t('orders.exportCsv')}
        </button>
      </div>

      {/* Table */}
      {orders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center text-night-400">
          <span className="text-4xl">📦</span>
          <p>{status !== 'all' ? t('orders.emptyFiltered') : t('orders.emptyNone')}</p>
          {status !== 'all' && (
            <button
              onClick={() => applyFilter('status', '')}
              className="text-sm text-primary-600 underline"
            >
              {t('orders.seeAll')}
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-warm-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-warm-100 bg-warm-50 text-xs font-semibold uppercase tracking-wide text-night-400">
                <th className="px-4 py-3 text-left">{t('orders.th.number')}</th>
                <th className="px-4 py-3 text-left">{t('orders.th.date')}</th>
                <th className="px-4 py-3 text-left">{t('orders.th.customer')}</th>
                <th className="px-4 py-3 text-right">{t('orders.th.total')}</th>
                <th className="px-4 py-3 text-left">{t('orders.th.status')}</th>
                <th className="px-4 py-3 text-center">{t('orders.th.details')}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, i) => {
                const customer = order.customerJson as { name?: string }
                const totals = order.totalsJson as { total?: number; currency?: string }
                const sColor = STATUS_STYLE[order.status] ?? 'bg-warm-100 text-night-500'

                return (
                  <tr
                    key={order.id}
                    className={`border-b border-warm-50 transition hover:bg-warm-50 ${i % 2 === 0 ? '' : 'bg-warm-50/40'}`}
                  >
                    <td className="px-4 py-3 font-mono font-medium text-night-800">
                      #{order.code}
                    </td>
                    <td className="px-4 py-3 text-night-500">{formatDate(order.createdAt)}</td>
                    <td className="px-4 py-3 text-night-700">{customer.name ?? '—'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-night-900">
                      {formatMoney(totals.total ?? 0, totals.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={order.status}
                        onChange={(e) => handleInlineStatus(order.id, e.target.value)}
                        disabled={isPending}
                        className={`cursor-pointer rounded-full px-2.5 py-0.5 text-xs font-semibold border-0 focus:outline-none focus:ring-1 focus:ring-primary-400 ${sColor}`}
                      >
                        {Object.keys(STATUS_STYLE).map((v) => (
                          <option key={v} value={v}>{statusLabel(v)}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(order)}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-50"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        {t('orders.view')}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div className="border-t border-warm-100 px-4 py-3 text-xs text-night-400">
            {orders.length} {orders.length !== 1 ? t('orders.countMany') : t('orders.countOne')}
          </div>
        </div>
      )}

      <OrderDetailDialog
        order={selectedOrder}
        open={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        catalogId={catalogId}
        onDeleted={handleDeleted}
        onStatusChanged={handleStatusChange}
      />
    </div>
  )
}
