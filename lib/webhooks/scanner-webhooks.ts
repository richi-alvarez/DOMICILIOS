/**
 * Scanner Webhooks
 * Notifica eventos de escaneo a URLs configuradas
 */

import { ScanJob } from '@/lib/queue/scanner-queue'

export interface WebhookEvent {
  /** Tipo de evento */
  type: 'scan.started' | 'scan.progress' | 'scan.completed' | 'scan.failed'
  /** ID del job */
  jobId: string
  /** ID del catálogo */
  catalogId: string
  /** ID del usuario */
  userId: string
  /** Timestamp del evento */
  timestamp: number
  /** Datos específicos del evento */
  data: {
    progress?: number
    productsDetected?: number
    error?: string
    detectedProducts?: any[]
  }
}

export interface WebhookConfig {
  /** URL del webhook */
  url: string
  /** Eventos a los que suscribirse */
  events: WebhookEvent['type'][]
  /** Secret para verificar firma */
  secret?: string
  /** Activo o no */
  active: boolean
  /** Reintentos en caso de fallo */
  maxRetries?: number
  /** Timeout en ms */
  timeout?: number
}

/**
 * Genera firma HMAC-SHA256 para verificar webhook
 */
export function generateWebhookSignature(
  payload: string,
  secret: string,
): string {
  const crypto = require('crypto')
  return crypto.createHmac('sha256', secret).update(payload).digest('hex')
}

/**
 * Verifica firma de webhook
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  const expectedSignature = generateWebhookSignature(payload, secret)
  return signature === expectedSignature
}

/**
 * Envía evento a un webhook
 */
export async function sendWebhookEvent(
  webhookUrl: string,
  event: WebhookEvent,
  secret?: string,
  maxRetries: number = 3,
  timeout: number = 5000,
): Promise<boolean> {
  const payload = JSON.stringify(event)
  const signature = secret ? generateWebhookSignature(payload, secret) : ''

  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': event.type,
          'X-Webhook-Timestamp': event.timestamp.toString(),
        },
        body: payload,
        signal: AbortSignal.timeout(timeout),
      })

      if (response.ok) {
        console.log(
          `[Webhook] Event ${event.type} sent to ${webhookUrl} (attempt ${attempt})`,
        )
        return true
      }

      lastError = new Error(
        `Webhook returned ${response.status}: ${response.statusText}`,
      )
      console.warn(
        `[Webhook] Failed attempt ${attempt}/${maxRetries}: ${lastError.message}`,
      )
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      console.warn(
        `[Webhook] Failed attempt ${attempt}/${maxRetries}: ${lastError.message}`,
      )

      // Exponential backoff entre reintentos
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  console.error(
    `[Webhook] Failed to send event to ${webhookUrl} after ${maxRetries} attempts`,
    lastError,
  )
  return false
}

/**
 * Notifica el inicio de un escaneo
 */
export async function notifyJobStarted(
  job: ScanJob,
  configs: WebhookConfig[],
): Promise<void> {
  const event: WebhookEvent = {
    type: 'scan.started',
    jobId: job.id,
    catalogId: job.catalogId,
    userId: job.userId,
    timestamp: Date.now(),
    data: {
      progress: 0,
    },
  }

  for (const config of configs) {
    if (
      config.active &&
      config.events.includes(event.type)
    ) {
      // Envía de forma asincrónica sin esperar
      sendWebhookEvent(
        config.url,
        event,
        config.secret,
        config.maxRetries || 3,
        config.timeout || 5000,
      ).catch((error) => {
        console.error(`[Webhook] Error notifying job start:`, error)
      })
    }
  }
}

/**
 * Notifica progreso de un escaneo
 */
export async function notifyJobProgress(
  job: ScanJob,
  progress: number,
  configs: WebhookConfig[],
): Promise<void> {
  const event: WebhookEvent = {
    type: 'scan.progress',
    jobId: job.id,
    catalogId: job.catalogId,
    userId: job.userId,
    timestamp: Date.now(),
    data: {
      progress,
    },
  }

  for (const config of configs) {
    if (
      config.active &&
      config.events.includes(event.type)
    ) {
      sendWebhookEvent(
        config.url,
        event,
        config.secret,
        config.maxRetries || 3,
        config.timeout || 5000,
      ).catch((error) => {
        console.error(`[Webhook] Error notifying progress:`, error)
      })
    }
  }
}

/**
 * Notifica completación exitosa de un escaneo
 */
export async function notifyJobCompleted(
  job: ScanJob,
  configs: WebhookConfig[],
): Promise<void> {
  const event: WebhookEvent = {
    type: 'scan.completed',
    jobId: job.id,
    catalogId: job.catalogId,
    userId: job.userId,
    timestamp: Date.now(),
    data: {
      progress: 100,
      productsDetected: job.detectedProducts?.length || 0,
      detectedProducts: job.detectedProducts,
    },
  }

  for (const config of configs) {
    if (
      config.active &&
      config.events.includes(event.type)
    ) {
      await sendWebhookEvent(
        config.url,
        event,
        config.secret,
        config.maxRetries || 3,
        config.timeout || 5000,
      )
    }
  }
}

/**
 * Notifica fallo de un escaneo
 */
export async function notifyJobFailed(
  job: ScanJob,
  error: string,
  configs: WebhookConfig[],
): Promise<void> {
  const event: WebhookEvent = {
    type: 'scan.failed',
    jobId: job.id,
    catalogId: job.catalogId,
    userId: job.userId,
    timestamp: Date.now(),
    data: {
      error,
    },
  }

  for (const config of configs) {
    if (
      config.active &&
      config.events.includes(event.type)
    ) {
      await sendWebhookEvent(
        config.url,
        event,
        config.secret,
        config.maxRetries || 3,
        config.timeout || 5000,
      )
    }
  }
}

/**
 * Valida URL de webhook
 */
export function validateWebhookUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Valida configuración de webhook
 */
export function validateWebhookConfig(config: WebhookConfig): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!config.url) {
    errors.push('URL is required')
  } else if (!validateWebhookUrl(config.url)) {
    errors.push('Invalid URL format (must be http/https)')
  }

  if (!config.events || config.events.length === 0) {
    errors.push('At least one event must be specified')
  }

  if (config.maxRetries !== undefined && config.maxRetries < 0) {
    errors.push('maxRetries must be >= 0')
  }

  if (config.timeout !== undefined && config.timeout < 100) {
    errors.push('timeout must be >= 100ms')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
