'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Phone, Mail, ChevronRight } from 'lucide-react'
import { CheckoutHeader } from '@/components/storefront/checkout-header'
import { useCartState, useCart } from '@/components/storefront/cart-context'

interface Props {
  params: Promise<{ slug: string }>
}

export default function ContactPage({ params }: Props) {
  const { slug } = use(params)
  const router = useRouter()
  const store = useCart()
  const { customer } = useCartState()

  const [name, setName] = useState(customer?.name ?? '')
  const [phone, setPhone] = useState(customer?.phone ?? '')
  const [email, setEmail] = useState(customer?.email ?? '')
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({})

  const canContinue = name.trim().length >= 2 && phone.trim().length >= 7

  function validate() {
    const e: typeof errors = {}
    if (name.trim().length < 2) e.name = 'Ingresa tu nombre (mín. 2 caracteres)'
    if (phone.trim().length < 7) e.phone = 'Ingresa un teléfono válido'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleContinue() {
    if (!validate()) return
    store.getState().setCustomer({ name: name.trim(), phone: phone.trim(), email: email || undefined })
    router.push(`/s/${slug}/checkout/summary`)
  }

  return (
    <div className="min-h-screen bg-warm-50 pb-32">
      <CheckoutHeader
        title="Datos"
        backHref={`/s/${slug}/checkout/delivery`}
        closeHref={`/s/${slug}`}
      />

      <div className="mx-auto max-w-2xl px-4 py-6">
        <h2 className="mb-4 font-semibold text-night-700">Información de contacto</h2>

        <div className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
          {/* Name */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-night-700">
              <User className="h-4 w-4 text-night-400" /> Nombre *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre completo"
              autoComplete="name"
              className={`w-full rounded-xl border px-4 py-2.5 text-sm text-night-800 placeholder-night-300 focus:outline-none focus:ring-1 ${
                errors.name
                  ? 'border-red-400 focus:border-red-400 focus:ring-red-400'
                  : 'border-warm-200 focus:border-primary-400 focus:ring-primary-400'
              }`}
            />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-night-700">
              <Phone className="h-4 w-4 text-night-400" /> Teléfono *
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ej: 3001234567"
              autoComplete="tel"
              className={`w-full rounded-xl border px-4 py-2.5 text-sm text-night-800 placeholder-night-300 focus:outline-none focus:ring-1 ${
                errors.phone
                  ? 'border-red-400 focus:border-red-400 focus:ring-red-400'
                  : 'border-warm-200 focus:border-primary-400 focus:ring-primary-400'
              }`}
            />
            {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-night-700">
              <Mail className="h-4 w-4 text-night-400" /> Email{' '}
              <span className="text-xs font-normal text-night-400">(opcional)</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              autoComplete="email"
              className="w-full rounded-xl border border-warm-200 px-4 py-2.5 text-sm text-night-800 placeholder-night-300 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
            />
          </div>
        </div>
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-warm-100 bg-white px-4 py-4">
        <div className="mx-auto max-w-2xl">
          <button
            type="button"
            onClick={handleContinue}
            disabled={!canContinue}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-500 py-3.5 font-semibold text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]"
          >
            Continuar <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
