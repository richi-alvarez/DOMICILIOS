'use client'

import { createContext, useContext, useRef } from 'react'
import { getCartStore } from '@/lib/store/cart'

type CartStore = ReturnType<typeof getCartStore>

const CartContext = createContext<CartStore | null>(null)

export function CartProvider({ slug, children }: { slug: string; children: React.ReactNode }) {
  const storeRef = useRef<CartStore | null>(null)
  if (!storeRef.current) {
    storeRef.current = getCartStore(slug)
  }
  return <CartContext.Provider value={storeRef.current}>{children}</CartContext.Provider>
}

export function useCart() {
  const store = useContext(CartContext)
  if (!store) throw new Error('useCart must be inside CartProvider')
  return store
}

export function useCartState() {
  const store = useCart()
  return store()
}
