/**
 * Scanner Module Index
 * Advanced scanning utilities
 */

export {
  levenshteinSimilarity,
  productSimilarity,
  deduplicateAdvanced,
  detectLanguage,
  getLanguageByRegion,
  normalizeForComparison,
  groupProductsByCategory,
  deduplicateByCategoryAdvanced,
} from './advanced-dedup'

export {
  estimateScanCost,
  calculateQualityScore,
  formatMetricsLog,
  saveScanMetrics,
  aggregateMetrics,
  generatePerformanceReport,
} from './analytics'

export type { ScanMetrics } from './analytics'
