import { NextRequest, NextResponse } from 'next/server'
import { generatePDFReport } from '@/lib/actions/reports'
import { auth } from '@/auth'
import { logger } from '@/lib/monitoring/logger'
import { db, catalogs } from '@/db'
import { eq } from 'drizzle-orm'
import { checkRateLimit, rateLimitConfig } from '@/lib/api/rate-limit'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const catalogId = req.nextUrl.searchParams.get('catalogId')
    const from = req.nextUrl.searchParams.get('from')
    const to = req.nextUrl.searchParams.get('to')

    if (!catalogId || !from || !to) {
      return NextResponse.json({ error: 'Required parameters missing' }, { status: 400 })
    }

    const catalog = await db.query.catalogs.findFirst({
      where: eq(catalogs.id, catalogId)
    })

    if (!catalog || catalog.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const result = await generatePDFReport(catalogId, new Date(from), new Date(to))

    if ('error' in result) {
      return NextResponse.json({ error: 'Unable to generate report' }, { status: 400 })
    }

    return new NextResponse(new Blob([new Uint8Array(result.buffer)], { type: 'application/pdf' }), {
      headers: {
        'Content-Disposition': `attachment; filename="${result.filename}"`,
      },
    })
  } catch (err) {
    logger.error('Failed to generate PDF report', err)
    return NextResponse.json({ error: 'Unable to generate report' }, { status: 500 })
  }
}
