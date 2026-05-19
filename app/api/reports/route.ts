import { auth } from '@/auth'
import { db, memberships, customReports } from '@/db'
import { eq, and, isNull } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { logger } from '@/lib/monitoring/logger'
import { checkRateLimit, rateLimitConfig } from '@/lib/api/rate-limit'
import { getClientIP } from '@/lib/api/get-client-ip'

export const runtime = 'nodejs'

const createReportSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  queryType: z.enum(['sales', 'customers', 'products', 'overview']),
  filters: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    interval: z.enum(['day', 'week', 'month']).optional(),
  }).optional(),
  columns: z.array(z.string()).optional(),
  isTemplate: z.boolean().optional(),
  templateName: z.string().optional(),
})

export async function GET(request: NextRequest) {
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

    // Check if filtering by shared/template reports or archived
    const shared = request.nextUrl.searchParams.get('shared') === 'true'
    const archived = request.nextUrl.searchParams.get('archived') === 'true'

    // Get custom reports for organization
    const reports = await db.query.customReports.findMany({
      where: shared
        ? and(
            eq(customReports.organizationId, membership.organizationId),
            eq(customReports.isTemplate, true),
            isNull(customReports.archivedAt)
          )
        : archived
        ? and(
            eq(customReports.organizationId, membership.organizationId),
          )
        : and(
            eq(customReports.organizationId, membership.organizationId),
            isNull(customReports.archivedAt)
          ),
      columns: {
        id: true,
        name: true,
        description: true,
        queryType: true,
        isTemplate: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: (t) => [t.createdAt],
    })

    logger.info('Reports list retrieved', {
      orgId: membership.organizationId,
      count: reports.length,
    })

    return NextResponse.json({ reports })
  } catch (error: any) {
    logger.error('[Reports GET Error]', error)
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const validated = createReportSchema.parse(body)

    // Create custom report
    const [newReport] = await db
      .insert(customReports)
      .values({
        organizationId: membership.organizationId,
        name: validated.name,
        description: validated.description || null,
        queryType: validated.queryType,
        filters: validated.filters || {},
        columns: validated.columns || [],
        createdBy: session.user.id,
        isTemplate: validated.isTemplate || false,
        templateName: validated.templateName || null,
      })
      .returning()

    logger.info('Report created', {
      orgId: membership.organizationId,
      reportId: newReport.id,
      queryType: newReport.queryType,
    })

    return NextResponse.json(newReport, { status: 201 })
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

    logger.error('[Reports POST Error]', error)
    return NextResponse.json(
      { error: 'Failed to create report' },
      { status: 500 },
    )
  }
}
