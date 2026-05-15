'use client'

import { ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { formatMoney } from '@/lib/utils'
import { calcTotals } from '@/lib/cart/totals'
import { useCartState } from './cart-context'

interface Props {
  slug: string
  currency: string
}

export function CartFab({ slug, currency }: Props) {
  const { items } = useCartState()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const count = items.reduce((s, i) => s + i.qty, 0)
  if (count === 0) return null

  const { subtotal } = calcTotals(items)

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 px-4">
      <Link
        href={`/s/${slug}/cart`}
        className="flex items-center gap-3 rounded-full px-5 py-3 shadow-xl transition active:scale-95"
        style={{
          background: 'var(--sf-primary, #FF6B57)',
          color: 'var(--sf-primary-text, #ffffff)',
        }}
      >
        <span className="relative">
          <ShoppingCart className="h-5 w-5" />
          <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-bold"
            style={{ color: 'var(--sf-primary, #FF6B57)' }}>
            {count}
          </span>
        </span>
        <span className="text-sm font-semibold">Ver carrito</span>
        <span className="ml-1 text-sm font-bold opacity-80">
          {formatMoney(subtotal, currency)}
        </span>
      </Link>
    </div>
  )
}
