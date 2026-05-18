/**
 * Metrics persistence module
 * Saves performance and AI usage metrics to the database
 */

import { db, monitoringMetrics } from '@/db'
import { logger } from './logger'

export interface MetricData {
  type: 'performance' | 'ai_usage' | 'cache' | 'database'
  endpoint?: string
  method?: string
  statusCode?: number
  responseTimeMs?: number
  userId?: string
  metadata?: Record<string, any>
}

class MetricsPersistence {
  /**
   * Save a single metric to the database
   */
  async saveMetric(metric: MetricData): Promise<boolean> {
    try {
      await db.insert(monitoringMetrics).values({
        type: metric.type,
        endpoint: metric.endpoint,
        method: metric.method,
        statusCode: metric.statusCode,
        responseTimeMs: metric.responseTimeMs,
        userId: metric.userId,
        metadata: metric.metadata || {},
      })
      return true
    } catch (error) {
      logger.error('Failed to save metric', error as Error, {
        type: metric.type,
        endpoint: metric.endpoint,
      })
      return false
    }
  }

  /**
   * Save multiple metrics in batch
   */
  async saveMetrics(metrics: MetricData[]): Promise<number> {
    if (metrics.length === 0) return 0

    try {
      const values = metrics.map((m) => ({
        type: m.type,
        endpoint: m.endpoint,
        method: m.method,
        statusCode: m.statusCode,
        responseTimeMs: m.responseTimeMs,
        userId: m.userId,
        metadata: m.metadata || {},
      }))

      await db.insert(monitoringMetrics).values(values)
      return metrics.length
    } catch (error) {
      logger.error('Failed to save metrics batch', error as Error, {
        count: metrics.length,
      })
      return 0
    }
  }

  /**
   * Get metrics for a specific time range and type
   */
  async getMetrics(
    type: string,
    hoursBack: number = 24,
    limit: number = 100
  ): Promise<any[]> {
    try {
      const since = new Date()
      since.setHours(since.getHours() - hoursBack)

      const metrics = await db.query.monitoringMetrics.findMany({
        where: (t) => {
          const { and, eq, gte } = require('drizzle-orm')
          return and(eq(t.type, type), gte(t.timestamp, since))
        },
        orderBy: (t) => {
          const { desc } = require('drizzle-orm')
          return desc(t.timestamp)
        },
        limit,
      })

      return metrics
    } catch (error) {
      logger.error('Failed to get metrics', error as Error, {
        type,
        hoursBack,
      })
      return []
    }
  }

  /**
   * Get metrics summary for a time range
   */
  async getMetricsSummary(hoursBack: number = 24) {
    try {
      const since = new Date()
      since.setHours(since.getHours() - hoursBack)

      const metrics = await db.query.monitoringMetrics.findMany({
        where: (t) => {
          const { gte } = require('drizzle-orm')
          return gte(t.timestamp, since)
        },
      })

      // Calculate summary
      const summary = {
        totalMetrics: metrics.length,
        byType: {} as Record<string, number>,
        performanceStats: {
          avgResponseTime: 0,
          slowRequests: 0, // > 1000ms
          errors: 0, // statusCode >= 400
        },
      }

      let totalResponseTime = 0
      let performanceMetrics = 0

      for (const metric of metrics) {
        // Count by type
        summary.byType[metric.type] = (summary.byType[metric.type] || 0) + 1

        // Performance stats
        if (metric.responseTimeMs !== null) {
          totalResponseTime += metric.responseTimeMs
          performanceMetrics++

          if (metric.responseTimeMs > 1000) {
            summary.performanceStats.slowRequests++
          }
        }

        if (metric.statusCode && metric.statusCode >= 400) {
          summary.performanceStats.errors++
        }
      }

      summary.performanceStats.avgResponseTime =
        performanceMetrics > 0 ? Math.round(totalResponseTime / performanceMetrics) : 0

      return summary
    } catch (error) {
      logger.error('Failed to get metrics summary', error as Error)
      return null
    }
  }

  /**
   * Clean up old metrics (retention policy)
   */
  async cleanupOldMetrics(daysToRetain: number = 90): Promise<number> {
    try {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - daysToRetain)

      const result = await db
        .delete(monitoringMetrics)
        .where((t) => {
          const { lt } = require('drizzle-orm')
          return lt(t.timestamp, cutoff)
        })
        .returning({ id: monitoringMetrics.id })

      logger.info('Cleaned up old metrics', {
        deleted: result.length,
        before: cutoff.toISOString(),
      })

      return result.length
    } catch (error) {
      logger.error('Failed to cleanup old metrics', error as Error)
      return 0
    }
  }
}

export const metricsPersistence = new MetricsPersistence()
