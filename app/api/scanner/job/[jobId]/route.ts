/**
 * GET /api/scanner/job/[jobId]
 * Obtiene estado de un job de escaneo
 */

import { getJobStatus } from '@/lib/queue'
import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const job = await getJobStatus(params.jobId)

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    // Verifica que el usuario sea propietario del job
    if (job.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    return NextResponse.json(job)
  } catch (error) {
    console.error('[API] Error getting job:', error)
    return NextResponse.json(
      { error: 'Failed to get job' },
      { status: 500 }
    )
  }
}
