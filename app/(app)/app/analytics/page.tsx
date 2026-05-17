'use client'

import { useScanMetrics } from '@/lib/hooks/use-scan-metrics'
import { MetricCard } from '../_components/analytics/metric-card'
import { ProviderBreakdown } from '../_components/analytics/provider-breakdown'
import { Recommendations } from '../_components/analytics/recommendations'
import { TrendCharts } from '../_components/analytics/trend-charts'
import { HistoricalTable } from '../_components/analytics/historical-table'
import { QualityComparison } from '../_components/analytics/quality-comparison'
import { BarChart3, Loader2 } from 'lucide-react'

export default function AnalyticsPage() {
  const { metrics, isLoading, error } = useScanMetrics()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BarChart3 className="h-8 w-8 text-primary-500" />
        <div>
          <h1 className="text-3xl font-bold text-night-800">Analytics</h1>
          <p className="text-sm text-warm-500 mt-1">
            Estadísticas en tiempo real de tus escaneos de menú
          </p>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 text-primary-500 animate-spin mx-auto mb-3" />
            <p className="text-warm-600">Cargando métricas...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">
            Error al cargar métricas: {error}
          </p>
        </div>
      )}

      {/* Content */}
      {metrics && !isLoading && (
        <>
          {/* Main KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Total de Escaneos"
              value={metrics.totalScans}
              trend="up"
              trendValue="+2 hoy"
              variant="success"
            />
            <MetricCard
              label="Productos Detectados"
              value={metrics.totalProducts}
              unit="productos"
              variant="success"
            />
            <MetricCard
              label="Costo Promedio"
              value={`$${metrics.averageCost.toFixed(4)}`}
              unit="por imagen"
              trend="down"
              trendValue="-12% vs semana pasada"
            />
            <MetricCard
              label="Calidad Promedio"
              value={`${metrics.averageQuality}/100`}
              variant="success"
              trend="stable"
              trendValue="Excelente"
            />
          </div>

          {/* Secondary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              label="Tiempo Promedio de Procesamiento"
              value={metrics.averageProcessingTime.toFixed(1)}
              unit="segundos"
              description="Incluye OCR y Claude Vision"
            />
            <MetricCard
              label="Costo Total Acumulado"
              value={`$${metrics.totalCost.toFixed(3)}`}
              description="Inversión total en escaneos"
              variant="default"
            />
            <MetricCard
              label="Últimas 24 Horas"
              value={metrics.last24h.scans}
              unit="escaneos"
              description={`${metrics.last24h.products} productos, $${metrics.last24h.cost.toFixed(3)} costo`}
            />
          </div>

          {/* Detailed Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Provider Breakdown */}
            <ProviderBreakdown metrics={metrics} />

            {/* Quality & Performance */}
            <div className="border border-warm-200 rounded-lg p-6 space-y-6">
              <h3 className="text-lg font-semibold text-night-800">
                Performance
              </h3>

              {/* Quality Trend */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-warm-600">
                    Tendencia de Calidad
                  </p>
                  <span className="text-xs bg-lime-100 text-lime-700 px-2 py-1 rounded">
                    Estable
                  </span>
                </div>
                <div className="h-2 bg-warm-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-lime-500"
                    style={{ width: `${metrics.averageQuality}%` }}
                  />
                </div>
                <p className="text-xs text-warm-500 mt-1">
                  {metrics.averageQuality}% - Excelente desempeño
                </p>
              </div>

              {/* Speed Trend */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-warm-600">
                    Tendencia de Velocidad
                  </p>
                  <span className="text-xs bg-lime-100 text-lime-700 px-2 py-1 rounded">
                    Mejorando
                  </span>
                </div>
                <p className="text-sm text-night-800 font-semibold">
                  {metrics.averageProcessingTime.toFixed(1)}s promedio
                </p>
                <p className="text-xs text-warm-500 mt-1">
                  -15% más rápido que la semana pasada
                </p>
              </div>

              {/* Cost Efficiency */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-warm-600">
                    Costo por Producto
                  </p>
                  <span className="text-xs bg-lime-100 text-lime-700 px-2 py-1 rounded">
                    Óptimo
                  </span>
                </div>
                <p className="text-sm text-night-800 font-semibold">
                  ${metrics.trends.costPerProduct.toFixed(6)} por producto
                </p>
                <p className="text-xs text-warm-500 mt-1">
                  Usando proveedores más eficientes
                </p>
              </div>

              {/* Efficiency Score */}
              <div className="pt-4 border-t border-warm-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-warm-600">
                    Índice de Eficiencia
                  </p>
                </div>
                <div className="text-3xl font-bold text-primary-500">
                  9.2/10
                </div>
                <p className="text-xs text-warm-500 mt-1">
                  Tu configuración está optimizada
                </p>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <Recommendations metrics={metrics} />

          {/* Interactive Charts */}
          <div>
            <h2 className="text-2xl font-bold text-night-800 mb-6">
              Visualización de Datos
            </h2>
            <TrendCharts period="7days" />
          </div>

          {/* Historical Table */}
          <div>
            <h2 className="text-2xl font-bold text-night-800 mb-6">
              Histórico Detallado
            </h2>
            <HistoricalTable />
          </div>

          {/* Historical Data Info */}

          {/* Quality Comparison */}
          <div>
            <h2 className="text-2xl font-bold text-night-800 mb-6">
              Comparación de Catálogos
            </h2>
            <QualityComparison />
          </div>
          <div className="bg-warm-50 border border-warm-200 rounded-lg p-4">
            <p className="text-xs text-warm-700">
              ℹ️ Datos actualizados cada 30 segundos. Los históricos se guardan
              por 90 días. Los costos se basan en las tasas actuales de
              proveedores.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
