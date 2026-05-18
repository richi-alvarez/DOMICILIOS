'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Button } from '@/components/ui/button'
import { Download, Calendar, Loader2 } from 'lucide-react'
import { getSalesData, getCustomerAnalytics, getAnalyticsOverview } from '@/lib/actions/analytics'
import { toast } from 'sonner'

interface AnalyticsDashboardProps {
  organizationId: string
}

export function AnalyticsDashboard({ organizationId }: AnalyticsDashboardProps) {
  const [salesData, setSalesData] = useState<any>(null)
  const [customerData, setCustomerData] = useState<any>(null)
  const [overviewData, setOverviewData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [interval, setInterval] = useState<'day' | 'week' | 'month'>('day')
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
  })

  useEffect(() => {
    loadData()
  }, [interval, dateRange])

  async function loadData() {
    setLoading(true)
    try {
      const [sales, customers, overview] = await Promise.all([
        getSalesData(
          dateRange.startDate.toISOString(),
          dateRange.endDate.toISOString(),
          interval,
        ),
        getCustomerAnalytics(),
        getAnalyticsOverview(),
      ])
      setSalesData(sales)
      setCustomerData(customers)
      setOverviewData(overview)
    } catch (error) {
      toast.error('Error al cargar datos de analytics')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  async function handleExport(format: 'csv' | 'xlsx' | 'pdf') {
    setExporting(true)
    try {
      // Create a temporary report and export it
      const reportResponse = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Dashboard Export ${new Date().toLocaleDateString()}`,
          queryType: 'sales',
          filters: {
            startDate: dateRange.startDate.toISOString(),
            endDate: dateRange.endDate.toISOString(),
            interval,
          },
        }),
      })

      if (!reportResponse.ok) throw new Error('Failed to create report')
      const report = await reportResponse.json()

      // Export the report
      const exportResponse = await fetch(`/api/reports/${report.id}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format }),
      })

      if (!exportResponse.ok) throw new Error('Failed to export')

      // Download the file
      const blob = await exportResponse.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `analytics-${format}.${format === 'xlsx' ? 'xlsx' : format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success(`Reporte exportado en formato ${format.toUpperCase()}`)
    } catch (error) {
      toast.error('Error al exportar reporte')
      console.error(error)
    } finally {
      setExporting(false)
    }
  }

  const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

  return (
    <div className="space-y-8">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex gap-2">
          {(['day', 'week', 'month'] as const).map((i) => (
            <Button
              key={i}
              variant={interval === i ? 'default' : 'outline'}
              size="sm"
              onClick={() => setInterval(i)}
              className="capitalize"
            >
              {i === 'day' ? 'Diario' : i === 'week' ? 'Semanal' : 'Mensual'}
            </Button>
          ))}
        </div>

        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" disabled>
            <Calendar className="h-4 w-4 mr-2" />
            Personalizado
          </Button>
          <div className="relative group">
            <Button variant="outline" size="sm" disabled={exporting}>
              {exporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Exportar
            </Button>
            {!exporting && (
              <div className="absolute right-0 top-full mt-1 hidden group-hover:block bg-white border rounded shadow-lg z-10">
                <button
                  onClick={() => handleExport('csv')}
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                >
                  CSV
                </button>
                <button
                  onClick={() => handleExport('xlsx')}
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                >
                  Excel (XLSX)
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                >
                  PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sales Chart */}
      {salesData?.data && (
        <div className="rounded-lg border border-warm-200 bg-white p-6">
          <h2 className="text-xl font-bold text-night-800 mb-4">
            Ventas {interval === 'day' ? 'Diarias' : interval === 'week' ? 'Semanales' : 'Mensuales'}
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip
                formatter={(value) => [`$${value}`, 'Revenue']}
                labelFormatter={(label) => `Fecha: ${label}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                strokeWidth={2}
                name="Ingresos"
              />
              <Line
                type="monotone"
                dataKey="orders"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Órdenes"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top Products */}
      {overviewData?.topProducts && overviewData.topProducts.length > 0 && (
        <div className="rounded-lg border border-warm-200 bg-white p-6">
          <h2 className="text-xl font-bold text-night-800 mb-4">
            Productos Más Vendidos
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={overviewData.topProducts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                formatter={(value) => [`$${value}`, 'Ingresos']}
              />
              <Legend />
              <Bar
                dataKey="revenue"
                fill="#8b5cf6"
                name="Ingresos"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Customer Stats */}
      {customerData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customer Distribution */}
          <div className="rounded-lg border border-warm-200 bg-white p-6">
            <h2 className="text-xl font-bold text-night-800 mb-4">
              Distribución de Clientes
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Nuevos', value: customerData.newCustomersThisMonth || 0 },
                    { name: 'Recurrentes', value: customerData.repeatCustomers || 0 },
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {['Nuevos', 'Recurrentes'].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Top Customers */}
          <div className="rounded-lg border border-warm-200 bg-white p-6">
            <h2 className="text-xl font-bold text-night-800 mb-4">
              Clientes Principales
            </h2>
            <div className="space-y-3">
              {customerData.topCustomers?.map((customer: any) => (
                <div
                  key={customer.id}
                  className="flex justify-between items-center p-3 bg-warm-50 rounded"
                >
                  <div>
                    <p className="font-semibold text-night-800">{customer.name}</p>
                    <p className="text-sm text-warm-600">
                      {customer.orderCount} órdenes
                    </p>
                  </div>
                  <p className="font-bold text-green-600">${customer.ltv.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Customer Metrics */}
      {customerData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border border-warm-200 bg-white p-6">
            <p className="text-sm text-warm-600">LTV Promedio</p>
            <p className="text-3xl font-bold text-night-800 mt-2">
              ${customerData.avgLifetimeValue?.toFixed(2) || '0.00'}
            </p>
          </div>

          <div className="rounded-lg border border-warm-200 bg-white p-6">
            <p className="text-sm text-warm-600">Tasa de Recurrencia</p>
            <p className="text-3xl font-bold text-night-800 mt-2">
              {customerData.repeatCustomers && customerData.totalCustomers
                ? ((customerData.repeatCustomers / customerData.totalCustomers) * 100).toFixed(1)
                : '0'}%
            </p>
          </div>

          <div className="rounded-lg border border-warm-200 bg-white p-6">
            <p className="text-sm text-warm-600">Tasa de Deserción</p>
            <p className="text-3xl font-bold text-night-800 mt-2">
              {(customerData.churnRate * 100).toFixed(1)}%
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
