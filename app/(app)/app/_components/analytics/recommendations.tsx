'use client'

import { Lightbulb, Check, AlertCircle } from 'lucide-react'
import { ScanMetricsData } from '@/lib/hooks/use-scan-metrics'

interface RecommendationsProps {
  metrics: ScanMetricsData
}

export function Recommendations({ metrics }: RecommendationsProps) {
  // Categorizar recomendaciones
  const getRecommendationType = (recommendation: string) => {
    if (recommendation.toLowerCase().includes('excelente') || recommendation.includes('✓')) {
      return 'success'
    }
    if (recommendation.toLowerCase().includes('warning') || recommendation.toLowerCase().includes('cuidado')) {
      return 'warning'
    }
    return 'info'
  }

  return (
    <div className="border border-warm-200 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <Lightbulb className="h-5 w-5 text-amber-500" />
        <h3 className="text-lg font-semibold text-night-800">
          Recomendaciones
        </h3>
      </div>

      <div className="space-y-3">
        {metrics.recommendations.map((rec, idx) => {
          const type = getRecommendationType(rec)
          return (
            <div
              key={idx}
              className={`p-3 rounded border flex gap-3 ${
                type === 'success'
                  ? 'bg-lime-50 border-lime-200'
                  : type === 'warning'
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-blue-50 border-blue-200'
              }`}
            >
              {type === 'success' ? (
                <Check className="h-5 w-5 text-lime-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              )}
              <p
                className={`text-sm ${
                  type === 'success'
                    ? 'text-lime-700'
                    : type === 'warning'
                      ? 'text-amber-700'
                      : 'text-blue-700'
                }`}
              >
                {rec}
              </p>
            </div>
          )
        })}
      </div>

      {/* Acciones sugeridas */}
      <div className="mt-6 pt-6 border-t border-warm-200">
        <p className="text-sm font-medium text-night-800 mb-3">
          Próximos pasos
        </p>
        <ul className="space-y-2 text-sm text-warm-600">
          <li className="flex gap-2">
            <span>→</span>
            <span>Monitorea la calidad de escaneos regularmente</span>
          </li>
          <li className="flex gap-2">
            <span>→</span>
            <span>Mantén tus menús con buena iluminación y contraste</span>
          </li>
          <li className="flex gap-2">
            <span>→</span>
            <span>Considera usar OCR local (Tesseract/PaddleOCR) para ahorrar costos</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
