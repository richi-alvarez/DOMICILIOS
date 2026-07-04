'use client'

import { useState, useTransition } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { formatMoney, formatDate, formatTime } from '@/lib/utils'
import { updateOrderStatus, deleteOrder } from '@/lib/actions/orders'
import {
  CheckCircle2,
  Clock,
  Package,
  Truck,
  Store,
  Printer,
  Trash2,
  User,
  Phone,
  MapPin,
} from 'lucide-react'
import { toast } from 'sonner'
import { useI18n } from '@/lib/i18n/context'

// value + icono; el label sale de t('orders.stepper.<value>').
const STATUSES = [
  { value: 'received',  icon: CheckCircle2 },
  { value: 'preparing', icon: Package },
  { value: 'ready',     icon: Clock },
  { value: 'delivered', icon: Truck },
]

const STATUS_NEXT: Record<string, string> = {
  received: 'preparing',
  preparing: 'ready',
  ready: 'delivered',
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
}

interface Props {
  order: Order | null
  open: boolean
  onClose: () => void
  catalogId: string
  onDeleted: (id: string) => void
  onStatusChanged: (id: string, status: string) => void
}

export function OrderDetailDialog({ order, open, onClose, catalogId, onDeleted, onStatusChanged }: Props) {
  const { t } = useI18n()
  const stepperLabel = (v: string) => t(`orders.stepper.${v}`)
  const [isPending, startTransition] = useTransition()

  if (!order) return null

  const customer = order.customerJson as { name?: string; phone?: string; email?: string }
  const items = (order.itemsJson ?? []) as { name: string; qty: number; price: number; variantLabel?: string }[]
  const delivery = order.deliveryJson as { type?: string; address?: string }
  const totals = order.totalsJson as { subtotal?: number; shipping?: number; discount?: number; total?: number; currency?: string }

  const currentStatusIdx = STATUSES.findIndex((s) => s.value === order.status)
  const nextStatus = STATUS_NEXT[order.status]

  function handleAdvanceStatus() {
    if (!nextStatus) return
    startTransition(async () => {
      const res = await updateOrderStatus(order!.id, nextStatus)
      if (res?.error) {
        toast.error(res.error)
      } else {
        onStatusChanged(order!.id, nextStatus)
        toast.success(`${t('orders.statusUpdatedPrefix')}${stepperLabel(nextStatus)}`)
      }
    })
  }

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteOrder(order!.id)
      if (res?.error) {
        toast.error(res.error)
      } else {
        onDeleted(order!.id)
        onClose()
        toast.success(t('orders.deleted'))
      }
    })
  }

  function handlePrint() {
    window.print()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden p-0">
        <DialogHeader className="border-b border-warm-100 px-5 py-4">
          <DialogTitle className="text-base font-bold text-night-900">
            {t('orders.orderNumberPrefix')}{order.code}
          </DialogTitle>
          <p className="text-xs text-night-400">
            {formatDate(order.createdAt)} · {formatTime(order.createdAt)}
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Status stepper */}
          <div>
            <div className="flex items-center justify-between">
              {STATUSES.map((s, i) => {
                const done = i <= currentStatusIdx
                const Icon = s.icon
                return (
                  <div key={s.value} className="flex flex-1 flex-col items-center">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
                        done ? 'bg-primary-500 text-white' : 'bg-warm-100 text-night-400'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className={`mt-1 text-center text-[10px] font-medium ${done ? 'text-primary-600' : 'text-night-400'}`}>
                      {stepperLabel(s.value)}
                    </span>
                    {i < STATUSES.length - 1 && (
                      <div
                        className={`absolute mt-4 h-0.5 w-[calc(25%-1rem)] transition ${
                          i < currentStatusIdx ? 'bg-primary-500' : 'bg-warm-200'
                        }`}
                        style={{ left: `calc(${(i + 1) * 25}% - 0.5rem)` }}
                      />
                    )}
                  </div>
                )
              })}
            </div>
            {nextStatus && order.status !== 'delivered' && order.status !== 'cancelled' && (
              <button
                type="button"
                onClick={handleAdvanceStatus}
                disabled={isPending}
                className="mt-4 w-full rounded-xl bg-primary-500 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-600 disabled:opacity-60"
              >
                {isPending ? t('orders.updating') : `${t('orders.advanceToPrefix')}${stepperLabel(nextStatus)}`}
              </button>
            )}
            {order.status === 'delivered' && (
              <div className="mt-3 rounded-xl bg-lime-50 py-2 text-center text-sm font-medium text-lime-700">
                {t('orders.deliveredBanner')}
              </div>
            )}
          </div>

          {/* Customer */}
          <div className="rounded-2xl bg-warm-50 p-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-night-400">{t('orders.customer')}</h3>
            <div className="space-y-1.5 text-sm text-night-700">
              {customer.name && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-night-400" />
                  <span>{customer.name}</span>
                </div>
              )}
              {customer.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-night-400" />
                  <a
                    href={`https://wa.me/${customer.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:underline"
                  >
                    {customer.phone}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Delivery */}
          <div className="rounded-2xl bg-warm-50 p-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-night-400">{t('orders.deliveryLabel')}</h3>
            <div className="flex items-center gap-2 text-sm text-night-700">
              {delivery.type === 'pickup' ? (
                <>
                  <Store className="h-4 w-4 text-night-400" />
                  <span>{t('orders.pickup')}</span>
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4 text-night-400" />
                  <span>{delivery.address ?? t('orders.deliveryHome')}</span>
                </>
              )}
            </div>
          </div>

          {/* Items */}
          <div className="rounded-2xl bg-warm-50 p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-night-400">{t('orders.products')}</h3>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-night-700">
                    x{item.qty} {item.name}
                    {item.variantLabel ? ` (${item.variantLabel})` : ''}
                  </span>
                  <span className="font-medium text-night-900">
                    {formatMoney(item.price * item.qty, totals?.currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          {totals && (
            <div className="rounded-2xl border border-warm-200 p-4">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-night-600">
                  <span>{t('orders.subtotal')}</span>
                  <span>{formatMoney(totals.subtotal ?? 0, totals.currency)}</span>
                </div>
                {(totals.shipping ?? 0) > 0 && (
                  <div className="flex justify-between text-night-600">
                    <span>{t('orders.shipping')}</span>
                    <span>{formatMoney(totals.shipping ?? 0, totals.currency)}</span>
                  </div>
                )}
                {(totals.discount ?? 0) > 0 && (
                  <div className="flex justify-between text-lime-600">
                    <span>{t('orders.discount')}</span>
                    <span>-{formatMoney(totals.discount ?? 0, totals.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-warm-200 pt-2 font-bold text-night-900">
                  <span>{t('orders.total')}</span>
                  <span className="text-primary-600">{formatMoney(totals.total ?? 0, totals.currency)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="border-t border-warm-100 px-5 py-3 flex items-center justify-between gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-red-500 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                {t('orders.delete')}
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('orders.deleteConfirmTitle')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('orders.deleteConfirmPre')}{order.code}{t('orders.deleteConfirmPost')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('orders.cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={isPending}>
                  {isPending ? t('orders.deleting') : t('orders.deleteOrder')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg border border-warm-200 px-3 py-2 text-sm text-night-600 hover:bg-warm-50"
            >
              <Printer className="h-4 w-4" />
              {t('orders.print')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-warm-200 px-4 py-2 text-sm font-medium text-night-700 hover:bg-warm-50"
            >
              {t('orders.close')}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
