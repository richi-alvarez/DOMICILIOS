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
  return {
    title: catalog?.name ?? slug,
    description: catalog?.description ?? undefined,
    icons: { icon: theme.success && theme.data.logoUrl ? theme.data.logoUrl : undefined },
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
