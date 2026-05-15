'use client'

interface Block {
  id: string
  visible: boolean
  type: 'presentation' | 'catalog' | 'cart' | 'text'
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
}

interface PreviewPanelProps {
  blocks: Block[]
  theme: ThemeState
  previewMode: 'desktop' | 'mobile'
  catalogSlug: string
}

export default function PreviewPanel({ blocks, theme, previewMode, catalogSlug }: PreviewPanelProps) {
  const borderRadiusMap = {
    none: '0px',
    sm: '8px',
    full: '9999px',
  }

  const bgStyle = {
    backgroundColor: theme.bgType === 'color' ? theme.bgColor : 'white',
    backgroundImage: theme.bgType === 'image' ? `url(${theme.bgImage})` : 'none',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    fontFamily: theme.font,
  }

  const visibleBlocks = blocks.filter((b) => b.visible)

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
      <div style={bgStyle} className="w-full min-h-screen">
        {visibleBlocks.map((block) => {
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
                <div className="relative z-10 text-center px-4">
                  <h1 className="text-4xl font-bold mb-2" style={{ color: block.textColor }}>
                    {block.title}
                  </h1>
                  <p className="text-lg mb-4" style={{ color: block.textColor }}>
                    {block.subtitle}
                  </p>
                  {block.showCta && (
                    <button
                      className="px-6 py-2 rounded text-white"
                      style={{ backgroundColor: theme.primaryColor }}
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
              <div key={block.id} className="bg-white px-4 py-8">
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
                        <div className="flex gap-2">
                          <button className="px-3 py-1 rounded-full text-sm" style={{ backgroundColor: theme.primaryColor, color: 'white' }}>
                            Todos
                          </button>
                          <button className="px-3 py-1 rounded-full text-sm bg-gray-100">
                            Categoría 1
                          </button>
                          <button className="px-3 py-1 rounded-full text-sm bg-gray-100">
                            Categoría 2
                          </button>
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
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="border rounded-lg overflow-hidden flex flex-col">
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
                              <button className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 w-full">
                                Agregar al carrito
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          }

          if (block.type === 'cart') {
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

            return (
              <div key={block.id} className="relative">
                {/* Cart Button */}
                <div
                  className={`fixed ${positionMap[block.position]} ${sizeMap[block.size]} rounded-full flex items-center justify-center cursor-pointer group`}
                  style={{
                    backgroundColor: block.useCustomColors ? block.bgColor : theme.primaryColor,
                    color: block.useCustomColors ? block.iconColor : 'white',
                  }}
                >
                  🛒
                  {block.showItemCount && (
                    <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                      3
                    </div>
                  )}
                  {block.showTotalPrice && (
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      Total: $59.97
                    </div>
                  )}

                  {/* Preview Popup - Always visible in editor for preview purposes */}
                  {block.showPreviewFirst && (
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-80 z-50">
                      <p className="text-xs font-semibold text-gray-900 mb-3">Resumen del Carrito</p>
                      <div className="space-y-2 text-xs">
                        <div className="grid grid-cols-2 gap-2 text-gray-700">
                          <span className="truncate">Producto 1</span>
                          <span className="text-right font-medium text-gray-900">$19.99</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-gray-700">
                          <span className="truncate">Producto 2</span>
                          <span className="text-right font-medium text-gray-900">$19.99</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-gray-700">
                          <span className="truncate">Producto 3</span>
                          <span className="text-right font-medium text-gray-900">$19.99</span>
                        </div>
                        <div className="border-t border-gray-300 pt-2 mt-2 grid grid-cols-2 gap-2 font-semibold text-gray-900">
                          <span>Total:</span>
                          <span className="text-right">$59.97</span>
                        </div>
                      </div>
                    </div>
                  )}
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

          return null
        })}
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
