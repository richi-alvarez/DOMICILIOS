import { auth } from '@/auth'
import { db, memberships, customReports, reportExports } from '@/db'
import { eq, and, desc } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/monitoring/logger'
import { checkRateLimit, rateLimitConfig } from '@/lib/api/rate-limit'
import { getClientIP } from '@/lib/api/get-client-ip'

export const runtime = 'nodejs'

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

    // Get export history ordered by newest first
    const history = await db.query.reportExports.findMany({
      where: eq(reportExports.reportId, report.id),
      columns: {
        id: true,
        exportFormat: true,
        fileSize: true,
        rowCount: true,
        createdAt: true,
        createdBy: true,
        metadata: true,
      },
      orderBy: desc(reportExports.createdAt),
      limit: 20,
    })

    logger.info('Report export history retrieved', {
      reportId: params.id,
      count: history.length,
    })

    return NextResponse.json({ history })
  } catch (error: any) {
    logger.error('[Reports History Error]', error)
    return NextResponse.json(
      { error: 'Failed to fetch export history' },
      { status: 500 },
    )
  }
}
