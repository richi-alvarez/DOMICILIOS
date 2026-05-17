/**
 * Middleware for automatic performance tracking
 * Integrates with Next.js to capture metrics on all requests
 */

import { NextRequest, NextResponse } from 'next/server'
import { performanceTracker } from './performance-tracker'
import { logger } from './logger'

/**
 * Wrap API routes to track performance
 * Usage in route handler:
 * export const POST = trackApiPerformance(async (req) => { ... })
 */
export function trackApiPerformance(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    const startTime = performance.now()
    const endpoint = req.nextUrl.pathname
    const method = req.method

    try {
      const response = await handler(req)
      const duration = performance.now() - startTime

      performanceTracker.trackEndpoint(
        endpoint,
        method,
        response.status,
        Math.round(duration),
      )

      logger.debug(`${method} ${endpoint} - ${response.status} (${Math.round(duration)}ms)`, {
        endpoint,
        method,
        duration: Math.round(duration),
        status: response.status,
      })

      return response
    } catch (error) {
      const duration = performance.now() - startTime

      performanceTracker.trackEndpoint(
        endpoint,
        method,
        500,
        Math.round(duration),
        undefined,
        error instanceof Error ? error.message : 'Unknown error',
      )

      logger.error(`${method} ${endpoint} failed`, error as Error, {
        endpoint,
        method,
        duration: Math.round(duration),
      })

      throw error
    }
  }
}

/**
 * Track server action performance
 * Usage in server action:
 * 'use server'
 * export async function myAction(data) {
 *   return trackServerAction('myAction', async () => {
 *     // ... action logic
 *   })
 * }
 */
export async function trackServerAction<T>(
  actionName: string,
  action: () => Promise<T>,
): Promise<T> {
  const startTime = performance.now()

  try {
    const result = await action()
    const duration = performance.now() - startTime

    performanceTracker.trackEndpoint(
      `/actions/${actionName}`,
      'POST',
      200,
      Math.round(duration),
    )

    logger.debug(`Action ${actionName} completed`, {
      action: actionName,
      duration: Math.round(duration),
    })

    return result
  } catch (error) {
    const duration = performance.now() - startTime

    performanceTracker.trackEndpoint(
      `/actions/${actionName}`,
      'POST',
      500,
      Math.round(duration),
      undefined,
      error instanceof Error ? error.message : 'Unknown error',
    )

    logger.error(`Action ${actionName} failed`, error as Error, {
      action: actionName,
      duration: Math.round(duration),
    })

    throw error
  }
}
