'use client'

import { use, useEffect, useState } from 'react'
import { ArrowLeft, ImageOff, ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import { formatMoney } from '@/lib/utils'
import { QuantityStepper } from '@/components/storefront/quantity-stepper'
import { CartFab } from '@/components/storefront/cart-fab'
import { StorefrontHeader } from '@/components/storefront/storefront-header'
import { useCartState, useCart } from '@/components/storefront/cart-context'

// This page intentionally fetches on the client to keep the layout simple
// A future iteration can convert to RSC with proper params typing
interface Props {
  params: Promise<{ slug: string; productSlug: string }>
}

export default function ProductPage({ params }: Props) {
  const { slug, productSlug } = use(params)
  const [product, setProduct] = useState<{
    id: string
    name: string
    slug: string
    description: string | null
    price: number
    compareAt: number | null
    stock: number | null
    imagesJson: unknown
  } | null>(null)
  const [catalog, setCatalog] = useState<{ id: string; name: string; currency: string } | null>(null)
  const [selectedImage, setSelectedImage] = useState(0)

  const store = useCart()
  const { items } = useCartState()
  const cartItem = product ? items.find((i) => i.productId === product.id) : null
  const qty = cartItem?.qty ?? 0

  useEffect(() => {
    fetch(`/api/storefront/${slug}/products/${productSlug}`)
      .then((r) => r.json())
      .then(({ product: p, catalog: c }) => {
        setProduct(p)
        setCatalog(c)
        // Track product view after we know the catalogId
        if (p?.id && c?.id) {
          let sessionId = ''
          try {
            sessionId = sessionStorage.getItem('sf_sid') ?? ''
            if (!sessionId) {
              sessionId = Math.random().toString(36).slice(2)
              sessionStorage.setItem('sf_sid', sessionId)
            }
          } catch {}
          fetch('/api/track', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ catalogId: c.id, type: 'product_view', productId: p.id, sessionId }),
            keepalive: true,
          }).catch(() => {})
        }
      })
      .catch(() => {})
  }, [slug, productSlug])

  if (!product || !catalog) {
    return (
      <div className="min-h-screen bg-warm-50">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center text-night-400">
          Cargando producto…
        </div>
      </div>
    )
  }

  // Las imágenes pueden venir como string (URL) o como objeto { url, alt }.
  const rawImages = Array.isArray(product.imagesJson)
    ? (product.imagesJson as Array<string | { url?: string }>)
    : []
  const images = rawImages
    .map((img) => (typeof img === 'string' ? img : img?.url))
    .filter((url): url is string => !!url)
  const outOfStock = product.stock !== null && product.stock <= 0

  function increment() {
    if (!product) return
    store.getState().addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: images[0],
    })
  }

  function decrement() {
    if (!product) return
    store.getState().updateQty(product.id, qty - 1)
  }

  return (
    <div className="min-h-screen bg-warm-50 pb-32">
      <StorefrontHeader catalogName={catalog.name} catalogSlug={slug} />

      <div className="mx-auto max-w-2xl px-4 py-6">
        <Link
          href={`/s/${slug}`}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-night-500 hover:text-night-800"
        >
          <ArrowLeft className="h-4 w-4" /> Volver
        </Link>

        {/* Images */}
        <div className="mb-6 overflow-hidden rounded-2xl bg-warm-100">
          {images.length > 0 ? (
            <>
              <img
                src={images[selectedImage]}
                alt={product.name}
                className="h-72 w-full object-cover sm:h-96"
              />
              {images.length > 1 && (
                <div className="flex gap-2 p-3">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`h-14 w-14 overflow-hidden rounded-lg border-2 transition ${
                        i === selectedImage ? 'border-primary-500' : 'border-transparent'
                      }`}
                    >
                      <img src={img} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex h-72 items-center justify-center">
              <ImageOff className="h-16 w-16 text-warm-300" />
            </div>
          )}
        </div>

        {/* Info */}
        <h1 className="font-display text-2xl font-bold text-night-900">{product.name}</h1>

        <div className="mt-2 flex items-baseline gap-3">
          <span className="text-3xl font-bold text-primary-600">
            {formatMoney(product.price, catalog.currency)}
          </span>
          {product.compareAt && product.compareAt > product.price && (
            <span className="text-lg text-night-400 line-through">
              {formatMoney(product.compareAt, catalog.currency)}
            </span>
          )}
        </div>

        {product.description && (
          <p className="mt-4 leading-relaxed text-night-600">{product.description}</p>
        )}

        {product.stock !== null && (
          <p className="mt-2 text-sm text-night-400">
            {product.stock > 0 ? `${product.stock} disponibles` : 'Agotado'}
          </p>
        )}

        {/* Add to cart */}
        <div className="mt-8">
          {outOfStock ? (
            <div className="rounded-xl bg-warm-100 px-6 py-4 text-center text-night-400">
              Producto agotado
            </div>
          ) : qty === 0 ? (
            <button
              type="button"
              onClick={increment}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-500 py-4 font-semibold text-white transition hover:bg-primary-600 active:scale-[0.98]"
            >
              <ShoppingCart className="h-5 w-5" />
              Agregar al carrito
            </button>
          ) : (
            <div className="flex items-center justify-between rounded-xl bg-warm-100 px-6 py-4">
              <span className="font-medium text-night-700">En tu carrito</span>
              <QuantityStepper
                qty={qty}
                onIncrement={increment}
                onDecrement={decrement}
                max={product.stock ?? undefined}
              />
            </div>
          )}
        </div>
      </div>

      <CartFab slug={slug} currency={catalog.currency} />
    </div>
  )
}
