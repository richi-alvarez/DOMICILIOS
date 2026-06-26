'use client'

import { CalendarPlus, ShoppingCart, ImageOff } from 'lucide-react'
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
    variantsJson?: {
      colors?: { name: string; hex: string; image?: string }[]
      sizes?: (string | { name: string; image?: string })[]
    }
  }
  currency: string
  catalogSlug: string
  /** 'cart' (Agregar al carrito) | 'appointment' (Agendar cita). Default: 'cart'. */
  buttonType?: 'cart' | 'appointment'
}

export function ProductCard({ product, currency, catalogSlug, buttonType = 'cart' }: Props) {
  const store = useCart()
  const { items } = useCartState()
  const cartItem = items.find((i) => i.productId === product.id)
  const qty = cartItem?.qty ?? 0

  const images = Array.isArray(product.imagesJson) ? product.imagesJson : []
  // Las imágenes pueden venir como string (URL) o como objeto { url, alt }.
  const rawFirstImage = images[0] as string | { url?: string } | undefined
  const firstImage =
    typeof rawFirstImage === 'string' ? rawFirstImage : rawFirstImage?.url

  const outOfStock = product.stock !== null && product.stock <= 0
  // Productos con color/talla: la selección se hace en el detalle, no en la card.
  const colors = product.variantsJson?.colors ?? []
  const hasVariants =
    colors.length > 0 || (product.variantsJson?.sizes?.length ?? 0) > 0

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
          <h3 className="line-clamp-2 font-semibold" style={{ color: 'var(--sf-product-name)' }}>
            {product.name}
          </h3>
        </Link>
        {product.description && (
          <p className="line-clamp-2 text-sm opacity-80" style={{ color: 'var(--sf-product-name)' }}>
            {product.description}
          </p>
        )}

        {colors.length > 0 && (
          <div className="mt-1 flex items-center gap-1">
            {colors.slice(0, 6).map((c) => (
              <span
                key={c.name}
                title={c.name}
                className="h-3.5 w-3.5 rounded-full border border-warm-200"
                style={{ backgroundColor: c.hex }}
              />
            ))}
            {colors.length > 6 && (
              <span className="text-xs text-night-400">+{colors.length - 6}</span>
            )}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between pt-3">
          <div className="flex flex-col">
            <span className="text-lg font-bold" style={{ color: 'var(--sf-product-price)' }}>
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
          ) : hasVariants ? (
            <Link
              href={`/s/${catalogSlug}/p/${product.slug}`}
              className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition hover:opacity-90 active:scale-95"
              style={{ background: 'var(--sf-button-bg)', color: 'var(--sf-button-text)' }}
            >
              <ShoppingCart className="h-4 w-4" />
              Elegir opciones
            </Link>
          ) : qty === 0 ? (
            <button
              type="button"
              onClick={increment}
              className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition hover:opacity-90 active:scale-95"
              style={{ background: 'var(--sf-button-bg)', color: 'var(--sf-button-text)' }}
            >
              {buttonType === 'appointment' ? (
                <>
                  <CalendarPlus className="h-4 w-4" />
                  Agendar
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4" />
                  Agregar
                </>
              )}
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
