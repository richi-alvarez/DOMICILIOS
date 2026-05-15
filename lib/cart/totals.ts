export interface CartItem {
  productId: string
  name: string
  price: number
  qty: number
  image?: string
  variantLabel?: string
}

export interface CartTotals {
  subtotal: number
  shipping: number
  discount: number
  total: number
}

export function calcTotals(
  items: CartItem[],
  shippingFee = 0,
  discountAmount = 0,
): CartTotals {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0)
  const shipping = shippingFee
  const discount = discountAmount
  const total = Math.max(0, subtotal + shipping - discount)
  return { subtotal, shipping, discount, total }
}
