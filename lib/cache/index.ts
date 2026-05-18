/**
 * Central export for all caching utilities
 * Provides Redis caching, HTTP headers, and query caching
 *
 * Note: Files that import from this module should use 'use server'
 * if they need server-only execution context
 */

// Redis caching
export {
  getRedisClient,
  cacheGet,
  cacheSet,
  cacheDelete,
  cacheDeleteByPattern,
  cacheClear,
  cacheGetOrSet,
  getCacheStats,
  getInMemoryCache,
  setInMemoryCache,
} from './redis'

// Query caching
export {
  withCache,
  withCacheHOF,
  cachedQueries,
  invalidateCatalogCache,
  invalidateOrgCache,
  invalidateUserCache,
  invalidateProductCache,
  invalidateAnalyticsCache,
  invalidateAllCaches,
} from './query-cache'

// HTTP response caching
export {
  CacheControl,
  withCacheControl,
  withETag,
  withLastModified,
  API_CACHE_HEADERS,
  setCacheControlForEndpoint,
  CDN_HEADERS,
  BROWSER_CACHE_HEADERS,
  generateCacheKey,
  isCacheable,
  parseCacheControl,
  isCacheableStatus,
} from './http-cache'

// Re-export cache keys and TTLs
export { CACHE_KEYS, CACHE_TTL } from '@/lib/db/queries'
