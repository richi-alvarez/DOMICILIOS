'use client'

import { Plus, Trash2, Smile } from 'lucide-react'
import { useState } from 'react'

interface BenefitItem {
  id: string
  icon: string
  title: string
  description: string
}

interface BenefitsBlock {
  id: string
  visible: boolean
  type: 'benefits'
  title: string
  subtitle: string
  columns: 1 | 2 | 3 | 4
  items: BenefitItem[]
  bgColor: string
  textColor: string
  iconColor: string
  iconSize: 'sm' | 'md' | 'lg'
  padding: 'sm' | 'md' | 'lg' | 'xl'
}

interface BenefitsSettingsProps {
  block: BenefitsBlock
  onChange: (partial: Partial<BenefitsBlock>) => void
}

const EMOJI_SUGGESTIONS = [
  '✨', '🚀', '💎', '⭐', '🎯', '💡', '🔥', '✅',
  '🏆', '💪', '🎁', '❤️', '👍', '🌟', '⚡', '🎨',
  '📱', '💻', '🔒', '📊', '🎵', '🎬', '📚', '🧠',
  '🌈', '🦋', '🌺', '🍎', '🎪', '🎭', '🎸', '🚗',
]

export default function BenefitsSettings({ block, onChange }: BenefitsSettingsProps) {
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null)

  const addItem = () => {
    const newItem: BenefitItem = {
      id: `benefit-${Date.now()}`,
      icon: '✨',
      title: `Beneficio ${block.items.length + 1}`,
      description: 'Descripción del beneficio',
    }
    onChange({ items: [...block.items, newItem] })
  }

  const updateItem = (itemId: string, updates: Partial<BenefitItem>) => {
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

  const paddingMap = {
    sm: '20px',
    md: '40px',
    lg: '60px',
    xl: '80px',
  }

  const iconSizeMap = {
    sm: '32px',
    md: '48px',
    lg: '64px',
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
          {/* Columnas */}
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
              <option value="4">4 columnas</option>
            </select>
          </div>

          {/* Tamaño de icono */}
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-2">Tamaño Icono</label>
            <select
              value={block.iconSize}
              onChange={(e) => onChange({ iconSize: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="sm">Pequeño (32px)</option>
              <option value="md">Mediano (48px)</option>
              <option value="lg">Grande (64px)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
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

        <div className="grid grid-cols-2 gap-4 mt-4">
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

          {/* Color de icono */}
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-2">Icono</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={block.iconColor}
                onChange={(e) => onChange({ iconColor: e.target.value })}
                className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={block.iconColor}
                onChange={(e) => onChange({ iconColor: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Beneficios */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm">Beneficios ({block.items.length})</h3>
          <button
            onClick={addItem}
            className="flex items-center gap-2 px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            <Plus className="w-3 h-3" />
            Agregar Beneficio
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
                <div className="flex items-center gap-3">
                  <div
                    className="text-3xl"
                    style={{ fontSize: iconSizeMap[block.iconSize] }}
                  >
                    {item.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm">#{index + 1} - {item.title}</p>
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
                  {/* Icono */}
                  <div>
                    <label className="text-xs font-medium text-gray-700 block mb-2">
                      Icono (Emoji)
                    </label>
                    <div className="flex gap-2">
                      <div
                        className="w-12 h-12 border-2 border-gray-300 rounded-lg flex items-center justify-center text-3xl cursor-pointer hover:border-blue-500"
                        onClick={() => setShowEmojiPicker(
                          showEmojiPicker === item.id ? null : item.id
                        )}
                      >
                        {item.icon}
                      </div>
                      <input
                        type="text"
                        value={item.icon}
                        onChange={(e) => updateItem(item.id, { icon: e.target.value })}
                        placeholder="Emoji"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Emoji Picker */}
                    {showEmojiPicker === item.id && (
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="grid grid-cols-8 gap-2">
                          {EMOJI_SUGGESTIONS.map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => {
                                updateItem(item.id, { icon: emoji })
                                setShowEmojiPicker(null)
                              }}
                              className="text-2xl p-2 hover:bg-white rounded-lg transition"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
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
                      placeholder="Título del beneficio"
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
                      placeholder="Descripción detallada del beneficio"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {block.items.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm mb-3">No hay beneficios agregados</p>
            <button
              onClick={addItem}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Agregar primer Beneficio
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
