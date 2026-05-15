import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: 'Database URL not configured' },
        { status: 500 }
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

    return NextResponse.json(catalog)
  } catch (error) {
    console.error('GET /api/catalogs/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
