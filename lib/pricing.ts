export type Currency = 'USD' | 'COP' | 'MXN' | 'BRL' | 'CAD' | 'CLP' | 'CRC' | 'EUR' | 'PEN'

export const CURRENCIES: { code: Currency; label: string; symbol: string; locale: string }[] = [
  { code: 'USD', label: 'USD — Dólar', symbol: '$', locale: 'en-US' },
  { code: 'COP', label: 'COP — Peso colombiano', symbol: '$', locale: 'es-CO' },
  { code: 'MXN', label: 'MXN — Peso mexicano', symbol: '$', locale: 'es-MX' },
  { code: 'BRL', label: 'BRL — Real brasileño', symbol: 'R$', locale: 'pt-BR' },
  { code: 'CAD', label: 'CAD — Dólar canadiense', symbol: 'CA$', locale: 'en-CA' },
  { code: 'CLP', label: 'CLP — Peso chileno', symbol: '$', locale: 'es-CL' },
  { code: 'CRC', label: 'CRC — Colón costarricense', symbol: '₡', locale: 'es-CR' },
  { code: 'EUR', label: 'EUR — Euro', symbol: '€', locale: 'es-ES' },
  { code: 'PEN', label: 'PEN — Sol peruano', symbol: 'S/', locale: 'es-PE' },
]

export type PlanCode = 'free' | 'basic' | 'pro' | 'business'

export interface Plan {
  code: PlanCode
  highlight?: boolean
  prices: Record<Currency, { monthly: number; annual: number }>
}

// Solo datos numéricos/estructura. El texto (nombre, tagline, badge, features)
// se localiza en messages/{es,en}.json bajo `pricing.plans.<code>`.
export const PLANS: Plan[] = [
  {
    code: 'free',
    prices: {
      USD: { monthly: 0, annual: 0 },
      COP: { monthly: 0, annual: 0 },
      MXN: { monthly: 0, annual: 0 },
      BRL: { monthly: 0, annual: 0 },
      CAD: { monthly: 0, annual: 0 },
      CLP: { monthly: 0, annual: 0 },
      CRC: { monthly: 0, annual: 0 },
      EUR: { monthly: 0, annual: 0 },
      PEN: { monthly: 0, annual: 0 },
    },
  },
  {
    code: 'basic',
    prices: {
      USD: { monthly: 9, annual: 6 },
      COP: { monthly: 39900, annual: 26900 },
      MXN: { monthly: 159, annual: 109 },
      BRL: { monthly: 49, annual: 33 },
      CAD: { monthly: 12, annual: 8 },
      CLP: { monthly: 8900, annual: 5900 },
      CRC: { monthly: 4900, annual: 3300 },
      EUR: { monthly: 9, annual: 6 },
      PEN: { monthly: 35, annual: 23 },
    },
  },
  {
    code: 'pro',
    highlight: true,
    prices: {
      USD: { monthly: 19, annual: 13 },
      COP: { monthly: 79900, annual: 53900 },
      MXN: { monthly: 329, annual: 219 },
      BRL: { monthly: 99, annual: 66 },
      CAD: { monthly: 25, annual: 17 },
      CLP: { monthly: 17900, annual: 11900 },
      CRC: { monthly: 9900, annual: 6600 },
      EUR: { monthly: 18, annual: 12 },
      PEN: { monthly: 72, annual: 48 },
    },
  },
  {
    code: 'business',
    prices: {
      USD: { monthly: 39, annual: 27 },
      COP: { monthly: 159900, annual: 107900 },
      MXN: { monthly: 659, annual: 439 },
      BRL: { monthly: 199, annual: 133 },
      CAD: { monthly: 52, annual: 35 },
      CLP: { monthly: 35900, annual: 23900 },
      CRC: { monthly: 19900, annual: 13200 },
      EUR: { monthly: 36, annual: 24 },
      PEN: { monthly: 149, annual: 99 },
    },
  },
]

export interface AgencyTier {
  name: string
  baseCatalogs: number
  extraCatalogPrice: Record<Currency, number>
  basePrice: Record<Currency, { monthly: number; annual: number }>
}

export const AGENCY_TIERS: AgencyTier[] = [
  {
    name: 'Starter',
    baseCatalogs: 5,
    basePrice: {
      USD: { monthly: 49, annual: 33 },
      COP: { monthly: 199900, annual: 134900 },
      MXN: { monthly: 849, annual: 569 },
      BRL: { monthly: 249, annual: 167 },
      CAD: { monthly: 65, annual: 44 },
      CLP: { monthly: 44900, annual: 29900 },
      CRC: { monthly: 24900, annual: 16600 },
      EUR: { monthly: 46, annual: 31 },
      PEN: { monthly: 189, annual: 127 },
    },
    extraCatalogPrice: {
      USD: 8, COP: 32900, MXN: 139, BRL: 41, CAD: 11, CLP: 7400, CRC: 4100, EUR: 7, PEN: 31,
    },
  },
  {
    name: 'Professional',
    baseCatalogs: 20,
    basePrice: {
      USD: { monthly: 99, annual: 66 },
      COP: { monthly: 399900, annual: 269900 },
      MXN: { monthly: 1699, annual: 1139 },
      BRL: { monthly: 499, annual: 335 },
      CAD: { monthly: 132, annual: 88 },
      CLP: { monthly: 89900, annual: 59900 },
      CRC: { monthly: 49900, annual: 33300 },
      EUR: { monthly: 93, annual: 62 },
      PEN: { monthly: 379, annual: 254 },
    },
    extraCatalogPrice: {
      USD: 6, COP: 24900, MXN: 104, BRL: 31, CAD: 8, CLP: 5600, CRC: 3100, EUR: 6, PEN: 23,
    },
  },
  {
    name: 'Agency Growth',
    baseCatalogs: 50,
    basePrice: {
      USD: { monthly: 199, annual: 133 },
      COP: { monthly: 799900, annual: 539900 },
      MXN: { monthly: 3399, annual: 2279 },
      BRL: { monthly: 999, annual: 670 },
      CAD: { monthly: 265, annual: 178 },
      CLP: { monthly: 179900, annual: 119900 },
      CRC: { monthly: 99900, annual: 66900 },
      EUR: { monthly: 186, annual: 125 },
      PEN: { monthly: 759, annual: 509 },
    },
    extraCatalogPrice: {
      USD: 4, COP: 16900, MXN: 69, BRL: 20, CAD: 5, CLP: 3700, CRC: 2100, EUR: 4, PEN: 15,
    },
  },
]

export function formatPrice(amount: number, currency: Currency): string {
  const cur = CURRENCIES.find((c) => c.code === currency)!
  if (amount === 0) return 'Gratis'
  return new Intl.NumberFormat(cur.locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function calcAgencyPrice(
  catalogs: number,
  tier: AgencyTier,
  currency: Currency,
  interval: 'monthly' | 'annual',
): number {
  const base = tier.basePrice[currency][interval]
  const extra = Math.max(0, catalogs - tier.baseCatalogs) * tier.extraCatalogPrice[currency]
  return base + extra
}

// Feature comparison table data
export type FeatureValue = boolean | string | number

export interface FeatureRow {
  label: string
  free: FeatureValue
  basic: FeatureValue
  pro: FeatureValue
  business: FeatureValue
}

export interface FeatureGroup {
  group: string
  rows: FeatureRow[]
}

// FEATURE_GROUPS se localiza en messages/{es,en}.json bajo pricing.featureGroups.
