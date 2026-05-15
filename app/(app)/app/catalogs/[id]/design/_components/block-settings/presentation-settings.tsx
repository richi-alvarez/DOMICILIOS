'use client'

import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

interface PresentationBlock {
  id: string
  visible: boolean
  type: 'presentation'
  bgType: 'color' | 'image' | 'video'
  bgColor: string
  bgImage: string | null
  bgVideoUrl: string
  overlayOpacity: number
  overlayType: 'dark' | 'light'
  title: string
  subtitle: string
  textAlign: 'left' | 'center' | 'right'
  textColor: string
  presentationImage: string | null
  showCta: boolean
  ctaText: string
  ctaActionType: 'url' | 'scroll'
  ctaUrl: string
  sectionSize: 'sm' | 'md' | 'lg' | 'xl'
  fullHeight: boolean
}

interface PresentationSettingsProps {
  block: PresentationBlock
  onChange: (partial: Partial<PresentationBlock>) => void
}

export default function PresentationSettings({ block, onChange }: PresentationSettingsProps) {
  const [expandedSection, setExpandedSection] = useState('background')

  return (
    <div className="space-y-4">
      {/* Background Settings */}
      <div className="border border-gray-200 rounded-lg">
        <button
          onClick={() => setExpandedSection(expandedSection === 'background' ? '' : 'background')}
          className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
        >
          <h4 className="font-semibold text-sm">Ajustes de Fondo</h4>
          <ChevronDown className={`w-4 h-4 transition ${expandedSection === 'background' ? 'rotate-180' : ''}`} />
        </button>

        {expandedSection === 'background' && (
          <div className="px-3 pb-3 space-y-3 border-t border-gray-200 pt-3">
            {/* Background Type */}
            <div>
              <label className="text-xs font-medium text-gray-700">Tipo de Fondo</label>
              <select
                value={block.bgType}
                onChange={(e) => onChange({ bgType: e.target.value as 'color' | 'image' | 'video' })}
                className="w-full mt-1 px-2 py-1 text-xs border border-gray-300 rounded"
              >
                <option value="color">Color</option>
                <option value="image">Imagen</option>
                <option value="video">Video</option>
              </select>
            </div>

            {/* Background Image */}
            {block.bgType === 'image' && (
              <div>
                <label className="text-xs font-medium text-gray-700">Imagen de Fondo</label>
                {block.bgImage && (
                  <div
                    className="w-full h-24 rounded mt-1 bg-cover bg-center"
                    style={{ backgroundImage: `url(${block.bgImage})` }}
                  />
                )}
                <div className="flex gap-2 mt-2">
                  <button className="flex-1 text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded">
                    Cambiar imagen
                  </button>
                  <button className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded">
                    ✕
                  </button>
                </div>
                <button className="w-full text-xs px-2 py-1 mt-2 bg-gray-100 hover:bg-gray-200 rounded">
                  📚 Elegir de biblioteca
                </button>
              </div>
            )}

            {/* Background Color */}
            {block.bgType === 'color' && (
              <div>
                <label className="text-xs font-medium text-gray-700">Color de Fondo</label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="color"
                    value={block.bgColor}
                    onChange={(e) => onChange({ bgColor: e.target.value })}
                    className="w-10 h-8 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={block.bgColor}
                    onChange={(e) => onChange({ bgColor: e.target.value })}
                    className="flex-1 text-xs px-2 py-1 border border-gray-300 rounded font-mono"
                  />
                </div>
              </div>
            )}

            {/* Video URL */}
            {block.bgType === 'video' && (
              <div>
                <label className="text-xs font-medium text-gray-700">URL del Video</label>
                <input
                  type="text"
                  value={block.bgVideoUrl}
                  onChange={(e) => onChange({ bgVideoUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full mt-1 text-xs px-2 py-1 border border-gray-300 rounded"
                />
              </div>
            )}

            {/* Overlay Opacity */}
            {block.bgType === 'image' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-gray-700">Opacidad de Superposición</label>
                  <span className="text-xs text-gray-600">{block.overlayOpacity}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={block.overlayOpacity}
                  onChange={(e) => onChange({ overlayOpacity: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
            )}

            {/* Overlay Type */}
            {block.bgType === 'image' && (
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-2">Tipo de Superposición</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => onChange({ overlayType: 'dark' })}
                    className={`flex-1 px-2 py-1 text-xs rounded ${
                      block.overlayType === 'dark' ? 'bg-gray-800 text-white' : 'bg-gray-100'
                    }`}
                  >
                    Aa Oscuro
                  </button>
                  <button
                    onClick={() => onChange({ overlayType: 'light' })}
                    className={`flex-1 px-2 py-1 text-xs rounded ${
                      block.overlayType === 'light' ? 'bg-gray-200 text-black' : 'bg-gray-100'
                    }`}
                  >
                    Aa Claro
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content Settings */}
      <div className="border border-gray-200 rounded-lg">
        <button
          onClick={() => setExpandedSection(expandedSection === 'content' ? '' : 'content')}
          className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
        >
          <h4 className="font-semibold text-sm">Ajustes de Contenido</h4>
          <ChevronDown className={`w-4 h-4 transition ${expandedSection === 'content' ? 'rotate-180' : ''}`} />
        </button>

        {expandedSection === 'content' && (
          <div className="px-3 pb-3 space-y-3 border-t border-gray-200 pt-3">
            {/* Title */}
            <div>
              <label className="text-xs font-medium text-gray-700">Título*</label>
              <input
                type="text"
                value={block.title}
                onChange={(e) => onChange({ title: e.target.value })}
                className="w-full mt-1 text-xs px-2 py-1 border border-gray-300 rounded"
              />
            </div>

            {/* Subtitle */}
            <div>
              <label className="text-xs font-medium text-gray-700">Subtítulo</label>
              <textarea
                value={block.subtitle}
                onChange={(e) => onChange({ subtitle: e.target.value })}
                className="w-full mt-1 text-xs px-2 py-1 border border-gray-300 rounded resize-none h-20"
              />
            </div>

            {/* Text Alignment */}
            <div>
              <label className="text-xs font-medium text-gray-700">Alineación del Texto</label>
              <select
                value={block.textAlign}
                onChange={(e) => onChange({ textAlign: e.target.value as 'left' | 'center' | 'right' })}
                className="w-full mt-1 px-2 py-1 text-xs border border-gray-300 rounded"
              >
                <option value="left">Izquierda</option>
                <option value="center">Centro</option>
                <option value="right">Derecha</option>
              </select>
            </div>

            {/* Text Color */}
            <div>
              <label className="text-xs font-medium text-gray-700">Color del Texto</label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  value={block.textColor}
                  onChange={(e) => onChange({ textColor: e.target.value })}
                  className="w-10 h-8 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={block.textColor}
                  onChange={(e) => onChange({ textColor: e.target.value })}
                  className="flex-1 text-xs px-2 py-1 border border-gray-300 rounded font-mono"
                />
              </div>
            </div>

            {/* Presentation Image */}
            <div>
              <label className="text-xs font-medium text-gray-700">Imagen de Presentación (Opcional)</label>
              <button className="w-full mt-1 text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded">
                Seleccionar imagen
              </button>
            </div>

            {/* CTA */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={block.showCta}
                  onChange={(e) => onChange({ showCta: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-xs font-medium text-gray-700">Botón de llamada a la acción (Opcional)</span>
              </label>

              {block.showCta && (
                <div className="mt-2 space-y-2">
                  <input
                    type="text"
                    placeholder="Ej: Ordenar ahora"
                    value={block.ctaText}
                    onChange={(e) => onChange({ ctaText: e.target.value })}
                    className="w-full text-xs px-2 py-1 border border-gray-300 rounded"
                  />
                  <select
                    value={block.ctaActionType}
                    onChange={(e) => onChange({ ctaActionType: e.target.value as 'url' | 'scroll' })}
                    className="w-full text-xs px-2 py-1 border border-gray-300 rounded"
                  >
                    <option value="url">Abrir URL</option>
                    <option value="scroll">Desplazarse a sección</option>
                  </select>
                  {block.ctaActionType === 'url' && (
                    <input
                      type="text"
                      placeholder="https://..."
                      value={block.ctaUrl}
                      onChange={(e) => onChange({ ctaUrl: e.target.value })}
                      className="w-full text-xs px-2 py-1 border border-gray-300 rounded"
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Design Settings */}
      <div className="border border-gray-200 rounded-lg">
        <button
          onClick={() => setExpandedSection(expandedSection === 'design' ? '' : 'design')}
          className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
        >
          <h4 className="font-semibold text-sm">Ajustes de Diseño</h4>
          <ChevronDown className={`w-4 h-4 transition ${expandedSection === 'design' ? 'rotate-180' : ''}`} />
        </button>

        {expandedSection === 'design' && (
          <div className="px-3 pb-3 space-y-3 border-t border-gray-200 pt-3">
            {/* Section Size */}
            <div>
              <label className="text-xs font-medium text-gray-700">Tamaño de Sección</label>
              <div className="flex gap-2 mt-2">
                {['sm', 'md', 'lg', 'xl'].map((size) => (
                  <button
                    key={size}
                    onClick={() => onChange({ sectionSize: size as 'sm' | 'md' | 'lg' | 'xl' })}
                    className={`flex-1 px-2 py-1 text-xs rounded ${
                      block.sectionSize === size ? 'bg-blue-600 text-white' : 'bg-gray-100'
                    }`}
                  >
                    {size === 'sm' ? 'P' : size === 'md' ? 'M' : size === 'lg' ? 'G' : 'XG'}
                  </button>
                ))}
              </div>
            </div>

            {/* Full Height */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={block.fullHeight}
                  onChange={(e) => onChange({ fullHeight: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-xs font-medium text-gray-700">Altura completa</span>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
