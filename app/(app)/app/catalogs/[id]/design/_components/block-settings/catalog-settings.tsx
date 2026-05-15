'use client'

import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

interface CatalogBlock {
  id: string
  visible: boolean
  type: 'catalog'
  template: 'list' | 'grid' | 'glassmorphism' | 'classic'
  showCategoryFilter: boolean
  showSearch: boolean
  showSortFilter: boolean
  showPriceFilter: boolean
  showAvailabilityFilter: boolean
  showRatingFilter: boolean
  showBrandFilter: boolean
  showDiscountFilter: boolean
  showTitle: boolean
  showPrice: boolean
  showDescription: boolean
  showExternalLink: boolean
  enableCart: boolean
}

interface CatalogSettingsProps {
  block: CatalogBlock
  onChange: (partial: Partial<CatalogBlock>) => void
}

export default function CatalogSettings({ block, onChange }: CatalogSettingsProps) {
  const [expandedSection, setExpandedSection] = useState('template')

  const templates = [
    { value: 'list', label: 'Lista', icon: '📋' },
    { value: 'grid', label: 'Parrilla', icon: '⊞' },
    { value: 'glassmorphism', label: 'Glassmorfismo', icon: '✨' },
    { value: 'classic', label: 'Clásico', icon: '⬜' },
  ]

  return (
    <div className="space-y-4">
      {/* Template Selection */}
      <div className="border border-gray-200 rounded-lg">
        <button
          onClick={() => setExpandedSection(expandedSection === 'template' ? '' : 'template')}
          className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
        >
          <h4 className="font-semibold text-sm">Estilo de Plantilla</h4>
          <ChevronDown className={`w-4 h-4 transition ${expandedSection === 'template' ? 'rotate-180' : ''}`} />
        </button>

        {expandedSection === 'template' && (
          <div className="px-3 pb-3 border-t border-gray-200 pt-3">
            <div className="grid grid-cols-2 gap-2">
              {templates.map((template) => (
                <button
                  key={template.value}
                  onClick={() => onChange({ template: template.value as 'list' | 'grid' | 'glassmorphism' | 'classic' })}
                  className={`p-3 rounded-lg border-2 transition text-center ${
                    block.template === template.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{template.icon}</div>
                  <p className="text-xs font-medium">{template.label}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filters and Search */}
      <div className="border border-gray-200 rounded-lg">
        <button
          onClick={() => setExpandedSection(expandedSection === 'filters' ? '' : 'filters')}
          className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
        >
          <h4 className="font-semibold text-sm">Filtros y Búsqueda</h4>
          <ChevronDown className={`w-4 h-4 transition ${expandedSection === 'filters' ? 'rotate-180' : ''}`} />
        </button>

        {expandedSection === 'filters' && (
          <div className="px-3 pb-3 space-y-3 border-t border-gray-200 pt-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={block.showCategoryFilter}
                onChange={(e) => onChange({ showCategoryFilter: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-xs font-medium">Filtro de Categorías</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={block.showSearch}
                onChange={(e) => onChange({ showSearch: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-xs font-medium">Buscador</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={block.showSortFilter}
                onChange={(e) => onChange({ showSortFilter: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-xs font-medium">Filtro de Ordenamiento</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={block.showPriceFilter}
                onChange={(e) => onChange({ showPriceFilter: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-xs font-medium">Filtro de Precio</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={block.showAvailabilityFilter}
                onChange={(e) => onChange({ showAvailabilityFilter: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-xs font-medium">Filtro de Disponibilidad</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={block.showRatingFilter}
                onChange={(e) => onChange({ showRatingFilter: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-xs font-medium">Filtro de Calificación</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={block.showBrandFilter}
                onChange={(e) => onChange({ showBrandFilter: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-xs font-medium">Filtro de Marca</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={block.showDiscountFilter}
                onChange={(e) => onChange({ showDiscountFilter: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-xs font-medium">Filtro de Descuento</span>
            </label>
          </div>
        )}
      </div>

      {/* Display Options */}
      <div className="border border-gray-200 rounded-lg">
        <button
          onClick={() => setExpandedSection(expandedSection === 'display' ? '' : 'display')}
          className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
        >
          <h4 className="font-semibold text-sm">Opciones de Visualización</h4>
          <ChevronDown className={`w-4 h-4 transition ${expandedSection === 'display' ? 'rotate-180' : ''}`} />
        </button>

        {expandedSection === 'display' && (
          <div className="px-3 pb-3 space-y-3 border-t border-gray-200 pt-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={block.showTitle}
                onChange={(e) => onChange({ showTitle: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-xs font-medium">Mostrar Título del Producto</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={block.showPrice}
                onChange={(e) => onChange({ showPrice: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-xs font-medium">Mostrar Precio</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={block.showDescription}
                onChange={(e) => onChange({ showDescription: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-xs font-medium">Mostrar Descripción</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={block.showExternalLink}
                onChange={(e) => onChange({ showExternalLink: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-xs font-medium">Mostrar Enlace Externo</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={block.enableCart}
                onChange={(e) => onChange({ enableCart: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-xs font-medium">Habilitar Agregar al Carrito</span>
            </label>
          </div>
        )}
      </div>
    </div>
  )
}
