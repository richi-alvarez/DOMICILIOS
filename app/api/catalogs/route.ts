import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db, catalogs, memberships } from '@/db'
import { eq, count } from 'drizzle-orm'
import { CreateCatalogSchema } from '@/lib/validators/schemas'
import { checkRateLimit, rateLimitConfig } from '@/lib/api/rate-limit'
import { getOrgPlan, PLAN_LIMITS } from '@/lib/billing/limits'
import { logger } from '@/lib/monitoring/logger'
import { z } from 'zod'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
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

    // 3. Input validation
    const body = await req.json()
    const validated = CreateCatalogSchema.parse(body)

    // 4. Get organization ID
    const membership = await db.query.memberships.findFirst({
      where: eq(memberships.userId, session.user.id),
      columns: { organizationId: true },
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 403 }
      )
    }

    // 5. Check plan limits
    const plan = await getOrgPlan(membership.organizationId)
    const limits = PLAN_LIMITS[plan]

    const catalogCount = await db
      .select({ count: count() })
      .from(catalogs)
      .where(eq(catalogs.orgId, membership.organizationId))
      .then(result => result[0]?.count ?? 0)

    if (limits.catalogs !== -1 && catalogCount >= limits.catalogs) {
      return NextResponse.json(
        { error: `Catalog limit reached for ${plan} plan` },
        { status: 400 }
      )
    }

    // 6. Check slug availability
    const existingSlug = await db.query.catalogs.findFirst({
      where: eq(catalogs.slug, validated.slug),
    })

    if (existingSlug) {
      return NextResponse.json(
        { error: 'Slug already in use' },
        { status: 400 }
      )
    }

    // 7. Create catalog
    const [newCatalog] = await db
      .insert(catalogs)
      .values({
        name: validated.name,
        slug: validated.slug,
        description: validated.description || '',
        language: validated.language,
        currency: validated.currency,
        orgId: membership.organizationId,
        status: 'draft',
      })
      .returning({ id: catalogs.id, slug: catalogs.slug, name: catalogs.name })

    if (!newCatalog) {
      return NextResponse.json(
        { error: 'Failed to create catalog' },
        { status: 500 }
      )
    }

    logger.info('Catalog created via API', {
      catalogId: newCatalog.id,
      userId: session.user.id,
      orgId: membership.organizationId,
    })

    return NextResponse.json(
      {
        id: newCatalog.id,
        slug: newCatalog.slug,
        name: newCatalog.name,
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

    logger.error('Failed to create catalog via API', err)
    return NextResponse.json(
      { error: 'Unable to create catalog' },
      { status: 500 }
    )
  }
}
