'use client'

import { SessionProvider } from 'next-auth/react'
import { Toaster } from 'sonner'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
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
