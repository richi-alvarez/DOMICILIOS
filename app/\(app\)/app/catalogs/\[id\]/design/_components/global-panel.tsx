'use client'

import { useState } from 'react'

interface ThemeState {
  selectedPalette: string | null
  primaryColor: string
  secondaryColor: string
  tertiaryColor: string
  font: string
  borderRadius: 'none' | 'sm' | 'full'
  buttonPrimaryColor: string
  buttonSecondaryColor: string
  buttonTertiaryColor: string
  categoryPrimaryColor: string
  categorySecondaryColor: string
  categoryTertiaryColor: string
  cartPrimaryColor: string
  cartSecondaryColor: string
  cartTertiaryColor: string
  buttonCustomMode: boolean
  categoryCustomMode: boolean
  cartCustomMode: boolean
}

interface GlobalPanelProps {
  buttonPalettes: Record<string, { primary: string; secondary: string; tertiary: string }>
  categoryPalettes: Record<string, { primary: string; secondary: string; tertiary: string }>
  cartPalettes: Record<string, { primary: string; secondary: string; tertiary: string }>
  fonts: Record<string, string[]>
  theme: ThemeState
  onUpdateTheme: (partial: Partial<ThemeState>) => void
}

export default function GlobalPanel({ buttonPalettes, categoryPalettes, cartPalettes, fonts, theme, onUpdateTheme }: GlobalPanelProps) {
  const renderPaletteSection = (
    title: string,
    palettes: Record<string, { primary: string; secondary: string; tertiary: string }>,
    colorType: 'button' | 'category' | 'cart'
  ) => {
    const colorMap: Record<string, [string, string, string, string]> = {
      button: ['buttonPrimaryColor', 'buttonSecondaryColor', 'buttonTertiaryColor', 'buttonCustomMode'],
      category: ['categoryPrimaryColor', 'categorySecondaryColor', 'categoryTertiaryColor', 'categoryCustomMode'],
      cart: ['cartPrimaryColor', 'cartSecondaryColor', 'cartTertiaryColor', 'cartCustomMode'],
    }

    const [primaryKey, secondaryKey, tertiaryKey, customModeKey] = colorMap[colorType]
    const isCustomMode = theme[customModeKey as keyof ThemeState] as boolean

    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">{title}</h3>
          <button
            onClick={() => onUpdateTheme({ [customModeKey]: !isCustomMode } as Partial<ThemeState>)}
            className={`text-xs px-2 py-1 rounded transition ${
              isCustomMode ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {isCustomMode ? 'Personalizado' : 'Personalizar'}
          </button>
        </div>

        {!isCustomMode && (
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(palettes).map(([name, colors]) => (
              <button
                key={name}
                onClick={() =>
                  onUpdateTheme({
                    [primaryKey]: colors.primary,
                    [secondaryKey]: colors.secondary,
                    [tertiaryKey]: colors.tertiary,
                  } as Partial<ThemeState>)
                }
                className={`p-3 rounded-lg border-2 transition ${
                  theme[primaryKey as keyof ThemeState] === colors.primary ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
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
        )}

        {isCustomMode && (
          <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
            {[
              { key: primaryKey, label: 'Color Principal' },
              { key: secondaryKey, label: 'Color Secundario' },
              { key: tertiaryKey, label: 'Color Terciario' },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center gap-2">
                <label className="text-xs font-medium w-32">{label}</label>
                <input
                  type="color"
                  value={theme[key as keyof ThemeState] as string}
                  onChange={(e) => onUpdateTheme({ [key]: e.target.value })}
                  className="w-10 h-8 rounded cursor-pointer border border-gray-300"
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
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-6">
      {/* Color Palettes - 3 categories */}
      {renderPaletteSection('Paleta de Botones (Portada + Agregar al Carrito)', buttonPalettes, 'button')}
      {renderPaletteSection('Paleta de Categoría', categoryPalettes, 'category')}
      {renderPaletteSection('Paleta de Carrito de Compras', cartPalettes, 'cart')}

      {/* Font Selection */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Fuente Tipográfica</h3>
        {Object.entries(fonts).map(([category, fontList]) => (
          <div key={category} className="mb-4">
            <p className="text-xs text-gray-600 mb-2">{category}</p>
            <div className="grid grid-cols-2 gap-2">
              {fontList.map((font) => (
                <button
                  key={font}
                  onClick={() => onUpdateTheme({ font })}
                  className={`p-2 rounded-lg border-2 transition text-left text-center ${
                    theme.font === font
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <p className="text-xs text-gray-600 mb-1">{font}</p>
                  <p className="text-xs" style={{ fontFamily: font }}>
                    Aa
                  </p>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Border Radius */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Esquinas</h3>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: 'none', label: 'Rectas' },
            { value: 'sm', label: 'Suave' },
            { value: 'full', label: 'Redondas' },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onUpdateTheme({ borderRadius: value as 'none' | 'sm' | 'full' })}
              className={`py-2 px-3 rounded transition text-xs font-medium ${
                theme.borderRadius === value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
