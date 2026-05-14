import { NextRequest, NextResponse } from 'next/server'
import { generatePDFReport } from '@/lib/actions/reports'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const catalogId = req.nextUrl.searchParams.get('catalogId')
    const from = req.nextUrl.searchParams.get('from')
    const to = req.nextUrl.searchParams.get('to')

    if (!catalogId || !from || !to) {
      return NextResponse.json({ error: 'Parámetros requeridos' }, { status: 400 })
    }

    const result = await generatePDFReport(catalogId, new Date(from), new Date(to))

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return new NextResponse(new Blob([new Uint8Array(result.buffer)], { type: 'application/pdf' }), {
      headers: {
        'Content-Disposition': `attachment; filename="${result.filename}"`,
      },
    })
  } catch (err: any) {
    console.error('[api/reports/pdf]', err)
    return NextResponse.json({ error: 'Error al generar reporte' }, { status: 500 })
  }
}
