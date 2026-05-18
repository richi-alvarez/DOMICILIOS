/**
 * Optimized database queries with proper relations and indexes
 * Prevents N+1 problems by using Drizzle relations
 */

import { db, catalogs, products, categories, memberships, users, organizations, orders, analyticsEvents } from '@/db'
import { eq, and, inArray, gt } from 'drizzle-orm'

// ──────────────────────────────────────────────────────────────
// CATALOG QUERIES
// ──────────────────────────────────────────────────────────────

/**
 * Get catalog with all related data (products, categories, blocks)
 * Single query instead of N+1
 */
export async function getCatalogWithRelations(catalogId: string) {
  return await db.query.catalogs.findFirst({
    where: eq(catalogs.id, catalogId),
    with: {
      products: {
        where: eq(products.active, true),
        orderBy: (p) => [p.position, p.createdAt],
      },
      categories: {
        orderBy: (c) => [c.position],
      },
      blocks: {
        where: eq(products.active, true),
        orderBy: (b) => [b.position],
      },
    },
  })
}

/**
 * Get catalog by slug with all relations
 */
export async function getCatalogBySlugWithRelations(slug: string) {
  return await db.query.catalogs.findFirst({
    where: eq(catalogs.slug, slug),
    with: {
      products: {
        where: eq(products.active, true),
        orderBy: (p) => [p.position, p.createdAt],
      },
      categories: {
        orderBy: (c) => [c.position],
      },
    },
  })
}

/**
 * Get all catalogs for an organization with product counts
 * Uses batch loading to avoid N+1
 */
export async function getOrgCatalogs(orgId: string) {
  return await db.query.catalogs.findMany({
    where: eq(catalogs.orgId, orgId),
    with: {
      products: {
        columns: { id: true }, // Only fetch IDs for counting
        where: eq(products.active, true),
      },
    },
    orderBy: (c) => [c.createdAt],
  })
}

// ──────────────────────────────────────────────────────────────
// PRODUCT QUERIES
// ──────────────────────────────────────────────────────────────

/**
 * Get products for a catalog (paginated)
 */
export async function getCatalogProducts(
  catalogId: string,
  limit: number = 20,
  offset: number = 0
) {
  return await db.query.products.findMany({
    where: and(
      eq(products.catalogId, catalogId),
      eq(products.active, true)
    ),
    with: {
      category: {
        columns: { id: true, name: true, slug: true },
      },
    },
    orderBy: (p) => [p.position, p.createdAt],
    limit,
    offset,
  })
}

/**
 * Batch get products for multiple catalogs
 * Prevents N+1 when loading catalogs with products
 */
export async function getProductsByCatalogIds(catalogIds: string[]) {
  if (catalogIds.length === 0) return []

  return await db.query.products.findMany({
    where: and(
      inArray(products.catalogId, catalogIds),
      eq(products.active, true)
    ),
    with: {
      category: {
        columns: { id: true, name: true },
      },
    },
    orderBy: (p) => [p.catalogId, p.position],
  })
}

/**
 * Get product with full details
 */
export async function getProductWithCategory(productId: string) {
  return await db.query.products.findFirst({
    where: eq(products.id, productId),
    with: {
      category: true,
    },
  })
}

// ──────────────────────────────────────────────────────────────
// CATEGORY QUERIES
// ──────────────────────────────────────────────────────────────

/**
 * Get all categories for a catalog with product count
 */
export async function getCatalogCategories(catalogId: string) {
  return await db.query.categories.findMany({
    where: eq(categories.catalogId, catalogId),
    with: {
      products: {
        columns: { id: true },
        where: eq(products.active, true),
      },
    },
    orderBy: (c) => [c.position],
  })
}

// ──────────────────────────────────────────────────────────────
// MEMBERSHIP & AUTH QUERIES
// ──────────────────────────────────────────────────────────────

/**
 * Get user with all organizations (memberships)
 * Single query with relations
 */
export async function getUserWithOrganizations(userId: string) {
  return await db.query.users.findFirst({
    where: eq(users.id, userId),
    with: {
      memberships: {
        with: {
          organization: {
            columns: {
              id: true,
              name: true,
              type: true,
              plan: true,
            },
          },
        },
      },
    },
  })
}

/**
 * Get user's memberships (optimized for auth checks)
 */
export async function getUserMemberships(userId: string) {
  return await db.query.memberships.findMany({
    where: eq(memberships.userId, userId),
    with: {
      organization: {
        columns: {
          id: true,
          name: true,
          type: true,
        },
      },
    },
  })
}

/**
 * Check if user has access to an organization
 * Single index-backed query
 */
export async function userHasOrgAccess(userId: string, orgId: string) {
  return await db.query.memberships.findFirst({
    where: and(
      eq(memberships.userId, userId),
      eq(memberships.organizationId, orgId)
    ),
  })
}

/**
 * Check if user is owner of a catalog (via org)
 */
export async function userOwnsCatalog(userId: string, catalogId: string) {
  const catalog = await db.query.catalogs.findFirst({
    where: eq(catalogs.id, catalogId),
    columns: { orgId: true },
  })

  if (!catalog) return false

  return await userHasOrgAccess(userId, catalog.orgId)
}

/**
 * Get organization with all catalogs
 */
export async function getOrgWithCatalogs(orgId: string) {
  return await db.query.organizations.findFirst({
    where: eq(organizations.id, orgId),
    with: {
      catalogs: {
        with: {
          products: {
            columns: { id: true },
            where: eq(products.active, true),
          },
        },
      },
    },
  })
}

// ──────────────────────────────────────────────────────────────
// ORDER QUERIES
// ──────────────────────────────────────────────────────────────

/**
 * Get orders for a catalog (paginated, filtered)
 */
export async function getCatalogOrders(
  catalogId: string,
  status?: string,
  limit: number = 50,
  offset: number = 0
) {
  const conditions = [eq(orders.catalogId, catalogId)]
  if (status) conditions.push(eq(orders.status, status as any))

  return await db.query.orders.findMany({
    where: and(...conditions),
    orderBy: (o) => [o.createdAt],
    limit,
    offset,
  })
}

// ──────────────────────────────────────────────────────────────
// ANALYTICS QUERIES
// ──────────────────────────────────────────────────────────────

/**
 * Get analytics events for a catalog (time-series)
 */
export async function getCatalogAnalytics(catalogId: string, days: number = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  return await db.query.analyticsEvents.findMany({
    where: and(
      eq(analyticsEvents.catalogId, catalogId),
      gt(analyticsEvents.ts, since)
    ),
    orderBy: (e) => [e.ts],
  })
}

// ──────────────────────────────────────────────────────────────
// CACHING STRATEGY
// ──────────────────────────────────────────────────────────────

/**
 * Cache keys for Redis/in-memory caching
 */
export const CACHE_KEYS = {
  // Catalogs (5 min)
  catalog: (id: string) => `catalog:${id}`,
  catalogBySlug: (slug: string) => `catalog:slug:${slug}`,
  catalogProducts: (id: string) => `catalog:${id}:products`,
  catalogCategories: (id: string) => `catalog:${id}:categories`,
  orgCatalogs: (orgId: string) => `org:${orgId}:catalogs`,

  // Products (5 min)
  product: (id: string) => `product:${id}`,
  productsByCategory: (catId: string) => `category:${catId}:products`,

  // Auth (1 hour)
  userOrgs: (userId: string) => `user:${userId}:orgs`,
  userMemberships: (userId: string) => `user:${userId}:memberships`,
  userAccess: (userId: string, orgId: string) => `user:${userId}:org:${orgId}`,

  // Orders (10 min)
  catalogOrders: (catalogId: string) => `catalog:${catalogId}:orders`,

  // Analytics (1 day)
  catalogAnalytics: (catalogId: string) => `catalog:${catalogId}:analytics`,
}

/**
 * Cache TTLs (in seconds)
 */
export const CACHE_TTL = {
  default: 300, // 5 minutes
  short: 60, // 1 minute
  long: 3600, // 1 hour
  veryLong: 86400, // 1 day
}
