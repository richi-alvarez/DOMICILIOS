'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { MessageCircle, CheckCircle2, Package } from 'lucide-react'
import { markOrderWhatsAppSent } from '@/lib/actions/orders'

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ code?: string; id?: string; cid?: string }>
}

export default function ConfirmPage({ params, searchParams }: Props) {
  const { slug } = use(params)
  const { code, id: orderId, cid: catalogId } = use(searchParams)
  const [catalog, setCatalog] = useState<{
    name: string
    currency: string
    orderChannel: string
    contactPhone: string | null
    contactCountryCode: string | null
    contactEmail: string | null
  } | null>(null)
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!catalogId) return
    fetch(`/api/storefront/${slug}`)
      .then((r) => r.json())
      .then(({ catalog: c }) => {
        setCatalog(c)
        if (c.orderChannel === 'whatsapp' && c.contactPhone && code) {
          // Build a minimal WhatsApp URL with just the order code since we
          // don't have full order detail here (cart was cleared). The full
          // message will be rebuilt from stored session if needed.
          const phone = `${c.contactCountryCode?.replace('+', '') ?? '57'}${c.contactPhone}`
          const msg = [
            `¡Hola! Quiero enviar mi pedido`,
            ``,
            `Número de pedido: ${code}`,
            ``,
            `👆 Envía este mensaje para confirmar tu pedido.`,
          ].join('\n')
          setWhatsappUrl(
            `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(msg)}`,
          )
        }
      })
      .catch(() => {})
  }, [slug, catalogId, code])

  async function handleSend() {
    if (orderId) {
      await markOrderWhatsAppSent(orderId)
    }
    if (whatsappUrl) {
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-warm-50 px-4 py-12">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-lime-100">
          <CheckCircle2 className="h-10 w-10 text-lime-600" />
        </div>

        <h1 className="font-display text-2xl font-bold text-night-900">¡Pedido Generado!</h1>
        <p className="mt-2 text-night-500">Continúa para enviar tu orden</p>

        {code && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-warm-100 px-4 py-2 text-sm font-medium text-night-700">
            <Package className="h-4 w-4" />
            Pedido #{code}
          </div>
        )}

        <div className="mt-8 space-y-3">
          {catalog?.orderChannel === 'whatsapp' && whatsappUrl ? (
            <button
              type="button"
              onClick={handleSend}
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#25D366] py-4 text-base font-bold text-white transition hover:bg-[#1da851] active:scale-[0.98]"
            >
              <MessageCircle className="h-5 w-5" />
              Enviar por WhatsApp
            </button>
          ) : catalog?.orderChannel === 'email' ? (
            <div className="rounded-xl bg-lime-50 px-4 py-3 text-sm text-lime-700">
              ✅ Tu pedido fue enviado por email al comerciante.
            </div>
          ) : (
            <div className="h-12 animate-pulse rounded-xl bg-warm-200" />
          )}

          <Link
            href={`/s/${slug}/order/${code}`}
            className="flex w-full items-center justify-center rounded-xl border border-warm-200 bg-white py-3 text-sm font-medium text-night-700 hover:bg-warm-50"
          >
            Ver detalle del pedido
          </Link>

          <Link
            href={`/s/${slug}`}
            className="block text-sm text-night-400 underline-offset-2 hover:underline"
          >
            Volver a la tienda
          </Link>
        </div>
      </div>
    </div>
  )
}
