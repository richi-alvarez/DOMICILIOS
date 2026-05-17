'use client'

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

// Datos de ejemplo (últimos 7 días)
const trendData = [
  { date: 'Lun', scans: 6, products: 120, cost: 0.009, quality: 91 },
  { date: 'Mar', scans: 8, products: 156, cost: 0.012, quality: 92 },
  { date: 'Mié', scans: 7, products: 145, cost: 0.011, quality: 90 },
  { date: 'Jue', scans: 9, products: 180, cost: 0.014, quality: 93 },
  { date: 'Vie', scans: 5, products: 98, cost: 0.008, quality: 89 },
  { date: 'Sáb', scans: 4, products: 72, cost: 0.006, quality: 88 },
  { date: 'Dom', scans: 3, products: 54, cost: 0.004, quality: 87 },
]

// Datos de costos por proveedor (últimos 30 días)
const costByProvider = [
  { name: 'Claude', cost: 0.25, percentage: 45 },
  { name: 'Tesseract', cost: 0, percentage: 0 },
  { name: 'PaddleOCR', cost: 0.05, percentage: 9 },
  { name: 'OpenAI', cost: 0.25, percentage: 45 },
]

interface TrendChartsProps {
  period?: '7days' | '30days' | '90days'
}

export function TrendCharts({ period = '7days' }: TrendChartsProps) {
  return (
    <div className="space-y-8">
      {/* Escaneos y Productos Detectados */}
      <div className="border border-warm-200 rounded-lg p-6 bg-white">
        <h3 className="text-lg font-semibold text-night-800 mb-6">
          Actividad de Escaneos (Últimos 7 días)
        </h3>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5d5c8" />
            <XAxis dataKey="date" stroke="#9d8b7e" />
            <YAxis stroke="#9d8b7e" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5d5c8',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Bar dataKey="scans" fill="#06b6d4" name="Escaneos" />
            <Bar dataKey="products" fill="#3b82f6" name="Productos" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Costo y Calidad */}
      <div className="border border-warm-200 rounded-lg p-6 bg-white">
        <h3 className="text-lg font-semibold text-night-800 mb-6">
          Costo y Calidad (Últimos 7 días)
        </h3>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5d5c8" />
            <XAxis dataKey="date" stroke="#9d8b7e" />
            <YAxis yAxisId="left" stroke="#9d8b7e" />
            <YAxis yAxisId="right" orientation="right" stroke="#9d8b7e" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5d5c8',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="cost"
              stroke="#f59e0b"
              name="Costo ($)"
              strokeWidth={2}
              dot={{ fill: '#f59e0b', r: 4 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="quality"
              stroke="#10b981"
              name="Calidad (/100)"
              strokeWidth={2}
              dot={{ fill: '#10b981', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Distribución de Costos */}
      <div className="border border-warm-200 rounded-lg p-6 bg-white">
        <h3 className="text-lg font-semibold text-night-800 mb-6">
          Distribución de Costos por Proveedor (Últimos 30 días)
        </h3>

        <div className="space-y-4">
          {costByProvider.map((provider) => (
            <div key={provider.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-night-800">
                  {provider.name}
                </span>
                <span className="text-sm text-warm-600">
                  ${provider.cost.toFixed(2)} ({provider.percentage}%)
                </span>
              </div>
              <div className="w-full h-3 bg-warm-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-400 to-primary-600"
                  style={{ width: `${provider.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Resumen */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-700">
            💡 <strong>Insight:</strong> Considera usar PaddleOCR para más escaneos - es 100% gratis y tiene buena precisión.
          </p>
        </div>
      </div>
    </div>
  )
}
