'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface CarouselItem {
  id: string
  image: string
  title: string
  description: string
  link?: string
}

interface CarouselPreviewProps {
  items: CarouselItem[]
  autoplay: boolean
  autoplaySpeed: number
  showDots: boolean
  showArrows: boolean
  height: 'sm' | 'md' | 'lg' | 'xl'
  transition: 'slide' | 'fade'
}

export default function CarouselPreview({
  items,
  autoplay,
  autoplaySpeed,
  showDots,
  showArrows,
  height,
  transition,
}: CarouselPreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const heightMap = {
    sm: '250px',
    md: '400px',
    lg: '500px',
    xl: '600px',
  }

  useEffect(() => {
    if (!autoplay || items.length === 0) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length)
    }, autoplaySpeed * 1000)

    return () => clearInterval(interval)
  }, [autoplay, autoplaySpeed, items.length])

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length)
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length)
  }

  if (items.length === 0) {
    return (
      <div
        className="bg-gray-200 flex items-center justify-center"
        style={{ height: heightMap[height] }}
      >
        <div className="text-center">
          <p className="text-gray-600 text-sm">No hay slides en el carrusel</p>
        </div>
      </div>
    )
  }

  const currentItem = items[currentIndex]

  return (
    <div className="relative w-full overflow-hidden" style={{ height: heightMap[height] }}>
      {/* Slides */}
      {items.map((item, index) => (
        <div
          key={item.id}
          className={`absolute inset-0 w-full h-full transition-all duration-500 ${
            transition === 'fade' ? 'opacity' : 'transform'
          }`}
          style={{
            opacity: index === currentIndex ? 1 : 0,
            transform: transition === 'slide' && index === currentIndex ? 'translateX(0)' : 'translateX(100%)',
            zIndex: index === currentIndex ? 10 : 0,
          }}
        >
          {/* Imagen de fondo */}
          <img
            src={item.image}
            alt={item.title}
            className="w-full h-full object-cover"
          />

          {/* Overlay y contenido */}
          <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center">
            <div className="text-center text-white px-4">
              <h3 className="text-2xl md:text-4xl font-bold mb-3">{item.title}</h3>
              <p className="text-sm md:text-base max-w-lg">{item.description}</p>
              {item.link && (
                <a
                  href={item.link}
                  className="inline-block mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium text-sm"
                >
                  Ver más
                </a>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Flechas de navegación */}
      {showArrows && items.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 bg-white/80 hover:bg-white rounded-full transition"
          >
            <ChevronLeft className="w-6 h-6 text-gray-800" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 bg-white/80 hover:bg-white rounded-full transition"
          >
            <ChevronRight className="w-6 h-6 text-gray-800" />
          </button>
        </>
      )}

      {/* Puntos de navegación */}
      {showDots && items.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition ${
                index === currentIndex ? 'bg-white' : 'bg-white/50 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
