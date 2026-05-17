export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { generateExcelReport } from '@/lib/actions/reports'
import { auth } from '@/auth'
import { logger } from '@/lib/monitoring/logger'
import { db, catalogs } from '@/db'
import { eq } from 'drizzle-orm'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
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

    const result = await generateExcelReport(catalogId, new Date(from), new Date(to))

    if ('error' in result) {
      return NextResponse.json({ error: 'Unable to generate report' }, { status: 400 })
    }

    return new NextResponse(result.buffer, {
      headers: {
        'Content-Disposition': `attachment; filename="${result.filename}"`,
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    })
  } catch (err) {
    logger.error('Failed to generate Excel report', err)
    return NextResponse.json({ error: 'Unable to generate report' }, { status: 500 })
  }
}
