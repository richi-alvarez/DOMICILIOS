'use client'

import { useState, useTransition } from 'react'
import { ExternalLink, Loader2 } from 'lucide-react'
import { createBillingPortalSession } from '@/lib/actions/payments'
import { useI18n } from '@/lib/i18n/context'

export function BillingPortalButton() {
  const { t } = useI18n()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleClick() {
    startTransition(async () => {
      setError(null)
      const result = await createBillingPortalSession()
      if (result.error) { setError(result.error); return }
      if (result.url) window.location.href = result.url
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleClick}
        disabled={isPending}
        className="flex items-center gap-2 rounded-xl border border-warm-200 bg-warm-50 px-4 py-2 text-sm font-semibold text-night-700 transition hover:bg-warm-100 disabled:opacity-60"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
        {t('billing.openPortal')}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
