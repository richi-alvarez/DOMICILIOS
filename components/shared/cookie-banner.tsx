'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Cookie, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n/context'

const COOKIE_KEY = 'domicilios_cookie_consent'

export function CookieBanner() {
  const { t } = useI18n()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_KEY)
    if (!consent) setVisible(true)
  }, [])

  function accept() {
    localStorage.setItem(COOKIE_KEY, 'accepted')
    setVisible(false)
  }

  function dismiss() {
    localStorage.setItem(COOKIE_KEY, 'dismissed')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-2xl">
      <div className="flex items-start gap-4 rounded-2xl border border-warm-200 bg-white p-5 shadow-modal">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-100">
          <Cookie className="h-5 w-5 text-primary-500" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-night-700">
            {t('cookieBanner.text')}{' '}
            <Link href="/privacy" className="font-medium text-primary-500 hover:underline">
              {t('cookieBanner.privacyLink')}
            </Link>
          </p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={accept}>
              {t('cookieBanner.accept')}
            </Button>
            <Button size="sm" variant="ghost" onClick={dismiss}>
              {t('cookieBanner.essentialsOnly')}
            </Button>
          </div>
        </div>
        <button
          onClick={dismiss}
          className="shrink-0 rounded-lg p-1 text-warm-400 hover:bg-warm-100 hover:text-night-700"
          aria-label={t('cookieBanner.close')}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
