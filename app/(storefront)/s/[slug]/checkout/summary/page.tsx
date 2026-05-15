'use client'

import { use, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { User, Phone, MapPin, Store, ShoppingCart } from 'lucide-react'
import { CheckoutHeader } from '@/components/storefront/checkout-header'
import { useCartState, useCart } from '@/components/storefront/cart-context'
import { calcTotals } from '@/lib/cart/totals'
import { formatMoney } from '@/lib/utils'
import { createOrder } from '@/lib/actions/orders'

interface Props {
  params: Promise<{ slug: string }>
  // catalogId is needed for createOrder — we fetch it from the cart context
}

// We need the catalogId. Pass it via a data attribute or fetch it from the API.
// For simplicity, we store catalogId in the cart items (added at product card level).
// Since we don't have it there, we fetch from API.

export default function SummaryPage({ params }: Props) {
  const { slug } = use(params)
  const router = useRouter()
  const store = useCart()
  const { items, delivery, customer } = useCartState()
  const totals = calcTotals(items, delivery?.fee ?? 0)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  if (!customer || items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-warm-50 px-4 text-center">
        <ShoppingCart className="h-12 w-12 text-warm-300" />
        <p className="text-night-500">Datos incompletos. Regresa al inicio del checkout.</p>
        <button
          onClick={() => router.push(`/s/${slug}/cart`)}
          className="rounded-full bg-primary-500 px-5 py-2 text-sm font-semibold text-white"
        >
          Ir al carrito
        </button>
      </div>
    )
  }

  function handleCreateOrder() {
    startTransition(async () => {
      setError(null)
      // fetch catalogId
      let catalogId: string
      try {
        const res = await fetch(`/api/storefront/${slug}`)
        const data = await res.json()
        catalogId = data.catalog?.id
        if (!catalogId) throw new Error('Catálogo no encontrado')
      } catch {
        setError('No se pudo conectar con el servidor. Intenta de nuevo.')
        return
      }

      const result = await createOrder({
        catalogId,
        items: items.map((i) => ({
          productId: i.productId,
          name: i.name,
          price: i.price,
          qty: i.qty,
          variantLabel: i.variantLabel,
        })),
        delivery: {
          type: delivery!.type,
          address: delivery!.address,
          zone: delivery!.zone,
          fee: delivery!.fee,
        },
        customer: customer!,
      })

      if ('error' in result) {
        setError(result.error ?? 'Error desconocido')
        return
      }

      store.getState().clear()
      router.push(`/s/${slug}/checkout/payment?orderId=${result.order!.id}&code=${result.order!.code}&cid=${catalogId}`)
    })
  }

  return (
    <div className="min-h-screen bg-warm-50 pb-32">
      <CheckoutHeader
        title="Resumen"
        backHref={`/s/${slug}/checkout/contact`}
        closeHref={`/s/${slug}`}
      />

      <div className="mx-auto max-w-2xl gap-6 px-4 py-6 lg:flex">
        <div className="flex-1 space-y-4">
          <h2 className="font-semibold text-night-700">Resumen del pedido</h2>

          {/* Customer info */}
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-night-500 uppercase tracking-wide">
              Información de contacto
            </h3>
            <div className="space-y-2 text-sm text-night-700">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-night-400" />
                <span>{customer.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-night-400" />
                <span>{customer.phone}</span>
              </div>
            </div>
          </div>

          {/* Delivery */}
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-night-500 uppercase tracking-wide">
              Entrega
            </h3>
            <div className="flex items-center gap-2 text-sm text-night-700">
              {delivery?.type === 'pickup' ? (
                <>
                  <Store className="h-4 w-4 text-night-400" />
                  <span>Recoger en tienda</span>
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4 text-night-400" />
                  <span>{delivery?.address}</span>
                </>
              )}
            </div>
          </div>

          {/* Items */}
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-night-500 uppercase tracking-wide">
              Elementos
            </h3>
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.productId} className="flex items-center justify-between text-sm">
                  <span className="text-night-700">
                    x{item.qty} {item.name}
                    {item.variantLabel ? ` (${item.variantLabel})` : ''}
                  </span>
                  <span className="font-medium text-night-900">
                    {formatMoney(item.price * item.qty)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Totals */}
        <div className="mt-6 lg:mt-0 lg:w-64 lg:shrink-0">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-night-800">Total del pedido</h2>
            <div className="mt-3 space-y-2 text-sm text-night-600">
              <div className="flex justify-between">
                <span>Total parcial</span>
                <span>{formatMoney(totals.subtotal)}</span>
              </div>
              {totals.shipping > 0 && (
                <div className="flex justify-between">
                  <span>Envío</span>
                  <span>{formatMoney(totals.shipping)}</span>
                </div>
              )}
              {totals.discount > 0 && (
                <div className="flex justify-between text-lime-600">
                  <span>Descuento</span>
                  <span>-{formatMoney(totals.discount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-warm-100 pt-3 text-base font-bold text-primary-600">
                <span>COSTO TOTAL</span>
                <span>{formatMoney(totals.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mx-auto max-w-2xl px-4">
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-warm-100 bg-white px-4 py-4">
        <div className="mx-auto max-w-2xl">
          <button
            type="button"
            onClick={handleCreateOrder}
            disabled={isPending}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-500 py-3.5 font-semibold text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]"
          >
            {isPending ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Creando pedido…
              </>
            ) : (
              'Crear Pedido →'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
