/**
 * Scanner Analytics & Monitoring
 * Tracking de performance y uso de proveedores
 */

export interface ScanMetrics {
  // Job info
  jobId: string
  userId: string
  catalogId: string

  // Input
  totalFiles: number
  totalPages: number
  totalFilesSizeMB: number

  // Processing
  processingTimeMs: number
  ocrProviderUsed: string
  aiProviderUsed: string
  cacheHits: number
  cacheMisses: number

  // Output
  productsDetected: number
  productsAfterDedupSimple: number
  productsAfterDedupAdvanced: number
  duplicatesRemovedSimple: number
  duplicatesRemovedAdvanced: number

  // Cost
  estimatedCostUSD: number
  costBreakdown: {
    ocr: number
    ai: number
  }

  // Quality
  averageConfidence: number
  productsWithoutPrice: number
  productsWithoutDescription: number

  // Errors
  failedFiles: number
  errors: Array<{ file: string; error: string }>

  // Timestamps
  startedAt: number
  completedAt: number
}

/**
 * Estima costo de un escaneo según proveedores usados
 */
export function estimateScanCost(
  ocrProvider: string,
  aiProvider: string,
  fileCount: number,
  pageCount: number,
): { ocr: number; ai: number; total: number } {
  // Costos aproximados
  const ocrCosts: Record<string, number> = {
    tesseract: 0, // Local
    paddleocr: 0, // Local
  }

  const aiCosts: Record<string, number> = {
    claude: 0.0075, // $0.0075 por imagen
    openai: 0.03, // $0.03 por imagen
  }

  const imagesToProcess = pageCount > 0 ? pageCount : fileCount

  const ocrCost = (ocrCosts[ocrProvider] || 0) * imagesToProcess
  const aiCost = (aiCosts[aiProvider] || 0) * imagesToProcess

  return {
    ocr: ocrCost,
    ai: aiCost,
    total: ocrCost + aiCost,
  }
}

/**
 * Calcula calidad de resultados
 */
export function calculateQualityScore(metrics: Partial<ScanMetrics>): number {
  let score = 100

  // Penalización por productos sin precio
  if (metrics.productsWithoutPrice) {
    score -= metrics.productsWithoutPrice * 2
  }

  // Penalización por productos sin descripción
  if (metrics.productsWithoutDescription) {
    score -= metrics.productsWithoutDescription * 1
  }

  // Penalización por confianza baja
  if (metrics.averageConfidence && metrics.averageConfidence < 0.8) {
    score -= (1 - metrics.averageConfidence) * 20
  }

  // Bonus por deduplicación efectiva
  if (metrics.duplicatesRemovedAdvanced && metrics.productsDetected) {
    const dedupRate = metrics.duplicatesRemovedAdvanced / metrics.productsDetected
    if (dedupRate > 0.1) {
      score += Math.min(10, dedupRate * 100) // Max +10
    }
  }

  return Math.max(0, Math.min(100, score))
}

/**
 * Formatea métricas para logging
 */
export function formatMetricsLog(metrics: ScanMetrics): string {
  const duration = (metrics.completedAt - metrics.startedAt) / 1000

  return `
[Scan Complete] Job: ${metrics.jobId}
  Input: ${metrics.totalFiles} files (${metrics.totalPages} pages) - ${metrics.totalFilesSizeMB.toFixed(2)}MB
  Processing: ${duration.toFixed(1)}s (OCR: ${metrics.ocrProviderUsed}, AI: ${metrics.aiProviderUsed})
  Cache: ${metrics.cacheHits} hits, ${metrics.cacheMisses} misses
  Output: ${metrics.productsDetected} detected → ${metrics.productsAfterDedupSimple} after simple dedup → ${metrics.productsAfterDedupAdvanced} after advanced
  Duplicates: ${metrics.duplicatesRemovedSimple} simple, ${metrics.duplicatesRemovedAdvanced} advanced
  Cost: $${metrics.estimatedCostUSD.toFixed(4)} (OCR: $${metrics.costBreakdown.ocr.toFixed(4)}, AI: $${metrics.costBreakdown.ai.toFixed(4)})
  Quality: ${calculateQualityScore(metrics).toFixed(0)}/100
  Errors: ${metrics.failedFiles} files failed
`
}

/**
 * Almacena métricas en base de datos (placeholder)
 */
export async function saveScanMetrics(metrics: ScanMetrics): Promise<void> {
  try {
    // Aquí iría la lógica para guardar en DB
    // Por ahora solo logue
    console.log('[Analytics] Metrics saved:', metrics.jobId)

    // Ejemplo de análisis
    const quality = calculateQualityScore(metrics)
    if (quality < 50) {
      console.warn('[Analytics] Low quality scan detected:', {
        jobId: metrics.jobId,
        quality,
        reason: metrics.averageConfidence ? 'Low confidence' : 'Many incomplete products',
      })
    }
  } catch (error) {
    console.error('[Analytics] Failed to save metrics:', error)
  }
}

/**
 * Obtiene estadísticas agregadas de múltiples escaneos
 */
export function aggregateMetrics(
  metrics: ScanMetrics[],
): {
  totalScans: number
  totalProducts: number
  averageProcessingTime: number
  averageCost: number
  totalCost: number
  providersUsed: Set<string>
  averageQuality: number
} {
  const totalScans = metrics.length
  const totalProducts = metrics.reduce((sum, m) => sum + m.productsAfterDedupAdvanced, 0)
  const avgTime =
    metrics.reduce((sum, m) => sum + m.processingTimeMs, 0) / totalScans
  const totalCost = metrics.reduce((sum, m) => sum + m.estimatedCostUSD, 0)
  const avgCost = totalCost / totalScans

  const providersUsed = new Set<string>()
  metrics.forEach((m) => {
    providersUsed.add(m.ocrProviderUsed)
    providersUsed.add(m.aiProviderUsed)
  })

  const avgQuality =
    metrics.reduce((sum, m) => sum + calculateQualityScore(m), 0) / totalScans

  return {
    totalScans,
    totalProducts,
    averageProcessingTime: avgTime,
    averageCost: avgCost,
    totalCost,
    providersUsed,
    averageQuality,
  }
}

/**
 * Genera reporte de performance
 */
export function generatePerformanceReport(
  metrics: ScanMetrics[],
): {
  summary: string
  recommendations: string[]
} {
  const agg = aggregateMetrics(metrics)

  const recommendations: string[] = []

  // Analizan costo
  if (agg.totalCost > 100) {
    recommendations.push('Consider switching to cheaper provider (Claude instead of OpenAI)')
  }

  // Analiza velocidad
  if (agg.averageProcessingTime > 60000) {
    recommendations.push('Consider using PaddleOCR for faster processing')
  }

  // Analiza calidad
  if (agg.averageQuality < 70) {
    recommendations.push('Quality is low - check if PDFs are readable and images are clear')
  }

  const summary = `
Performance Report (${agg.totalScans} scans)
- Total Products: ${agg.totalProducts}
- Avg Time: ${(agg.averageProcessingTime / 1000).toFixed(1)}s
- Avg Cost: $${agg.averageCost.toFixed(4)}
- Total Cost: $${agg.totalCost.toFixed(2)}
- Providers: ${Array.from(agg.providersUsed).join(', ')}
- Avg Quality: ${agg.averageQuality.toFixed(0)}/100
  `

  return { summary, recommendations }
}
