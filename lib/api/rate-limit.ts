import { logger } from '@/lib/monitoring/logger'

/**
 * In-memory rate limiter for development
 * In production, use Redis or similar
 */
interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up old entries every minute to prevent memory leaks
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 60000)

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime?: number
  retryAfter?: number
}

/**
 * Check if request is within rate limit
 * @param identifier - Unique identifier (IP, userId, etc)
 * @param limit - Max requests allowed
 * @param windowMs - Time window in milliseconds
 */
export async function checkRateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const now = Date.now()
  const current = rateLimitStore.get(identifier)

  // First request or window expired
  if (!current || now > current.resetTime) {
    const resetTime = now + windowMs
    rateLimitStore.set(identifier, { count: 1, resetTime })

    return {
      allowed: true,
      remaining: limit - 1,
      resetTime,
    }
  }

  // Limit exceeded
  if (current.count >= limit) {
    const retryAfter = Math.ceil((current.resetTime - now) / 1000)
    logger.warn('Rate limit exceeded', {
      identifier,
      limit,
      retryAfter,
    })

    return {
      allowed: false,
      remaining: 0,
      retryAfter,
    }
  }

  // Increment and allow
  current.count++
  return {
    allowed: true,
    remaining: limit - current.count,
    resetTime: current.resetTime,
  }
}

/**
 * Rate limit configuration for different endpoint types
 */
export const rateLimitConfig = {
  // Authentication endpoints: 5 requests per minute per IP
  auth: {
    limit: 5,
    windowMs: 60000,
    message: 'Too many authentication attempts. Please try again later.',
  },

  // AI generation endpoints: 10 requests per minute per user
  ai: {
    limit: 10,
    windowMs: 60000,
    message: 'Too many AI generation requests. Please wait before trying again.',
  },

  // General API endpoints: 100 requests per minute per user
  api: {
    limit: 100,
    windowMs: 60000,
    message: 'Too many requests. Please try again later.',
  },

  // Order creation: 20 per hour per user
  orders: {
    limit: 20,
    windowMs: 3600000,
    message: 'Too many orders. Please try again later.',
  },

  // Strict limit for sensitive operations: 3 per minute
  sensitive: {
    limit: 3,
    windowMs: 60000,
    message: 'Too many sensitive operations. Please try again later.',
  },
}

/**
 * Get rate limit config for an endpoint
 */
export function getRateLimitConfig(endpoint: keyof typeof rateLimitConfig) {
  return rateLimitConfig[endpoint]
}

/**
 * Check multiple rate limits (cascade check)
 */
export async function checkMultipleRateLimits(
  checks: Array<{
    identifier: string
    config: (typeof rateLimitConfig)[keyof typeof rateLimitConfig]
  }>
): Promise<RateLimitResult> {
  for (const { identifier, config } of checks) {
    const result = await checkRateLimit(identifier, config.limit, config.windowMs)
    if (!result.allowed) {
      return result
    }
  }

  return {
    allowed: true,
    remaining: 999, // Multiple checks passed
  }
}

/**
 * Reset rate limit for a specific identifier (admin/testing)
 */
export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier)
  logger.info('Rate limit reset', { identifier })
}

/**
 * Get rate limit status
 */
export function getRateLimitStatus(identifier: string): RateLimitEntry | null {
  return rateLimitStore.get(identifier) || null
}

/**
 * Clear all rate limits (admin/testing)
 */
export function clearAllRateLimits(): void {
  rateLimitStore.clear()
  logger.warn('All rate limits cleared')
}

/**
 * Get memory usage stats (for monitoring)
 */
export function getRateLimitStats() {
  return {
    activeIdentifiers: rateLimitStore.size,
    memoryUsage: rateLimitStore.size * 100, // Approximate bytes
    entries: Array.from(rateLimitStore.entries()).map(([id, entry]) => ({
      identifier: id.substring(0, 20) + '...', // Don't expose full identifier
      requests: entry.count,
      resetIn: Math.max(0, entry.resetTime - Date.now()),
    })),
  }
}
