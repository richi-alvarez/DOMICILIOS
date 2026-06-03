import { eq, and, asc } from 'drizzle-orm'
import { db, catalogs, categories, products, orders, blocks } from '@/db'
import {
  DEMO_CATALOG,
  DEMO_CATEGORIES,
  DEMO_PRODUCTS,
} from './demo-data'
import type { BlockConfig } from '@/lib/design/blocks'

function isDemo(slug: string) {
  return slug === 'demo' || !process.env.DATABASE_URL
}

export type StorefrontCatalog = {
  id: string
  slug: string
  name: string
  description: string | null
  currency: string
  language: string
  orderChannel: 'whatsapp' | 'email'
  contactPhone: string | null
  contactCountryCode: string | null
  contactEmail: string | null
  themeJson: Record<string, unknown>
  settingsJson: Record<string, unknown>
  publishedAt: Date | null
}

export type StorefrontCategory = {
  id: string
  name: string
  slug: string
  position: number
}

export type StorefrontProduct = {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  compareAt: number | null
  stock: number | null
  imagesJson: unknown
  categoryId: string | null
  active: boolean
  position: number
}

// Los precios se almacenan en centavos (price * 100). El storefront trabaja en
// unidades enteras de la moneda, así que dividimos al leer (igual que la API admin).
function toStorefrontProduct(row: {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  compareAt: number | null
  stock: number | null
  imagesJson: unknown
  categoryId: string | null
  active: boolean
  position: number
}): StorefrontProduct {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    price: row.price / 100,
    compareAt: row.compareAt != null ? row.compareAt / 100 : null,
    stock: row.stock,
    imagesJson: row.imagesJson,
    categoryId: row.categoryId,
    active: row.active,
    position: row.position,
  }
}

export async function getCatalogBySlug(slug: string): Promise<StorefrontCatalog | null> {
  if (isDemo(slug)) return { ...DEMO_CATALOG, slug }
  try {
    const row = await db.query.catalogs.findFirst({
      where: and(eq(catalogs.slug, slug), eq(catalogs.status, 'published')),
    })
    if (!row) return null
    return {
      ...row,
      themeJson: (row.themeJson ?? {}) as Record<string, unknown>,
      settingsJson: (row.settingsJson ?? {}) as Record<string, unknown>,
    }
  } catch {
    return null
  }
}

export async function listCatalogCategories(catalogId: string): Promise<StorefrontCategory[]> {
  if (catalogId === DEMO_CATALOG.id) return DEMO_CATEGORIES
  try {
    const rows = await db.query.categories.findMany({
      where: and(eq(categories.catalogId, catalogId), eq(categories.active, true)),
      orderBy: (t, { asc }) => [asc(t.position), asc(t.name)],
    })
    return rows
  } catch {
    return []
  }
}

export async function listCatalogProducts(
  catalogId: string,
  opts: { categoryId?: string } = {},
): Promise<StorefrontProduct[]> {
  if (catalogId === DEMO_CATALOG.id) {
    return opts.categoryId
      ? DEMO_PRODUCTS.filter((p) => p.categoryId === opts.categoryId)
      : DEMO_PRODUCTS
  }
  try {
    const where = opts.categoryId
      ? and(
          eq(products.catalogId, catalogId),
          eq(products.active, true),
          eq(products.categoryId, opts.categoryId),
        )
      : and(eq(products.catalogId, catalogId), eq(products.active, true))
    const rows = await db.query.products.findMany({
      where,
      orderBy: (t, { asc }) => [asc(t.position), asc(t.name)],
    })
    return rows.map(toStorefrontProduct)
  } catch {
    return []
  }
}

export async function getProductBySlug(
  catalogId: string,
  slug: string,
): Promise<StorefrontProduct | null> {
  if (catalogId === DEMO_CATALOG.id) {
    return DEMO_PRODUCTS.find((p) => p.slug === slug) ?? null
  }
  try {
    const row = await db.query.products.findFirst({
      where: and(
        eq(products.catalogId, catalogId),
        eq(products.slug, slug),
        eq(products.active, true),
      ),
    })
    return row ? toStorefrontProduct(row) : null
  } catch {
    return null
  }
}

export async function getOrderByCode(
  catalogId: string,
  code: string,
) {
  try {
    return await db.query.orders.findFirst({
      where: and(eq(orders.catalogId, catalogId), eq(orders.code, code)),
    })
  } catch {
    return null
  }
}

export async function getBlocksForStorefront(catalogId: string): Promise<BlockConfig[]> {
  if (catalogId === DEMO_CATALOG.id) return []
  try {
    const rows = await db.query.blocks.findMany({
      where: and(eq(blocks.catalogId, catalogId), eq(blocks.active, true)),
      orderBy: [asc(blocks.position)],
    })
    return rows.map((r) => ({
      type: r.type as BlockConfig['type'],
      id: r.id,
      active: r.active,
      config: r.configJson as BlockConfig['config'],
    })) as BlockConfig[]
  } catch {
    return []
  }
}

export async function getNextOrderSequence(catalogId: string): Promise<number> {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const rows = await db.query.orders.findMany({
      where: and(eq(orders.catalogId, catalogId)),
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    })
    const todayOrders = rows.filter((r) => r.createdAt >= today)
    return todayOrders.length + 1
  } catch {
    return 1
  }
}
