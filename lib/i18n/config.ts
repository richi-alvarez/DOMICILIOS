// i18n ligero (sin routing por locale): el idioma se guarda en una cookie y se
// aplica vía Context en cliente + <html lang> en el root layout. Pensado para
// crecer de forma incremental (hoy solo traduce los headers).

export const LOCALES = ['es', 'en'] as const
export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'es'

/** Nombre de la cookie donde se persiste el idioma elegido. */
export const LOCALE_COOKIE = 'NEXT_LOCALE'

export const LOCALE_LABELS: Record<Locale, string> = {
  es: 'Español',
  en: 'English',
}

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
}

/** Devuelve el valor crudo (string/array/objeto) en la clave "a.b.c", o undefined. */
export function resolveRawMessage(messages: Record<string, unknown>, key: string): unknown {
  return key.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[part]
    return undefined
  }, messages)
}

/** Resuelve una clave "a.b.c" a string; devuelve la clave si no existe. */
export function resolveMessage(messages: Record<string, unknown>, key: string): string {
  const value = resolveRawMessage(messages, key)
  return typeof value === 'string' ? value : key
}
