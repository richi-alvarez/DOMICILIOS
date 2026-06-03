import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Package, CheckCircle2, Clock, Truck, Store } from 'lucide-react'
import { getCatalogBySlug, getOrderByCode } from '@/lib/storefront/queries'
import { formatMoney, formatDate, formatTime } from '@/lib/utils'

interface Props {
  params: Promise<{ slug: string; code: string }>
}

const STATUS_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  pending_send: { label: 'Pendiente de envío', icon: <Clock className="h-5 w-5" />, color: 'text-yellow-600 bg-yellow-50' },
  received:    { label: 'Recibido', icon: <CheckCircle2 className="h-5 w-5" />, color: 'text-blue-600 bg-blue-50' },
  preparing:   { label: 'En preparación', icon: <Package className="h-5 w-5" />, color: 'text-orange-600 bg-orange-50' },
  ready:       { label: 'Listo', icon: <CheckCircle2 className="h-5 w-5" />, color: 'text-lime-600 bg-lime-50' },
  delivered:   { label: 'Entregado', icon: <Truck className="h-5 w-5" />, color: 'text-green-600 bg-green-50' },
  cancelled:   { label: 'Cancelado', icon: <Clock className="h-5 w-5" />, color: 'text-red-600 bg-red-50' },
}

export default async function OrderPage({ params }: Props) {
  const { slug, code } = await params

  const catalog = await getCatalogBySlug(slug)
  if (!catalog) notFound()

  const order = await getOrderByCode(catalog.id, code)
  if (!order) notFound()

  const status = STATUS_LABELS[order.status] ?? STATUS_LABELS['received']
  const customer = order.customerJson as { name?: string; phone?: string }
  const items = order.itemsJson as { name: string; qty: number; price: number; variantLabel?: string }[]
  const totals = order.totalsJson as { subtotal: number; shipping: number; discount: number; total: number; currency: string }
  const delivery = order.deliveryJson as { type: string; address?: string; notes?: string }

  return (
    <div className="min-h-screen bg-warm-50">
      <header className="sticky top-0 z-40 border-b border-warm-100 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <Link href={`/s/${slug}`} className="font-display text-lg font-bold text-night-800">
            {catalog.name}
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-6">
        {/* Status badge */}
        <div className={`mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${status.color}`}>
          {status.icon}
          {status.label}
        </div>

        <h1 className="font-display text-xl font-bold text-night-900">Pedido #{order.code}</h1>
        <p className="mt-1 text-sm text-night-400">
          {formatDate(order.createdAt)} · {formatTime(order.createdAt)}
        </p>

        <div className="mt-6 space-y-4">
          {/* Customer */}
          {customer.name && (
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-night-400">
                Cliente
              </h2>
              <p className="font-medium text-night-800">{customer.name}</p>
              {customer.phone && <p className="text-sm text-night-500">{customer.phone}</p>}
            </div>
          )}

          {/* Delivery */}
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-night-400">
              Entrega
            </h2>
            <div className="flex items-center gap-2 text-night-700">
              {delivery.type === 'pickup' ? (
                <>
                  <Store className="h-4 w-4 text-night-400" />
                  <span>Recoger en tienda</span>
                </>
              ) : (
                <>
                  <Truck className="h-4 w-4 text-night-400" />
                  <span>{delivery.address}</span>
                </>
              )}
            </div>
            {delivery.type === 'delivery' && delivery.notes && (
              <p className="mt-2 text-sm text-night-500">
                <span className="font-medium text-night-600">Indicaciones:</span> {delivery.notes}
              </p>
            )}
          </div>

          {/* Items */}
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-night-400">
              Productos
            </h2>
            <div className="space-y-2">
              {Array.isArray(items) && items.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-night-700">
                    x{item.qty} {item.name}
                    {item.variantLabel ? ` (${item.variantLabel})` : ''}
                  </span>
                  <span className="font-medium text-night-900">
                    {formatMoney(item.price * item.qty, totals?.currency ?? catalog.currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          {totals && (
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-night-400">
                Totales
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-night-600">
                  <span>Subtotal</span>
                  <span>{formatMoney(totals.subtotal, totals.currency)}</span>
                </div>
                {totals.shipping > 0 && (
                  <div className="flex justify-between text-night-600">
                    <span>Envío</span>
                    <span>{formatMoney(totals.shipping, totals.currency)}</span>
                  </div>
                )}
                {totals.discount > 0 && (
                  <div className="flex justify-between text-lime-600">
                    <span>Descuento</span>
                    <span>-{formatMoney(totals.discount, totals.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-warm-100 pt-2 text-base font-bold text-night-900">
                  <span>Total</span>
                  <span>{formatMoney(totals.total, totals.currency)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <Link
            href={`/s/${slug}`}
            className="rounded-full border border-warm-200 bg-white px-5 py-2.5 text-sm font-medium text-night-700 hover:bg-warm-50"
          >
            Volver a la tienda
          </Link>
        </div>
      </div>
    </div>
  )
}
