/**
 * GET /api/scanner/jobs
 * Obtiene todos los jobs del usuario autenticado
 */

import { getUserJobs, getQueueStats } from '@/lib/queue'
import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const includeStats = searchParams.get('stats') === 'true'

    const jobs = await getUserJobs(session.user.id)

    const response: any = {
      jobs,
      count: jobs.length,
      pending: jobs.filter((j) => j.status === 'pending').length,
      processing: jobs.filter((j) => j.status === 'processing').length,
      completed: jobs.filter((j) => j.status === 'completed').length,
      failed: jobs.filter((j) => j.status === 'failed').length,
    }

    if (includeStats) {
      response.queueStats = await getQueueStats()
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[API] Error getting jobs:', error)
    return NextResponse.json(
      { error: 'Failed to get jobs' },
      { status: 500 }
    )
  }
}
