/**
 * Query caching decorator and utilities
 * Automatically caches database query results
 *
 * Server-only module. Import this only in server actions or API routes.
 */

import { cacheGetOrSet, cacheDelete, cacheDeleteByPattern } from './redis'

/**
 * Cache decorator for async functions
 * Automatically caches results based on key generator
 */
export function withCache<T extends any[], R>(
  keyGenerator: (...args: T) => string,
  ttlSeconds: number = 300
) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: T) {
      const cacheKey = keyGenerator(...args)

      return cacheGetOrSet(
        cacheKey,
        () => originalMethod.apply(this, args),
        ttlSeconds
      )
    }

    return descriptor
  }
}

/**
 * Higher-order function to wrap async functions with caching
 */
export function withCacheHOF<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  keyGenerator: (...args: T) => string,
  ttlSeconds: number = 300
) {
  return async (...args: T): Promise<R> => {
    const cacheKey = keyGenerator(...args)
    return cacheGetOrSet(cacheKey, () => fn(...args), ttlSeconds)
  }
}

// ─────────────────────────────────────────────────────────────────
// SPECIFIC QUERY CACHING FUNCTIONS
// ─────────────────────────────────────────────────────────────────

import { CACHE_KEYS, CACHE_TTL } from '@/lib/db/queries'

/**
 * Cached catalog queries
 */
export const cachedQueries = {
  // Catalogs
  async getCatalog(fn: (id: string) => Promise<any>, id: string) {
    const key = CACHE_KEYS.catalog(id)
    return cacheGetOrSet(key, () => fn(id), CACHE_TTL.default)
  },

  async getCatalogBySlug(fn: (slug: string) => Promise<any>, slug: string) {
    const key = CACHE_KEYS.catalogBySlug(slug)
    return cacheGetOrSet(key, () => fn(slug), CACHE_TTL.default)
  },

  async getCatalogProducts(
    fn: (id: string, limit: number, offset: number) => Promise<any>,
    id: string,
    limit: number = 20,
    offset: number = 0
  ) {
    // Only cache first page
    if (offset > 0) {
      return fn(id, limit, offset)
    }
    const key = CACHE_KEYS.catalogProducts(id)
    return cacheGetOrSet(key, () => fn(id, limit, offset), CACHE_TTL.short)
  },

  async getCatalogCategories(fn: (id: string) => Promise<any>, id: string) {
    const key = CACHE_KEYS.catalogCategories(id)
    return cacheGetOrSet(key, () => fn(id), CACHE_TTL.default)
  },

  async getOrgCatalogs(fn: (orgId: string) => Promise<any>, orgId: string) {
    const key = CACHE_KEYS.orgCatalogs(orgId)
    return cacheGetOrSet(key, () => fn(orgId), CACHE_TTL.default)
  },

  // Products
  async getProduct(fn: (id: string) => Promise<any>, id: string) {
    const key = CACHE_KEYS.product(id)
    return cacheGetOrSet(key, () => fn(id), CACHE_TTL.default)
  },

  // Auth
  async getUserOrganizations(fn: (userId: string) => Promise<any>, userId: string) {
    const key = CACHE_KEYS.userOrgs(userId)
    return cacheGetOrSet(key, () => fn(userId), CACHE_TTL.long)
  },

  async getUserMemberships(fn: (userId: string) => Promise<any>, userId: string) {
    const key = CACHE_KEYS.userMemberships(userId)
    return cacheGetOrSet(key, () => fn(userId), CACHE_TTL.long)
  },

  // Orders
  async getCatalogOrders(
    fn: (catalogId: string, status?: string) => Promise<any>,
    catalogId: string,
    status?: string
  ) {
    const key = CACHE_KEYS.catalogOrders(catalogId)
    return cacheGetOrSet(key, () => fn(catalogId, status), CACHE_TTL.short)
  },

  // Analytics
  async getCatalogAnalytics(
    fn: (catalogId: string, days: number) => Promise<any>,
    catalogId: string,
    days: number = 30
  ) {
    const key = CACHE_KEYS.catalogAnalytics(catalogId)
    return cacheGetOrSet(key, () => fn(catalogId, days), CACHE_TTL.veryLong)
  },
}

// ─────────────────────────────────────────────────────────────────
// CACHE INVALIDATION STRATEGIES
// ─────────────────────────────────────────────────────────────────

/**
 * Invalidate all caches for a catalog
 * Call when catalog is updated
 */
export async function invalidateCatalogCache(catalogId: string) {
  await Promise.all([
    cacheDelete(CACHE_KEYS.catalog(catalogId)),
    cacheDeleteByPattern(`catalog:${catalogId}:*`),
  ])
}

/**
 * Invalidate all caches for an organization
 * Call when org structure changes
 */
export async function invalidateOrgCache(orgId: string) {
  await Promise.all([
    cacheDeleteByPattern(`org:${orgId}:*`),
  ])
}

/**
 * Invalidate user auth cache
 * Call when user permissions change
 */
export async function invalidateUserCache(userId: string) {
  await Promise.all([
    cacheDelete(CACHE_KEYS.userOrgs(userId)),
    cacheDelete(CACHE_KEYS.userMemberships(userId)),
  ])
}

/**
 * Invalidate product cache
 * Call when product is updated
 */
export async function invalidateProductCache(productId: string, catalogId: string) {
  await Promise.all([
    cacheDelete(CACHE_KEYS.product(productId)),
    cacheDelete(CACHE_KEYS.catalogProducts(catalogId)),
  ])
}

/**
 * Invalidate analytics cache
 * Call after order is created
 */
export async function invalidateAnalyticsCache(catalogId: string) {
  await cacheDelete(CACHE_KEYS.catalogAnalytics(catalogId))
}

/**
 * Invalidate all caches
 * WARNING: Use only in development/testing
 */
export async function invalidateAllCaches() {
  // This would require a full cache flush from Redis client
  // Only available during development
  if (process.env.NODE_ENV !== 'production') {
    const { cacheClear } = await import('./redis')
    await cacheClear()
  }
}
