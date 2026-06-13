import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db, memberships } from '@/db'
import { eq } from 'drizzle-orm'
import { logger } from '@/lib/monitoring/logger'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authentication check
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 }
      )
    }

    const { db, catalogs } = await import('@/db')
    const { eq } = await import('drizzle-orm')

    const catalog = await db.query.catalogs.findFirst({
      where: eq(catalogs.id, id)
    })

    if (!catalog) {
      return NextResponse.json(
        { error: 'Catalog not found' },
        { status: 404 }
      )
    }

    // 2. Authorization check - user must be a member of the organization
    const membership = await db.query.memberships.findFirst({
      where: eq(memberships.userId, session.user.id)
    })

    if (!membership || membership.organizationId !== catalog.orgId) {
      logger.warn('Unauthorized catalog access attempt', {
        userId: session.user.id,
        catalogId: id,
        catalogOrgId: catalog.orgId,
      })
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      id: catalog.id,
      name: catalog.name,
      slug: catalog.slug,
      description: catalog.description,
      language: catalog.language,
      currency: catalog.currency,
      status: catalog.status,
      orderChannel: catalog.orderChannel,
      contactEmail: catalog.contactEmail,
      contactPhone: catalog.contactPhone,
      themeJson: catalog.themeJson ?? {},
      createdAt: catalog.createdAt,
      updatedAt: catalog.updatedAt,
      publishedAt: catalog.publishedAt,
    })
  } catch (error) {
    logger.error('GET /api/catalogs/[id]', error)
    return NextResponse.json(
      { error: 'Unable to load catalog' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authentication check
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 }
      )
    }

    const { db, catalogs } = await import('@/db')
    const { eq } = await import('drizzle-orm')

    const catalog = await db.query.catalogs.findFirst({
      where: eq(catalogs.id, id)
    })

    if (!catalog) {
      return NextResponse.json(
        { error: 'Catalog not found' },
        { status: 404 }
      )
    }

    // 2. Authorization check - user must be an admin of the organization
    const membership = await db.query.memberships.findFirst({
      where: eq(memberships.userId, session.user.id)
    })

    if (!membership || membership.organizationId !== catalog.orgId) {
      logger.warn('Unauthorized catalog deletion attempt', {
        userId: session.user.id,
        catalogId: id,
      })
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Only admin can delete
    if (membership.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only administrators can delete catalogs' },
        { status: 403 }
      )
    }

    // 3. Check plan permission for catalog deletion
    const { organizations, subscriptions, plans } = await import('@/db')
    const { eq: eqImport } = await import('drizzle-orm')

    const orgWithPlan = await db.query.organizations.findFirst({
      where: eqImport(organizations.id, catalog.orgId),
      with: {
        subscriptions: {
          with: { plan: true }
        }
      }
    })

    if (!orgWithPlan?.subscriptions[0]?.plan) {
      return NextResponse.json(
        { error: 'Unable to determine plan' },
        { status: 500 }
      )
    }

    const planLimits = (await import('@/lib/billing/constants')).PLAN_LIMITS[orgWithPlan.subscriptions[0].plan.code as any]
    if (!planLimits?.canDeleteCatalogs) {
      return NextResponse.json(
        { error: 'Your plan does not allow deleting catalogs' },
        { status: 403 }
      )
    }

    // 4. Delete the catalog
    await db.delete(catalogs).where(eq(catalogs.id, id))

    logger.info('Catalog deleted', {
      catalogId: id,
      userId: session.user.id,
      orgId: catalog.orgId,
    })

    return NextResponse.json({
      success: true,
      message: 'Catalog deleted successfully',
      catalogId: id,
    })
  } catch (error) {
    logger.error('DELETE /api/catalogs/[id]', error)
    return NextResponse.json(
      { error: 'Unable to delete catalog' },
      { status: 500 }
    )
  }
}
