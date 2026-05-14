export type BlockType =
  | 'announcement'
  | 'hero'
  | 'categories'
  | 'featured'
  | 'banner'
  | 'cta'
  | 'social'

export interface AnnouncementConfig {
  text: string
  bgColor: string
  textColor: string
  link?: string
}

export interface HeroConfig {
  title: string
  subtitle: string
  ctaText: string
  ctaLink: string
  bgColor: string
  textColor: string
}

export interface CategoriesConfig {
  title: string
  showAll: boolean
}

export interface FeaturedConfig {
  title: string
  maxProducts: number
}

export interface BannerConfig {
  imageUrl: string
  title: string
  subtitle: string
  ctaText: string
  ctaLink: string
}

export interface CtaConfig {
  title: string
  subtitle: string
  btnText: string
  btnLink: string
  bgColor: string
}

export type SocialNetwork = 'instagram' | 'facebook' | 'tiktok' | 'twitter' | 'youtube' | 'whatsapp'

export interface SocialConfig {
  items: Array<{ network: SocialNetwork; url: string }>
}

export type BlockConfig =
  | { type: 'announcement'; id: string; active: boolean; config: AnnouncementConfig }
  | { type: 'hero'; id: string; active: boolean; config: HeroConfig }
  | { type: 'categories'; id: string; active: boolean; config: CategoriesConfig }
  | { type: 'featured'; id: string; active: boolean; config: FeaturedConfig }
  | { type: 'banner'; id: string; active: boolean; config: BannerConfig }
  | { type: 'cta'; id: string; active: boolean; config: CtaConfig }
  | { type: 'social'; id: string; active: boolean; config: SocialConfig }

export const BLOCK_META: Record<BlockType, { label: string; description: string; emoji: string }> = {
  announcement: { label: 'Anuncio', description: 'Barra de texto destacada', emoji: '📢' },
  hero: { label: 'Hero', description: 'Sección principal con CTA', emoji: '🏠' },
  categories: { label: 'Categorías', description: 'Chips de categorías', emoji: '🗂️' },
  featured: { label: 'Destacados', description: 'Productos seleccionados', emoji: '⭐' },
  banner: { label: 'Banner', description: 'Imagen con texto superpuesto', emoji: '🖼️' },
  cta: { label: 'Call to Action', description: 'Sección con botón destacado', emoji: '🎯' },
  social: { label: 'Redes sociales', description: 'Links a tus redes', emoji: '📱' },
}

export const BLOCK_DEFAULTS: Record<BlockType, object> = {
  announcement: {
    text: '🚀 ¡Envíos gratis en pedidos mayores a $50.000!',
    bgColor: '#FF6B57',
    textColor: '#ffffff',
    link: '',
  } satisfies AnnouncementConfig,
  hero: {
    title: 'Bienvenido a nuestra tienda',
    subtitle: 'Los mejores productos al mejor precio',
    ctaText: 'Ver menú',
    ctaLink: '',
    bgColor: '#0B1F3A',
    textColor: '#ffffff',
  } satisfies HeroConfig,
  categories: {
    title: 'Categorías',
    showAll: true,
  } satisfies CategoriesConfig,
  featured: {
    title: 'Productos destacados',
    maxProducts: 4,
  } satisfies FeaturedConfig,
  banner: {
    imageUrl: '',
    title: 'Oferta especial',
    subtitle: 'Solo por hoy',
    ctaText: 'Ver oferta',
    ctaLink: '',
  } satisfies BannerConfig,
  cta: {
    title: '¿Listo para pedir?',
    subtitle: 'Escríbenos por WhatsApp y te atendemos al instante.',
    btnText: 'Pedir ahora',
    btnLink: '',
    bgColor: '#9BE14A',
  } satisfies CtaConfig,
  social: {
    items: [{ network: 'instagram', url: '' }],
  } satisfies SocialConfig,
}

export function createBlock(type: BlockType): BlockConfig {
  return {
    type,
    id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    active: true,
    config: { ...BLOCK_DEFAULTS[type] },
  } as BlockConfig
}
