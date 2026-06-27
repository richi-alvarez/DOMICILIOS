'use client'

import { Globe } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n/context'
import { LOCALES, LOCALE_LABELS } from '@/lib/i18n/config'

/**
 * Selector de idioma compacto (segmentado ES | EN) para los headers.
 * Persiste el idioma en cookie y refresca los server components.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale } = useI18n()

  return (
    <div
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full border border-warm-200 p-0.5',
        className,
      )}
      role="group"
      aria-label={LOCALE_LABELS[locale]}
    >
      <Globe className="ml-1 h-3.5 w-3.5 shrink-0 text-warm-400" aria-hidden="true" />
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLocale(l)}
          aria-pressed={locale === l}
          aria-label={LOCALE_LABELS[l]}
          className={cn(
            'rounded-full px-2 py-0.5 text-xs font-semibold uppercase transition-colors',
            locale === l
              ? 'bg-primary-500 text-white'
              : 'text-night-500 hover:text-night-800',
          )}
        >
          {l}
        </button>
      ))}
    </div>
  )
}
