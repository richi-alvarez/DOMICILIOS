/**
 * GET /api/monitoring/metrics?type=performance&hours=24
 * Returns metrics for a specific time range and type
 */

import { NextRequest, NextResponse } from 'next/server'
import { metricsPersistence } from '@/lib/monitoring/metrics-persistence'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') || 'performance'
    const hours = parseInt(searchParams.get('hours') || '24')
    const limit = parseInt(searchParams.get('limit') || '100')

    const metrics = await metricsPersistence.getMetrics(type, hours, limit)
    const summary = await metricsPersistence.getMetricsSummary(hours)

    return NextResponse.json({
      status: 'ok',
      data: {
        metrics,
        summary,
        filters: {
          type,
          hours,
          limit,
        },
      },
    })
  } catch (error) {
    console.error('[Metrics API] Error:', error)
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to fetch metrics',
      },
      { status: 500 }
    )
  }
}
