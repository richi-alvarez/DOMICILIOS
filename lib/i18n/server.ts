import 'server-only'
import { cookies } from 'next/headers'
import esMessages from '@/messages/es.json'
import enMessages from '@/messages/en.json'
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  isLocale,
  resolveMessage,
  type Locale,
} from './config'

const MESSAGES: Record<Locale, Record<string, unknown>> = {
  es: esMessages,
  en: enMessages,
}

/** Lee el idioma de la cookie en el servidor (root layout, metadata, etc.). */
export async function getLocale(): Promise<Locale> {
  const store = await cookies()
  const value = store.get(LOCALE_COOKIE)?.value
  return isLocale(value) ? value : DEFAULT_LOCALE
}

/**
 * Traductor para server components: lee el idioma de la cookie y devuelve una
 * función t('a.b.c'). Equivalente server-side del hook cliente useI18n().
 */
export async function getT(): Promise<(key: string) => string> {
  const locale = await getLocale()
  return (key: string) => resolveMessage(MESSAGES[locale], key)
}
