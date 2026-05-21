'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'

interface CTAReinforcementBlock {
  id: string
  visible: boolean
  type: 'cta-reinforcement'
  title: string
  subtitle: string
  buttonText: string
  buttonAction: 'url' | 'phone' | 'email' | 'scroll'
  buttonUrl: string
  buttonPhone: string
  buttonEmail: string
  scrollTarget: string
  buttonColor: string
  textColor: string
  bgColor: string
  fontSize: 'sm' | 'md' | 'lg'
  buttonSize: 'sm' | 'md' | 'lg'
  alignment: 'left' | 'center' | 'right'
  padding: 'sm' | 'md' | 'lg' | 'xl'
  showBorder: boolean
  borderColor: string
  borderWidth: 'none' | 'thin' | 'medium' | 'thick'
}

interface CTAReinforcementSettingsProps {
  block: CTAReinforcementBlock
  onChange: (partial: Partial<CTAReinforcementBlock>) => void
}

export default function CTAReinforcementSettings({ block, onChange }: CTAReinforcementSettingsProps) {
  return (
    <div className="space-y-6">
      {/* Contenido */}
      <div className="border-b border-gray-200 pb-4">
        <h3 className="font-semibold text-sm mb-4">Contenido</h3>

        <div className="space-y-4">
          {/* Título */}
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-2">Título Principal</label>
            <input
              type="text"
              value={block.title}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder="¿Listo para comenzar?"
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
              placeholder="Describe la acción que quieres que realicen"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Botón */}
      <div className="border-b border-gray-200 pb-4">
        <h3 className="font-semibold text-sm mb-4">Configuración del Botón</h3>

        <div className="space-y-4">
          {/* Texto del botón */}
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-2">Texto del Botón</label>
            <input
              type="text"
              value={block.buttonText}
              onChange={(e) => onChange({ buttonText: e.target.value })}
              placeholder="Comprar ahora, Contactar, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Tipo de acción */}
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-2">Tipo de Acción</label>
            <select
              value={block.buttonAction}
              onChange={(e) => onChange({ buttonAction: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="url">Enlace externo</option>
              <option value="phone">Llamada telefónica</option>
              <option value="email">Correo electrónico</option>
              <option value="scroll">Scroll a sección</option>
            </select>
          </div>

          {/* URLs según acción */}
          {block.buttonAction === 'url' && (
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-2">URL</label>
              <input
                type="url"
                value={block.buttonUrl}
                onChange={(e) => onChange({ buttonUrl: e.target.value })}
                placeholder="https://ejemplo.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {block.buttonAction === 'phone' && (
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-2">Teléfono</label>
              <input
                type="tel"
                value={block.buttonPhone}
                onChange={(e) => onChange({ buttonPhone: e.target.value })}
                placeholder="+57 123 456 7890"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {block.buttonAction === 'email' && (
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-2">Correo electrónico</label>
              <input
                type="email"
                value={block.buttonEmail}
                onChange={(e) => onChange({ buttonEmail: e.target.value })}
                placeholder="contacto@ejemplo.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {block.buttonAction === 'scroll' && (
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-2">ID de Sección (ej: contacto, productos)</label>
              <input
                type="text"
                value={block.scrollTarget}
                onChange={(e) => onChange({ scrollTarget: e.target.value })}
                placeholder="contacto"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Tamaño del botón */}
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-2">Tamaño del Botón</label>
            <select
              value={block.buttonSize}
              onChange={(e) => onChange({ buttonSize: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="sm">Pequeño (px-4 py-2)</option>
              <option value="md">Mediano (px-6 py-3)</option>
              <option value="lg">Grande (px-8 py-4)</option>
            </select>
          </div>

          {/* Tamaño de fuente */}
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-2">Tamaño de Fuente del Botón</label>
            <select
              value={block.fontSize}
              onChange={(e) => onChange({ fontSize: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="sm">Pequeña (12px)</option>
              <option value="md">Mediana (16px)</option>
              <option value="lg">Grande (18px)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Diseño */}
      <div className="border-b border-gray-200 pb-4">
        <h3 className="font-semibold text-sm mb-4">Diseño</h3>

        <div className="space-y-4">
          {/* Alineación */}
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-2">Alineación</label>
            <div className="flex gap-2">
              {(['left', 'center', 'right'] as const).map((align) => (
                <button
                  key={align}
                  onClick={() => onChange({ alignment: align })}
                  className={`flex-1 py-2 px-3 rounded text-sm font-medium border transition ${
                    block.alignment === align
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                  }`}
                >
                  {align === 'left' ? '←' : align === 'center' ? '↔' : '→'}
                </button>
              ))}
            </div>
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

          {/* Color del botón */}
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-2">Color del Botón</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={block.buttonColor}
                onChange={(e) => onChange({ buttonColor: e.target.value })}
                className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={block.buttonColor}
                onChange={(e) => onChange({ buttonColor: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Borde */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer mb-2">
              <input
                type="checkbox"
                checked={block.showBorder}
                onChange={(e) => onChange({ showBorder: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm font-medium">Mostrar borde</span>
            </label>

            {block.showBorder && (
              <>
                <div className="mb-2">
                  <label className="text-xs font-medium text-gray-700 block mb-2">Grosor del Borde</label>
                  <select
                    value={block.borderWidth}
                    onChange={(e) => onChange({ borderWidth: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="thin">Delgado (1px)</option>
                    <option value="medium">Mediano (2px)</option>
                    <option value="thick">Grueso (3px)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-2">Color del Borde</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={block.borderColor}
                      onChange={(e) => onChange({ borderColor: e.target.value })}
                      className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={block.borderColor}
                      onChange={(e) => onChange({ borderColor: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Espaciado */}
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
        </div>
      </div>

      {/* Vista previa */}
      <div className="border-t border-gray-200 pt-4">
        <h3 className="font-semibold text-sm mb-3">Vista Previa</h3>
        <div className="p-4 rounded-lg" style={{ backgroundColor: block.bgColor }}>
          <p className="text-sm mb-2" style={{ color: block.textColor, textAlign: block.alignment as any }}>
            {block.title}
          </p>
          {block.subtitle && (
            <p className="text-xs mb-4" style={{ color: block.textColor, textAlign: block.alignment as any, opacity: 0.8 }}>
              {block.subtitle}
            </p>
          )}
          <div style={{ textAlign: block.alignment as any }}>
            <button
              style={{
                backgroundColor: block.buttonColor,
                color: 'white',
                borderWidth: block.showBorder ? (block.borderWidth === 'thin' ? '1px' : block.borderWidth === 'medium' ? '2px' : '3px') : '0px',
                borderColor: block.borderColor,
              }}
              className={`rounded font-medium transition hover:opacity-90 ${
                block.buttonSize === 'sm' ? 'px-4 py-2 text-sm' : block.buttonSize === 'md' ? 'px-6 py-3 text-base' : 'px-8 py-4 text-lg'
              }`}
            >
              {block.buttonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
