import { z } from 'zod'

export const FONT_OPTIONS = [
  { value: 'inter', label: 'Inter', family: 'Inter, sans-serif' },
  { value: 'sora', label: 'Sora', family: 'Sora, sans-serif' },
  { value: 'poppins', label: 'Poppins', family: 'Poppins, sans-serif' },
  { value: 'playfair', label: 'Playfair Display', family: '"Playfair Display", serif' },
  { value: 'roboto', label: 'Roboto', family: 'Roboto, sans-serif' },
  { value: 'lato', label: 'Lato', family: 'Lato, sans-serif' },
] as const

export const RADIUS_OPTIONS = [
  { value: 'none', label: 'Sin radio', css: '0px' },
  { value: 'sm', label: 'Pequeño', css: '6px' },
  { value: 'md', label: 'Mediano', css: '12px' },
  { value: 'lg', label: 'Grande', css: '20px' },
  { value: 'full', label: 'Circular', css: '9999px' },
] as const

export type FontValue = (typeof FONT_OPTIONS)[number]['value']
export type RadiusValue = (typeof RADIUS_OPTIONS)[number]['value']

export const themeSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').default('#FF6B57'),
  primaryTextColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').default('#ffffff'),
  bgColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').default('#FAFAF8'),
  headerBg: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').default('#ffffff'),
  headingFont: z.string().default('sora'),
  bodyFont: z.string().default('inter'),
  borderRadius: z.string().default('md'),
  // Permitir cadena vacía (sin logo/portada) además de una URL válida; con solo
  // .url() el valor '' rompía la validación y el guardado del tema fallaba.
  logoUrl: z.string().url('Invalid URL').or(z.literal('')).default(''),
  coverImageUrl: z.string().url('Invalid URL').or(z.literal('')).default(''),
  customDomain: z.string().default(''),
  // SEO (metadatos para buscadores y al compartir el enlace).
  seoTitle: z.string().default(''),
  seoDescription: z.string().default(''),
})

export type ThemeConfig = z.infer<typeof themeSchema>

export const THEME_DEFAULTS: ThemeConfig = {
  primaryColor: '#FF6B57',
  primaryTextColor: '#ffffff',
  bgColor: '#FAFAF8',
  headerBg: '#ffffff',
  headingFont: 'sora',
  bodyFont: 'inter',
  borderRadius: 'md',
  logoUrl: '',
  coverImageUrl: '',
  customDomain: '',
  seoTitle: '',
  seoDescription: '',
}

export function getFontFamily(value: string): string {
  return FONT_OPTIONS.find((f) => f.value === value)?.family ?? 'Inter, sans-serif'
}

export function getRadiusCss(value: string): string {
  return RADIUS_OPTIONS.find((r) => r.value === value)?.css ?? '12px'
}

export function buildThemeCss(theme: ThemeConfig): string {
  return `
    :root {
      --sf-primary: ${theme.primaryColor};
      --sf-primary-text: ${theme.primaryTextColor};
      --sf-bg: ${theme.bgColor};
      --sf-header-bg: ${theme.headerBg};
      --sf-heading-font: ${getFontFamily(theme.headingFont)};
      --sf-body-font: ${getFontFamily(theme.bodyFont)};
      --sf-radius: ${getRadiusCss(theme.borderRadius)};
    }
  `.trim()
}

// Paleta del editor de diseño (botones, categoría, carrito, producto, filtros).
// Se guarda en `catalogs.themeJson` junto al tema; aquí la leemos para que la
// tienda pública refleje los mismos colores que el preview del editor.
export const PALETTE_DEFAULTS = {
  buttonPrimaryColor: '#ff6b57',
  buttonTextColor: '#ffffff',
  categoryPrimaryColor: '#4a7c59',
  categoryTextColor: '#ffffff',
  cartPrimaryColor: '#9b59b6',
  cartTextColor: '#ffffff',
  cartCountColor: '#ef4444',
  cartTotalColor: '#1f2937',
  productNameColor: '#1f2937',
  productPriceColor: '#111827',
  filterTextColor: '#4b5563',
} as const

const paletteSchema = z.object({
  buttonPrimaryColor: z.string().default(PALETTE_DEFAULTS.buttonPrimaryColor),
  buttonTextColor: z.string().default(PALETTE_DEFAULTS.buttonTextColor),
  categoryPrimaryColor: z.string().default(PALETTE_DEFAULTS.categoryPrimaryColor),
  categoryTextColor: z.string().default(PALETTE_DEFAULTS.categoryTextColor),
  cartPrimaryColor: z.string().default(PALETTE_DEFAULTS.cartPrimaryColor),
  cartTextColor: z.string().default(PALETTE_DEFAULTS.cartTextColor),
  cartCountColor: z.string().default(PALETTE_DEFAULTS.cartCountColor),
  cartTotalColor: z.string().default(PALETTE_DEFAULTS.cartTotalColor),
  productNameColor: z.string().default(PALETTE_DEFAULTS.productNameColor),
  productPriceColor: z.string().default(PALETTE_DEFAULTS.productPriceColor),
  filterTextColor: z.string().default(PALETTE_DEFAULTS.filterTextColor),
})

export function buildPaletteCss(themeJson: unknown): string {
  const parsed = paletteSchema.safeParse(themeJson ?? {})
  const p = parsed.success ? parsed.data : PALETTE_DEFAULTS
  return `
    :root {
      --sf-button-bg: ${p.buttonPrimaryColor};
      --sf-button-text: ${p.buttonTextColor};
      --sf-category-bg: ${p.categoryPrimaryColor};
      --sf-category-text: ${p.categoryTextColor};
      --sf-cart-bg: ${p.cartPrimaryColor};
      --sf-cart-text: ${p.cartTextColor};
      --sf-cart-count: ${p.cartCountColor};
      --sf-cart-total: ${p.cartTotalColor};
      --sf-product-name: ${p.productNameColor};
      --sf-product-price: ${p.productPriceColor};
      --sf-filter-text: ${p.filterTextColor};
    }
  `.trim()
}

export function getGoogleFontsUrl(headingFont: string, bodyFont: string): string {
  const needed = new Set([headingFont, bodyFont])
  const families: string[] = []
  for (const f of FONT_OPTIONS) {
    if (needed.has(f.value) && f.value !== 'inter' && f.value !== 'sora') {
      const name = f.family.replace(/["']/g, '').split(',')[0].trim().replace(/ /g, '+')
      families.push(`family=${name}:wght@400;600;700;800`)
    }
  }
  if (families.length === 0) return ''
  return `https://fonts.googleapis.com/css2?${families.join('&')}&display=swap`
}
