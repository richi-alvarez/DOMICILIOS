'use client'

import { useState } from 'react'

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  label?: string
}

export function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const presetColors = [
    '#ffffff', // White
    '#000000', // Black
    '#ff6b57', // Coral (primary)
    '#ff0000', // Red
    '#00ff00', // Green
    '#0066ff', // Blue
    '#ffff00', // Yellow
    '#ff00ff', // Magenta
    '#00ffff', // Cyan
    '#ff9900', // Orange
  ]

  const handleColorChange = (color: string) => {
    onChange(color)
    setIsOpen(false)
  }

  const isValidHex = /^#[0-9A-F]{6}$/i.test(value)

  return (
    <div className="space-y-2">
      {label && <label className="text-xs font-medium text-gray-700">{label}</label>}

      <div className="flex items-center gap-2">
        {/* Color Preview Square */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-10 h-8 rounded border-2 border-gray-300 hover:border-gray-400 transition-colors flex-shrink-0"
          style={{ backgroundColor: isValidHex ? value : '#cccccc' }}
          title="Click to open color picker"
        />

        {/* Hex Input */}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          placeholder="#000000"
          className="flex-1 text-xs px-2 py-1 border border-gray-300 rounded font-mono"
          maxLength={7}
        />
      </div>

      {/* Color Picker Dropdown */}
      {isOpen && (
        <div className="p-2 border border-gray-300 rounded bg-white shadow-lg space-y-2">
          {/* Preset Colors Grid */}
          <div className="grid grid-cols-5 gap-2">
            {presetColors.map((color) => (
              <button
                key={color}
                onClick={() => handleColorChange(color)}
                className="w-8 h-8 rounded border-2 transition-all hover:border-gray-600"
                style={{
                  backgroundColor: color,
                  borderColor: value === color ? '#000000' : '#cccccc',
                  borderWidth: value === color ? '3px' : '2px',
                }}
                title={color}
              />
            ))}
          </div>

          {/* RGB/HSL Input Option */}
          <div className="border-t border-gray-200 pt-2">
            <label className="text-xs font-medium text-gray-700 block mb-1">
              Otros colores
            </label>
            <input
              type="text"
              placeholder="Escribe hex color (ej: #ff6b57)"
              className="w-full text-xs px-2 py-1 border border-gray-300 rounded font-mono"
              onChange={(e) => {
                const val = e.target.value.toUpperCase()
                if (/^#[0-9A-F]{6}$/.test(val)) {
                  onChange(val)
                }
              }}
            />
          </div>

          {/* Close Button */}
          <button
            onClick={() => setIsOpen(false)}
            className="w-full text-xs py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
          >
            Cerrar
          </button>
        </div>
      )}
    </div>
  )
}
