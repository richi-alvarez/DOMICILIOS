/**
 * HTTP Response Caching Headers Middleware
 * Manages browser and CDN caching strategies
 */

import { NextResponse } from 'next/server'

/**
 * Cache control options
 */
export enum CacheControl {
  // No caching
  NO_CACHE = 'no-cache, no-store, must-revalidate',

  // Short-lived (1 minute) - for frequently changing data
  SHORT = 'public, max-age=60, must-revalidate',

  // Default (5 minutes) - for most API responses
  DEFAULT = 'public, max-age=300, s-maxage=300',

  // Medium (1 hour) - for stable content
  MEDIUM = 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',

  // Long (1 day) - for static content
  LONG = 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',

  // Very long (30 days) - for images, static files
  VERY_LONG = 'public, max-age=2592000, immutable',

  // No cache but allow conditional requests (If-Modified-Since)
  REVALIDATE = 'public, must-revalidate',

  // Private (not shared with CDN)
  PRIVATE = 'private, max-age=300, must-revalidate',
}

/**
 * Add cache control headers to response
 */
export function withCacheControl(response: NextResponse, cacheControl: CacheControl) {
  response.headers.set('Cache-Control', cacheControl)
  return response
}

/**
 * Add ETag header for cache validation
 */
export function withETag(response: NextResponse, data: any) {
  // Simple ETag generation from data hash
  const hash = require('crypto').createHash('sha256').update(JSON.stringify(data)).digest('hex')
  response.headers.set('ETag', `"${hash}"`)
  return response
}

/**
 * Add Last-Modified header
 */
export function withLastModified(response: NextResponse, date: Date = new Date()) {
  response.headers.set('Last-Modified', date.toUTCString())
  return response
}

/**
 * API Response caching strategy
 */
export const API_CACHE_HEADERS = {
  // Public data (products, catalogs)
  public: CacheControl.DEFAULT,

  // User-specific data (orders, settings)
  private: CacheControl.PRIVATE,

  // Frequently updated (orders, analytics)
  short: CacheControl.SHORT,

  // Rarely updated (catalog settings)
  long: CacheControl.MEDIUM,

  // Dynamic content (no caching)
  dynamic: CacheControl.NO_CACHE,
}

/**
 * Middleware to add cache headers to all API responses
 * Usage in route.ts:
 *
 * const response = NextResponse.json({ ... })
 * return withCacheControl(response, CacheControl.DEFAULT)
 */

/**
 * Helper to set cache control based on endpoint type
 */
export function setCacheControlForEndpoint(
  response: NextResponse,
  type: 'public' | 'private' | 'short' | 'long' | 'dynamic'
) {
  const cacheControl = API_CACHE_HEADERS[type]
  return withCacheControl(response, cacheControl)
}

/**
 * CDN cache headers
 */
export const CDN_HEADERS = {
  // Tell CDN to cache
  setCacheability: (maxAge: number = 300) => ({
    'Cache-Control': `public, max-age=${maxAge}, s-maxage=${maxAge}`,
  }),

  // Tell CDN not to cache
  noCache: () => ({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
  }),

  // Cache with stale-while-revalidate
  staleWhileRevalidate: (maxAge: number = 300, staleAge: number = 86400) => ({
    'Cache-Control': `public, max-age=${maxAge}, s-maxage=${maxAge}, stale-while-revalidate=${staleAge}`,
  }),
}

/**
 * Browser cache headers
 */
export const BROWSER_CACHE_HEADERS = {
  // Aggressive caching for images/static files
  static: () => ({
    'Cache-Control': 'public, max-age=31536000, immutable',
  }),

  // For HTML pages
  html: () => ({
    'Cache-Control': 'public, max-age=3600, must-revalidate',
  }),

  // For API responses
  api: () => ({
    'Cache-Control': 'public, max-age=300, must-revalidate',
  }),

  // For user-specific data
  userSpecific: () => ({
    'Cache-Control': 'private, max-age=300, must-revalidate',
  }),
}

/**
 * Generate cache key for response deduplication
 */
export function generateCacheKey(method: string, path: string, query?: Record<string, any>) {
  const queryStr = query ? new URLSearchParams(query).toString() : ''
  return `${method}:${path}${queryStr ? '?' + queryStr : ''}`
}

/**
 * Check if request can be cached (GET/HEAD only)
 */
export function isCacheable(method: string): boolean {
  return method === 'GET' || method === 'HEAD'
}

/**
 * Parse cache control header
 */
export function parseCacheControl(header: string): Record<string, string | boolean> {
  const result: Record<string, string | boolean> = {}
  const parts = header.split(',')

  for (const part of parts) {
    const [key, value] = part.trim().split('=')
    result[key] = value ? value : true
  }

  return result
}

/**
 * Check if response should be cached based on status code
 */
export function isCacheableStatus(status: number): boolean {
  // Cache successful responses (200, 203, 204, 206)
  // Also cache redirects (300, 301, 308) and client errors (404, 405, 410, 414, 501)
  return (
    [200, 203, 204, 206, 300, 301, 308, 404, 405, 410, 414, 501].includes(status)
  )
}
