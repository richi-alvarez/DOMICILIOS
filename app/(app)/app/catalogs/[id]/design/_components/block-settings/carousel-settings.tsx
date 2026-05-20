'use client'

import { Plus, Trash2, Image as ImageIcon } from 'lucide-react'
import { useState } from 'react'

interface CarouselItem {
  id: string
  image: string
  title: string
  description: string
  link?: string
}

interface CarouselBlock {
  id: string
  visible: boolean
  type: 'carousel'
  items: CarouselItem[]
  autoplay: boolean
  autoplaySpeed: number
  showDots: boolean
  showArrows: boolean
  height: 'sm' | 'md' | 'lg' | 'xl'
  transition: 'slide' | 'fade'
}

interface CarouselSettingsProps {
  block: CarouselBlock
  onChange: (partial: Partial<CarouselBlock>) => void
}

export default function CarouselSettings({ block, onChange }: CarouselSettingsProps) {
  const [editingItemId, setEditingItemId] = useState<string | null>(null)

  const addItem = () => {
    const newItem: CarouselItem = {
      id: `item-${Date.now()}`,
      image: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=800&h=400&fit=crop',
      title: `Slide ${block.items.length + 1}`,
      description: 'Descripción del slide',
      link: '',
    }
    onChange({ items: [...block.items, newItem] })
  }

  const updateItem = (itemId: string, updates: Partial<CarouselItem>) => {
    onChange({
      items: block.items.map((item) =>
        item.id === itemId ? { ...item, ...updates } : item
      ),
    })
  }

  const deleteItem = (itemId: string) => {
    onChange({
      items: block.items.filter((item) => item.id !== itemId),
    })
  }

  const heightMap = {
    sm: '250px',
    md: '400px',
    lg: '500px',
    xl: '600px',
  }

  return (
    <div className="space-y-6">
      {/* Opciones generales */}
      <div className="border-b border-gray-200 pb-4">
        <h3 className="font-semibold text-sm mb-4">Configuración General</h3>

        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Altura */}
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-2">Altura</label>
            <select
              value={block.height}
              onChange={(e) => onChange({ height: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="sm">Pequeña (250px)</option>
              <option value="md">Mediana (400px)</option>
              <option value="lg">Grande (500px)</option>
              <option value="xl">Extra Grande (600px)</option>
            </select>
          </div>

          {/* Transición */}
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-2">Transición</label>
            <select
              value={block.transition}
              onChange={(e) => onChange({ transition: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="slide">Desliz</option>
              <option value="fade">Desvanecimiento</option>
            </select>
          </div>
        </div>

        {/* Autoplay */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={block.autoplay}
              onChange={(e) => onChange({ autoplay: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300"
            />
            <span className="text-sm font-medium">Reproducción automática</span>
          </label>

          {block.autoplay && (
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-2">
                Velocidad (segundos)
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={block.autoplaySpeed}
                onChange={(e) => onChange({ autoplaySpeed: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        {/* Opciones visuales */}
        <div className="space-y-3 mt-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={block.showDots}
              onChange={(e) => onChange({ showDots: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300"
            />
            <span className="text-sm font-medium">Mostrar puntos de navegación</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={block.showArrows}
              onChange={(e) => onChange({ showArrows: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300"
            />
            <span className="text-sm font-medium">Mostrar flechas de navegación</span>
          </label>
        </div>
      </div>

      {/* Items del carousel */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm">Slides ({block.items.length})</h3>
          <button
            onClick={addItem}
            className="flex items-center gap-2 px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            <Plus className="w-3 h-3" />
            Agregar Slide
          </button>
        </div>

        <div className="space-y-3">
          {block.items.map((item, index) => (
            <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Cabecera */}
              <div
                className="bg-gray-50 p-3 flex items-center justify-between cursor-pointer hover:bg-gray-100"
                onClick={() =>
                  setEditingItemId(editingItemId === item.id ? null : item.id)
                }
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">
                      #{index + 1} - {item.title || 'Sin título'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{item.description}</p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteItem(item.id)
                  }}
                  className="p-2 hover:bg-red-100 rounded text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Formulario de edición */}
              {editingItemId === item.id && (
                <div className="p-4 bg-white border-t border-gray-200 space-y-4">
                  {/* Imagen */}
                  <div>
                    <label className="text-xs font-medium text-gray-700 block mb-2">
                      URL de Imagen
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={item.image}
                        onChange={(e) => updateItem(item.id, { image: e.target.value })}
                        placeholder="https://..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                        <ImageIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Título */}
                  <div>
                    <label className="text-xs font-medium text-gray-700 block mb-2">
                      Título
                    </label>
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => updateItem(item.id, { title: e.target.value })}
                      placeholder="Título del slide"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Descripción */}
                  <div>
                    <label className="text-xs font-medium text-gray-700 block mb-2">
                      Descripción
                    </label>
                    <textarea
                      value={item.description}
                      onChange={(e) => updateItem(item.id, { description: e.target.value })}
                      placeholder="Descripción del slide"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={3}
                    />
                  </div>

                  {/* Link */}
                  <div>
                    <label className="text-xs font-medium text-gray-700 block mb-2">
                      Link (Opcional)
                    </label>
                    <input
                      type="url"
                      value={item.link || ''}
                      onChange={(e) => updateItem(item.id, { link: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {block.items.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm mb-3">No hay slides agregados</p>
            <button
              onClick={addItem}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Agregar primer Slide
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
