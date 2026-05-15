'use client'

import { useState } from 'react'

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

interface GlobalPanelProps {
  palettes: Record<string, { primary: string; secondary: string; tertiary: string }>
  fonts: Record<string, string[]>
  theme: ThemeState
  onUpdateTheme: (partial: Partial<ThemeState>) => void
}

export default function GlobalPanel({ palettes, fonts, theme, onUpdateTheme }: GlobalPanelProps) {
  const [showBgUpload, setShowBgUpload] = useState(false)

  return (
    <div className="space-y-6 pb-6">
      {/* Color Palettes */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Paletas de Colores</h3>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(palettes).map(([name, colors]) => (
            <button
              key={name}
              onClick={() =>
                onUpdateTheme({
                  selectedPalette: name,
                  primaryColor: colors.primary,
                  secondaryColor: colors.secondary,
                  tertiaryColor: colors.tertiary,
                })
              }
              className={`p-3 rounded-lg border-2 transition ${
                theme.selectedPalette === name ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
              title={name}
            >
              <div className="flex gap-1 mb-1">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: colors.primary }} />
                <div className="w-4 h-4 rounded" style={{ backgroundColor: colors.secondary }} />
                <div className="w-4 h-4 rounded" style={{ backgroundColor: colors.tertiary }} />
              </div>
              <p className="text-xs font-medium truncate">{name}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Colors */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Colores Personalizados</h3>
        <div className="space-y-2">
          {[
            { key: 'primaryColor', label: 'Color Principal' },
            { key: 'secondaryColor', label: 'Color Secundario' },
            { key: 'tertiaryColor', label: 'Color Terciario' },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center gap-2">
              <label className="text-xs font-medium w-24">{label}</label>
              <input
                type="color"
                value={theme[key as keyof ThemeState] as string}
                onChange={(e) => onUpdateTheme({ [key]: e.target.value })}
                className="w-10 h-8 rounded cursor-pointer"
              />
              <input
                type="text"
                value={theme[key as keyof ThemeState] as string}
                onChange={(e) => onUpdateTheme({ [key]: e.target.value })}
                className="flex-1 text-xs px-2 py-1 border border-gray-300 rounded font-mono"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Font Selection */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Fuente Tipográfica</h3>
        {Object.entries(fonts).map(([category, fontList]) => (
          <div key={category} className="mb-4">
            <p className="text-xs text-gray-600 mb-2">{category}</p>
            <div className="flex flex-wrap gap-1">
              {fontList.map((font) => (
                <button
                  key={font}
                  onClick={() => onUpdateTheme({ font })}
                  className={`px-2 py-1 rounded text-xs transition ${
                    theme.font === font
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  style={{ fontFamily: font }}
                >
                  {font}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Border Radius */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Esquinas</h3>
        <div className="flex gap-2">
          {['none', 'sm', 'full'].map((radius) => (
            <button
              key={radius}
              onClick={() => onUpdateTheme({ borderRadius: radius as 'none' | 'sm' | 'full' })}
              className={`flex-1 py-2 rounded transition text-xs font-medium ${
                theme.borderRadius === radius
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {radius === 'none' ? '□ Rectas' : radius === 'sm' ? '◐ Suave' : '● Redondas'}
            </button>
          ))}
        </div>
      </div>

      {/* Page Background */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Fondo de Página</h3>
        <select
          value={theme.bgType}
          onChange={(e) => onUpdateTheme({ bgType: e.target.value as 'color' | 'image' | 'video' })}
          className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
        >
          <option value="color">Color</option>
          <option value="image">Imagen</option>
          <option value="video">Video</option>
        </select>

        {theme.bgType === 'color' && (
          <div className="mt-2 flex items-center gap-2">
            <input
              type="color"
              value={theme.bgColor}
              onChange={(e) => onUpdateTheme({ bgColor: e.target.value })}
              className="w-10 h-8 rounded cursor-pointer"
            />
            <input
              type="text"
              value={theme.bgColor}
              onChange={(e) => onUpdateTheme({ bgColor: e.target.value })}
              className="flex-1 text-xs px-2 py-1 border border-gray-300 rounded font-mono"
            />
          </div>
        )}

        {theme.bgType === 'image' && (
          <div className="mt-2 space-y-2">
            {theme.bgImage && (
              <div className="w-full h-20 rounded bg-cover bg-center" style={{ backgroundImage: `url(${theme.bgImage})` }} />
            )}
            <button className="w-full px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded">
              Seleccionar imagen
            </button>
          </div>
        )}

        {theme.bgType === 'video' && (
          <input
            type="text"
            placeholder="URL del video"
            value={theme.bgVideoUrl}
            onChange={(e) => onUpdateTheme({ bgVideoUrl: e.target.value })}
            className="w-full mt-2 text-xs px-2 py-1 border border-gray-300 rounded"
          />
        )}
      </div>
    </div>
  )
}
