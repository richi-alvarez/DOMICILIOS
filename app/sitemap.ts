import type { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://domicilios.app'

const staticRoutes = [
  { url: '/', priority: 1.0, changeFrequency: 'weekly' as const },
  { url: '/plans', priority: 0.9, changeFrequency: 'monthly' as const },
  { url: '/agencies', priority: 0.9, changeFrequency: 'monthly' as const },
  { url: '/digitalcatalog', priority: 0.8, changeFrequency: 'monthly' as const },
  { url: '/digitalmenu', priority: 0.8, changeFrequency: 'monthly' as const },
  { url: '/proveedores-chinos', priority: 0.7, changeFrequency: 'monthly' as const },
  { url: '/tools', priority: 0.8, changeFrequency: 'monthly' as const },
  { url: '/tools/whatsapp-link-generator', priority: 0.7, changeFrequency: 'monthly' as const },
  { url: '/tools/product-description-generator', priority: 0.7, changeFrequency: 'monthly' as const },
  { url: '/tools/profit-margin-calculator', priority: 0.7, changeFrequency: 'monthly' as const },
  { url: '/tools/business-name-generator', priority: 0.7, changeFrequency: 'monthly' as const },
  { url: '/tools/qr-code-menu-generator', priority: 0.7, changeFrequency: 'monthly' as const },
  { url: '/tools/biography-generator', priority: 0.6, changeFrequency: 'monthly' as const },
  { url: '/como-vender', priority: 0.8, changeFrequency: 'weekly' as const },
  { url: '/guides', priority: 0.8, changeFrequency: 'weekly' as const },
  { url: '/terms', priority: 0.3, changeFrequency: 'yearly' as const },
  { url: '/privacy', priority: 0.3, changeFrequency: 'yearly' as const },
  { url: '/aup', priority: 0.3, changeFrequency: 'yearly' as const },
]

const guidesSlugs = [
  'ropa', 'comida', 'pasteles', 'cafe', 'salsas', 'joyeria',
  'zapatos', 'cosmeticos', 'artesanias', 'comida-rapida',
  'tamales', 'saludable', 'botanas', 'lenceria', 'accesorios',
]

const comparesSlugs = [
  'catalogo-digital-whatsapp',
  'mejor-plataforma-whatsapp',
  'tienda-online-gratis',
  'menu-digital-restaurantes',
]

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const routes = staticRoutes.map((r) => ({
    url: `${BASE_URL}${r.url}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }))

  const guideRoutes = guidesSlugs.map((slug) => ({
    url: `${BASE_URL}/como-vender/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  const compareRoutes = comparesSlugs.map((slug) => ({
    url: `${BASE_URL}/guides/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  return [...routes, ...guideRoutes, ...compareRoutes]
}
