import { auth } from '@/auth'
import { db, memberships } from '@/db'
import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { logger } from '@/lib/monitoring/logger'

export const runtime = 'nodejs'

const createReportSchema = z.object({
  name: z.string().min(1),
  queryType: z.enum(['overview', 'sales', 'customers', 'products']),
  filters: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    interval: z.enum(['day', 'week', 'month']).optional(),
  }).optional(),
})

export async function GET(request: NextRequest) {
  try {
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

    logger.info('Reports list retrieved', {
      orgId: membership.organizationId,
    })

    return NextResponse.json({
      reports: [],
      message: 'Custom reports feature coming soon',
    })
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

    logger.info('Report created', {
      orgId: membership.organizationId,
      name: validated.name,
      queryType: validated.queryType,
    })

    return NextResponse.json(
      {
        id: 'report_' + Date.now(),
        name: validated.name,
        queryType: validated.queryType,
        filters: validated.filters,
        createdAt: new Date().toISOString(),
      },
      { status: 201 },
    )
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
