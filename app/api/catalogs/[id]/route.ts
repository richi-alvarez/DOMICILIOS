import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 }
      )
    }

    const { db, catalogs } = await import('@/db')
    const { eq } = await import('drizzle-orm')

    const catalog = await db.query.catalogs.findFirst({
      where: eq(catalogs.id, id)
    })

    if (!catalog) {
      return NextResponse.json(
        { error: 'Catalog not found' },
        { status: 404 }
      )
    }

    if (catalog.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    return NextResponse.json(catalog)
  } catch (error) {
    console.error('GET /api/catalogs/[id]:', error)
    return NextResponse.json(
      { error: 'Unable to load catalog' },
      { status: 500 }
    )
  }
}
