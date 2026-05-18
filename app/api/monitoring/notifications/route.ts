/**
 * GET /api/monitoring/notifications
 * POST /api/monitoring/notifications
 *
 * Manages alert notification configuration and testing
 */

import { NextRequest, NextResponse } from 'next/server'
import { getNotificationConfig, sendAlertNotifications } from '@/lib/monitoring'

function maskEmail(email: string): string {
  if (!email) return null as any
  const [user, domain] = email.split('@')
  const userPart = user.slice(0, Math.max(1, user.length - 3))
  return `${userPart}***@${domain}`
}

export async function GET() {
  try {
    const config = getNotificationConfig()

    return NextResponse.json({
      status: 'ok',
      data: {
        email: {
          enabled: config.emailEnabled,
          to: config.emailTo ? maskEmail(config.emailTo) : null,
        },
        slack: {
          enabled: config.slackEnabled,
          configured: config.slackEnabled,
        },
      },
    })
  } catch (error) {
    console.error('[Notifications API] Error:', error)
    return NextResponse.json(
      { status: 'error', message: 'Failed to get notification config' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (body.action === 'test') {
      const severity = body.severity ?? 'warning'

      // Send test notification
      await sendAlertNotifications({
        severity: severity as 'warning' | 'critical',
        title: 'Notificación de prueba',
        description:
          'Esta es una alerta de prueba enviada manualmente desde el dashboard de configuración.',
        service: 'api',
        triggeredAt: new Date(),
        metadata: {
          test: true,
        },
      })

      return NextResponse.json({
        status: 'ok',
        message: 'Notificación de prueba enviada',
      })
    }

    return NextResponse.json(
      { status: 'error', message: 'Acción desconocida' },
      { status: 400 }
    )
  } catch (error) {
    console.error('[Notifications API] Error:', error)
    return NextResponse.json(
      { status: 'error', message: 'Error al enviar notificación de prueba' },
      { status: 500 }
    )
  }
}
