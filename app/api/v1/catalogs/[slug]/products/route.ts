import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db, catalogs, products } from '@/db'
import { eq } from 'drizzle-orm'
import { CreateProductSchema } from '@/lib/validators/schemas'
import { checkRateLimit, rateLimitConfig } from '@/lib/api/rate-limit'
import { logger } from '@/lib/monitoring/logger'
import { z } from 'zod'

export const runtime = 'nodejs'

interface Props {
  params: Promise<{ slug: string }>
}

export async function GET(req: NextRequest, { params }: Props) {
  try {
    // 1. Authentication check
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { slug } = await params

    const catalog = await db.query.catalogs.findFirst({
      where: eq(catalogs.slug, slug),
    })

    if (!catalog) {
      return NextResponse.json({ error: 'Catálogo no encontrado' }, { status: 404 })
    }

    // 2. Authorization check - user must own the catalog
    if (catalog.userId !== session.user.id) {
      logger.warn('Unauthorized catalog access attempt', {
        userId: session.user.id,
        catalogSlug: slug,
        catalogOwner: catalog.userId,
      })
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const prods = await db.query.products.findMany({
      where: eq(products.catalogId, catalog.id),
    })

    const page = parseInt(req.nextUrl.searchParams.get('page') || '1')
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '20'), 100)
    const start = (page - 1) * limit

    const filtered = prods.filter((p) => p.active).slice(start, start + limit)

    return NextResponse.json({
      data: filtered.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: p.price,
        compareAt: p.compareAt,
        stock: p.stock,
        categoryId: p.categoryId,
        images: p.imagesJson || [],
        variants: p.variantsJson || [],
      })),
      pagination: {
        page,
        limit,
        total: prods.filter((p) => p.active).length,
      },
    })
  } catch (err) {
    logger.error('GET /api/v1/catalogs/[slug]/products', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: Props) {
  try {
    // 1. Rate limiting
    const ip = req.ip || 'unknown'
    const rateLimitResult = await checkRateLimit(ip, rateLimitConfig.api.limit, rateLimitConfig.api.windowMs)

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitConfig.api.message },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfter || 60),
          },
        }
      )
    }

    // 2. Authentication check
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 3. Get catalog and verify ownership
    const { slug } = await params
    const catalog = await db.query.catalogs.findFirst({
      where: eq(catalogs.slug, slug),
    })

    if (!catalog) {
      return NextResponse.json({ error: 'Catalog not found' }, { status: 404 })
    }

    if (catalog.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // 4. Input validation
    const body = await req.json()
    const validated = CreateProductSchema.parse(body)

    // 5. Create product
    const [newProduct] = await db
      .insert(products)
      .values({
        catalogId: catalog.id,
        name: validated.name,
        description: validated.description || '',
        price: validated.price,
        category: validated.category,
        sku: validated.sku || null,
        image: validated.image || null,
        slug: validated.name.toLowerCase().replace(/\s+/g, '-'),
        active: true,
      })
      .returning({
        id: products.id,
        name: products.name,
        slug: products.slug,
        price: products.price,
      })

    if (!newProduct) {
      return NextResponse.json(
        { error: 'Failed to create product' },
        { status: 500 }
      )
    }

    logger.info('Product created via API', {
      productId: newProduct.id,
      catalogId: catalog.id,
      userId: session.user.id,
    })

    return NextResponse.json(
      {
        id: newProduct.id,
        name: newProduct.name,
        slug: newProduct.slug,
        price: newProduct.price,
      },
      { status: 201 }
    )
  } catch (err) {
    // Validation errors
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: err.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      )
    }

    logger.error('Failed to create product via API', err)
    return NextResponse.json(
      { error: 'Unable to create product' },
      { status: 500 }
    )
  }
}
