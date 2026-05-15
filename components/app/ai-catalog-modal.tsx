'use client'

import { useState } from 'react'
import { createCatalogFromAI } from '@/lib/actions/ai-catalog'
import { useRouter } from 'next/navigation'
import { Loader2, Sparkles, X } from 'lucide-react'

interface AICatalogModalProps {
  isOpen: boolean
  onClose: () => void
}

const businessTypes = [
  {
    id: 'restaurant',
    name: '🍔 Restaurante',
    description: 'Menú de comida y bebidas',
    icon: '🍽️',
  },
  {
    id: 'cafe',
    name: '☕ Cafetería',
    description: 'Menú de café y postres',
    icon: '☕',
  },
  {
    id: 'store',
    name: '👕 Tienda',
    description: 'Catálogo de productos',
    icon: '🛍️',
  },
]

export function AICatalogModal({ isOpen, onClose }: AICatalogModalProps) {
  const router = useRouter()
  const [selectedType, setSelectedType] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const handleCreate = async () => {
    if (!selectedType) return

    setIsLoading(true)
    setError('')

    try {
      const result = await createCatalogFromAI(selectedType)

      if (result.success && result.catalogId) {
        // Redirigir al catálogo creado
        router.push(`/app/catalogs/${result.catalogId}`)
        onClose()
      } else {
        setError(result.error || 'Error al crear el catálogo')
      }
    } catch (err) {
      setError('Error inesperado')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary-500" />
            <h2 className="text-2xl font-bold">Crear con IA</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-gray-600">
          Selecciona el tipo de negocio y crearemos un catálogo con productos automáticamente
        </p>

        {/* Business Type Selection */}
        <div className="space-y-2">
          {businessTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`w-full p-4 rounded-lg border-2 transition text-left ${
                selectedType === type.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-primary-300 bg-white'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{type.icon}</span>
                <div>
                  <h3 className="font-semibold text-gray-900">{type.name}</h3>
                  <p className="text-sm text-gray-600">{type.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            disabled={!selectedType || isLoading}
            className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creando...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Crear Catálogo
              </>
            )}
          </button>
        </div>

        {/* Info */}
        <p className="text-xs text-gray-500 text-center">
          Se crearán 2 productos y 1 categoría automáticamente
        </p>
      </div>
    </div>
  )
}
