'use client'

import { use, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CreditCard, Banknote, Loader2, ShieldCheck } from 'lucide-react'
import { CheckoutHeader } from '@/components/storefront/checkout-header'
import { useCartState } from '@/components/storefront/cart-context'
import { calcTotals } from '@/lib/cart/totals'
import { formatMoney } from '@/lib/utils'
import { createStripeCheckoutSession } from '@/lib/actions/payments'

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ orderId?: string; code?: string; cid?: string }>
}

export default function PaymentPage({ params, searchParams }: Props) {
  const { slug } = use(params)
  const { orderId, code, cid } = use(searchParams)
  const router = useRouter()
  const { items, delivery } = useCartState()
  const totals = calcTotals(items, delivery?.fee ?? 0)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [loadingMethod, setLoadingMethod] = useState<'stripe' | 'cash' | null>(null)

  if (!orderId || !code || !cid) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-warm-50 px-4 text-center">
        <p className="text-night-500">Datos de pedido faltantes. Regresa e intenta de nuevo.</p>
        <button
          onClick={() => router.back()}
          className="rounded-full bg-primary-500 px-5 py-2 text-sm font-semibold text-white"
        >
          Volver
        </button>
      </div>
    )
  }

  function handleCash() {
    setLoadingMethod('cash')
    router.push(`/s/${slug}/checkout/confirm?code=${code}&id=${orderId}&cid=${cid}`)
  }

  function handleStripe() {
    setLoadingMethod('stripe')
    startTransition(async () => {
      setError(null)
      const result = await createStripeCheckoutSession(orderId!, slug)
      if (result.error) {
        setError(result.error)
        setLoadingMethod(null)
        return
      }
      if (result.url) {
        window.location.href = result.url
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
          disabled={isPending}
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
          disabled={isPending}
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
