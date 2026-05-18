'use server'

import { Resend } from 'resend'
import { logger } from './logger'

// Tipos
export interface NotificationConfig {
  emailEnabled: boolean
  emailTo: string
  slackEnabled: boolean
  slackWebhookUrl: string
}

export interface AlertNotificationPayload {
  severity: 'warning' | 'critical'
  title: string
  description: string
  service: string
  triggeredAt: Date
  metadata?: Record<string, any>
}

interface NotificationResult {
  channel: 'email' | 'slack'
  success: boolean
  error?: string
}

// Configuración
const resend = new Resend(process.env.RESEND_API_KEY ?? 'placeholder')
const FROM = process.env.RESEND_FROM_EMAIL ?? 'WaStore <noreply@wastore.app>'
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'WaStore'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

function getConfig(): NotificationConfig {
  return {
    emailEnabled: !!process.env.ALERT_EMAIL_TO,
    emailTo: process.env.ALERT_EMAIL_TO ?? '',
    slackEnabled: !!process.env.SLACK_WEBHOOK_URL,
    slackWebhookUrl: process.env.SLACK_WEBHOOK_URL ?? '',
  }
}

// Template HTML para emails
function alertEmailTemplate(payload: AlertNotificationPayload): string {
  const severityColor =
    payload.severity === 'critical' ? '#DC2626' : '#D97706'
  const severityLabel = payload.severity === 'critical' ? 'CRÍTICA' : 'ADVERTENCIA'

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Alerta ${severityLabel}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #0B1F3A; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #F5F5F4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <!-- Header -->
    <tr>
      <td style="padding: 32px 24px; background: linear-gradient(135deg, #06B6D4 0%, #0057FF 100%);">
        <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 800;">
          ${APP_NAME}
        </h1>
        <p style="margin: 4px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
          Notificación de Alerta
        </p>
      </td>
    </tr>

    <!-- Content -->
    <tr>
      <td style="padding: 32px 24px;">
        <!-- Severity badge -->
        <div style="border-left: 4px solid ${severityColor}; padding-left: 16px; margin-bottom: 24px;">
          <p style="margin: 0 0 4px; font-size: 12px; font-weight: 700; color: ${severityColor}; text-transform: uppercase; letter-spacing: 0.5px;">
            Alerta ${severityLabel}
          </p>
          <h2 style="margin: 4px 0 8px; font-size: 22px; font-weight: 800; color: #0B1F3A;">
            ${payload.title}
          </h2>
        </div>

        <!-- Description -->
        <p style="color: #5C5C52; line-height: 1.6; margin: 0 0 20px; font-size: 15px;">
          ${payload.description}
        </p>

        <!-- Details table -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px; font-size: 13px;">
          <tr style="border-bottom: 1px solid #E8E8E6;">
            <td style="padding: 12px 0; font-weight: 600; color: #0B1F3A; width: 120px;">Servicio</td>
            <td style="padding: 12px 0; font-family: 'Monaco', 'Courier', monospace; color: #5C5C52; background-color: #F5F5F4; padding: 8px 12px; border-radius: 4px;">
              ${payload.service}
            </td>
          </tr>
          <tr style="border-bottom: 1px solid #E8E8E6;">
            <td style="padding: 12px 0; font-weight: 600; color: #0B1F3A;">Severidad</td>
            <td style="padding: 12px 0; color: ${severityColor}; font-weight: 600;">
              ${severityLabel}
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 0; font-weight: 600; color: #0B1F3A;">Hora</td>
            <td style="padding: 12px 0; color: #5C5C52;">
              ${payload.triggeredAt.toLocaleString('es-CO', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </td>
          </tr>
        </table>

        <!-- CTA -->
        <a href="${APP_URL}/app/monitoring" style="display: inline-block; background: linear-gradient(135deg, #06B6D4 0%, #0057FF 100%); color: white; font-weight: 700; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-size: 15px; margin-bottom: 24px; text-align: center; min-width: 200px;">
          Ver Dashboard →
        </a>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 16px 24px; background-color: #F5F5F4; border-top: 1px solid #E8E8E6; text-align: center; font-size: 12px; color: #8C8C86;">
        <p style="margin: 0;">
          Esta es una notificación automática del sistema de monitoreo de ${APP_NAME}.
          No responda a este email.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// Envío por email
async function sendEmailNotification(
  payload: AlertNotificationPayload,
  config: NotificationConfig
): Promise<NotificationResult> {
  try {
    const subject = `[${payload.severity.toUpperCase()}] ${payload.title} - ${APP_NAME}`
    const html = alertEmailTemplate(payload)

    await resend.emails.send({
      from: FROM,
      to: config.emailTo,
      subject,
      html,
    })

    return { channel: 'email', success: true }
  } catch (error) {
    return {
      channel: 'email',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Envío por Slack (via Incoming Webhooks)
async function sendSlackNotification(
  payload: AlertNotificationPayload,
  config: NotificationConfig
): Promise<NotificationResult> {
  try {
    const emoji = payload.severity === 'critical' ? ':red_circle:' : ':warning:'
    const color = payload.severity === 'critical' ? '#DC2626' : '#D97706'

    const body = {
      attachments: [
        {
          color,
          blocks: [
            {
              type: 'header',
              text: {
                type: 'plain_text',
                text: `${emoji} ${payload.title}`,
              },
            },
            {
              type: 'section',
              fields: [
                {
                  type: 'mrkdwn',
                  text: `*Severidad:*\n${payload.severity.toUpperCase()}`,
                },
                {
                  type: 'mrkdwn',
                  text: `*Servicio:*\n\`${payload.service}\``,
                },
                {
                  type: 'mrkdwn',
                  text: `*Descripción:*\n${payload.description}`,
                },
                {
                  type: 'mrkdwn',
                  text: `*Hora:*\n${payload.triggeredAt.toISOString()}`,
                },
              ],
            },
            {
              type: 'actions',
              elements: [
                {
                  type: 'button',
                  text: {
                    type: 'plain_text',
                    text: 'Ver Dashboard',
                  },
                  url: `${APP_URL}/app/monitoring`,
                  style: payload.severity === 'critical' ? 'danger' : 'primary',
                },
              ],
            },
          ],
        },
      ],
    }

    const res = await fetch(config.slackWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const text = await res.text()
      return {
        channel: 'slack',
        success: false,
        error: `HTTP ${res.status}: ${text}`,
      }
    }

    return { channel: 'slack', success: true }
  } catch (error) {
    return {
      channel: 'slack',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Función pública principal
export async function sendAlertNotifications(
  payload: AlertNotificationPayload
): Promise<void> {
  // Solo notificar warning y critical
  if (payload.severity === 'info') return

  const config = getConfig()
  const promises: Promise<NotificationResult>[] = []

  if (config.emailEnabled) {
    promises.push(sendEmailNotification(payload, config))
  }

  if (config.slackEnabled) {
    promises.push(sendSlackNotification(payload, config))
  }

  // Sin canales configurados, no hacer nada silenciosamente
  if (promises.length === 0) return

  const results = await Promise.allSettled(promises)

  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      const r = result.value
      if (r.success) {
        logger.info(`Alert notification sent via ${r.channel}`, {
          channel: r.channel,
          severity: payload.severity,
          title: payload.title,
        })
      } else {
        logger.error(
          `Alert notification failed via ${r.channel}`,
          new Error(r.error),
          {
            channel: r.channel,
            severity: payload.severity,
          }
        )
      }
    } else {
      logger.error(
        'Alert notification promise rejected',
        result.reason as Error
      )
    }
  })
}

// Exportar config para UI
export async function getNotificationConfig(): Promise<NotificationConfig> {
  return getConfig()
}
