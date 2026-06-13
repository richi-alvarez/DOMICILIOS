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
  logoUrl: z.string().url('Invalid URL').default(''),
  coverImageUrl: z.string().url('Invalid URL').default(''),
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
