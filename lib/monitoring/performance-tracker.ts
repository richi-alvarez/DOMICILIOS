/**
 * Performance tracking middleware for monitoring API response times
 * Tracks request duration, status, and logs to monitoring system
 */

import { logger } from './logger'

export interface PerformanceMetric {
  endpoint: string
  method: string
  statusCode: number
  responseDurationMs: number
  userId?: string
  timestamp: Date
  error?: string
}

class PerformanceTracker {
  private metrics: PerformanceMetric[] = []
  private maxMetricsInMemory = 100

  /**
   * Track API endpoint performance
   */
  trackEndpoint(
    endpoint: string,
    method: string,
    statusCode: number,
    durationMs: number,
    userId?: string,
    error?: string,
  ) {
    const metric: PerformanceMetric = {
      endpoint,
      method,
      statusCode,
      responseDurationMs: durationMs,
      userId,
      timestamp: new Date(),
      error,
    }

    this.metrics.push(metric)

    // Keep only the last N metrics in memory
    if (this.metrics.length > this.maxMetricsInMemory) {
      this.metrics = this.metrics.slice(-this.maxMetricsInMemory)
    }

    // Log slow requests (> 1 second)
    if (durationMs > 1000) {
      logger.warn('Slow endpoint detected', {
        endpoint,
        method,
        duration: durationMs,
        userId,
      })
    }

    // Log errors
    if (statusCode >= 500) {
      logger.error('Server error', new Error(error || 'Unknown error'), {
        endpoint,
        method,
        statusCode,
        duration: durationMs,
      })
    }
  }

  /**
   * Get performance statistics
   */
  getStats() {
    if (this.metrics.length === 0) {
      return { totalRequests: 0, averageResponseTime: 0, slowRequests: 0 }
    }

    const totalRequests = this.metrics.length
    const averageResponseTime =
      this.metrics.reduce((sum, m) => sum + m.responseDurationMs, 0) / totalRequests
    const slowRequests = this.metrics.filter((m) => m.responseDurationMs > 1000).length

    return {
      totalRequests,
      averageResponseTime: Math.round(averageResponseTime),
      slowRequests,
      slowPercentage: ((slowRequests / totalRequests) * 100).toFixed(2),
    }
  }

  /**
   * Get recent metrics for debugging
   */
  getRecentMetrics(limit = 20) {
    return this.metrics.slice(-limit)
  }

  /**
   * Clear metrics (useful for testing)
   */
  clear() {
    this.metrics = []
  }
}

export const performanceTracker = new PerformanceTracker()
