'use client'

import { CalendarPlus, ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { formatMoney } from '@/lib/utils'
import { calcTotals } from '@/lib/cart/totals'
import { useCartState } from './cart-context'

type CartPosition =
  | 'top-left'
  | 'top-right'
  | 'center-left'
  | 'center-right'
  | 'bottom-left'
  | 'bottom-right'

interface Props {
  slug: string
  currency: string
  position?: CartPosition
  /** 'cart' = carrito normal; 'appointment' = modo citas (ícono calendario). */
  mode?: 'cart' | 'appointment'
}

// Clases de posición fija dentro del marco de la tienda. Insets más pequeños en
// móvil y más amplios en desktop (sm:).
const POSITION_CLASSES: Record<CartPosition, string> = {
  'top-left': 'top-4 left-4 sm:top-6 sm:left-6',
  'top-right': 'top-4 right-4 sm:top-6 sm:right-6',
  'center-left': 'top-1/2 left-4 -translate-y-1/2 sm:left-6',
  'center-right': 'top-1/2 right-4 -translate-y-1/2 sm:right-6',
  'bottom-left': 'bottom-4 left-4 sm:bottom-6 sm:left-6',
  'bottom-right': 'bottom-4 right-4 sm:bottom-6 sm:right-6',
}

export function CartFab({ slug, currency, position = 'bottom-right', mode = 'cart' }: Props) {
  const { items } = useCartState()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const count = items.reduce((s, i) => s + i.qty, 0)
  if (count === 0) return null

  const { subtotal } = calcTotals(items)
  const positionClasses = POSITION_CLASSES[position] ?? POSITION_CLASSES['bottom-right']

  return (
    <div className={`fixed z-50 max-w-[calc(100vw-2rem)] ${positionClasses}`}>
      <Link
        href={`/s/${slug}/cart`}
        className="flex items-center gap-3 rounded-full px-5 py-3 shadow-xl transition active:scale-95"
        style={{
          background: 'var(--sf-cart-bg, #FF6B57)',
          color: 'var(--sf-cart-text, #ffffff)',
        }}
      >
        <span className="relative">
          {mode === 'appointment' ? (
            <CalendarPlus className="h-5 w-5" />
          ) : (
            <ShoppingCart className="h-5 w-5" />
          )}
          <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white"
            style={{ background: 'var(--sf-cart-count, #ef4444)' }}>
            {count}
          </span>
        </span>
        <span className="text-sm font-semibold">{mode === 'appointment' ? 'Ver citas' : 'Ver carrito'}</span>
        <span className="ml-1 rounded-full px-2 py-0.5 text-xs font-bold text-white"
          style={{ background: 'var(--sf-cart-total, #1f2937)' }}>
          {formatMoney(subtotal, currency)}
        </span>
      </Link>
    </div>
  )
}
