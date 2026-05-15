'use client'

import { useState, useTransition } from 'react'
import { CreditCard, Eye, EyeOff, ExternalLink, CheckCircle2, X } from 'lucide-react'
import { saveStripeSettings } from '@/lib/actions/payments'

interface Props {
  catalogId: string
  existing: {
    enabled: boolean
    credentials: {
      publicKey?: string
      secretKey?: string
      webhookSecret?: string
    }
  } | null
}

export function PaymentsForm({ catalogId, existing }: Props) {
  const [isPending, startTransition] = useTransition()
  const [showSecret, setShowSecret] = useState(false)
  const [showWebhook, setShowWebhook] = useState(false)
  const [enabled, setEnabled] = useState(existing?.enabled ?? false)
  const [publicKey, setPublicKey] = useState(existing?.credentials.publicKey ?? '')
  const [secretKey, setSecretKey] = useState(existing?.credentials.secretKey ?? '')
  const [webhookSecret, setWebhookSecret] = useState(existing?.credentials.webhookSecret ?? '')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      setError(null)
      setSuccess(false)
      const res = await saveStripeSettings(catalogId, { publicKey, secretKey, webhookSecret, enabled })
      if (res.error) setError(res.error)
      else setSuccess(true)
    })
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Stripe info banner */}
      <div className="rounded-2xl border border-warm-200 bg-warm-50 p-5 flex gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#635BFF]/10">
          <CreditCard className="h-5 w-5 text-[#635BFF]" />
        </div>
        <div className="flex-1 text-sm">
          <p className="font-semibold text-night-700 mb-1">Integración con Stripe</p>
          <p className="text-night-400 leading-relaxed">
            Crea una cuenta en{' '}
            <a href="https://stripe.com" target="_blank" rel="noopener noreferrer" className="text-primary-500 underline">
              stripe.com
            </a>{' '}
            y obtén tus claves en el{' '}
            <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-primary-500 underline">
              Dashboard → Developers → API keys <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="rounded-2xl border border-warm-200 bg-white p-6 space-y-5">
        {/* Enable toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-night-800">Activar pagos con tarjeta</p>
            <p className="text-sm text-night-400">Tus clientes verán la opción de pagar con Stripe en el checkout</p>
          </div>
          <button
            type="button"
            onClick={() => setEnabled((v) => !v)}
            className={`relative h-6 w-11 rounded-full transition-colors ${enabled ? 'bg-primary-500' : 'bg-warm-300'}`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>

        <div className="h-px bg-warm-100" />

        {/* Public key */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-night-700">
            Clave pública <span className="text-warm-400 font-normal">(pk_live_... o pk_test_...)</span>
          </label>
          <input
            type="text"
            value={publicKey}
            onChange={(e) => setPublicKey(e.target.value)}
            placeholder="pk_live_..."
            required
            className="w-full rounded-xl border border-warm-200 bg-warm-50 px-3 py-2.5 text-sm font-mono text-night-800 placeholder:text-warm-400 focus:border-primary-400 focus:bg-white focus:outline-none"
          />
        </div>

        {/* Secret key */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-night-700">
            Clave secreta <span className="text-warm-400 font-normal">(sk_live_... o sk_test_...)</span>
          </label>
          <div className="relative">
            <input
              type={showSecret ? 'text' : 'password'}
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder="sk_live_..."
              required
              className="w-full rounded-xl border border-warm-200 bg-warm-50 px-3 py-2.5 pr-10 text-sm font-mono text-night-800 placeholder:text-warm-400 focus:border-primary-400 focus:bg-white focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowSecret((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-400 hover:text-night-600"
            >
              {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Webhook secret */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-night-700">
            Webhook secret <span className="text-warm-400 font-normal">(whsec_... — opcional)</span>
          </label>
          <p className="mb-2 text-xs text-night-400">
            En Stripe Dashboard → Webhooks, apunta a{' '}
            <code className="rounded bg-warm-100 px-1 py-0.5 text-[11px]">
              {typeof window !== 'undefined' ? window.location.origin : 'https://tu-dominio.com'}/api/stripe/webhook
            </code>
          </p>
          <div className="relative">
            <input
              type={showWebhook ? 'text' : 'password'}
              value={webhookSecret}
              onChange={(e) => setWebhookSecret(e.target.value)}
              placeholder="whsec_..."
              className="w-full rounded-xl border border-warm-200 bg-warm-50 px-3 py-2.5 pr-10 text-sm font-mono text-night-800 placeholder:text-warm-400 focus:border-primary-400 focus:bg-white focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowWebhook((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-400 hover:text-night-600"
            >
              {showWebhook ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <X className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 rounded-xl border border-lime-200 bg-lime-50 px-4 py-3 text-sm text-lime-700">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Configuración guardada correctamente.
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 rounded-xl bg-primary-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-600 disabled:opacity-60"
        >
          {isPending ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : null}
          Guardar configuración
        </button>
      </form>

      {/* Mode indicator */}
      {publicKey && (
        <div className={`rounded-xl px-4 py-3 text-sm font-medium ${publicKey.startsWith('pk_live') ? 'bg-lime-50 text-lime-700 border border-lime-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
          {publicKey.startsWith('pk_live') ? '✅ Modo producción (cobros reales)' : '🧪 Modo prueba (no se cobran pagos reales)'}
        </div>
      )}
    </div>
  )
}
