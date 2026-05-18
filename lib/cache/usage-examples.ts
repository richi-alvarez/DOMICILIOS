/**
 * Examples of how to use the caching layer in API endpoints
 * These are reference implementations
 */

// ─────────────────────────────────────────────────────────────────
// EXAMPLE 1: Caching a catalog query in an API route
// ─────────────────────────────────────────────────────────────────

import {
  getCatalogBySlugWithRelations,
  setCacheControlForEndpoint,
  withCacheControl,
  invalidateCatalogCache,
  CacheControl,
  cachedQueries,
} from '@/lib/cache'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/v1/catalogs/[slug]
 * Get catalog with products (cached)
 */
export async function getPublicCatalogExample(slug: string) {
  // Use cached query
  const catalog = await cachedQueries.getCatalogBySlug(
    (s) => getCatalogBySlugWithRelations(s),
    slug
  )

  if (!catalog) {
    return NextResponse.json({ error: 'Catalog not found' }, { status: 404 })
  }

  // Create response with cache headers
  const response = NextResponse.json(catalog)

  // Public data - can be cached by CDN for 5 minutes
  return withCacheControl(response, CacheControl.DEFAULT)
}

// ─────────────────────────────────────────────────────────────────
// EXAMPLE 2: User-specific data caching
// ─────────────────────────────────────────────────────────────────

import { getUserWithOrganizations } from '@/lib/db/queries'

/**
 * GET /api/user/organizations
 * Get user's organizations (cached but private)
 */
export async function getUserOrganizationsExample(userId: string) {
  const userWithOrgs = await cachedQueries.getUserOrganizations(
    (id) => getUserWithOrganizations(id),
    userId
  )

  if (!userWithOrgs) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Private data - should not be cached by CDN, only by browser
  const response = NextResponse.json(userWithOrgs)
  return withCacheControl(response, CacheControl.PRIVATE)
}

// ─────────────────────────────────────────────────────────────────
// EXAMPLE 3: Cache invalidation on data update
// ─────────────────────────────────────────────────────────────────

import { db, catalogs } from '@/db'
import { eq } from 'drizzle-orm'

/**
 * PATCH /api/catalogs/[id]
 * Update catalog and invalidate cache
 */
export async function updateCatalogExample(catalogId: string, updates: any) {
  // Update in database
  const updated = await db
    .update(catalogs)
    .set(updates)
    .where(eq(catalogs.id, catalogId))
    .returning()

  // Invalidate related caches
  await invalidateCatalogCache(catalogId)

  const response = NextResponse.json({ success: true, data: updated })
  return withCacheControl(response, CacheControl.NO_CACHE) // Don't cache update responses
}

// ─────────────────────────────────────────────────────────────────
// EXAMPLE 4: Conditional caching based on query parameters
// ─────────────────────────────────────────────────────────────────

import { getCatalogProducts } from '@/lib/db/queries'

/**
 * GET /api/v1/catalogs/[slug]/products
 * List products with optional caching (page 1 cached, others not)
 */
export async function listProductsExample(
  catalogId: string,
  page: number = 1,
  limit: number = 20
) {
  const offset = (page - 1) * limit

  // Only cache first page
  let products
  if (page === 1) {
    products = await cachedQueries.getCatalogProducts(
      (id, l, o) => getCatalogProducts(id, l, o),
      catalogId,
      limit,
      offset
    )
  } else {
    products = await getCatalogProducts(catalogId, limit, offset)
  }

  const response = NextResponse.json(products)

  // Cache only first page, others are dynamic
  if (page === 1) {
    return withCacheControl(response, CacheControl.DEFAULT)
  } else {
    return withCacheControl(response, CacheControl.SHORT)
  }
}

// ─────────────────────────────────────────────────────────────────
// EXAMPLE 5: Manual cache management for complex queries
// ─────────────────────────────────────────────────────────────────

import { cacheGetOrSet, cacheDelete, CACHE_KEYS, CACHE_TTL } from '@/lib/cache'

/**
 * Complex query with multiple steps
 */
export async function complexQueryExample(orgId: string, catalogId: string) {
  const cacheKey = `org:${orgId}:catalog:${catalogId}:complex`

  // Get or compute complex result
  const result = await cacheGetOrSet(
    cacheKey,
    async () => {
      // Step 1: Get catalog
      const catalog = await db.query.catalogs.findFirst({
        where: eq(catalogs.id, catalogId),
        with: { products: true, categories: true },
      })

      // Step 2: Transform data
      const transformed = {
        ...catalog,
        productCount: catalog?.products?.length || 0,
        categoryCount: catalog?.categories?.length || 0,
      }

      return transformed
    },
    CACHE_TTL.default
  )

  return result
}

// ─────────────────────────────────────────────────────────────────
// EXAMPLE 6: Cache stats and monitoring
// ─────────────────────────────────────────────────────────────────

import { getCacheStats } from '@/lib/cache'

/**
 * GET /api/admin/cache/stats
 * Get cache statistics (admin only)
 */
export async function getCacheStatsExample() {
  const stats = await getCacheStats()

  const response = NextResponse.json(stats)
  return withCacheControl(response, CacheControl.NO_CACHE) // Never cache admin endpoints
}

// ─────────────────────────────────────────────────────────────────
// IMPLEMENTATION CHECKLIST
// ─────────────────────────────────────────────────────────────────

/**
 * To implement caching in an endpoint:
 *
 * 1. Identify the query pattern:
 *    - Public data → use CacheControl.DEFAULT (5 min)
 *    - Private data → use CacheControl.PRIVATE (5 min, browser only)
 *    - Dynamic data → use CacheControl.NO_CACHE
 *    - Rarely changing → use CacheControl.MEDIUM (1 hour)
 *
 * 2. Use cachedQueries helper or cacheGetOrSet:
 *    const data = await cachedQueries.getCatalog(fn, id)
 *
 * 3. Add cache control header:
 *    return withCacheControl(response, CacheControl.DEFAULT)
 *
 * 4. Invalidate cache when data changes:
 *    await invalidateCatalogCache(catalogId)
 *
 * 5. Monitor cache performance:
 *    const stats = await getCacheStats()
 *
 * Expected improvements:
 * - Query time: 50-100ms → 5-10ms (10x faster with cache hit)
 * - Response time: 100-200ms → 10-50ms (5x faster)
 * - Database load: Reduced by 70-80%
 * - Throughput: 100 req/s → 500+ req/s
 */
