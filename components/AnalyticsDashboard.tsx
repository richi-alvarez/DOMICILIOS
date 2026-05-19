'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Button } from '@/components/ui/button'
import { Download, Calendar, Loader2, Archive, RotateCcw, Share2, X, Copy } from 'lucide-react'
import { getSalesData, getCustomerAnalytics, getAnalyticsOverview } from '@/lib/actions/analytics'
import { toast } from 'sonner'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Mail } from 'lucide-react'

interface AnalyticsDashboardProps {
  organizationId: string
}

export function AnalyticsDashboard({ organizationId }: AnalyticsDashboardProps) {
  const [salesData, setSalesData] = useState<any>(null)
  const [customerData, setCustomerData] = useState<any>(null)
  const [overviewData, setOverviewData] = useState<any>(null)
  const [sharedTemplates, setSharedTemplates] = useState<any[]>([])
  const [exportHistory, setExportHistory] = useState<any[]>([])
  const [archivedReports, setArchivedReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [emailInput, setEmailInput] = useState('')
  const [emailFormat, setEmailFormat] = useState<'csv' | 'xlsx' | 'pdf'>('csv')
  const [tempReportId, setTempReportId] = useState<string>('')
  const [interval, setInterval] = useState<'day' | 'week' | 'month'>('day')
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
  })
  const [customDateModalOpen, setCustomDateModalOpen] = useState(false)
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [sharingReportId, setSharingReportId] = useState('')
  const [sharingLoading, setSharingLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [interval, dateRange])

  async function loadData() {
    setLoading(true)
    try {
      const [sales, customers, overview, templatesRes, archivedRes] = await Promise.all([
        getSalesData(
          dateRange.startDate.toISOString(),
          dateRange.endDate.toISOString(),
          interval,
        ),
        getCustomerAnalytics(),
        getAnalyticsOverview(),
        fetch('/api/reports?shared=true').then(r => r.json()),
        fetch('/api/reports?archived=true').then(r => r.json()),
      ])
      setSalesData(sales)
      setCustomerData(customers)
      setOverviewData(overview)
      setSharedTemplates(templatesRes.reports || [])
      setArchivedReports(archivedRes.reports || [])
    } catch (error) {
      toast.error('Error al cargar datos de analytics')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  async function createTempReport() {
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
    return await reportResponse.json()
  }

  function formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0]
  }

  function applyCustomDateRange() {
    if (!customStartDate || !customEndDate) {
      toast.error('Selecciona fecha inicio y fin')
      return
    }
    setDateRange({
      startDate: new Date(customStartDate),
      endDate: new Date(customEndDate),
    })
    setCustomDateModalOpen(false)
    toast.success('Rango de fechas actualizado')
  }

  async function loadExportHistory(reportId: string) {
    try {
      const res = await fetch(`/api/reports/${reportId}/history`)
      if (res.ok) {
        const data = await res.json()
        setExportHistory(data.history || [])
      }
    } catch (error) {
      console.error('Error loading export history:', error)
    }
  }

  async function archiveReport(reportId: string) {
    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: true }),
      })
      if (!response.ok) throw new Error('Failed to archive')
      toast.success('Reporte archivado')
      await loadData()
    } catch (error) {
      toast.error('Error al archivar reporte')
      console.error(error)
    }
  }

  async function restoreReport(reportId: string) {
    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: false }),
      })
      if (!response.ok) throw new Error('Failed to restore')
      toast.success('Reporte restaurado')
      await loadData()
    } catch (error) {
      toast.error('Error al restaurar reporte')
      console.error(error)
    }
  }

  async function generateShareLink(reportId: string) {
    setSharingLoading(true)
    try {
      const response = await fetch(`/api/reports/${reportId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!response.ok) throw new Error('Failed to generate share link')
      const data = await response.json()
      setShareUrl(data.shareUrl)
      setSharingReportId(reportId)
      setShareModalOpen(true)
      toast.success('Link de compartición generado')
    } catch (error) {
      toast.error('Error al generar link')
      console.error(error)
    } finally {
      setSharingLoading(false)
    }
  }

  async function revokeShareLink(reportId: string) {
    try {
      const response = await fetch(`/api/reports/${reportId}/share`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!response.ok) throw new Error('Failed to revoke share link')
      setShareModalOpen(false)
      toast.success('Link revocado')
      await loadData()
    } catch (error) {
      toast.error('Error al revocar link')
      console.error(error)
    }
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(shareUrl)
    toast.success('Link copiado al portapapeles')
  }

  async function handleExport(format: 'csv' | 'xlsx' | 'pdf') {
    setExporting(true)
    try {
      const report = await createTempReport()
      setTempReportId(report.id)

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

      // Load updated history
      await loadExportHistory(report.id)

      toast.success(`Reporte exportado en formato ${format.toUpperCase()}`)
    } catch (error) {
      toast.error('Error al exportar reporte')
      console.error(error)
    } finally {
      setExporting(false)
    }
  }

  async function handleSendEmail() {
    if (!emailInput || !tempReportId) {
      toast.error('Ingresa un email válido')
      return
    }

    setSendingEmail(true)
    try {
      const response = await fetch(`/api/reports/${tempReportId}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput, format: emailFormat }),
      })

      if (!response.ok) throw new Error('Failed to send email')

      // Load updated history
      await loadExportHistory(tempReportId)

      toast.success(`Reporte enviado a ${emailInput}`)
      setEmailModalOpen(false)
      setEmailInput('')
      setEmailFormat('csv')
    } catch (error) {
      toast.error('Error al enviar reporte por email')
      console.error(error)
    } finally {
      setSendingEmail(false)
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
          <Dialog open={customDateModalOpen} onOpenChange={setCustomDateModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                Personalizado
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Seleccionar rango de fechas</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Fecha inicio</label>
                  <input
                    type="date"
                    value={customStartDate || formatDateForInput(dateRange.startDate)}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded border border-warm-200 focus:outline-none focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Fecha fin</label>
                  <input
                    type="date"
                    value={customEndDate || formatDateForInput(dateRange.endDate)}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded border border-warm-200 focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setCustomDateModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={applyCustomDateRange}>
                  Aplicar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={exporting}>
                {exporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('xlsx')}>
                Excel (XLSX)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('pdf')}>
                PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Dialog open={emailModalOpen} onOpenChange={setEmailModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={exporting || !tempReportId}>
                <Mail className="h-4 w-4 mr-2" />
                Enviar por email
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Enviar reporte por email</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Correo electrónico</label>
                  <Input
                    type="email"
                    placeholder="tu@email.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    disabled={sendingEmail}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Formato</label>
                  <div className="flex gap-2">
                    {(['csv', 'xlsx', 'pdf'] as const).map((fmt) => (
                      <button
                        key={fmt}
                        onClick={() => setEmailFormat(fmt)}
                        className={`flex-1 px-3 py-2 rounded border text-sm font-medium transition-all ${
                          emailFormat === fmt
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-warm-200 hover:border-warm-300'
                        }`}
                        disabled={sendingEmail}
                      >
                        {fmt.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setEmailModalOpen(false)}
                  disabled={sendingEmail}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSendEmail}
                  disabled={sendingEmail || !emailInput}
                >
                  {sendingEmail ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Enviar
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Shared Templates */}
      {sharedTemplates && sharedTemplates.length > 0 && (
        <div className="rounded-lg border border-warm-200 bg-white p-6">
          <h2 className="text-xl font-bold text-night-800 mb-4">
            Plantillas del Equipo
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sharedTemplates.map((template: any) => (
              <div
                key={template.id}
                className="text-left p-4 rounded-lg border border-warm-200 hover:border-primary-500 hover:bg-primary-50 transition-all flex flex-col"
              >
                <button
                  onClick={() => {
                    toast.success(`Plantilla "${template.name}" cargada`)
                  }}
                  className="flex-1 text-left"
                >
                  <p className="font-semibold text-night-800">{template.name}</p>
                  {template.description && (
                    <p className="text-sm text-warm-600 mt-1">{template.description}</p>
                  )}
                  <p className="text-xs text-warm-500 mt-2 capitalize">
                    Tipo: {template.queryType}
                  </p>
                </button>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => generateShareLink(template.id)}
                    className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
                    disabled={sharingLoading}
                  >
                    <Share2 className="h-3 w-3" />
                    Compartir
                  </button>
                  <button
                    onClick={() => archiveReport(template.id)}
                    className="text-xs text-warm-600 hover:text-red-600 flex items-center gap-1"
                  >
                    <Archive className="h-3 w-3" />
                    Archivar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Share Link Modal */}
      <Dialog open={shareModalOpen} onOpenChange={setShareModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Compartir Reporte</DialogTitle>
          </DialogHeader>
          {shareUrl && (
            <div className="space-y-4">
              <div className="bg-warm-50 p-4 rounded-lg">
                <p className="text-sm text-warm-600 mb-2">Link de compartición (válido por 7 días):</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 px-3 py-2 rounded border border-warm-200 text-sm bg-white"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="px-3 py-2 bg-primary-500 text-white rounded hover:bg-primary-600 flex items-center gap-1"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-warm-600">
                Cualquiera con este link puede descargar el reporte en formato CSV sin necesidad de autenticación.
              </p>
            </div>
          )}
          <DialogFooter>
            <button
              onClick={() => revokeShareLink(sharingReportId)}
              className="text-xs text-red-600 hover:text-red-700"
            >
              Revocar link
            </button>
            <Button onClick={() => setShareModalOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Archived Reports */}
      {archivedReports && archivedReports.length > 0 && (
        <div className="rounded-lg border border-warm-200 bg-warm-50 p-6">
          <h2 className="text-xl font-bold text-night-800 mb-4">
            Reportes Archivados
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {archivedReports.map((report: any) => (
              <div
                key={report.id}
                className="text-left p-4 rounded-lg border border-warm-300 bg-white flex flex-col"
              >
                <div className="flex-1">
                  <p className="font-semibold text-night-800">{report.name}</p>
                  {report.description && (
                    <p className="text-sm text-warm-600 mt-1">{report.description}</p>
                  )}
                  <p className="text-xs text-warm-500 mt-2 capitalize">
                    Tipo: {report.queryType}
                  </p>
                </div>
                <button
                  onClick={() => restoreReport(report.id)}
                  className="mt-2 text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
                >
                  <RotateCcw className="h-3 w-3" />
                  Restaurar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export History */}
      {exportHistory && exportHistory.length > 0 && (
        <div className="rounded-lg border border-warm-200 bg-white p-6">
          <h2 className="text-xl font-bold text-night-800 mb-4">
            Historial de Exportaciones
          </h2>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {exportHistory.map((entry: any) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 bg-warm-50 rounded"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-night-800">
                    {entry.exportFormat.toUpperCase()}
                    {(entry.metadata as any)?.deliveryType === 'email' && (
                      <span className="ml-2 text-xs text-warm-600">
                        📧 → {(entry.metadata as any)?.email}
                      </span>
                    )}
                    {(entry.metadata as any)?.deliveryType === 'download' && (
                      <span className="ml-2 text-xs text-warm-600">
                        ⬇️ Descarga
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-warm-600 mt-1">
                    {entry.rowCount} filas • {(entry.fileSize / 1024).toFixed(1)} KB
                  </p>
                </div>
                <p className="text-xs text-warm-500">
                  {new Date(entry.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

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
