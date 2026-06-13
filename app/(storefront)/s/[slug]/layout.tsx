import { notFound } from 'next/navigation'
import { getCatalogBySlug } from '@/lib/storefront/queries'
import { CartProvider } from '@/components/storefront/cart-context'
import { THEME_DEFAULTS, themeSchema, buildThemeCss, getGoogleFontsUrl } from '@/lib/design/theme'

interface Props {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const catalog = await getCatalogBySlug(slug)
  const theme = themeSchema.safeParse(catalog?.themeJson ?? {})
  const data = theme.success ? theme.data : undefined

  const title = data?.seoTitle?.trim() || catalog?.name || slug
  const description = data?.seoDescription?.trim() || catalog?.description || undefined
  const logoUrl = data?.logoUrl || undefined

  return {
    title,
    description,
    icons: { icon: logoUrl },
    openGraph: {
      title,
      description,
      type: 'website',
      images: logoUrl ? [{ url: logoUrl }] : undefined,
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: logoUrl ? [logoUrl] : undefined,
    },
  }
}

export default async function StorefrontLayout({ children, params }: Props) {
  const { slug } = await params
  const catalog = await getCatalogBySlug(slug)

  if (!catalog) notFound()

  const parsed = themeSchema.safeParse(catalog.themeJson ?? {})
  const theme = parsed.success ? parsed.data : THEME_DEFAULTS
  const themeCss = buildThemeCss(theme)
  const googleFontsUrl = getGoogleFontsUrl(theme.headingFont, theme.bodyFont)

  return (
    <CartProvider slug={slug}>
      {googleFontsUrl && (
        <link rel="stylesheet" href={googleFontsUrl} />
      )}
      <style dangerouslySetInnerHTML={{ __html: themeCss }} />
      {children}
    </CartProvider>
  )
}
