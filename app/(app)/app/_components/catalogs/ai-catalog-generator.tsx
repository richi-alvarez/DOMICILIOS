'use client'

import { useState } from 'react'
import { Sparkles, Loader2, AlertCircle, Check } from 'lucide-react'
import { generateCatalogWithAI } from '@/lib/actions/catalogs/generate-ai-catalog'
import type { GeneratedCatalogStructure } from '@/lib/actions/catalogs/generate-ai-catalog'

interface AICatalogGeneratorProps {
  businessName: string
  businessDescription: string
  businessType?: string
  onGenerated?: (catalog: GeneratedCatalogStructure) => void
}

type GeneratorState = 'idle' | 'generating' | 'success' | 'error'

export function AICatalogGenerator({
  businessName,
  businessDescription,
  businessType,
  onGenerated,
}: AICatalogGeneratorProps) {
  const [state, setState] = useState<GeneratorState>('idle')
  const [generated, setGenerated] = useState<GeneratedCatalogStructure | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  const handleGenerate = async () => {
    setState('generating')
    setError(null)

    const result = await generateCatalogWithAI(businessName, businessDescription, businessType)

    if ('error' in result) {
      setError(result.error)
      setState('error')
    } else {
      setGenerated(result.catalog)
      setState('success')
      onGenerated?.(result.catalog)
    }
  }

  const handleRegenerate = async () => {
    setState('idle')
    setGenerated(null)
    setError(null)
    setIsExpanded(false)
  }

  if (state === 'idle' && !generated) {
    return (
      <div className="rounded-lg border-2 border-dashed border-primary-300 bg-primary-50 p-6">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <h3 className="font-semibold text-primary-900 flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Generar catálogo con IA
            </h3>
            <p className="text-sm text-primary-700 mt-1">
              Analiza tu negocio y genera automáticamente la estructura óptima del catálogo,
              incluyendo secciones, productos destacados y recomendaciones de diseño.
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={!businessName || !businessDescription}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm whitespace-nowrap"
          >
            Generar Ahora
          </button>
        </div>
      </div>
    )
  }

  if (state === 'generating') {
    return (
      <div className="rounded-lg border border-warm-200 bg-white p-6">
        <div className="flex items-center justify-center gap-3 py-8">
          <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
          <div>
            <p className="font-medium text-night-800">Generando estructura del catálogo...</p>
            <p className="text-sm text-warm-600 mt-1">Analizando tu negocio y optimizando la presentación</p>
          </div>
        </div>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-red-900">Error generando catálogo</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <button
              onClick={handleRegenerate}
              className="mt-3 text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Intentar nuevamente
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (state === 'success' && generated) {
    return (
      <div className="space-y-4">
        {/* Success Message */}
        <div className="rounded-lg border border-lime-200 bg-lime-50 p-4">
          <div className="flex items-center gap-3">
            <Check className="h-5 w-5 text-lime-600" />
            <div>
              <p className="font-medium text-lime-900">¡Catálogo generado exitosamente!</p>
              <p className="text-sm text-lime-700 mt-1">
                Revisa la estructura propuesta y personalízala según tus preferencias
              </p>
            </div>
          </div>
        </div>

        {/* Generated Catalog Preview */}
        <div className="rounded-lg border border-warm-200 bg-white overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r p-6" style={{
            backgroundImage: `linear-gradient(135deg, ${generated.theme.primaryColor}, ${generated.theme.secondaryColor})`
          }}>
            <h2 className="text-2xl font-bold text-white">{generated.title}</h2>
            <p className="text-sm text-white/90 mt-2">{generated.subtitle}</p>
          </div>

          {/* Theme & Layout Info */}
          <div className="p-6 border-b border-warm-100">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-warm-600 font-medium">Tipo de Negocio</p>
                <p className="font-semibold text-night-800 mt-1 capitalize">{generated.businessType}</p>
              </div>
              <div>
                <p className="text-xs text-warm-600 font-medium">Estilo</p>
                <p className="font-semibold text-night-800 mt-1 capitalize">{generated.theme.style}</p>
              </div>
              <div>
                <p className="text-xs text-warm-600 font-medium">Colores Principales</p>
                <div className="flex gap-2 mt-1">
                  <div
                    className="w-6 h-6 rounded border border-warm-300"
                    style={{ backgroundColor: generated.theme.primaryColor }}
                    title={generated.theme.primaryColor}
                  />
                  <div
                    className="w-6 h-6 rounded border border-warm-300"
                    style={{ backgroundColor: generated.theme.secondaryColor }}
                    title={generated.theme.secondaryColor}
                  />
                </div>
              </div>
              <div>
                <p className="text-xs text-warm-600 font-medium">Layout</p>
                <p className="font-semibold text-night-800 mt-1">{generated.layout.grid_columns} columnas</p>
              </div>
            </div>
          </div>

          {/* Sections */}
          <div className="p-6 border-b border-warm-100">
            <h3 className="font-semibold text-night-800 mb-4">Secciones Propuestas</h3>
            <div className="space-y-3">
              {generated.sections
                .sort((a, b) => a.order - b.order)
                .map((section) => (
                  <div key={section.id} className="flex items-start gap-3 p-3 bg-warm-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-night-800">{section.name}</p>
                      <p className="text-sm text-warm-600 mt-0.5">{section.description}</p>
                      <p className="text-xs text-warm-500 mt-2">
                        {section.productIds.length} productos • Tipo: <span className="capitalize">{section.type}</span>
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Recommendations */}
          {generated.recommendations.length > 0 && (
            <div className="p-6 border-b border-warm-100">
              <h3 className="font-semibold text-night-800 mb-3">Recomendaciones</h3>
              <ul className="space-y-2">
                {generated.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <span className="text-primary-600 font-bold mt-0.5">•</span>
                    <span className="text-warm-700">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="p-6 bg-warm-50 flex items-center justify-between">
            <p className="text-sm text-warm-600">
              <span className="font-medium">{generated.featuredProducts.length}</span> productos destacados
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleRegenerate}
                className="px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors"
              >
                Regenerar
              </button>
              <button
                onClick={() => onGenerated?.(generated)}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Aplicar Estructura
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
