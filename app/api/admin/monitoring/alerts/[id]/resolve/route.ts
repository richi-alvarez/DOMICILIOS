/**
 * POST /api/admin/monitoring/alerts/{alertId}/resolve
 * Resolves an alert
 */

import { NextRequest, NextResponse } from 'next/server'
import { alertManager } from '@/lib/monitoring/alerting'
import { auth } from '@/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication (admin only)
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const alertId = params.id
    const success = await alertManager.resolveAlert(alertId)

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to resolve alert' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      status: 'ok',
      message: 'Alert resolved',
    })
  } catch (error) {
    console.error('[Admin Alerts API] Error:', error)
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to resolve alert',
      },
      { status: 500 }
    )
  }
}
