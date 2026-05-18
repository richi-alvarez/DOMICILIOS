/**
 * GET /api/monitoring/alerts?severity=critical
 * Returns unresolved alerts
 */

import { NextRequest, NextResponse } from 'next/server'
import { alertManager } from '@/lib/monitoring/alerting'

export async function GET(request: NextRequest) {
  try {
    const alerts = await alertManager.getUnresolvedAlerts()

    return NextResponse.json({
      status: 'ok',
      data: {
        alerts,
        totalCount: alerts.length,
      },
    })
  } catch (error) {
    console.error('[Alerts API] Error:', error)
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to fetch alerts',
      },
      { status: 500 }
    )
  }
}
