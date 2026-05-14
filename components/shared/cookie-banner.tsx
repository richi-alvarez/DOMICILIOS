'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Cookie, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

const COOKIE_KEY = 'domicilios_cookie_consent'

export function CookieBanner() {
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
            Usamos cookies esenciales para el funcionamiento del sitio y analítica propia para mejorar
            la plataforma. No usamos cookies de publicidad.{' '}
            <Link href="/privacy" className="font-medium text-primary-500 hover:underline">
              Política de privacidad
            </Link>
          </p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={accept}>
              Aceptar
            </Button>
            <Button size="sm" variant="ghost" onClick={dismiss}>
              Solo esenciales
            </Button>
          </div>
        </div>
        <button
          onClick={dismiss}
          className="shrink-0 rounded-lg p-1 text-warm-400 hover:bg-warm-100 hover:text-night-700"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
