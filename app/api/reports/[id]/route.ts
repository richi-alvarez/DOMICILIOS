import { auth } from '@/auth'
import { db, memberships, customReports } from '@/db'
import { eq, and } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { logger } from '@/lib/monitoring/logger'
import { checkRateLimit, rateLimitConfig } from '@/lib/api/rate-limit'
import { getClientIP } from '@/lib/api/get-client-ip'

export const runtime = 'nodejs'

const updateReportSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  filters: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    interval: z.enum(['day', 'week', 'month']).optional(),
  }).optional(),
  columns: z.array(z.string()).optional(),
  isTemplate: z.boolean().optional(),
  archived: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ip = getClientIP(request)
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

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const membership = await db.query.memberships.findFirst({
      where: eq(memberships.userId, session.user.id),
      columns: { organizationId: true },
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 },
      )
    }

    const report = await db.query.customReports.findFirst({
      where: and(
        eq(customReports.id, params.id),
        eq(customReports.organizationId, membership.organizationId),
      ),
    })

    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 },
      )
    }

    logger.info('Report retrieved', {
      reportId: params.id,
      orgId: membership.organizationId,
    })

    return NextResponse.json(report)
  } catch (error: any) {
    logger.error('[Reports GET Error]', error)
    return NextResponse.json(
      { error: 'Failed to fetch report' },
      { status: 500 },
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ip = getClientIP(request)
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

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const membership = await db.query.memberships.findFirst({
      where: eq(memberships.userId, session.user.id),
      columns: { organizationId: true },
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 },
      )
    }

    const report = await db.query.customReports.findFirst({
      where: and(
        eq(customReports.id, params.id),
        eq(customReports.organizationId, membership.organizationId),
      ),
    })

    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 },
      )
    }

    const body = await request.json()
    const validated = updateReportSchema.parse(body)

    const [updatedReport] = await db
      .update(customReports)
      .set({
        name: validated.name ?? report.name,
        description: validated.description ?? report.description,
        filters: validated.filters ?? report.filters,
        columns: validated.columns ?? report.columns,
        isTemplate: validated.isTemplate ?? report.isTemplate,
        archivedAt: validated.archived === true
          ? new Date()
          : validated.archived === false
          ? null
          : report.archivedAt,
        updatedAt: new Date(),
      })
      .where(eq(customReports.id, params.id))
      .returning()

    logger.info('Report updated', {
      reportId: params.id,
      orgId: membership.organizationId,
    })

    return NextResponse.json(updatedReport)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 },
      )
    }

    logger.error('[Reports PATCH Error]', error)
    return NextResponse.json(
      { error: 'Failed to update report' },
      { status: 500 },
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ip = getClientIP(request)
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

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const membership = await db.query.memberships.findFirst({
      where: eq(memberships.userId, session.user.id),
      columns: { organizationId: true },
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 },
      )
    }

    const report = await db.query.customReports.findFirst({
      where: and(
        eq(customReports.id, params.id),
        eq(customReports.organizationId, membership.organizationId),
      ),
    })

    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 },
      )
    }

    // Soft delete: mark as archived
    await db
      .update(customReports)
      .set({ archivedAt: new Date() })
      .where(eq(customReports.id, params.id))

    logger.info('Report archived', {
      reportId: params.id,
      orgId: membership.organizationId,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error('[Reports DELETE Error]', error)
    return NextResponse.json(
      { error: 'Failed to delete report' },
      { status: 500 },
    )
  }
}
