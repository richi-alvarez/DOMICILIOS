'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Minus, Award, AlertTriangle, Lightbulb, Loader2 } from 'lucide-react'
import { getMultiCatalogComparison } from '@/lib/actions/quality-comparison'
import type { CatalogComparison, ComparisonMetrics, BenchmarkInsights } from '@/lib/actions/quality-comparison'

export function QualityComparison() {
  const [comparisons, setComparisons] = useState<CatalogComparison[]>([])
  const [metrics, setMetrics] = useState<ComparisonMetrics | null>(null)
  const [insights, setInsights] = useState<BenchmarkInsights | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadComparison()
  }, [])

  const loadComparison = async () => {
    setIsLoading(true)
    setError(null)

    const result = await getMultiCatalogComparison()

    if ('error' in result) {
      setError(result.error)
    } else {
      setComparisons(result.comparisons || [])
      setMetrics(result.metrics || null)
      setInsights(result.insights || null)
    }

    setIsLoading(false)
  }

  const getScoreColor = (score: number | null) => {
    if (!score) return 'text-warm-600'
    if (score >= 85) return 'text-lime-600'
    if (score >= 70) return 'text-blue-600'
    if (score >= 50) return 'text-amber-600'
    return 'text-red-600'
  }

  const getTrendIcon = (trend: number | null) => {
    if (!trend) return <Minus className="h-4 w-4 text-warm-400" />
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-lime-600" />
    return <TrendingDown className="h-4 w-4 text-red-600" />
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border border-warm-200 bg-white p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary-500 mr-3" />
          <p className="text-warm-600">Cargando comparación...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-700">{error}</p>
      </div>
    )
  }

  if (comparisons.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-warm-200 bg-warm-50 p-6 text-center">
        <p className="text-warm-600">No hay catálogos analizados para comparar.</p>
        <p className="text-sm text-warm-500 mt-1">Realiza un análisis de calidad en al menos un catálogo para comenzar.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Metrics Overview */}
      {metrics && (
        <div className="rounded-lg border border-warm-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-night-800 mb-4">Métricas Generales</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-500">{metrics.averageScore}</p>
              <p className="text-xs text-warm-600 mt-1">Score Promedio</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-lime-600">{metrics.highestScore}</p>
              <p className="text-xs text-warm-600 mt-1">Más Alto</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{metrics.lowestScore}</p>
              <p className="text-xs text-warm-600 mt-1">Más Bajo</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{Math.round(metrics.medianScore)}</p>
              <p className="text-xs text-warm-600 mt-1">Mediana</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-night-800">{metrics.catalogsAnalyzed}</p>
              <p className="text-xs text-warm-600 mt-1">Catálogos Analizados</p>
            </div>
          </div>
        </div>
      )}

      {/* Ranking Table */}
      <div className="rounded-lg border border-warm-200 bg-white overflow-hidden">
        <div className="p-6 border-b border-warm-100">
          <h3 className="text-lg font-semibold text-night-800">Ranking de Catálogos</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-warm-50 border-b border-warm-100">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-warm-600">#</th>
                <th className="px-4 py-3 text-left font-semibold text-warm-600">Catálogo</th>
                <th className="px-4 py-3 text-center font-semibold text-warm-600">Score General</th>
                <th className="px-4 py-3 text-center font-semibold text-warm-600">Tendencia</th>
                <th className="px-4 py-3 text-center font-semibold text-warm-600">Percentil</th>
                <th className="px-4 py-3 text-center font-semibold text-warm-600 hidden md:table-cell">Completitud</th>
                <th className="px-4 py-3 text-center font-semibold text-warm-600 hidden md:table-cell">SEO</th>
                <th className="px-4 py-3 text-center font-semibold text-warm-600 hidden lg:table-cell">Consistencia</th>
                <th className="px-4 py-3 text-center font-semibold text-warm-600 hidden lg:table-cell">Vendibilidad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-100">
              {comparisons.map((catalog) => (
                <tr key={catalog.id} className="hover:bg-warm-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {catalog.rank <= 3 && <Award className="h-4 w-4 text-amber-500" />}
                      <span className="font-semibold text-night-800">{catalog.rank}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-night-800">{catalog.name}</p>
                      <p className="text-xs text-warm-500">/{catalog.slug}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <p className={`font-bold text-lg ${getScoreColor(catalog.latestScore)}`}>
                      {catalog.latestScore ?? '—'}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {getTrendIcon(catalog.trend)}
                      {catalog.trend && (
                        <span className={catalog.trend > 0 ? 'text-lime-600' : 'text-red-600'}>
                          {catalog.trend > 0 ? '+' : ''}{catalog.trend}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-block px-2 py-1 rounded bg-primary-50 text-primary-700 text-xs font-medium">
                      {catalog.percentile}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center hidden md:table-cell">
                    <span className="font-medium text-night-700">{catalog.completenessScore ?? '—'}</span>
                  </td>
                  <td className="px-4 py-3 text-center hidden md:table-cell">
                    <span className="font-medium text-night-700">{catalog.seoScore ?? '—'}</span>
                  </td>
                  <td className="px-4 py-3 text-center hidden lg:table-cell">
                    <span className="font-medium text-night-700">{catalog.consistencyScore ?? '—'}</span>
                  </td>
                  <td className="px-4 py-3 text-center hidden lg:table-cell">
                    <span className="font-medium text-night-700">{catalog.sellabilityScore ?? '—'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Performers & Insights */}
      {insights && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Performers */}
          <div className="rounded-lg border border-lime-200 bg-lime-50 p-6">
            <h3 className="font-semibold text-lime-900 flex items-center gap-2 mb-4">
              <Award className="h-5 w-5" />
              Top Performers
            </h3>
            <div className="space-y-3">
              {insights.topPerformers.map((catalog, idx) => (
                <div key={catalog.id} className="bg-white rounded-lg p-3 border border-lime-100">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-lime-900">{catalog.name}</p>
                      <p className="text-sm text-lime-700">Rank: #{catalog.rank}</p>
                    </div>
                    <p className="text-2xl font-bold text-lime-600">{catalog.latestScore}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Needs Attention */}
          <div className="rounded-lg border border-red-200 bg-red-50 p-6">
            <h3 className="font-semibold text-red-900 flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5" />
              Necesitan Atención
            </h3>
            <div className="space-y-3">
              {insights.needsAttention.map((catalog) => (
                <div key={catalog.id} className="bg-white rounded-lg p-3 border border-red-100">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-red-900">{catalog.name}</p>
                      <p className="text-sm text-red-700">Rank: #{catalog.rank}</p>
                    </div>
                    <p className="text-2xl font-bold text-red-600">{catalog.latestScore}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Dimension Averages */}
      {insights && (
        <div className="rounded-lg border border-warm-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-night-800 mb-4">Promedio por Dimensión</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Completitud', score: insights.averageByDimension.completeness },
              { label: 'SEO & Discoverabilidad', score: insights.averageByDimension.seo },
              { label: 'Consistencia', score: insights.averageByDimension.consistency },
              { label: 'Vendibilidad', score: insights.averageByDimension.sellability },
            ].map((dim) => (
              <div key={dim.label} className="text-center">
                <p className="text-3xl font-bold text-primary-500">{dim.score}</p>
                <p className="text-sm text-warm-600 mt-1">{dim.label}</p>
                <div className="mt-2 h-2 bg-warm-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 transition-all"
                    style={{ width: `${dim.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {insights && insights.recommendations.length > 0 && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
          <h3 className="font-semibold text-blue-900 flex items-center gap-2 mb-4">
            <Lightbulb className="h-5 w-5" />
            Recomendaciones de Benchmarking
          </h3>
          <div className="space-y-3">
            {insights.recommendations.map((rec, idx) => (
              <div key={idx} className="bg-white rounded-lg p-4 border border-blue-100">
                <p className="font-medium text-blue-900">{rec.focus}</p>
                <p className="text-sm text-blue-700 mt-1">{rec.reason}</p>
                <p className="text-xs text-blue-600 mt-2 italic">💡 {rec.potentialImprovement}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
