import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) return NextResponse.json({ ok: false })

    const body = await req.json()
    const { catalogId, type, productId, sessionId, meta } = body
    if (!catalogId || !type) return NextResponse.json({ ok: false })

    const { db, analyticsEvents } = await import('@/db')
    await db.insert(analyticsEvents).values({
      catalogId,
      type: String(type).slice(0, 64),
      productId: productId ?? null,
      sessionId: sessionId ? String(sessionId).slice(0, 64) : null,
      meta: meta ?? {},
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}
