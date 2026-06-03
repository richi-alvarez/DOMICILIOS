'use client'

import { useState, useCallback } from 'react'
import CarouselPreview from '@/components/blocks/carousel-preview'
import BenefitsPreview from '@/components/blocks/benefits-preview'
import SocialProofPreview from '@/components/blocks/socialproof-preview'
import CTAReinforcementPreview from '@/components/blocks/cta-reinforcement-preview'
import FooterPreview from '@/components/blocks/footer-preview'

interface Block {
  id: string
  visible: boolean
  type: 'presentation' | 'catalog' | 'cart' | 'text' | 'carousel' | 'benefits' | 'socialproof' | 'cta-reinforcement' | 'footer'
  [key: string]: any
}

interface ThemeState {
  selectedPalette: string | null
  primaryColor: string
  secondaryColor: string
  tertiaryColor: string
  font: string
  borderRadius: 'none' | 'sm' | 'full'
  bgType: 'color' | 'image' | 'video'
  bgColor: string
  bgImage: string | null
  bgVideoUrl: string
  buttonPrimaryColor: string
  buttonSecondaryColor: string
  buttonTertiaryColor: string
  categoryPrimaryColor: string
  categorySecondaryColor: string
  categoryTertiaryColor: string
  cartPrimaryColor: string
  cartSecondaryColor: string
  cartTertiaryColor: string
}

interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  compareAt: number | null
  stock: number | null
  categoryId: string | null
  images: { url: string }[]
  variants: any[]
}

interface Category {
  id: string
  name: string
}

interface PreviewPanelProps {
  blocks: Block[]
  theme: ThemeState
  previewMode: 'desktop' | 'mobile'
  catalogSlug: string
  products?: Product[]
  categories?: Category[]
}

export default function PreviewPanel({ blocks, theme, previewMode, catalogSlug, products = [], categories = [] }: PreviewPanelProps) {
  const [cartItems, setCartItems] = useState<Set<string>>(new Set())
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const handleAddToCart = useCallback((productId: string) => {
    setCartItems(prev => {
      const newCart = new Set(prev)
      if (newCart.has(productId)) {
        newCart.delete(productId)
      } else {
        newCart.add(productId)
      }
      return newCart
    })
  }, [])

  const handleSelectCategory = useCallback((categoryId: string | null) => {
    setSelectedCategory(categoryId)
  }, [])

  const borderRadiusMap = {
    none: '0px',
    sm: '8px',
    full: '9999px',
  }

  const borderRadiusClass = {
    none: '',
    sm: 'rounded-lg',
    full: 'rounded-full',
  }

  const textAlignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }

  const bgStyle = {
    backgroundColor: theme.bgType === 'color' ? theme.bgColor : 'white',
    backgroundImage: theme.bgType === 'image' ? `url(${theme.bgImage})` : 'none',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    fontFamily: theme.font,
  }

  const filteredProducts = selectedCategory
    ? products.filter(p => p.categoryId === selectedCategory)
    : products

  const visibleBlocks = blocks.filter((b) => b.visible)
  const cartBlock = visibleBlocks.find((b) => b.type === 'cart')
  const contentBlocks = visibleBlocks.filter((b) => b.type !== 'cart')

  const previewContent = (
    <div className="w-full">
      {/* URL Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>🌐</span>
          <span>https://domicilios.app/s/{catalogSlug}</span>
        </div>
      </div>

      {/* Content */}
      <div style={bgStyle} className="w-full min-h-screen relative">
        {contentBlocks.map((block) => {
          if (block.type === 'presentation') {
            return (
              <div
                key={block.id}
                className="relative w-full overflow-hidden flex items-center justify-center"
                style={{
                  backgroundImage: block.bgType === 'image' ? `url(${block.bgImage})` : 'none',
                  backgroundColor: block.bgType === 'color' ? block.bgColor : 'transparent',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  minHeight: block.sectionSize === 'sm' ? '300px' : block.sectionSize === 'md' ? '400px' : block.sectionSize === 'lg' ? '500px' : '600px',
                  height: block.fullHeight ? '100vh' : 'auto',
                }}
              >
                {/* Video Background */}
                {block.bgType === 'video' && block.bgVideoUrl && (
                  <>
                    {/* YouTube Embed */}
                    {block.bgVideoUrl.includes('youtube.com') || block.bgVideoUrl.includes('youtu.be') ? (
                      (() => {
                        let videoId = ''
                        if (block.bgVideoUrl.includes('watch?v=')) {
                          videoId = block.bgVideoUrl.split('v=')[1]?.split('&')[0] || ''
                        } else if (block.bgVideoUrl.includes('youtu.be/')) {
                          videoId = block.bgVideoUrl.split('youtu.be/')[1]?.split('?')[0] || ''
                        }
                        return videoId ? (
                          <iframe
                            className="absolute inset-0 w-full h-full"
                            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&controls=0&playlist=${videoId}`}
                            allow="autoplay; encrypted-media"
                            allowFullScreen={false}
                          />
                        ) : (
                          <div className="absolute inset-0 w-full h-full bg-gray-300 flex items-center justify-center text-gray-600">
                            URL de YouTube inválida
                          </div>
                        )
                      })()
                    ) : block.bgVideoUrl.includes('vimeo.com') ? (
                      (() => {
                        const videoId = block.bgVideoUrl.split('/').pop() || ''
                        return (
                          <iframe
                            className="absolute inset-0 w-full h-full"
                            src={`https://player.vimeo.com/video/${videoId}?autoplay=1&loop=1&muted=1&background=1`}
                            allow="autoplay; encrypted-media"
                            allowFullScreen={false}
                          />
                        )
                      })()
                    ) : (
                      /* Direct video file */
                      <video
                        className="absolute inset-0 w-full h-full object-cover"
                        autoPlay
                        loop
                        muted
                        playsInline
                      >
                        <source src={block.bgVideoUrl} type="video/mp4" />
                        Tu navegador no soporta videos
                      </video>
                    )}
                  </>
                )}

                {/* Image Overlay */}
                {block.bgType === 'image' && (
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundColor: block.overlayType === 'dark' ? `rgba(0, 0, 0, ${block.overlayOpacity / 100})` : `rgba(255, 255, 255, ${block.overlayOpacity / 100})`,
                    }}
                  />
                )}
                <div className={`relative z-10 px-4 ${textAlignClass[block.textAlign] || 'text-center'}`}>
                  <h1 className="text-4xl font-bold mb-2" style={{ color: block.textColor }}>
                    {block.title}
                  </h1>
                  <p className="text-lg mb-4" style={{ color: block.textColor }}>
                    {block.subtitle}
                  </p>
                  {block.showCta && (
                    <button
                      onClick={() => {
                        const productosSection = document.getElementById('productos')
                        if (productosSection) {
                          // Find the scrollable parent container
                          let scrollParent = productosSection.parentElement
                          while (scrollParent) {
                            const style = window.getComputedStyle(scrollParent)
                            if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
                              break
                            }
                            scrollParent = scrollParent.parentElement
                          }

                          // Scroll the appropriate element
                          if (scrollParent && (scrollParent.scrollHeight > scrollParent.clientHeight)) {
                            scrollParent.scrollTo({
                              top: productosSection.offsetTop - scrollParent.offsetTop,
                              behavior: 'smooth'
                            })
                          } else {
                            // Fallback to scrollIntoView
                            productosSection.scrollIntoView({ behavior: 'smooth' })
                          }
                        }
                      }}
                      className={`px-6 py-2 text-white cursor-pointer transition-all hover:opacity-90 ${borderRadiusClass[theme.borderRadius]}`}
                      style={{ backgroundColor: theme.buttonPrimaryColor }}
                    >
                      {block.ctaText}
                    </button>
                  )}
                </div>
              </div>
            )
          }

          if (block.type === 'catalog') {
            return (
              <div key={block.id} id="productos" className="bg-white px-4 py-8">
                <div className="max-w-6xl mx-auto">
                  {/* Filters and Search Section */}
                  <div className="mb-6 space-y-4">
                    {/* Search Bar */}
                    {block.showSearch && (
                      <div className="flex">
                        <input
                          type="text"
                          placeholder="🔍 Buscar productos..."
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm"
                          disabled
                        />
                      </div>
                    )}

                    {/* Category Filter + Sort Filter */}
                    <div className="flex gap-4 items-center flex-wrap">
                      {/* Category Filter */}
                      {block.showCategoryFilter && (
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => handleSelectCategory(null)}
                            className={`px-3 py-1 text-sm transition-all ${borderRadiusClass[theme.borderRadius]} ${selectedCategory === null ? 'opacity-100 scale-100' : 'opacity-70'}`}
                            style={{ backgroundColor: selectedCategory === null ? theme.categoryPrimaryColor : '#e5e7eb', color: selectedCategory === null ? 'white' : '#4b5563' }}
                          >
                            Todos
                          </button>
                          {categories.length > 0 ? (
                            categories.map((cat) => (
                              <button
                                key={cat.id}
                                onClick={() => handleSelectCategory(cat.id)}
                                className={`px-3 py-1 text-sm transition-all ${borderRadiusClass[theme.borderRadius]} ${selectedCategory === cat.id ? 'opacity-100 scale-100' : 'opacity-70'}`}
                                style={{ backgroundColor: selectedCategory === cat.id ? theme.categoryPrimaryColor : '#e5e7eb', color: selectedCategory === cat.id ? 'white' : '#4b5563' }}
                              >
                                {cat.name}
                              </button>
                            ))
                          ) : (
                            <>
                              <button
                                onClick={() => handleSelectCategory('cat1')}
                                className={`px-3 py-1 text-sm transition-all ${borderRadiusClass[theme.borderRadius]} ${selectedCategory === 'cat1' ? 'opacity-100 scale-100' : 'opacity-70'}`}
                                style={{ backgroundColor: selectedCategory === 'cat1' ? theme.categoryPrimaryColor : '#e5e7eb', color: selectedCategory === 'cat1' ? 'white' : '#4b5563' }}
                              >
                                Categoría 1
                              </button>
                              <button
                                onClick={() => handleSelectCategory('cat2')}
                                className={`px-3 py-1 text-sm transition-all ${borderRadiusClass[theme.borderRadius]} ${selectedCategory === 'cat2' ? 'opacity-100 scale-100' : 'opacity-70'}`}
                                style={{ backgroundColor: selectedCategory === 'cat2' ? theme.categoryPrimaryColor : '#e5e7eb', color: selectedCategory === 'cat2' ? 'white' : '#4b5563' }}
                              >
                                Categoría 2
                              </button>
                            </>
                          )}
                        </div>
                      )}

                      {/* Sort Filter */}
                      {block.showSortFilter && (
                        <select className="px-3 py-1 rounded border border-gray-300 text-sm bg-white" disabled>
                          <option>Ordenar por: Relevancia</option>
                          <option>Precio (menor a mayor)</option>
                          <option>Precio (mayor a menor)</option>
                          <option>Más recientes</option>
                          <option>Más populares</option>
                        </select>
                      )}

                      {/* Price Filter */}
                      {block.showPriceFilter && (
                        <div className="flex items-center gap-2 text-xs">
                          <label>Precio:</label>
                          <input type="number" placeholder="Mín" className="w-16 px-2 py-1 border border-gray-300 rounded" disabled />
                          <span>-</span>
                          <input type="number" placeholder="Máx" className="w-16 px-2 py-1 border border-gray-300 rounded" disabled />
                        </div>
                      )}

                      {/* Availability Filter */}
                      {block.showAvailabilityFilter && (
                        <label className="flex items-center gap-2 text-xs cursor-pointer">
                          <input type="checkbox" disabled />
                          <span>En stock</span>
                        </label>
                      )}

                      {/* Rating Filter */}
                      {block.showRatingFilter && (
                        <select className="px-3 py-1 rounded border border-gray-300 text-sm bg-white" disabled>
                          <option>Calificación: Todas</option>
                          <option>⭐⭐⭐⭐⭐ (5 estrellas)</option>
                          <option>⭐⭐⭐⭐ (4+ estrellas)</option>
                          <option>⭐⭐⭐ (3+ estrellas)</option>
                        </select>
                      )}

                      {/* Brand Filter */}
                      {block.showBrandFilter && (
                        <div className="flex gap-2 text-xs">
                          <label className="flex items-center gap-1">
                            <input type="checkbox" disabled />
                            <span>Marca A</span>
                          </label>
                          <label className="flex items-center gap-1">
                            <input type="checkbox" disabled />
                            <span>Marca B</span>
                          </label>
                        </div>
                      )}

                      {/* Discount Filter */}
                      {block.showDiscountFilter && (
                        <label className="flex items-center gap-2 text-xs cursor-pointer">
                          <input type="checkbox" disabled />
                          <span>Con descuento</span>
                        </label>
                      )}
                    </div>
                  </div>

                  <div className={`grid gap-4 ${block.template === 'list' ? 'grid-cols-1' : block.template === 'grid' ? 'grid-cols-3' : 'grid-cols-2'}`}>
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map((product) => (
                        <div key={product.id} className={`border overflow-hidden flex flex-col ${borderRadiusClass[theme.borderRadius]}`}>
                          {product.images && product.images.length > 0 ? (
                            <img src={product.images[0].url} alt={product.name} className="w-full h-40 object-cover bg-gray-200" />
                          ) : (
                            <div className="bg-gray-200 h-40" />
                          )}
                          <div className="p-3 flex flex-col flex-1">
                            {block.showTitle && <p className="font-semibold text-sm">{product.name}</p>}
                            {block.showDescription && product.description && <p className="text-xs text-gray-600 mt-1">{product.description}</p>}
                            {block.showPrice && <p className="font-bold text-sm mt-2">${product.price.toLocaleString('es-CO')}</p>}

                            <div className="mt-auto flex flex-col gap-2">
                              {block.showExternalLink && (
                                <a href="#" className="text-xs text-blue-600 hover:underline">
                                  Ver más →
                                </a>
                              )}
                              {block.enableCart && (
                                <button
                                  onClick={() => handleAddToCart(product.id)}
                                  className={`text-xs text-white px-2 py-1 w-full cursor-pointer transition-all ${borderRadiusClass[theme.borderRadius]} ${cartItems.has(product.id) ? 'opacity-75 scale-95' : 'hover:opacity-90'}`}
                                  style={{ backgroundColor: theme.buttonPrimaryColor }}
                                >
                                  {cartItems.has(product.id) ? '✓ Agregado' : 'Agregar al carrito'}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      [1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className={`border overflow-hidden flex flex-col ${borderRadiusClass[theme.borderRadius]}`}>
                          <div className="bg-gray-200 h-40" />
                          <div className="p-3 flex flex-col flex-1">
                            {block.showTitle && <p className="font-semibold text-sm">Producto {i}</p>}
                            {block.showDescription && <p className="text-xs text-gray-600 mt-1">Descripción del producto</p>}
                            {block.showPrice && <p className="font-bold text-sm mt-2">$19.99</p>}

                            <div className="mt-auto flex flex-col gap-2">
                              {block.showExternalLink && (
                                <a href="#" className="text-xs text-blue-600 hover:underline">
                                  Ver más →
                                </a>
                              )}
                              {block.enableCart && (
                                <button
                                  onClick={() => handleAddToCart(`mock-${i}`)}
                                  className={`text-xs text-white px-2 py-1 w-full cursor-pointer transition-all ${borderRadiusClass[theme.borderRadius]} ${cartItems.has(`mock-${i}`) ? 'opacity-75 scale-95' : 'hover:opacity-90'}`}
                                  style={{ backgroundColor: theme.buttonPrimaryColor }}
                                >
                                  {cartItems.has(`mock-${i}`) ? '✓ Agregado' : 'Agregar al carrito'}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )
          }

          if (block.type === 'text') {
            const alignMap = {
              left: 'text-left',
              center: 'text-center',
              right: 'text-right',
              justify: 'text-justify',
            }

            return (
              <div key={block.id} className="bg-white px-4 py-8">
                <div
                  className={`max-w-2xl mx-auto ${alignMap[block.align]} ${block.bold ? 'font-bold' : ''} ${block.italic ? 'italic' : ''} ${block.underline ? 'underline' : ''} ${
                    block.fontSize === 'sm' ? 'text-sm' : block.fontSize === 'md' ? 'text-base' : 'text-lg'
                  }`}
                >
                  {block.content || 'Tu contenido de texto aparecerá aquí...'}
                </div>
              </div>
            )
          }

          if (block.type === 'carousel') {
            return (
              <div key={block.id} className="bg-white">
                <CarouselPreview
                  items={block.items || []}
                  autoplay={block.autoplay}
                  autoplaySpeed={block.autoplaySpeed}
                  showDots={block.showDots}
                  showArrows={block.showArrows}
                  height={block.height}
                  transition={block.transition}
                />
              </div>
            )
          }

          if (block.type === 'benefits') {
            return (
              <div key={block.id}>
                <BenefitsPreview
                  title={block.title}
                  subtitle={block.subtitle}
                  items={block.items || []}
                  columns={block.columns}
                  bgColor={block.bgColor}
                  textColor={block.textColor}
                  iconColor={block.iconColor}
                  iconSize={block.iconSize}
                  padding={block.padding}
                />
              </div>
            )
          }

          if (block.type === 'socialproof') {
            return (
              <div key={block.id}>
                <SocialProofPreview
                  title={block.title}
                  subtitle={block.subtitle}
                  items={block.items || []}
                  layout={block.layout}
                  columns={block.columns}
                  bgColor={block.bgColor}
                  textColor={block.textColor}
                  ratingColor={block.ratingColor}
                  showRating={block.showRating}
                  showAvatar={block.showAvatar}
                  showRole={block.showRole}
                  padding={block.padding}
                />
              </div>
            )
          }

          if (block.type === 'cta-reinforcement') {
            return (
              <div key={block.id}>
                <CTAReinforcementPreview
                  title={block.title}
                  subtitle={block.subtitle}
                  buttonText={block.buttonText}
                  buttonAction={block.buttonAction}
                  buttonUrl={block.buttonUrl}
                  buttonPhone={block.buttonPhone}
                  buttonEmail={block.buttonEmail}
                  scrollTarget={block.scrollTarget}
                  buttonColor={block.buttonColor}
                  textColor={block.textColor}
                  bgColor={block.bgColor}
                  fontSize={block.fontSize}
                  buttonSize={block.buttonSize}
                  alignment={block.alignment}
                  padding={block.padding}
                  showBorder={block.showBorder}
                  borderColor={block.borderColor}
                  borderWidth={block.borderWidth}
                />
              </div>
            )
          }

          if (block.type === 'footer') {
            return (
              <div key={block.id}>
                <FooterPreview
                  companyName={block.companyName}
                  companyDescription={block.companyDescription}
                  address={block.address}
                  phone={block.phone}
                  email={block.email}
                  website={block.website}
                  socialLinks={block.socialLinks || []}
                  copyrightText={block.copyrightText}
                  bgColor={block.bgColor}
                  textColor={block.textColor}
                  accentColor={block.accentColor}
                  layout={block.layout}
                  showSocialLinks={block.showSocialLinks}
                  showDescription={block.showDescription}
                  showAddress={block.showAddress}
                  showPhone={block.showPhone}
                  showEmail={block.showEmail}
                  showWebsite={block.showWebsite}
                  showCopyright={block.showCopyright}
                  showCompanyInfo={block.showCompanyInfo}
                  showContactInfo={block.showContactInfo}
                  alignment={block.alignment}
                />
              </div>
            )
          }

          return null
        })}

        {/* Cart - Rendered outside of content blocks to prevent scroll issues */}
        {cartBlock && (
          (() => {
            const positionMap: Record<string, string> = {
              'bottom-right': 'bottom-4 right-4',
              'bottom-left': 'bottom-4 left-4',
              'top-right': 'top-4 right-4',
              'top-left': 'top-4 left-4',
              'center-right': 'top-1/2 right-4 -translate-y-1/2',
              'center-left': 'top-1/2 left-4 -translate-y-1/2',
            }

            const sizeMap = {
              sm: 'w-12 h-12 text-lg',
              md: 'w-16 h-16 text-2xl',
              lg: 'w-20 h-20 text-3xl',
            }

            const animationMap = {
              'none': '',
              'pulse': 'animate-pulse',
              'bounce': 'animate-bounce',
              'scale': 'animate-scale',
            }

            const cartProductIds = Array.from(cartItems)
            const cartProducts = products.filter(p => cartProductIds.includes(p.id))
            const cartTotal = cartProducts.reduce((sum, p) => sum + p.price, 0)

            return (
              <div key={cartBlock.id} className="fixed pointer-events-none z-10" style={{ inset: 0 }}>
                {/* Cart Button */}
                <div
                  className={`fixed ${positionMap[cartBlock.position]} ${sizeMap[cartBlock.size]} ${animationMap[cartBlock.animation]} rounded-full flex items-center justify-center cursor-pointer group pointer-events-auto`}
                  style={{
                    backgroundColor: cartBlock.useCustomColors ? cartBlock.bgColor : theme.cartPrimaryColor,
                  }}
                >
                  <span style={{ color: cartBlock.useCustomColors ? cartBlock.iconColor : 'white' }}>
                    🛒
                  </span>
                  {cartBlock.showItemCount && (
                    <div
                      className="absolute -top-2 -right-2 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center"
                      style={{
                        backgroundColor: cartBlock.useCustomColors ? cartBlock.iconColor : '#ef4444',
                      }}
                    >
                      {cartItems.size}
                    </div>
                  )}
                  {cartBlock.showTotalPrice && (
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      Total: ${cartTotal.toLocaleString('es-CO')}
                    </div>
                  )}

                  {/* Preview Popup */}
                  {cartBlock.showPreviewFirst && (
                    <div className={`absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white border border-gray-300 shadow-lg p-4 w-80 z-50 ${borderRadiusClass[cartBlock.borderRadius] || 'rounded-lg'}`}>
                      <p className="text-xs font-semibold text-gray-900 mb-3">Resumen del Carrito</p>
                      <div className="space-y-2 text-xs">
                        {cartProducts.length > 0 ? (
                          <>
                            {cartProducts.map((product) => (
                              <div key={product.id} className="grid grid-cols-2 gap-2 text-gray-700">
                                <span className="truncate">{product.name}</span>
                                <span className="text-right font-medium text-gray-900">${product.price.toLocaleString('es-CO')}</span>
                              </div>
                            ))}
                            <div className="border-t border-gray-300 pt-2 mt-2 grid grid-cols-2 gap-2 font-semibold text-gray-900">
                              <span>Total:</span>
                              <span className="text-right">${cartTotal.toLocaleString('es-CO')}</span>
                            </div>
                          </>
                        ) : (
                          <div className="text-gray-500 py-4 text-center">
                            El carrito está vacío
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })()
        )}
      </div>
    </div>
  )

  if (previewMode === 'mobile') {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 p-4">
        <div className="relative bg-black rounded-[40px] border-[10px] border-gray-800 shadow-2xl overflow-hidden" style={{ width: '390px', height: '844px' }}>
          <div className="absolute inset-0 overflow-y-auto">{previewContent}</div>
        </div>
      </div>
    )
  }

  return <div className="overflow-y-auto h-full">{previewContent}</div>
}
