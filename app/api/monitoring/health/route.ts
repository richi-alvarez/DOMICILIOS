/**
 * GET /api/monitoring/health
 * Returns the health status of all critical services
 */

import { NextResponse } from 'next/server'
import { healthChecker } from '@/lib/monitoring/health-check'

export async function GET() {
  try {
    const healthStatus = await healthChecker.checkAll()

    return NextResponse.json({
      status: 'ok',
      data: healthStatus,
    })
  } catch (error) {
    console.error('[Health Check] Error:', error)
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Health check failed',
      },
      { status: 500 }
    )
  }
}
