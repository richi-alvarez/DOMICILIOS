import { auth } from '@/auth'
import { db, memberships, customReports, reportSchedules } from '@/db'
import { eq, and } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { logger } from '@/lib/monitoring/logger'
import { checkRateLimit, rateLimitConfig } from '@/lib/api/rate-limit'
import { getClientIP } from '@/lib/api/get-client-ip'

export const runtime = 'nodejs'

const scheduleSchema = z.object({
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  recipientEmail: z.string().email(),
  exportFormat: z.enum(['csv', 'xlsx', 'pdf']).default('csv'),
  isActive: z.boolean().default(true),
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

    // Get schedule for this report
    const schedule = await db.query.reportSchedules.findFirst({
      where: eq(reportSchedules.reportId, report.id),
    })

    if (!schedule) {
      return NextResponse.json({ schedule: null })
    }

    return NextResponse.json({ schedule })
  } catch (error: any) {
    logger.error('[Schedule GET Error]', error)
    return NextResponse.json(
      { error: 'Failed to fetch schedule' },
      { status: 500 },
    )
  }
}

export async function POST(
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
    const validated = scheduleSchema.parse(body)

    // Calculate next run time based on frequency
    const now = new Date()
    let nextRunAt = new Date()

    if (validated.frequency === 'daily') {
      nextRunAt.setDate(nextRunAt.getDate() + 1)
      nextRunAt.setHours(6, 0, 0, 0) // 6 AM
    } else if (validated.frequency === 'weekly') {
      nextRunAt.setDate(nextRunAt.getDate() + (8 - nextRunAt.getDay())) // Next Monday
      nextRunAt.setHours(6, 0, 0, 0)
    } else if (validated.frequency === 'monthly') {
      nextRunAt.setMonth(nextRunAt.getMonth() + 1)
      nextRunAt.setDate(1)
      nextRunAt.setHours(6, 0, 0, 0)
    }

    // Check if schedule already exists
    const existing = await db.query.reportSchedules.findFirst({
      where: eq(reportSchedules.reportId, report.id),
    })

    let schedule

    if (existing) {
      // Update existing schedule
      const [updated] = await db
        .update(reportSchedules)
        .set({
          frequency: validated.frequency,
          recipientEmail: validated.recipientEmail,
          exportFormat: validated.exportFormat,
          isActive: validated.isActive,
          nextRunAt,
        })
        .where(eq(reportSchedules.id, existing.id))
        .returning()
      schedule = updated
    } else {
      // Create new schedule
      const [created] = await db
        .insert(reportSchedules)
        .values({
          reportId: report.id,
          organizationId: membership.organizationId,
          frequency: validated.frequency,
          recipientEmail: validated.recipientEmail,
          exportFormat: validated.exportFormat,
          isActive: validated.isActive,
          nextRunAt,
          createdBy: session.user.id,
        })
        .returning()
      schedule = created
    }

    logger.info('Report schedule created/updated', {
      reportId: params.id,
      frequency: validated.frequency,
    })

    return NextResponse.json({ schedule })
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

    logger.error('[Schedule POST Error]', error)
    return NextResponse.json(
      { error: 'Failed to create schedule' },
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

    // Delete schedule
    await db.delete(reportSchedules).where(eq(reportSchedules.reportId, report.id))

    logger.info('Report schedule deleted', {
      reportId: params.id,
    })

    return NextResponse.json({ success: true, message: 'Schedule deleted' })
  } catch (error: any) {
    logger.error('[Schedule DELETE Error]', error)
    return NextResponse.json(
      { error: 'Failed to delete schedule' },
      { status: 500 },
    )
  }
}
