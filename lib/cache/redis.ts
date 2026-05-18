/**
 * Redis caching client for database query results
 * Provides simple get/set/delete with TTL support
 *
 * Note: This module is server-only (Node.js) and uses dynamic require()
 * to avoid bundling ioredis in client code. The webpack config in next.config.ts
 * ensures this module is only bundled for server builds.
 */

// Lazy load ioredis only when needed (Node.js server environment)
let Redis: any = null
let redisClient: any = null

export function getRedisClient(): any {
  if (redisClient) return redisClient

  // Only connect to Redis if URL is provided
  if (!process.env.REDIS_URL) {
    console.log('[Cache] Redis not configured, using in-memory cache')
    return null
  }

  try {
    // Require ioredis directly in server context
    const RedisClient = require('ioredis')

    redisClient = new RedisClient(process.env.REDIS_URL, {
      // Connection options
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      enableOfflineQueue: true,

      // Retry strategy
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000)
        return delay
      },

      // Error handling
      reconnectOnError: (err: any) => {
        const targetError = 'READONLY'
        if (err.message.includes(targetError)) {
          return true
        }
        return false
      },
    })

    redisClient.on('error', (err: any) => {
      console.error('[Redis Error]', err.message)
    })

    redisClient.on('connect', () => {
      console.log('[Redis] Connected')
    })

    return redisClient
  } catch (error) {
    console.error('[Redis] Connection failed:', error)
    return null
  }
}

/**
 * Get value from cache
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = getRedisClient()
  if (!redis) return null

  try {
    const data = await redis.get(key)
    if (!data) return null

    return JSON.parse(data) as T
  } catch (error) {
    console.error(`[Cache] Get failed for key ${key}:`, error)
    return null
  }
}

/**
 * Set value in cache with TTL
 */
export async function cacheSet<T>(key: string, value: T, ttlSeconds: number = 300): Promise<void> {
  const redis = getRedisClient()
  if (!redis) return

  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value))
  } catch (error) {
    console.error(`[Cache] Set failed for key ${key}:`, error)
  }
}

/**
 * Delete value from cache
 */
export async function cacheDelete(key: string): Promise<void> {
  const redis = getRedisClient()
  if (!redis) return

  try {
    await redis.del(key)
  } catch (error) {
    console.error(`[Cache] Delete failed for key ${key}:`, error)
  }
}

/**
 * Delete multiple keys by pattern
 * WARNING: Expensive operation, use sparingly
 */
export async function cacheDeleteByPattern(pattern: string): Promise<void> {
  const redis = getRedisClient()
  if (!redis) return

  try {
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  } catch (error) {
    console.error(`[Cache] Delete pattern failed for ${pattern}:`, error)
  }
}

/**
 * Clear all cache
 * WARNING: Use only in development/testing
 */
export async function cacheClear(): Promise<void> {
  const redis = getRedisClient()
  if (!redis) return

  try {
    await redis.flushdb()
  } catch (error) {
    console.error('[Cache] Clear failed:', error)
  }
}

/**
 * Get or set value (compute if not cached)
 */
export async function cacheGetOrSet<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> {
  // Try to get from cache first
  const cached = await cacheGet<T>(key)
  if (cached) {
    return cached
  }

  // Compute value
  const value = await fetchFn()

  // Set in cache
  await cacheSet(key, value, ttlSeconds)

  return value
}

/**
 * Cache stats (for monitoring)
 */
export async function getCacheStats() {
  const redis = getRedisClient()
  if (!redis) {
    return { enabled: false }
  }

  try {
    const info = await redis.info('stats')
    const dbSize = await redis.dbsize()

    return {
      enabled: true,
      dbSize,
      info,
    }
  } catch (error) {
    return { enabled: false, error: String(error) }
  }
}

// In-memory fallback cache for when Redis is unavailable
const inMemoryCache = new Map<string, { value: any; expiresAt: number }>()

/**
 * Cleanup expired entries in-memory cache
 */
function cleanupInMemoryCache() {
  const now = Date.now()
  for (const [key, { expiresAt }] of inMemoryCache.entries()) {
    if (expiresAt < now) {
      inMemoryCache.delete(key)
    }
  }
}

/**
 * Fallback: In-memory cache when Redis unavailable
 */
export async function getInMemoryCache<T>(key: string): Promise<T | null> {
  cleanupInMemoryCache()
  const entry = inMemoryCache.get(key)
  if (!entry || entry.expiresAt < Date.now()) {
    return null
  }
  return entry.value as T
}

export async function setInMemoryCache<T>(
  key: string,
  value: T,
  ttlSeconds: number = 300
): Promise<void> {
  inMemoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  })
}
