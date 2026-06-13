'use client'

import CarouselPreview from '@/components/blocks/carousel-preview'
import BenefitsPreview from '@/components/blocks/benefits-preview'
import SocialProofPreview from '@/components/blocks/socialproof-preview'
import CTAReinforcementPreview from '@/components/blocks/cta-reinforcement-preview'
import FooterPreview from '@/components/blocks/footer-preview'
import { ProductCard } from '@/components/storefront/product-card'
import { CategoryChips } from '@/components/storefront/category-chips'
import type { StorefrontProduct } from '@/lib/storefront/queries'

type Block = { id: string; type: string; config: Record<string, any> }

interface Props {
  blocks: Block[]
  products: StorefrontProduct[]
  categories: { id: string; name: string; slug: string }[]
  catalogSlug: string
  currency: string
  activeCategorySlug?: string
}

const minHeightMap: Record<string, string> = {
  sm: '300px',
  md: '400px',
  lg: '500px',
  xl: '600px',
}

export function StorefrontDesignBlocks({
  blocks,
  products,
  categories,
  catalogSlug,
  currency,
  activeCategorySlug,
}: Props) {
  // El carrito flotante (cart) lo maneja el CartFab del layout; aquí lo omitimos.
  const contentBlocks = blocks.filter((b) => b.type !== 'cart')

  return (
    <>
      {contentBlocks.map((block) => {
        const c = block.config || {}

        switch (block.type) {
          case 'presentation':
            return (
              <section
                key={block.id}
                className="relative w-full overflow-hidden flex items-center justify-center"
                style={{
                  backgroundImage: c.bgType === 'image' && c.bgImage ? `url(${c.bgImage})` : 'none',
                  backgroundColor: c.bgType === 'color' ? c.bgColor : 'transparent',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  minHeight: minHeightMap[c.sectionSize] || '400px',
                  height: c.fullHeight ? '100vh' : 'auto',
                }}
              >
                {c.bgType === 'image' && (
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundColor:
                        c.overlayType === 'dark'
                          ? `rgba(0,0,0,${(c.overlayOpacity ?? 40) / 100})`
                          : `rgba(255,255,255,${(c.overlayOpacity ?? 40) / 100})`,
                    }}
                  />
                )}
                <div
                  className={`relative z-10 px-4 ${
                    c.textAlign === 'left' ? 'text-left' : c.textAlign === 'right' ? 'text-right' : 'text-center'
                  }`}
                >
                  <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: c.textColor }}>
                    {c.title}
                  </h1>
                  {c.subtitle && (
                    <p className="text-base md:text-lg mb-4" style={{ color: c.textColor }}>
                      {c.subtitle}
                    </p>
                  )}
                  {c.showCta && c.ctaText && (
                    <a
                      href="#productos"
                      className="inline-block px-6 py-2 rounded-lg bg-primary-600 text-white font-medium transition hover:opacity-90"
                    >
                      {c.ctaText}
                    </a>
                  )}
                </div>
              </section>
            )

          case 'carousel':
            return (
              <div key={block.id}>
                <CarouselPreview
                  items={c.items || []}
                  autoplay={c.autoplay ?? true}
                  autoplaySpeed={c.autoplaySpeed ?? 5}
                  showDots={c.showDots ?? true}
                  showArrows={c.showArrows ?? true}
                  height={c.height || 'md'}
                  transition={c.transition || 'slide'}
                />
              </div>
            )

          case 'benefits':
            return (
              <BenefitsPreview
                key={block.id}
                title={c.title}
                subtitle={c.subtitle}
                items={c.items || []}
                columns={c.columns ?? 3}
                bgColor={c.bgColor}
                textColor={c.textColor}
                iconColor={c.iconColor}
                iconSize={c.iconSize || 'md'}
                padding={c.padding || 'lg'}
              />
            )

          case 'socialproof':
            return (
              <SocialProofPreview
                key={block.id}
                title={c.title}
                subtitle={c.subtitle}
                items={c.items || []}
                layout={c.layout || 'grid'}
                columns={c.columns ?? 3}
                bgColor={c.bgColor}
                textColor={c.textColor}
                ratingColor={c.ratingColor}
                showRating={c.showRating ?? true}
                showAvatar={c.showAvatar ?? true}
                showRole={c.showRole ?? true}
                padding={c.padding || 'lg'}
              />
            )

          case 'cta-reinforcement':
            return (
              <CTAReinforcementPreview
                key={block.id}
                title={c.title}
                subtitle={c.subtitle}
                buttonText={c.buttonText}
                buttonAction={c.buttonAction || 'url'}
                buttonUrl={c.buttonUrl || '#'}
                buttonPhone={c.buttonPhone || ''}
                buttonEmail={c.buttonEmail || ''}
                scrollTarget={c.scrollTarget || ''}
                buttonColor={c.buttonColor}
                textColor={c.textColor}
                bgColor={c.bgColor}
                fontSize={c.fontSize || 'md'}
                buttonSize={c.buttonSize || 'md'}
                alignment={c.alignment || 'center'}
                padding={c.padding || 'lg'}
                showBorder={c.showBorder ?? false}
                borderColor={c.borderColor}
                borderWidth={c.borderWidth || 'none'}
              />
            )

          case 'footer':
            return (
              <FooterPreview
                key={block.id}
                companyName={c.companyName}
                companyDescription={c.companyDescription}
                address={c.address}
                phone={c.phone}
                email={c.email}
                website={c.website}
                socialLinks={c.socialLinks || []}
                copyrightText={c.copyrightText}
                bgColor={c.bgColor}
                textColor={c.textColor}
                accentColor={c.accentColor}
                layout={c.layout || 'standard'}
                showSocialLinks={c.showSocialLinks ?? true}
                showDescription={c.showDescription ?? true}
                showAddress={c.showAddress ?? true}
                showPhone={c.showPhone ?? true}
                showEmail={c.showEmail ?? true}
                showWebsite={c.showWebsite ?? true}
                showCopyright={c.showCopyright ?? true}
                showCompanyInfo={c.showCompanyInfo ?? true}
                showContactInfo={c.showContactInfo ?? true}
                alignment={c.alignment || 'left'}
              />
            )

          case 'text': {
            const alignMap: Record<string, string> = {
              left: 'text-left',
              center: 'text-center',
              right: 'text-right',
              justify: 'text-justify',
            }
            return (
              <div key={block.id} className="px-4 py-8">
                <div
                  className={`mx-auto max-w-2xl ${alignMap[c.align] || 'text-left'} ${c.bold ? 'font-bold' : ''} ${
                    c.italic ? 'italic' : ''
                  } ${c.underline ? 'underline' : ''} ${
                    c.fontSize === 'sm' ? 'text-sm' : c.fontSize === 'lg' ? 'text-lg' : 'text-base'
                  }`}
                >
                  {c.content || ''}
                </div>
              </div>
            )
          }

          case 'catalog':
            return (
              <section key={block.id} id="productos" className="mx-auto max-w-3xl px-4 py-8">
                {c.showCategoryFilter !== false && categories.length > 0 && (
                  <div className="mb-6">
                    <CategoryChips
                      categories={categories}
                      catalogSlug={catalogSlug}
                      activeCategorySlug={activeCategorySlug}
                    />
                  </div>
                )}
                {products.length === 0 ? (
                  <p className="py-12 text-center text-night-400">No hay productos disponibles aún.</p>
                ) : (
                  <div
                    className={`grid gap-4 ${
                      c.template === 'list' ? 'grid-cols-1' : c.template === 'grid' ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'
                    }`}
                  >
                    {products.map((p) => (
                      <ProductCard
                        key={p.id}
                        product={p}
                        currency={currency}
                        catalogSlug={catalogSlug}
                        buttonType={c.buttonType === 'appointment' ? 'appointment' : 'cart'}
                      />
                    ))}
                  </div>
                )}
              </section>
            )

          default:
            return null
        }
      })}
    </>
  )
}
