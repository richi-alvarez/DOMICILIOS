/**
 * POST /api/webhooks/scanner
 * Endpoint para recibir webhooks de eventos de escaneo
 *
 * Para testing, puede usarse:
 * curl -X POST http://localhost:3000/api/webhooks/scanner \
 *   -H "Content-Type: application/json" \
 *   -H "X-Webhook-Signature: <signature>" \
 *   -H "X-Webhook-Event: scan.completed" \
 *   -d '{...}'
 */

import { verifyWebhookSignature } from '@/lib/webhooks'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('X-Webhook-Signature') || ''
    const event = request.headers.get('X-Webhook-Event') || ''
    const timestamp = request.headers.get('X-Webhook-Timestamp') || ''

    // Si hay secret configurado, verifica firma
    const webhookSecret = process.env.WEBHOOK_SECRET
    if (webhookSecret && !verifyWebhookSignature(body, signature, webhookSecret)) {
      console.warn('[Webhook] Invalid signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    const payload = JSON.parse(body)

    console.log('[Webhook] Received event:', {
      type: event,
      jobId: payload.jobId,
      timestamp,
      status: payload.data?.status || 'unknown',
    })

    // Aquí puedes:
    // 1. Guardar el evento en la BD
    // 2. Actualizar UI via Socket.io/WebSocket
    // 3. Triggear acciones (enviar notificaciones, etc)

    // Por ahora solo loguea
    if (event === 'scan.completed') {
      console.log('[Webhook] Scan completed:', {
        jobId: payload.jobId,
        productsDetected: payload.data?.productsDetected,
      })
    } else if (event === 'scan.failed') {
      console.error('[Webhook] Scan failed:', {
        jobId: payload.jobId,
        error: payload.data?.error,
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[Webhook] Error:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    )
  }
}

/**
 * Test webhook delivery
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Webhook endpoint ready',
    note: 'Send POST requests with scanner events',
    example: {
      type: 'scan.completed',
      jobId: 'scan-xxxxx',
      catalogId: 'catalog-xxxxx',
      userId: 'user-xxxxx',
      timestamp: Date.now(),
      data: {
        progress: 100,
        productsDetected: 5,
        detectedProducts: [
          {
            name: 'Producto 1',
            price: 10000,
            category: 'Bebidas',
          },
        ],
      },
    },
  })
}
