'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { User, Phone, MapPin, Store, ShoppingCart } from 'lucide-react'
import { CheckoutHeader } from '@/components/storefront/checkout-header'
import { useCartState } from '@/components/storefront/cart-context'
import { calcTotals } from '@/lib/cart/totals'
import { formatMoney } from '@/lib/utils'

interface Props {
  params: Promise<{ slug: string }>
}

export default function SummaryPage({ params }: Props) {
  const { slug } = use(params)
  const router = useRouter()
  const { items, delivery, customer } = useCartState()
  const totals = calcTotals(items, delivery?.fee ?? 0)

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

  // El pedido NO se crea aquí: solo avanzamos al pago con el carrito intacto.
  // Así el usuario puede volver atrás a editar y el pedido se crea al final.
  function handleContinue() {
    router.push(`/s/${slug}/checkout/payment`)
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
            {delivery?.type === 'delivery' && delivery?.notes && (
              <p className="mt-2 text-sm text-night-500">
                <span className="font-medium text-night-600">Indicaciones:</span> {delivery.notes}
              </p>
            )}
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

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-warm-100 bg-white px-4 py-4">
        <div className="mx-auto max-w-2xl">
          <button
            type="button"
            onClick={handleContinue}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-500 py-3.5 font-semibold text-white transition hover:bg-primary-600 active:scale-[0.98]"
          >
            Continuar al pago →
          </button>
        </div>
      </div>
    </div>
  )
}
