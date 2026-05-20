'use client'

import { X } from 'lucide-react'

const BLOCK_CATEGORIES = {
  Presentación: [
    { type: 'presentation', label: 'Sección Hero', description: 'Banner con título y CTA', icon: '🎯', plan: 'BASIC' },
    { type: 'carousel', label: 'Carrusel', description: 'Slider rotativo con imágenes y texto', icon: '🎠', plan: 'BASIC' },
    { type: 'benefits', label: 'Beneficios y Características', description: 'Lista de características con iconos', icon: '⭐', plan: 'BASIC' },
  ],
  Contenido: [
    { type: 'text', label: 'Texto', description: 'Bloque de texto editable', icon: '📝', plan: 'BASIC' },
  ],
  'E-Commerce': [
    { type: 'catalog', label: 'Catálogo de Productos', description: 'Muestra tus productos', icon: '📦', plan: 'BASIC' },
    { type: 'cart', label: 'Bolsón de Carrito', description: 'Botón flotante del carrito', icon: '🛒', plan: 'BASIC' },
  ],
}

interface AddBlockModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddBlock: (type: 'presentation' | 'catalog' | 'cart' | 'text' | 'carousel' | 'benefits') => void
}

export default function AddBlockModal({ open, onOpenChange, onAddBlock }: AddBlockModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Agregar Bloque</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {Object.entries(BLOCK_CATEGORIES).map(([category, blocks]) => (
            <div key={category}>
              <h3 className="font-semibold text-sm mb-3 text-gray-700">{category}</h3>
              <div className="space-y-2">
                {blocks.map((block) => (
                  <button
                    key={block.type}
                    onClick={() => {
                      onAddBlock(block.type as any)
                      onOpenChange(false)
                    }}
                    className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{block.icon}</span>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{block.label}</p>
                        <p className="text-xs text-gray-600 mt-1">{block.description}</p>
                        <div className="mt-2">
                          <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                            {block.plan}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
