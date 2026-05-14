'use client'

import { ShoppingCart, ImageOff } from 'lucide-react'
import Link from 'next/link'
import { formatMoney } from '@/lib/utils'
import { QuantityStepper } from './quantity-stepper'
import { useCartState, useCart } from './cart-context'
import { cn } from '@/lib/utils'

interface Props {
  product: {
    id: string
    name: string
    slug: string
    description: string | null
    price: number
    compareAt: number | null
    stock: number | null
    imagesJson: unknown
  }
  currency: string
  catalogSlug: string
}

export function ProductCard({ product, currency, catalogSlug }: Props) {
  const store = useCart()
  const { items } = useCartState()
  const cartItem = items.find((i) => i.productId === product.id)
  const qty = cartItem?.qty ?? 0

  const images = Array.isArray(product.imagesJson) ? product.imagesJson : []
  const firstImage = images[0] as string | undefined

  const outOfStock = product.stock !== null && product.stock <= 0

  function increment() {
    store.getState().addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: firstImage,
    })
  }

  function decrement() {
    store.getState().updateQty(product.id, qty - 1)
  }

  return (
    <div
      className={cn(
        'group relative flex flex-col rounded-2xl border border-warm-200 bg-white shadow-sm transition hover:shadow-md',
        outOfStock && 'opacity-60',
      )}
    >
      {/* image */}
      <Link href={`/s/${catalogSlug}/p/${product.slug}`} className="block overflow-hidden rounded-t-2xl">
        {firstImage ? (
          <img
            src={firstImage}
            alt={product.name}
            className="h-44 w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-44 w-full items-center justify-center bg-warm-100">
            <ImageOff className="h-10 w-10 text-warm-300" />
          </div>
        )}
      </Link>

      {/* badge precio tachado */}
      {product.compareAt && product.compareAt > product.price && (
        <span className="absolute right-3 top-3 rounded-full bg-primary-500 px-2 py-0.5 text-xs font-semibold text-white">
          -{Math.round(((product.compareAt - product.price) / product.compareAt) * 100)}%
        </span>
      )}

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <Link href={`/s/${catalogSlug}/p/${product.slug}`}>
          <h3 className="line-clamp-2 font-semibold text-night-800 hover:text-primary-600">
            {product.name}
          </h3>
        </Link>
        {product.description && (
          <p className="line-clamp-2 text-sm text-night-500">{product.description}</p>
        )}

        <div className="mt-auto flex items-center justify-between pt-3">
          <div className="flex flex-col">
            <span className="text-lg font-bold text-night-900">
              {formatMoney(product.price, currency)}
            </span>
            {product.compareAt && product.compareAt > product.price && (
              <span className="text-xs text-night-400 line-through">
                {formatMoney(product.compareAt, currency)}
              </span>
            )}
          </div>

          {outOfStock ? (
            <span className="rounded-full bg-warm-100 px-3 py-1 text-xs text-night-400">
              Agotado
            </span>
          ) : qty === 0 ? (
            <button
              type="button"
              onClick={increment}
              className="flex items-center gap-1.5 rounded-full bg-primary-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-primary-600 active:scale-95"
            >
              <ShoppingCart className="h-4 w-4" />
              Agregar
            </button>
          ) : (
            <QuantityStepper
              qty={qty}
              onIncrement={increment}
              onDecrement={decrement}
              max={product.stock ?? undefined}
              size="sm"
            />
          )}
        </div>
      </div>
    </div>
  )
}
