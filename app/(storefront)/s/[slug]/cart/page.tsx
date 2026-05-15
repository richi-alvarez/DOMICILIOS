'use client'

import { use } from 'react'
import Link from 'next/link'
import { Trash2, ShoppingCart, ArrowLeft } from 'lucide-react'
import { formatMoney } from '@/lib/utils'
import { calcTotals } from '@/lib/cart/totals'
import { QuantityStepper } from '@/components/storefront/quantity-stepper'
import { useCartState, useCart } from '@/components/storefront/cart-context'

interface Props {
  params: Promise<{ slug: string }>
}

export default function CartPage({ params }: Props) {
  const { slug } = use(params)
  const store = useCart()
  const { items, delivery } = useCartState()
  const totals = calcTotals(items, delivery.fee)

  if (items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-warm-50 px-4 text-center">
        <ShoppingCart className="h-16 w-16 text-warm-300" />
        <p className="text-lg font-semibold text-night-700">Tu carrito está vacío</p>
        <p className="text-sm text-night-400">Agrega productos para continuar</p>
        <Link
          href={`/s/${slug}`}
          className="mt-2 rounded-full bg-primary-500 px-6 py-2.5 font-semibold text-white hover:bg-primary-600"
        >
          Ver catálogo
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-warm-50">
      {/* header */}
      <header className="sticky top-0 z-40 border-b border-warm-100 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <Link
            href={`/s/${slug}`}
            className="flex items-center gap-1.5 text-night-500 hover:text-night-800"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm font-medium">Seguir comprando</span>
          </Link>
          <h1 className="font-semibold text-night-800">Carrito</h1>
          <button
            type="button"
            onClick={() => store.getState().clear()}
            className="text-sm text-night-400 hover:text-red-500"
          >
            Vaciar
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-2xl gap-6 px-4 py-6 lg:flex">
        {/* Items list */}
        <div className="flex-1 space-y-3">
          {items.map((item) => (
            <div
              key={item.productId}
              className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm"
            >
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-16 w-16 shrink-0 rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-warm-100">
                  <ShoppingCart className="h-6 w-6 text-warm-300" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium text-night-800">{item.name}</p>
                {item.variantLabel && (
                  <p className="text-xs text-night-400">{item.variantLabel}</p>
                )}
                <p className="mt-0.5 text-sm font-semibold text-primary-600">
                  {/* We don't have catalog currency here so pass COP as default */}
                  {formatMoney(item.price * item.qty)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <button
                  type="button"
                  onClick={() => store.getState().removeItem(item.productId)}
                  className="text-night-300 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <QuantityStepper
                  qty={item.qty}
                  onIncrement={() => store.getState().updateQty(item.productId, item.qty + 1)}
                  onDecrement={() => store.getState().updateQty(item.productId, item.qty - 1)}
                  size="sm"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Summary panel */}
        <div className="mt-6 lg:mt-0 lg:w-72 lg:shrink-0">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-night-800">Resumen del pedido</h2>
            <div className="mt-3 space-y-2 text-sm text-night-600">
              <div className="flex justify-between">
                <span>Elementos ({items.reduce((s, i) => s + i.qty, 0)})</span>
                <span>{formatMoney(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between border-t border-warm-100 pt-2 font-bold text-night-900">
                <span>Total parcial</span>
                <span>{formatMoney(totals.subtotal)}</span>
              </div>
            </div>
            <Link
              href={`/s/${slug}/checkout/delivery`}
              className="mt-5 flex w-full items-center justify-center rounded-xl bg-primary-500 py-3.5 font-semibold text-white transition hover:bg-primary-600 active:scale-[0.98]"
            >
              Continuar →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
