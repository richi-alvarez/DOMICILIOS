/**
 * Alert management module
 * Monitors system health and creates alerts when thresholds are exceeded
 */

import { db, monitoringAlerts } from '@/db'
import { logger } from './logger'
import { healthChecker } from './health-check'
import { metricsPersistence } from './metrics-persistence'
import { sendAlertNotifications } from './notifications'

export interface Alert {
  severity: 'info' | 'warning' | 'critical'
  title: string
  description: string
  service: 'api' | 'database' | 'cache' | 'ai'
  metadata?: Record<string, any>
}

// Alert thresholds
export const ALERT_THRESHOLDS = {
  slowEndpoint: 2000, // > 2s = slow
  errorRate: 5, // > 5% errors
  cacheHitRate: 50, // < 50% = bad
  aiCostPerDay: 50, // > $50/day
  highResponseTime: 1000, // > 1s average
  serviceDownThreshold: 2, // 2+ failed health checks = alert
}

class AlertManager {
  private lastAlertTime: Map<string, Date> = new Map()
  private alertCooldown = 5 * 60 * 1000 // 5 minutes

  /**
   * Create a new alert
   */
  async createAlert(alert: Alert): Promise<boolean> {
    try {
      // Check cooldown to avoid alert spam
      const alertKey = `${alert.service}-${alert.title}`
      const lastAlert = this.lastAlertTime.get(alertKey)
      if (lastAlert && Date.now() - lastAlert.getTime() < this.alertCooldown) {
        return false // Skip due to cooldown
      }

      await db.insert(monitoringAlerts).values({
        severity: alert.severity,
        title: alert.title,
        description: alert.description,
        service: alert.service,
        metadata: alert.metadata || {},
      })

      this.lastAlertTime.set(alertKey, new Date())

      // Send notifications for warning and critical alerts
      if (alert.severity !== 'info') {
        void sendAlertNotifications({
          severity: alert.severity as 'warning' | 'critical',
          title: alert.title,
          description: alert.description,
          service: alert.service,
          triggeredAt: new Date(),
          metadata: alert.metadata,
        })
      }

      logger.warn('Alert created', {
        service: alert.service,
        severity: alert.severity,
        title: alert.title,
      })

      return true
    } catch (error) {
      logger.error('Failed to create alert', error as Error, {
        service: alert.service,
      })
      return false
    }
  }

  /**
   * Resolve an alert by ID
   */
  async resolveAlert(alertId: string): Promise<boolean> {
    try {
      const { eq } = await import('drizzle-orm')
      await db
        .update(monitoringAlerts)
        .set({ resolvedAt: new Date() })
        .where(eq(monitoringAlerts.id, alertId))

      return true
    } catch (error) {
      logger.error('Failed to resolve alert', error as Error)
      return false
    }
  }

  /**
   * Get unresolved alerts
   */
  async getUnresolvedAlerts(): Promise<any[]> {
    try {
      const { isNull } = await import('drizzle-orm')
      const alerts = await db.query.monitoringAlerts.findMany({
        where: (t) => isNull(t.resolvedAt),
        orderBy: (t) => {
          const { desc } = require('drizzle-orm')
          return desc(t.triggeredAt)
        },
        limit: 50,
      })

      return alerts
    } catch (error) {
      logger.error('Failed to get alerts', error as Error)
      return []
    }
  }

  /**
   * Check health and create alerts if needed
   */
  async checkHealthAndAlert(): Promise<void> {
    try {
      const health = await healthChecker.checkAll()

      // Check for down services
      for (const service of health.services) {
        if (service.status === 'down') {
          await this.createAlert({
            severity: 'critical',
            title: `${service.service} is down`,
            description: `${service.service} health check failed: ${service.details || 'No details'}`,
            service: service.service as any,
            metadata: {
              latencyMs: service.latencyMs,
              lastCheck: service.lastCheck,
            },
          })
        } else if (service.status === 'degraded') {
          await this.createAlert({
            severity: 'warning',
            title: `${service.service} is degraded`,
            description: `${service.service} response time: ${service.latencyMs}ms (slow)`,
            service: service.service as any,
            metadata: {
              latencyMs: service.latencyMs,
            },
          })
        }
      }
    } catch (error) {
      logger.error('Failed to check health and alert', error as Error)
    }
  }

  /**
   * Check performance metrics and create alerts
   */
  async checkPerformanceAndAlert(): Promise<void> {
    try {
      const summary = await metricsPersistence.getMetricsSummary(1) // Last 1 hour

      if (!summary) return

      // Check for high error rate
      const totalMetrics = summary.performanceStats.errors + summary.performanceStats.slowRequests
      if (totalMetrics > 0) {
        const errorRate = (summary.performanceStats.errors / totalMetrics) * 100
        if (errorRate > ALERT_THRESHOLDS.errorRate) {
          await this.createAlert({
            severity: 'warning',
            title: 'High error rate detected',
            description: `Error rate: ${errorRate.toFixed(2)}% (threshold: ${ALERT_THRESHOLDS.errorRate}%)`,
            service: 'api',
            metadata: {
              errorRate: parseFloat(errorRate.toFixed(2)),
              errorCount: summary.performanceStats.errors,
            },
          })
        }
      }

      // Check for slow responses
      if (summary.performanceStats.avgResponseTime > ALERT_THRESHOLDS.highResponseTime) {
        await this.createAlert({
          severity: 'warning',
          title: 'High average response time',
          description: `Average response time: ${summary.performanceStats.avgResponseTime}ms (threshold: ${ALERT_THRESHOLDS.highResponseTime}ms)`,
          service: 'api',
          metadata: {
            avgResponseTime: summary.performanceStats.avgResponseTime,
            slowRequests: summary.performanceStats.slowRequests,
          },
        })
      }
    } catch (error) {
      logger.error('Failed to check performance and alert', error as Error)
    }
  }

  /**
   * Run all alert checks (call this periodically)
   */
  async runAllChecks(): Promise<void> {
    await Promise.all([this.checkHealthAndAlert(), this.checkPerformanceAndAlert()])
  }
}

export const alertManager = new AlertManager()
