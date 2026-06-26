'use client'

import { ThemeEditor } from '@/components/design-editor/theme-editor'
import type { ThemeConfig } from '@/lib/design/theme'

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
  buttonTextColor: string
  categoryTextColor: string
  cartTextColor: string
  cartCountColor: string
  cartTotalColor: string
  productNameColor: string
  productPriceColor: string
  filterTextColor: string
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
  catalogId: string
  catalogSlug: string
  themeSettings: ThemeConfig
  onUpdateThemeSettings: (next: ThemeConfig) => void
}

export default function GlobalPanel({ buttonPalettes, categoryPalettes, cartPalettes, fonts, theme, onUpdateTheme, catalogId, catalogSlug, themeSettings, onUpdateThemeSettings }: GlobalPanelProps) {
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

  // Campo de color con el mismo estilo de la sección "Colores": label en
  // negrita + hint gris + selector circular + input hex.
  const colorField = (label: string, hint: string, key: keyof ThemeState) => (
    <div className="space-y-1.5">
      <div>
        <label className="block text-sm font-semibold text-gray-900">{label}</label>
        {hint && <p className="text-xs text-gray-400">{hint}</p>}
      </div>
      <div className="flex items-center gap-3">
        <label className="relative shrink-0 cursor-pointer">
          <input
            type="color"
            value={theme[key] as string}
            onChange={(e) => onUpdateTheme({ [key]: e.target.value } as Partial<ThemeState>)}
            className="sr-only"
          />
          <div
            className="h-10 w-10 rounded-full border-2 border-gray-200 shadow-sm transition-transform hover:scale-105"
            style={{ background: theme[key] as string }}
          />
        </label>
        <input
          type="text"
          value={theme[key] as string}
          onChange={(e) => onUpdateTheme({ [key]: e.target.value } as Partial<ThemeState>)}
          maxLength={7}
          className="min-w-0 flex-1 rounded-lg border-2 border-gray-200 px-3 py-2 font-mono text-sm uppercase focus:border-blue-400 focus:outline-none"
        />
      </div>
    </div>
  )

  // Sección de paleta simplificada: lista de campos de color (label + hint + key).
  const renderColorSection = (
    title: string,
    fields: { label: string; hint: string; key: keyof ThemeState }[],
  ) => (
    <div className="rounded-2xl border border-warm-200 bg-white p-4 sm:p-5">
      <h3 className="mb-1 text-base font-bold text-gray-900">{title}</h3>
      <div className="mt-4 space-y-4">
        {fields.map((f) => (
          <div key={f.key as string}>{colorField(f.label, f.hint, f.key)}</div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="space-y-6 pb-6">
      {/* Tema visual (movido desde Configuración): preview del header, colores y
          marca. La tipografía y la forma usan los componentes de abajo (que ya se
          reflejan en el preview). El guardado lo hace el botón "Guardar" superior. */}
      <ThemeEditor
        catalogId={catalogId}
        catalogSlug={catalogSlug}
        initial={themeSettings}
        onChange={onUpdateThemeSettings}
        embedded
      />

      <div className="border-t border-gray-200 pt-2" />

      {/* Paletas simplificadas: color del elemento + color del texto (estilo Colores) */}
      {renderColorSection('Paleta de Botones (Portada + Agregar al Carrito)', [
        { label: 'Color primario', hint: 'Fondo del botón', key: 'buttonPrimaryColor' },
        { label: 'Texto sobre primario', hint: 'Color del texto del botón', key: 'buttonTextColor' },
      ])}
      {renderColorSection('Paleta de Categoría', [
        { label: 'Color primario', hint: 'Fondo del filtro de categoría', key: 'categoryPrimaryColor' },
        { label: 'Texto sobre primario', hint: 'Color del texto del filtro', key: 'categoryTextColor' },
      ])}
      {renderColorSection('Paleta de Carrito de Compras', [
        { label: 'Color primario', hint: 'Fondo del botón del carrito', key: 'cartPrimaryColor' },
        { label: 'Texto sobre primario', hint: 'Color del ícono', key: 'cartTextColor' },
        { label: 'Cantidad de productos', hint: 'Fondo del contador de items', key: 'cartCountColor' },
        { label: 'Total', hint: 'Fondo del total', key: 'cartTotalColor' },
      ])}
      {renderColorSection('Paleta de Productos', [
        { label: 'Nombre y descripción', hint: 'Color del texto del producto', key: 'productNameColor' },
        { label: 'Precio', hint: 'Color del precio', key: 'productPriceColor' },
      ])}
      {renderColorSection('Paleta de Filtros y Búsqueda', [
        { label: 'Texto de filtros y búsqueda', hint: 'Color del texto de búsqueda y filtros', key: 'filterTextColor' },
      ])}

      {/* Font Selection (diseño de tarjetas con vista previa de la fuente) */}
      <div className="rounded-2xl border border-warm-200 bg-white p-4 sm:p-5">
        <h3 className="text-sm font-semibold mb-3">Fuente Tipográfica</h3>
        {Object.entries(fonts).map(([category, fontList]) => (
          <div key={category} className="mb-4">
            <p className="text-xs text-gray-600 mb-2">{category}</p>
            <div className="grid grid-cols-2 gap-2">
              {fontList.map((font) => (
                <button
                  key={font}
                  onClick={() => onUpdateTheme({ font })}
                  className={`flex flex-col items-start gap-1 rounded-xl border-2 px-3 py-2.5 transition-all ${
                    theme.font === font
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <span className="text-[10px] text-gray-500">{font}</span>
                  <span className="text-lg leading-none text-gray-900" style={{ fontFamily: font }}>
                    Ag
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Border Radius (diseño con vista previa del radio: el div con borde) */}
      <div className="rounded-2xl border border-warm-200 bg-white p-4 sm:p-5">
        <h3 className="text-sm font-semibold mb-3">Esquinas</h3>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: 'none', label: 'Rectas', css: '0px' },
            { value: 'sm', label: 'Suave', css: '8px' },
            { value: 'full', label: 'Redondas', css: '9999px' },
          ].map(({ value, label, css }) => (
            <button
              key={value}
              onClick={() => onUpdateTheme({ borderRadius: value as 'none' | 'sm' | 'full' })}
              className={`flex flex-col items-center gap-2 rounded-xl border-2 px-3 py-3 transition-all ${
                theme.borderRadius === value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div
                className="h-8 w-8 border-2 border-gray-800 bg-gray-100"
                style={{ borderRadius: css }}
              />
              <span className="text-xs font-medium text-gray-700">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
