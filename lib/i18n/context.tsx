'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import esMessages from '@/messages/es.json'
import enMessages from '@/messages/en.json'
import { DEFAULT_LOCALE, LOCALE_COOKIE, resolveMessage, resolveRawMessage, type Locale } from './config'

const MESSAGES: Record<Locale, Record<string, unknown>> = {
  es: esMessages,
  en: enMessages,
}

interface I18nContextValue {
  locale: Locale
  /** Traduce por clave con notación de puntos, p. ej. t('siteHeader.nav.home'). */
  t: (key: string) => string
  /** Devuelve el valor crudo (array/objeto/string) para listas/tablas localizadas. */
  tRaw: (key: string) => unknown
  setLocale: (locale: Locale) => void
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({
  initialLocale = DEFAULT_LOCALE,
  children,
}: {
  initialLocale?: Locale
  children: React.ReactNode
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)
  const router = useRouter()

  const setLocale = useCallback(
    (next: Locale) => {
      // Persistir en cookie (1 año) + actualizar <html lang> al instante.
      document.cookie = `${LOCALE_COOKIE}=${next};path=/;max-age=31536000;samesite=lax`
      document.documentElement.lang = next
      setLocaleState(next)
      // Re-renderiza los server components con el nuevo idioma (leen la cookie).
      router.refresh()
    },
    [router],
  )

  const t = useCallback((key: string) => resolveMessage(MESSAGES[locale], key), [locale])
  const tRaw = useCallback((key: string) => resolveRawMessage(MESSAGES[locale], key), [locale])

  const value = useMemo(() => ({ locale, t, tRaw, setLocale }), [locale, t, tRaw, setLocale])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n debe usarse dentro de <I18nProvider>')
  return ctx
}
