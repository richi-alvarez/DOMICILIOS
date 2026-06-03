'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Store, Bike, ChevronRight } from 'lucide-react'
import { CheckoutHeader } from '@/components/storefront/checkout-header'
import { useCartState, useCart } from '@/components/storefront/cart-context'
import { calcTotals } from '@/lib/cart/totals'
import { formatMoney } from '@/lib/utils'

interface Props {
  params: Promise<{ slug: string }>
}

export default function DeliveryPage({ params }: Props) {
  const { slug } = use(params)
  const router = useRouter()
  const store = useCart()
  const { items, delivery } = useCartState()
  const totals = calcTotals(items, delivery.fee)

  const [type, setType] = useState<'pickup' | 'delivery'>(delivery.type)
  const [address, setAddress] = useState(delivery.address ?? '')
  const [notes, setNotes] = useState(delivery.notes ?? '')

  const canContinue = type === 'pickup' || (type === 'delivery' && address.trim().length >= 5)

  function handleContinue() {
    const trimmedNotes = notes.trim()
    store.getState().setDelivery({
      type,
      address: type === 'delivery' ? address : undefined,
      notes: type === 'delivery' && trimmedNotes ? trimmedNotes : undefined,
      fee: type === 'delivery' ? 0 : 0, // configurable in future phases
    })
    router.push(`/s/${slug}/checkout/contact`)
  }

  return (
    <div className="min-h-screen bg-warm-50 pb-32">
      <CheckoutHeader
        title="Opciones de Entrega"
        backHref={`/s/${slug}/cart`}
        closeHref={`/s/${slug}`}
      />

      <div className="mx-auto max-w-2xl gap-6 px-4 py-6 lg:flex">
        {/* delivery options */}
        <div className="flex-1 space-y-3">
          <h2 className="font-semibold text-night-700">¿Cómo recibes tu pedido?</h2>

          {/* Pickup */}
          <button
            type="button"
            onClick={() => setType('pickup')}
            className={`w-full rounded-2xl border-2 p-5 text-left transition ${
              type === 'pickup'
                ? 'border-primary-500 bg-primary-50'
                : 'border-warm-200 bg-white hover:border-primary-200'
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                  type === 'pickup' ? 'bg-primary-500 text-white' : 'bg-warm-100 text-night-500'
                }`}
              >
                <Store className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold text-night-800">Recoger en tienda</p>
                <p className="mt-0.5 text-sm text-night-500">
                  Recoge tu pedido en el local del comerciante
                </p>
              </div>
              {type === 'pickup' && (
                <div className="ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-500 text-white">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="h-3 w-3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              )}
            </div>
          </button>

          {/* Delivery */}
          <button
            type="button"
            onClick={() => setType('delivery')}
            className={`w-full rounded-2xl border-2 p-5 text-left transition ${
              type === 'delivery'
                ? 'border-primary-500 bg-primary-50'
                : 'border-warm-200 bg-white hover:border-primary-200'
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                  type === 'delivery' ? 'bg-primary-500 text-white' : 'bg-warm-100 text-night-500'
                }`}
              >
                <Bike className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold text-night-800">A domicilio</p>
                <p className="mt-0.5 text-sm text-night-500">
                  Recibe tu pedido en la dirección que indiques
                </p>
              </div>
              {type === 'delivery' && (
                <div className="ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-500 text-white">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="h-3 w-3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              )}
            </div>
          </button>

          {/* Address input when delivery selected */}
          {type === 'delivery' && (
            <div className="mt-3 space-y-3 rounded-2xl bg-white p-4 shadow-sm">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-night-700">
                  Dirección de entrega *
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ej: Calle 45 # 12-34, Apto 301"
                  className="w-full rounded-xl border border-warm-200 px-4 py-2.5 text-sm text-night-800 placeholder-night-300 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-night-700">
                  Indicaciones adicionales
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Color de puerta, piso, notas de entrega..."
                  rows={2}
                  className="w-full rounded-xl border border-warm-200 px-4 py-2.5 text-sm text-night-800 placeholder-night-300 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
                />
              </div>
            </div>
          )}
        </div>

        {/* Summary panel */}
        <div className="mt-6 lg:mt-0 lg:w-64 lg:shrink-0">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-night-800">Resumen</h2>
            <div className="mt-3 space-y-1.5 text-sm text-night-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatMoney(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Envío</span>
                <span className="text-lime-600">{type === 'pickup' ? 'Gratis' : 'A definir'}</span>
              </div>
              <div className="flex justify-between border-t border-warm-100 pt-2 font-bold text-night-900">
                <span>Total</span>
                <span>{formatMoney(totals.subtotal)}</span>
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
            disabled={!canContinue}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-500 py-3.5 font-semibold text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]"
          >
            Continuar <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
