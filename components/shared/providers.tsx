'use client'

import { SessionProvider } from 'next-auth/react'
import { Toaster } from 'sonner'
import { I18nProvider } from '@/lib/i18n/context'
import type { Locale } from '@/lib/i18n/config'

export function Providers({
  children,
  initialLocale,
}: {
  children: React.ReactNode
  initialLocale?: Locale
}) {
  return (
    <SessionProvider>
      <I18nProvider initialLocale={initialLocale}>
        {children}
      </I18nProvider>
      <Toaster
        position="bottom-right"
        toastOptions={{
          classNames: {
            toast: 'rounded-xl border border-warm-200 shadow-elevated',
            title: 'font-semibold text-night-800',
            description: 'text-warm-500',
          },
        }}
      />
    </SessionProvider>
  )
}
