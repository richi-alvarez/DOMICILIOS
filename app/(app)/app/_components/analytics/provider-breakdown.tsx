'use client'

import { ScanMetricsData } from '@/lib/hooks/use-scan-metrics'
import { Check } from 'lucide-react'

interface ProviderBreakdownProps {
  metrics: ScanMetricsData
}

export function ProviderBreakdown({ metrics }: ProviderBreakdownProps) {
  const ocrProviders = Object.entries(metrics.providers.ocr)
  const aiProviders = Object.entries(metrics.providers.ai)

  return (
    <div className="border border-warm-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-night-800 mb-6">
        Uso de Proveedores
      </h3>

      <div className="space-y-8">
        {/* OCR Providers */}
        <div>
          <h4 className="text-sm font-medium text-warm-600 mb-3">
            Proveedores OCR
          </h4>
          <div className="space-y-2">
            {ocrProviders.map(([provider, data]) => (
              <div key={provider} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary-500" />
                  <span className="text-sm capitalize">{provider}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-2 bg-warm-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500"
                      style={{
                        width: `${(data.usage / (ocrProviders.reduce((sum, [, d]) => sum + d.usage, 0) || 1)) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-warm-500 w-12 text-right">
                    {data.usage}
                  </span>
                  <span className="text-xs text-lime-600 flex items-center gap-1 w-16">
                    <Check className="h-3 w-3" />
                    {(data.accuracy * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Providers */}
        <div>
          <h4 className="text-sm font-medium text-warm-600 mb-3">
            Proveedores IA
          </h4>
          <div className="space-y-2">
            {aiProviders.map(([provider, data]) => (
              <div key={provider} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary-500" />
                  <span className="text-sm capitalize">{provider}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-2 bg-warm-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500"
                      style={{
                        width: `${(data.usage / (aiProviders.reduce((sum, [, d]) => sum + d.usage, 0) || 1)) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-warm-500 w-12 text-right">
                    {data.usage}
                  </span>
                  <span className="text-xs text-amber-600 w-16 text-right">
                    ${data.cost.toFixed(4)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="mt-6 p-3 bg-blue-50 rounded border border-blue-200">
        <p className="text-xs text-blue-700">
          💡 Está utilizando los proveedores más económicos. Claude Haiku es
          excelente para visión de menús.
        </p>
      </div>
    </div>
  )
}
