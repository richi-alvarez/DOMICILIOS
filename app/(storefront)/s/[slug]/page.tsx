import { notFound } from 'next/navigation'
import {
  getCatalogBySlug,
  listCatalogCategories,
  listCatalogProducts,
  getBlocksForStorefront,
} from '@/lib/storefront/queries'
import { CategoryChips } from '@/components/storefront/category-chips'
import { ProductCard } from '@/components/storefront/product-card'
import { StorefrontHeader } from '@/components/storefront/storefront-header'
import { CartFab } from '@/components/storefront/cart-fab'
import { AnnouncementBlock } from '@/components/storefront/blocks/announcement-block'
import { HeroBlock } from '@/components/storefront/blocks/hero-block'
import { BannerBlock } from '@/components/storefront/blocks/banner-block'
import { CtaBlock } from '@/components/storefront/blocks/cta-block'
import { SocialBlock } from '@/components/storefront/blocks/social-block'
import { StorefrontDesignBlocks } from '@/components/storefront/storefront-design-blocks'
import { Store } from 'lucide-react'
import type { BlockConfig } from '@/lib/design/blocks'
import { themeSchema, THEME_DEFAULTS } from '@/lib/design/theme'
import { TrackEvent } from '@/components/storefront/track-event'

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ cat?: string; q?: string }>
}

export const revalidate = 60

function renderBlock(block: BlockConfig, _catalogSlug: string) {
  switch (block.type) {
    case 'announcement':
      return <AnnouncementBlock key={block.id} config={block.config} />
    case 'hero':
      return <HeroBlock key={block.id} config={block.config} />
    case 'banner':
      return <BannerBlock key={block.id} config={block.config} />
    case 'cta':
      return <CtaBlock key={block.id} config={block.config} />
    case 'social':
      return <SocialBlock key={block.id} config={block.config} />
    default:
      return null
  }
}

export default async function StorefrontPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { cat, q } = await searchParams

  const catalog = await getCatalogBySlug(slug)
  if (!catalog) notFound()

  const [cats, allProducts, pageBlocks] = await Promise.all([
    listCatalogCategories(catalog.id),
    listCatalogProducts(catalog.id),
    getBlocksForStorefront(catalog.id),
  ])

  const activeCategory = cat ? cats.find((c) => c.slug === cat) : null

  let products = allProducts
  if (activeCategory) {
    products = allProducts.filter((p) => p.categoryId === activeCategory.id)
  }
  if (q) {
    const query = q.toLowerCase()
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query),
    )
  }

  const hasHeroBlock = pageBlocks.some((b) => b.type === 'hero')
  const hasFeaturedBlock = pageBlocks.some((b) => b.type === 'featured')

  const parsed = themeSchema.safeParse(catalog.themeJson ?? {})
  const theme = parsed.success ? parsed.data : THEME_DEFAULTS

  // Bloques del editor de diseño nuevo (presentation/carousel/benefits/…).
  // Si el catálogo los usa, renderizamos esos bloques en orden en vez del layout legacy.
  const DESIGN_BLOCK_TYPES = new Set([
    'presentation',
    'catalog',
    'carousel',
    'benefits',
    'socialproof',
    'cta-reinforcement',
    'footer',
    'text',
  ])
  const designBlocks = pageBlocks.filter((b) => DESIGN_BLOCK_TYPES.has(b.type))
  const hasDesignBlocks = designBlocks.length > 0

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--sf-bg, #FAFAF8)', fontFamily: 'var(--sf-body-font)' }}>
      <TrackEvent catalogId={catalog.id} type="page_view" />
      <StorefrontHeader catalogName={catalog.name} catalogSlug={slug} logoUrl={theme.logoUrl || undefined} />

      {hasDesignBlocks ? (
        <StorefrontDesignBlocks
          blocks={designBlocks.map((b) => ({ id: b.id, type: b.type, config: b.config as Record<string, any> }))}
          products={products}
          categories={cats}
          catalogSlug={slug}
          currency={catalog.currency}
          activeCategorySlug={cat}
        />
      ) : (
      <>
      {/* Blocks: announcement goes first */}
      {pageBlocks
        .filter((b) => b.type === 'announcement')
        .map((b) => renderBlock(b, slug))}

      {/* Hero: use custom block if present, else default */}
      {hasHeroBlock ? (
        pageBlocks.filter((b) => b.type === 'hero').map((b) => renderBlock(b, slug))
      ) : (
        <div className="bg-gradient-to-br from-night-800 to-night-600 px-4 py-10 text-white">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-500/20">
                <Store className="h-6 w-6 text-primary-300" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold">{catalog.name}</h1>
                {catalog.description && (
                  <p className="mt-0.5 text-sm text-night-300">{catalog.description}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Banner blocks (after hero) */}
      {pageBlocks.filter((b) => b.type === 'banner').map((b) => renderBlock(b, slug))}

      {/* Content */}
      <div className="mx-auto max-w-3xl px-4 py-6" id="productos">
        {/* Categories block or chips */}
        {cats.length > 0 && (
          <div className="mb-6">
            <CategoryChips
              categories={cats}
              catalogSlug={slug}
              activeCategorySlug={cat}
            />
          </div>
        )}

        {/* Featured products block */}
        {hasFeaturedBlock &&
          pageBlocks
            .filter((b) => b.type === 'featured')
            .map((b) => {
              const featured = allProducts.slice(0, (b.config as { maxProducts: number }).maxProducts)
              return (
                <div key={b.id} className="mb-8">
                  <h2 className="mb-3 text-lg font-extrabold text-night-800">
                    {(b.config as { title: string }).title}
                  </h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {featured.map((p) => (
                      <ProductCard key={p.id} product={p} currency={catalog.currency} catalogSlug={slug} />
                    ))}
                  </div>
                </div>
              )
            })}

        {/* Products grid */}
        {products.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Store className="h-12 w-12 text-warm-300" />
            <p className="text-night-400">
              {q ? `Sin resultados para "${q}"` : 'No hay productos disponibles aún.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                currency={catalog.currency}
                catalogSlug={slug}
              />
            ))}
          </div>
        )}
      </div>

      {/* CTA + Social blocks */}
      {pageBlocks.filter((b) => b.type === 'cta' || b.type === 'social').map((b) => renderBlock(b, slug))}
      </>
      )}

      {/* Cart FAB */}
      <CartFab slug={slug} currency={catalog.currency} />

      {/* Footer brand */}
      <footer className="pb-6 pt-2 text-center text-xs text-night-300">
        Creado con <span className="font-semibold text-primary-500">WaStore</span>
      </footer>
    </div>
  )
}
