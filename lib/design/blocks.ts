export type BlockType =
  | 'announcement'
  | 'hero'
  | 'categories'
  | 'featured'
  | 'banner'
  | 'cta'
  | 'social'
  | 'footer'

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

export interface FooterConfig {
  companyName: string
  companyDescription: string
  address: string
  phone: string
  email: string
  website: string
  socialLinks: Array<{ id: string; name: string; url: string }>
  copyrightText: string
  bgColor: string
  textColor: string
  accentColor: string
  layout: 'minimal' | 'standard' | 'full'
  showSocialLinks: boolean
  showDescription: boolean
  showAddress: boolean
  showPhone: boolean
  showEmail: boolean
  showWebsite: boolean
  showCopyright: boolean
  showCompanyInfo: boolean
  showContactInfo: boolean
  alignment: 'left' | 'center'
}

export type BlockConfig =
  | { type: 'announcement'; id: string; active: boolean; config: AnnouncementConfig }
  | { type: 'hero'; id: string; active: boolean; config: HeroConfig }
  | { type: 'categories'; id: string; active: boolean; config: CategoriesConfig }
  | { type: 'featured'; id: string; active: boolean; config: FeaturedConfig }
  | { type: 'banner'; id: string; active: boolean; config: BannerConfig }
  | { type: 'cta'; id: string; active: boolean; config: CtaConfig }
  | { type: 'social'; id: string; active: boolean; config: SocialConfig }
  | { type: 'footer'; id: string; active: boolean; config: FooterConfig }

export const BLOCK_META: Record<BlockType, { label: string; description: string; emoji: string }> = {
  announcement: { label: 'Anuncio', description: 'Barra de texto destacada', emoji: '📢' },
  hero: { label: 'Hero', description: 'Sección principal con CTA', emoji: '🏠' },
  categories: { label: 'Categorías', description: 'Chips de categorías', emoji: '🗂️' },
  featured: { label: 'Destacados', description: 'Productos seleccionados', emoji: '⭐' },
  banner: { label: 'Banner', description: 'Imagen con texto superpuesto', emoji: '🖼️' },
  cta: { label: 'Call to Action', description: 'Sección con botón destacado', emoji: '🎯' },
  social: { label: 'Redes sociales', description: 'Links a tus redes', emoji: '📱' },
  footer: { label: 'Pie de página', description: 'Información de contacto y empresa', emoji: '🏛️' },
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
  footer: {
    companyName: 'Tu Empresa',
    companyDescription: 'Descripción de tu empresa',
    address: 'Calle Principal 123, Ciudad',
    phone: '+1 (555) 123-4567',
    email: 'contacto@empresa.com',
    website: 'https://www.empresa.com',
    socialLinks: [
      { id: '1', name: 'Instagram', url: 'https://instagram.com' },
      { id: '2', name: 'Facebook', url: 'https://facebook.com' },
    ],
    copyrightText: '© 2026 Tu Empresa. Todos los derechos reservados.',
    bgColor: '#1F2937',
    textColor: '#F3F4F6',
    accentColor: '#3B82F6',
    layout: 'standard',
    showSocialLinks: true,
    showDescription: true,
    showAddress: true,
    showPhone: true,
    showEmail: true,
    showWebsite: true,
    showCopyright: true,
    showCompanyInfo: true,
    showContactInfo: true,
    alignment: 'left',
  } satisfies FooterConfig,
}

export function createBlock(type: BlockType): BlockConfig {
  return {
    type,
    id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    active: true,
    config: { ...BLOCK_DEFAULTS[type] },
  } as BlockConfig
}
