'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Star } from 'lucide-react'

interface TestimonialItem {
  id: string
  name: string
  role: string
  company: string
  text: string
  rating: number
  avatar?: string
}

interface SocialProofPreviewProps {
  title: string
  subtitle: string
  items: TestimonialItem[]
  layout: 'carousel' | 'grid' | 'list'
  columns: 1 | 2 | 3
  bgColor: string
  textColor: string
  ratingColor: string
  showRating: boolean
  showAvatar: boolean
  showRole: boolean
  padding: 'sm' | 'md' | 'lg' | 'xl'
}

export default function SocialProofPreview({
  title,
  subtitle,
  items,
  layout,
  columns,
  bgColor,
  textColor,
  ratingColor,
  showRating,
  showAvatar,
  showRole,
  padding,
}: SocialProofPreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [autoplayInterval, setAutoplayInterval] = useState<NodeJS.Timeout | null>(null)

  const paddingMap = {
    sm: '20px',
    md: '40px',
    lg: '60px',
    xl: '80px',
  }

  const columnMap = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
  }

  // Autoplay carousel
  useEffect(() => {
    if (layout === 'carousel' && items.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % items.length)
      }, 5000)
      setAutoplayInterval(interval)
      return () => clearInterval(interval)
    }
  }, [layout, items.length])

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length)
    if (autoplayInterval) clearInterval(autoplayInterval)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length)
    if (autoplayInterval) clearInterval(autoplayInterval)
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className="w-4 h-4"
            fill={star <= rating ? ratingColor : '#e5e7eb'}
            color={star <= rating ? ratingColor : '#d1d5db'}
          />
        ))}
      </div>
    )
  }

  const TestimonialCard = ({ item }: { item: TestimonialItem }) => (
    <div
      className="rounded-lg p-4 border border-gray-200 bg-white h-full flex flex-col"
      style={{ borderColor: `${textColor}20` }}
    >
      {/* Avatar and Info */}
      {(showAvatar || showRole) && (
        <div className="flex gap-3 mb-3">
          {showAvatar && item.avatar && (
            <img
              src={item.avatar}
              alt={item.name}
              className="w-12 h-12 rounded-full flex-shrink-0 object-cover"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm" style={{ color: textColor }}>
              {item.name}
            </p>
            {showRole && (
              <p className="text-xs text-gray-600">
                {item.role} • {item.company}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Rating */}
      {showRating && <div className="mb-3">{renderStars(item.rating)}</div>}

      {/* Text */}
      <p className="text-sm flex-1 line-clamp-4" style={{ color: textColor }}>
        "{item.text}"
      </p>
    </div>
  )

  return (
    <div
      className="w-full"
      style={{
        backgroundColor: bgColor,
        padding: paddingMap[padding],
      }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        {(title || subtitle) && (
          <div className="text-center mb-8">
            {title && (
              <h2 className="text-3xl font-bold mb-2" style={{ color: textColor }}>
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-lg" style={{ color: textColor, opacity: 0.8 }}>
                {subtitle}
              </p>
            )}
          </div>
        )}

        {/* Content */}
        {items.length === 0 ? (
          <div className="text-center py-12" style={{ color: textColor }}>
            <p>No hay testimonios para mostrar</p>
          </div>
        ) : layout === 'carousel' ? (
          /* Carousel Layout */
          <div className="relative">
            <div className="overflow-hidden rounded-lg">
              <div className="relative h-80">
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    className="absolute inset-0 transition-opacity duration-500"
                    style={{
                      opacity: index === currentIndex ? 1 : 0,
                      pointerEvents: index === currentIndex ? 'auto' : 'none',
                    }}
                  >
                    <div className="h-full bg-white rounded-lg p-8 flex flex-col justify-center">
                      {showAvatar && item.avatar && (
                        <img
                          src={item.avatar}
                          alt={item.name}
                          className="w-16 h-16 rounded-full mx-auto mb-4 object-cover"
                        />
                      )}
                      <p className="text-lg italic text-center mb-4" style={{ color: textColor }}>
                        "{item.text}"
                      </p>
                      {showRating && <div className="flex justify-center mb-4">{renderStars(item.rating)}</div>}
                      <p className="font-semibold text-center" style={{ color: textColor }}>
                        {item.name}
                      </p>
                      {showRole && (
                        <p className="text-sm text-gray-600 text-center">
                          {item.role} • {item.company}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation */}
            {items.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white shadow-lg hover:bg-gray-100"
                  aria-label="Anterior"
                >
                  <ChevronLeft className="w-5 h-5" style={{ color: textColor }} />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white shadow-lg hover:bg-gray-100"
                  aria-label="Siguiente"
                >
                  <ChevronRight className="w-5 h-5" style={{ color: textColor }} />
                </button>

                {/* Dots */}
                <div className="flex justify-center gap-2 mt-4">
                  {items.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentIndex(index)}
                      className="w-2 h-2 rounded-full transition-all"
                      style={{
                        backgroundColor: index === currentIndex ? textColor : `${textColor}40`,
                      }}
                      aria-label={`Ir a testimonial ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : layout === 'grid' ? (
          /* Grid Layout */
          <div className={`grid ${columnMap[columns]} gap-4`}>
            {items.map((item) => (
              <TestimonialCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          /* List Layout */
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex gap-4">
                  {showAvatar && item.avatar && (
                    <img
                      src={item.avatar}
                      alt={item.name}
                      className="w-16 h-16 rounded-full flex-shrink-0 object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold" style={{ color: textColor }}>
                          {item.name}
                        </p>
                        {showRole && (
                          <p className="text-sm text-gray-600">
                            {item.role} • {item.company}
                          </p>
                        )}
                      </div>
                      {showRating && renderStars(item.rating)}
                    </div>
                    <p className="text-sm" style={{ color: textColor }}>
                      {item.text}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
