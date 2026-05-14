export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { generateExcelReport } from '@/lib/actions/reports'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const catalogId = req.nextUrl.searchParams.get('catalogId')
    const from = req.nextUrl.searchParams.get('from')
    const to = req.nextUrl.searchParams.get('to')

    if (!catalogId || !from || !to) {
      return NextResponse.json({ error: 'Parámetros requeridos' }, { status: 400 })
    }

    const result = await generateExcelReport(catalogId, new Date(from), new Date(to))

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return new NextResponse(result.buffer, {
      headers: {
        'Content-Disposition': `attachment; filename="${result.filename}"`,
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    })
  } catch (err: any) {
    console.error('[api/reports/excel]', err)
    return NextResponse.json({ error: 'Error al generar reporte' }, { status: 500 })
  }
}
