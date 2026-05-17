/**
 * Export utilities for analytics data
 * CSV y PDF generation
 */

export interface ExportOptions {
  filename?: string
  includeHeaders?: boolean
}

/**
 * Exporta datos a CSV
 */
export function exportToCSV(
  data: Record<string, any>[],
  options: ExportOptions = {}
) {
  const { filename = 'analytics-export.csv', includeHeaders = true } = options

  if (data.length === 0) {
    console.warn('No data to export')
    return
  }

  // Obtener headers de las keys del primer objeto
  const headers = Object.keys(data[0])

  // Crear CSV
  let csv = ''

  if (includeHeaders) {
    csv += headers.join(',') + '\n'
  }

  // Agregar datos
  for (const row of data) {
    const values = headers.map((header) => {
      const value = row[header]
      // Escapar comillas y envolver en comillas si contiene comas
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value ?? ''
    })
    csv += values.join(',') + '\n'
  }

  // Descargar
  downloadFile(csv, filename, 'text/csv')
}

/**
 * Exporta reporte a JSON
 */
export function exportToJSON(
  data: Record<string, any>,
  options: ExportOptions = {}
) {
  const { filename = 'analytics-report.json' } = options

  const json = JSON.stringify(data, null, 2)
  downloadFile(json, filename, 'application/json')
}

/**
 * Genera reporte de Analytics en formato texto
 */
export function generateAnalyticsReport(
  metrics: Record<string, any>
): string {
  const lines: string[] = []

  lines.push('═══════════════════════════════════════════════════')
  lines.push('           REPORTE DE ANALYTICS - ESCANEOS')
  lines.push('═══════════════════════════════════════════════════')
  lines.push('')

  // Fecha de generación
  lines.push(`Generado: ${new Date().toLocaleString('es-CO')}`)
  lines.push('')

  // KPIs
  lines.push('MÉTRICAS PRINCIPALES')
  lines.push('───────────────────────────────────────────────────')
  lines.push(`Total de Escaneos: ${metrics.totalScans || 0}`)
  lines.push(`Productos Detectados: ${metrics.totalProducts || 0}`)
  lines.push(`Calidad Promedio: ${metrics.averageQuality || 0}/100`)
  lines.push(`Costo Total: $${(metrics.totalCost || 0).toFixed(2)}`)
  lines.push(`Costo Promedio: $${(metrics.averageCost || 0).toFixed(4)}`)
  lines.push(`Tiempo Promedio: ${(metrics.averageProcessingTime || 0).toFixed(1)}s`)
  lines.push('')

  // Últimas 24 horas
  lines.push('ÚLTIMAS 24 HORAS')
  lines.push('───────────────────────────────────────────────────')
  if (metrics.last24h) {
    lines.push(`Escaneos: ${metrics.last24h.scans || 0}`)
    lines.push(`Productos: ${metrics.last24h.products || 0}`)
    lines.push(`Costo: $${(metrics.last24h.cost || 0).toFixed(3)}`)
  }
  lines.push('')

  // Proveedores
  if (metrics.providers) {
    lines.push('USO DE PROVEEDORES')
    lines.push('───────────────────────────────────────────────────')

    if (metrics.providers.ocr) {
      lines.push('OCR:')
      for (const [name, data] of Object.entries(metrics.providers.ocr)) {
        lines.push(
          `  - ${name}: ${(data as any).usage} usos, ${((data as any).accuracy * 100).toFixed(0)}% accuracy`
        )
      }
    }

    if (metrics.providers.ai) {
      lines.push('IA:')
      for (const [name, data] of Object.entries(metrics.providers.ai)) {
        lines.push(
          `  - ${name}: ${(data as any).usage} usos, $${(data as any).cost.toFixed(4)} costo`
        )
      }
    }
    lines.push('')
  }

  // Recomendaciones
  if (metrics.recommendations && metrics.recommendations.length > 0) {
    lines.push('RECOMENDACIONES')
    lines.push('───────────────────────────────────────────────────')
    for (const rec of metrics.recommendations) {
      lines.push(`• ${rec}`)
    }
    lines.push('')
  }

  lines.push('═══════════════════════════════════════════════════')
  lines.push('Fin del reporte')
  lines.push('═══════════════════════════════════════════════════')

  return lines.join('\n')
}

/**
 * Descarga un archivo
 */
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Genera PDF básico con jsPDF (requiere instalación)
 * Por ahora retorna un reporte de texto que puede guardarse como .txt
 */
export function exportToTXT(
  metrics: Record<string, any>,
  options: ExportOptions = {}
) {
  const { filename = 'analytics-report.txt' } = options
  const content = generateAnalyticsReport(metrics)
  downloadFile(content, filename, 'text/plain')
}
