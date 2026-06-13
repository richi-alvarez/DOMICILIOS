'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { CartItem } from '@/lib/cart/totals'

interface DeliveryInfo {
  type: 'pickup' | 'delivery'
  address?: string
  zone?: string
  notes?: string
  fee: number
}

interface CustomerInfo {
  name: string
  phone: string
  email?: string
}

interface CartStore {
  slug: string
  items: CartItem[]
  delivery: DeliveryInfo
  customer: CustomerInfo | null

  addItem: (item: Omit<CartItem, 'qty'>) => void
  removeItem: (productId: string, variantLabel?: string) => void
  updateQty: (productId: string, qty: number, variantLabel?: string) => void
  setDelivery: (d: DeliveryInfo) => void
  setCustomer: (c: CustomerInfo) => void
  clear: () => void
}

const defaultDelivery: DeliveryInfo = { type: 'pickup', fee: 0 }

export function createCartStore(slug: string) {
  return create<CartStore>()(
    persist(
      (set, get) => ({
        slug,
        items: [],
        delivery: defaultDelivery,
        customer: null,

        addItem(item) {
          const { items } = get()
          // La identidad de una línea es producto + variante (color/talla), así
          // dos variantes del mismo producto son líneas separadas.
          const sameLine = (i: CartItem) =>
            i.productId === item.productId && (i.variantLabel ?? '') === (item.variantLabel ?? '')
          const existing = items.find(sameLine)
          if (existing) {
            set({ items: items.map((i) => (sameLine(i) ? { ...i, qty: i.qty + 1 } : i)) })
          } else {
            set({ items: [...items, { ...item, qty: 1 }] })
          }
        },

        removeItem(productId, variantLabel) {
          set({
            items: get().items.filter(
              (i) => !(i.productId === productId && (i.variantLabel ?? '') === (variantLabel ?? '')),
            ),
          })
        },

        updateQty(productId, qty, variantLabel) {
          if (qty <= 0) {
            get().removeItem(productId, variantLabel)
            return
          }
          set({
            items: get().items.map((i) =>
              i.productId === productId && (i.variantLabel ?? '') === (variantLabel ?? '')
                ? { ...i, qty }
                : i,
            ),
          })
        },

        setDelivery(d) {
          set({ delivery: d })
        },

        setCustomer(c) {
          set({ customer: c })
        },

        clear() {
          set({ items: [], delivery: defaultDelivery, customer: null })
        },
      }),
      {
        name: `cart:${slug}`,
        storage: createJSONStorage(() => localStorage),
      },
    ),
  )
}

// Singleton map so each slug gets exactly one store instance
const stores = new Map<string, ReturnType<typeof createCartStore>>()

export function getCartStore(slug: string) {
  if (!stores.has(slug)) {
    stores.set(slug, createCartStore(slug))
  }
  return stores.get(slug)!
}
