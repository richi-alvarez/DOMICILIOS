import { useEffect, useState } from 'react'

export interface ScanMetricsData {
  totalScans: number
  totalProducts: number
  averageProcessingTime: number
  averageCost: number
  totalCost: number
  averageQuality: number
  providers: {
    ocr: Record<string, { usage: number; accuracy: number }>
    ai: Record<string, { usage: number; cost: number }>
  }
  last24h: {
    scans: number
    products: number
    cost: number
  }
  trends: {
    costPerProduct: number
    qualityTrend: 'improving' | 'stable' | 'declining'
    speedTrend: 'improving' | 'stable' | 'declining'
  }
  recommendations: string[]
}

export function useScanMetrics() {
  const [metrics, setMetrics] = useState<ScanMetricsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/analytics/metrics')
        if (!response.ok) {
          throw new Error('Failed to fetch metrics')
        }
        const data = await response.json()
        setMetrics(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        setMetrics(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMetrics()

    // Poll cada 30 segundos
    const interval = setInterval(fetchMetrics, 30000)
    return () => clearInterval(interval)
  }, [])

  return { metrics, isLoading, error }
}
