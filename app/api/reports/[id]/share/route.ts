import { auth } from '@/auth'
import { db, memberships, customReports } from '@/db'
import { eq, and } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { logger } from '@/lib/monitoring/logger'
import { checkRateLimit, rateLimitConfig } from '@/lib/api/rate-limit'
import { getClientIP } from '@/lib/api/get-client-ip'

export const runtime = 'nodejs'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ip = getClientIP(request)
    const rateLimitResult = await checkRateLimit(ip, rateLimitConfig.sensitive.limit, rateLimitConfig.sensitive.windowMs)

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitConfig.sensitive.message },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfter || 60),
          },
        }
      )
    }

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const membership = await db.query.memberships.findFirst({
      where: eq(memberships.userId, session.user.id),
      columns: { organizationId: true },
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 },
      )
    }

    const report = await db.query.customReports.findFirst({
      where: and(
        eq(customReports.id, params.id),
        eq(customReports.organizationId, membership.organizationId),
      ),
    })

    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 },
      )
    }

    // Generate share token (64-char hex string)
    const shareToken = randomBytes(32).toString('hex')
    const shareTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    // Update report with share token
    const [updated] = await db
      .update(customReports)
      .set({
        shareToken,
        shareTokenExpiresAt,
      })
      .where(eq(customReports.id, params.id))
      .returning()

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const shareUrl = `${appUrl}/api/reports/share/${shareToken}`

    logger.info('Report share link generated', {
      reportId: params.id,
      expiresAt: shareTokenExpiresAt,
    })

    return NextResponse.json({
      shareUrl,
      shareToken,
      expiresAt: shareTokenExpiresAt,
    })
  } catch (error: any) {
    logger.error('[Reports Share Error]', error)
    return NextResponse.json(
      { error: 'Failed to generate share link' },
      { status: 500 },
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ip = getClientIP(request)
    const rateLimitResult = await checkRateLimit(ip, rateLimitConfig.sensitive.limit, rateLimitConfig.sensitive.windowMs)

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitConfig.sensitive.message },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfter || 60),
          },
        }
      )
    }

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const membership = await db.query.memberships.findFirst({
      where: eq(memberships.userId, session.user.id),
      columns: { organizationId: true },
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 },
      )
    }

    const report = await db.query.customReports.findFirst({
      where: and(
        eq(customReports.id, params.id),
        eq(customReports.organizationId, membership.organizationId),
      ),
    })

    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 },
      )
    }

    // Revoke share token
    await db
      .update(customReports)
      .set({
        shareToken: null,
        shareTokenExpiresAt: null,
      })
      .where(eq(customReports.id, params.id))

    logger.info('Report share link revoked', {
      reportId: params.id,
    })

    return NextResponse.json({ success: true, message: 'Share link revoked' })
  } catch (error: any) {
    logger.error('[Reports Share Delete Error]', error)
    return NextResponse.json(
      { error: 'Failed to revoke share link' },
      { status: 500 },
    )
  }
}
