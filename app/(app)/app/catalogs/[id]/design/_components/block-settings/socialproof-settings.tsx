'use client'

import { Plus, Trash2, Star } from 'lucide-react'
import { useState } from 'react'

interface TestimonialItem {
  id: string
  name: string
  role: string
  company: string
  text: string
  rating: number
  avatar?: string
}

interface SocialProofBlock {
  id: string
  visible: boolean
  type: 'socialproof'
  title: string
  subtitle: string
  layout: 'carousel' | 'grid' | 'list'
  items: TestimonialItem[]
  columns: 1 | 2 | 3
  showRating: boolean
  showAvatar: boolean
  showRole: boolean
  bgColor: string
  textColor: string
  ratingColor: string
  padding: 'sm' | 'md' | 'lg' | 'xl'
}

interface SocialProofSettingsProps {
  block: SocialProofBlock
  onChange: (partial: Partial<SocialProofBlock>) => void
}

export default function SocialProofSettings({ block, onChange }: SocialProofSettingsProps) {
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [ratingHover, setRatingHover] = useState<number>(0)

  const addItem = () => {
    const newItem: TestimonialItem = {
      id: `testimonial-${Date.now()}`,
      name: 'Nombre del Cliente',
      role: 'Posición',
      company: 'Empresa',
      text: 'Escriba el testimonial aquí...',
      rating: 5,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`,
    }
    onChange({ items: [...block.items, newItem] })
  }

  const updateItem = (itemId: string, updates: Partial<TestimonialItem>) => {
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

  const renderStars = (rating: number, onClick?: (r: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => onClick?.(star)}
            onMouseEnter={() => setRatingHover(star)}
            onMouseLeave={() => setRatingHover(0)}
            className="p-0 transition"
          >
            <Star
              className="w-5 h-5"
              fill={star <= (ratingHover || rating) ? '#fbbf24' : '#e5e7eb'}
              color={star <= (ratingHover || rating) ? '#fbbf24' : '#d1d5db'}
            />
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="border-b border-gray-200 pb-4">
        <h3 className="font-semibold text-sm mb-4">Contenido Principal</h3>

        <div className="space-y-4">
          {/* Título */}
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-2">Título</label>
            <input
              type="text"
              value={block.title}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder="Título de la sección"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Subtítulo */}
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-2">Subtítulo</label>
            <input
              type="text"
              value={block.subtitle}
              onChange={(e) => onChange({ subtitle: e.target.value })}
              placeholder="Subtítulo descriptivo"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Diseño */}
      <div className="border-b border-gray-200 pb-4">
        <h3 className="font-semibold text-sm mb-4">Diseño</h3>

        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Layout */}
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-2">Layout</label>
            <select
              value={block.layout}
              onChange={(e) => onChange({ layout: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="carousel">Carrusel</option>
              <option value="grid">Grid</option>
              <option value="list">Lista</option>
            </select>
          </div>

          {/* Columnas (solo para grid) */}
          {block.layout === 'grid' && (
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-2">Columnas</label>
              <select
                value={block.columns}
                onChange={(e) => onChange({ columns: parseInt(e.target.value) as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="1">1 columna</option>
                <option value="2">2 columnas</option>
                <option value="3">3 columnas</option>
              </select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Padding */}
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-2">Espaciado</label>
            <select
              value={block.padding}
              onChange={(e) => onChange({ padding: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="sm">Pequeño</option>
              <option value="md">Mediano</option>
              <option value="lg">Grande</option>
              <option value="xl">Extra Grande</option>
            </select>
          </div>

          {/* Color de fondo */}
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-2">Fondo</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={block.bgColor}
                onChange={(e) => onChange({ bgColor: e.target.value })}
                className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={block.bgColor}
                onChange={(e) => onChange({ bgColor: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Color de texto */}
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-2">Texto</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={block.textColor}
                onChange={(e) => onChange({ textColor: e.target.value })}
                className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={block.textColor}
                onChange={(e) => onChange({ textColor: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Color de estrellas */}
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-2">Estrellas</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={block.ratingColor}
                onChange={(e) => onChange({ ratingColor: e.target.value })}
                className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={block.ratingColor}
                onChange={(e) => onChange({ ratingColor: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Opciones visuales */}
        <div className="space-y-3 mt-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={block.showAvatar}
              onChange={(e) => onChange({ showAvatar: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300"
            />
            <span className="text-sm font-medium">Mostrar avatares</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={block.showRating}
              onChange={(e) => onChange({ showRating: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300"
            />
            <span className="text-sm font-medium">Mostrar calificaciones</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={block.showRole}
              onChange={(e) => onChange({ showRole: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300"
            />
            <span className="text-sm font-medium">Mostrar rol y empresa</span>
          </label>
        </div>
      </div>

      {/* Testimonios */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm">Testimonios ({block.items.length})</h3>
          <button
            onClick={addItem}
            className="flex items-center gap-2 px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            <Plus className="w-3 h-3" />
            Agregar Testimonio
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
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {item.avatar && (
                    <img
                      src={item.avatar}
                      alt={item.name}
                      className="w-10 h-10 rounded-full flex-shrink-0"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">
                      #{index + 1} - {item.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {item.role} • {item.company}
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteItem(item.id)
                  }}
                  className="p-2 hover:bg-red-100 rounded text-red-600 flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Formulario de edición */}
              {editingItemId === item.id && (
                <div className="p-4 bg-white border-t border-gray-200 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Nombre */}
                    <div>
                      <label className="text-xs font-medium text-gray-700 block mb-2">
                        Nombre
                      </label>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateItem(item.id, { name: e.target.value })}
                        placeholder="Nombre del cliente"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Rol */}
                    <div>
                      <label className="text-xs font-medium text-gray-700 block mb-2">
                        Rol/Posición
                      </label>
                      <input
                        type="text"
                        value={item.role}
                        onChange={(e) => updateItem(item.id, { role: e.target.value })}
                        placeholder="CEO, Emprendedor, etc."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Empresa */}
                  <div>
                    <label className="text-xs font-medium text-gray-700 block mb-2">
                      Empresa
                    </label>
                    <input
                      type="text"
                      value={item.company}
                      onChange={(e) => updateItem(item.id, { company: e.target.value })}
                      placeholder="Nombre de la empresa"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Testimonial */}
                  <div>
                    <label className="text-xs font-medium text-gray-700 block mb-2">
                      Testimonio
                    </label>
                    <textarea
                      value={item.text}
                      onChange={(e) => updateItem(item.id, { text: e.target.value })}
                      placeholder="Escriba el testimonial del cliente..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={3}
                    />
                  </div>

                  {/* Calificación */}
                  <div>
                    <label className="text-xs font-medium text-gray-700 block mb-2">
                      Calificación
                    </label>
                    <div className="flex gap-2">
                      {renderStars(item.rating, (rating) => {
                        updateItem(item.id, { rating })
                        setRatingHover(0)
                      })}
                      <span className="text-sm font-medium text-gray-600 ml-2">
                        {item.rating}/5
                      </span>
                    </div>
                  </div>

                  {/* Avatar URL */}
                  <div>
                    <label className="text-xs font-medium text-gray-700 block mb-2">
                      URL del Avatar (opcional)
                    </label>
                    <input
                      type="url"
                      value={item.avatar || ''}
                      onChange={(e) => updateItem(item.id, { avatar: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {item.avatar && (
                      <img
                        src={item.avatar}
                        alt="avatar preview"
                        className="w-12 h-12 rounded-full mt-2"
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {block.items.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm mb-3">No hay testimonios agregados</p>
            <button
              onClick={addItem}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Agregar primer Testimonio
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
