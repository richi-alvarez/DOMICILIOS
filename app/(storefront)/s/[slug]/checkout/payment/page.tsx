'use client'

import { use, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CreditCard, Banknote, Loader2, ShieldCheck } from 'lucide-react'
import { CheckoutHeader } from '@/components/storefront/checkout-header'
import { useCartState, useCart } from '@/components/storefront/cart-context'
import { calcTotals } from '@/lib/cart/totals'
import { formatMoney } from '@/lib/utils'
import { createOrder } from '@/lib/actions/orders'
import { createStripeCheckoutSession } from '@/lib/actions/payments'

interface Props {
  params: Promise<{ slug: string }>
}

export default function PaymentPage({ params }: Props) {
  const { slug } = use(params)
  const router = useRouter()
  const store = useCart()
  const { items, delivery, customer } = useCartState()
  const totals = calcTotals(items, delivery?.fee ?? 0)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [loadingMethod, setLoadingMethod] = useState<'stripe' | 'cash' | null>(null)

  // El pedido aún no existe: se crea al elegir el método de pago. Si el carrito
  // está incompleto (p.ej. el usuario recargó), volvemos al inicio del checkout.
  if (!customer || !delivery || items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-warm-50 px-4 text-center">
        <p className="text-night-500">Datos del pedido incompletos. Regresa y completa el checkout.</p>
        <button
          onClick={() => router.push(`/s/${slug}/cart`)}
          className="rounded-full bg-primary-500 px-5 py-2 text-sm font-semibold text-white"
        >
          Ir al carrito
        </button>
      </div>
    )
  }

  // Crea el pedido a partir del carrito actual. Devuelve {id, code, catalogId}.
  async function createPendingOrder() {
    const res = await fetch(`/api/storefront/${slug}`)
    const data = await res.json()
    const catalogId: string | undefined = data.catalog?.id
    if (!catalogId) throw new Error('No se pudo conectar con el servidor. Intenta de nuevo.')

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
        notes: delivery!.notes,
        fee: delivery!.fee,
      },
      customer: customer!,
    })

    if ('error' in result) {
      throw new Error(result.error ?? 'Error al crear el pedido')
    }
    return { id: result.order!.id, code: result.order!.code, catalogId }
  }

  async function handleCash() {
    setLoadingMethod('cash')
    setError(null)
    try {
      const { id, code, catalogId } = await createPendingOrder()
      await fetch(`/api/v1/orders/${id}/payment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: 'cash', status: 'pending' }),
      })
      store.getState().clear()
      router.push(`/s/${slug}/checkout/confirm?code=${code}&id=${id}&cid=${catalogId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar el pago. Intenta de nuevo.')
      setLoadingMethod(null)
    }
  }

  function handleStripe() {
    setLoadingMethod('stripe')
    startTransition(async () => {
      setError(null)
      try {
        const { id } = await createPendingOrder()
        const result = await createStripeCheckoutSession(id, slug)
        if (result.error) {
          setError(result.error)
          setLoadingMethod(null)
          return
        }
        if (result.url) {
          store.getState().clear()
          window.location.href = result.url
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al procesar el pago. Intenta de nuevo.')
        setLoadingMethod(null)
      }
    })
  }

  return (
    <div className="min-h-screen bg-warm-50 pb-8">
      <CheckoutHeader
        title="Método de pago"
        backHref={`/s/${slug}/checkout/summary`}
        closeHref={`/s/${slug}`}
      />

      <div className="mx-auto max-w-md px-4 py-6 space-y-4">
        {/* Total recap */}
        <div className="rounded-2xl bg-white p-4 shadow-sm flex items-center justify-between">
          <span className="text-sm text-night-500">Total a pagar</span>
          <span className="text-lg font-bold text-primary-600">{formatMoney(totals.total)}</span>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <h2 className="text-sm font-bold uppercase tracking-wider text-night-400 px-1">
          ¿Cómo quieres pagar?
        </h2>

        {/* Pay with card (Stripe) */}
        <button
          onClick={handleStripe}
          disabled={isPending || loadingMethod !== null}
          className="w-full flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm border-2 border-transparent transition hover:border-primary-300 hover:shadow-md disabled:opacity-60 text-left"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50">
            {loadingMethod === 'stripe' ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
            ) : (
              <CreditCard className="h-6 w-6 text-primary-500" />
            )}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-night-800">Pagar con tarjeta</p>
            <p className="text-sm text-night-400">Visa, Mastercard, débito — pago seguro</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-night-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            Stripe
          </div>
        </button>

        {/* Pay cash / on delivery */}
        <button
          onClick={handleCash}
          disabled={isPending || loadingMethod !== null}
          className="w-full flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm border-2 border-transparent transition hover:border-warm-300 hover:shadow-md disabled:opacity-60 text-left"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-warm-100">
            {loadingMethod === 'cash' ? (
              <Loader2 className="h-6 w-6 animate-spin text-warm-500" />
            ) : (
              <Banknote className="h-6 w-6 text-warm-500" />
            )}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-night-800">Pagar al recibir</p>
            <p className="text-sm text-night-400">Efectivo o transferencia al momento</p>
          </div>
        </button>
      </div>
    </div>
  )
}
