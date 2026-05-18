/**
 * System health check module
 * Monitors the health of all critical services
 */

import { logger } from './logger'

export type ServiceStatus = 'healthy' | 'degraded' | 'down'

export interface ServiceHealth {
  service: string
  status: ServiceStatus
  latencyMs: number
  lastCheck: Date
  details?: string
}

interface HealthCheckResult {
  timestamp: Date
  overallStatus: ServiceStatus
  services: ServiceHealth[]
}

class HealthChecker {
  private lastResults: Map<string, ServiceHealth> = new Map()

  /**
   * Check database connection
   */
  async checkDatabase(): Promise<ServiceHealth> {
    const startTime = performance.now()
    try {
      const { db } = await import('@/db')
      await db.execute('SELECT 1')

      const latency = Math.round(performance.now() - startTime)
      return {
        service: 'database',
        status: latency > 1000 ? 'degraded' : 'healthy',
        latencyMs: latency,
        lastCheck: new Date(),
      }
    } catch (error) {
      logger.error('Database health check failed', error as Error)
      return {
        service: 'database',
        status: 'down',
        latencyMs: Math.round(performance.now() - startTime),
        lastCheck: new Date(),
        details: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Check Redis cache connection
   */
  async checkRedis(): Promise<ServiceHealth> {
    const startTime = performance.now()
    try {
      const { getRedisClient } = await import('@/lib/cache/redis')
      const client = getRedisClient()

      if (!client) {
        return {
          service: 'redis',
          status: 'degraded',
          latencyMs: Math.round(performance.now() - startTime),
          lastCheck: new Date(),
          details: 'Redis not configured',
        }
      }

      await client.ping()

      const latency = Math.round(performance.now() - startTime)
      return {
        service: 'redis',
        status: latency > 500 ? 'degraded' : 'healthy',
        latencyMs: latency,
        lastCheck: new Date(),
      }
    } catch (error) {
      logger.error('Redis health check failed', error as Error)
      return {
        service: 'redis',
        status: 'down',
        latencyMs: Math.round(performance.now() - startTime),
        lastCheck: new Date(),
        details: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Check Anthropic API connectivity
   */
  async checkAnthropicAPI(): Promise<ServiceHealth> {
    const startTime = performance.now()
    try {
      if (!process.env.ANTHROPIC_API_KEY) {
        return {
          service: 'anthropic-api',
          status: 'degraded',
          latencyMs: Math.round(performance.now() - startTime),
          lastCheck: new Date(),
          details: 'ANTHROPIC_API_KEY not configured',
        }
      }

      const { default: Anthropic } = await import('@anthropic-ai/sdk')
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

      // Make a minimal request to test connectivity
      await client.messages.countTokens({
        model: 'claude-opus-4-7',
        messages: [{ role: 'user', content: 'test' }],
      })

      const latency = Math.round(performance.now() - startTime)
      return {
        service: 'anthropic-api',
        status: latency > 5000 ? 'degraded' : 'healthy',
        latencyMs: latency,
        lastCheck: new Date(),
      }
    } catch (error) {
      logger.warn('Anthropic API health check failed', {
        service: 'anthropic-api',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      return {
        service: 'anthropic-api',
        status: 'down',
        latencyMs: Math.round(performance.now() - startTime),
        lastCheck: new Date(),
        details: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Check Stripe API connectivity
   */
  async checkStripeAPI(): Promise<ServiceHealth> {
    const startTime = performance.now()
    try {
      if (!process.env.STRIPE_SECRET_KEY) {
        return {
          service: 'stripe-api',
          status: 'degraded',
          latencyMs: Math.round(performance.now() - startTime),
          lastCheck: new Date(),
          details: 'STRIPE_SECRET_KEY not configured',
        }
      }

      const Stripe = require('stripe')
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

      // Make a minimal request to test connectivity
      await stripe.customers.list({ limit: 1 })

      const latency = Math.round(performance.now() - startTime)
      return {
        service: 'stripe-api',
        status: latency > 5000 ? 'degraded' : 'healthy',
        latencyMs: latency,
        lastCheck: new Date(),
      }
    } catch (error) {
      logger.warn('Stripe API health check failed', {
        service: 'stripe-api',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      return {
        service: 'stripe-api',
        status: 'down',
        latencyMs: Math.round(performance.now() - startTime),
        lastCheck: new Date(),
        details: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Run all health checks
   */
  async checkAll(): Promise<HealthCheckResult> {
    const checks = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkAnthropicAPI(),
      this.checkStripeAPI(),
    ])

    // Store results
    for (const check of checks) {
      this.lastResults.set(check.service, check)
    }

    // Determine overall status
    const downServices = checks.filter((c) => c.status === 'down').length
    const degradedServices = checks.filter((c) => c.status === 'degraded').length

    let overallStatus: ServiceStatus = 'healthy'
    if (downServices > 0) {
      overallStatus = 'down'
    } else if (degradedServices >= 2) {
      overallStatus = 'degraded'
    }

    return {
      timestamp: new Date(),
      overallStatus,
      services: checks,
    }
  }

  /**
   * Get last known status for a service
   */
  getLastStatus(service: string): ServiceHealth | null {
    return this.lastResults.get(service) || null
  }

  /**
   * Get all last known statuses
   */
  getAllLastStatus(): ServiceHealth[] {
    return Array.from(this.lastResults.values())
  }
}

export const healthChecker = new HealthChecker()
