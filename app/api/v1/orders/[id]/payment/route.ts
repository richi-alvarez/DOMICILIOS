import { NextRequest, NextResponse } from 'next/server'
import { db, orders } from '@/db'
import { eq } from 'drizzle-orm'
import { logger } from '@/lib/monitoring/logger'
import { z } from 'zod'

export const runtime = 'nodejs'

const updatePaymentSchema = z.object({
  method: z.enum(['cash', 'stripe']),
  status: z.enum(['pending', 'paid', 'failed']).optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const validated = updatePaymentSchema.parse(body)

    const order = await db.query.orders.findFirst({
      where: eq(orders.id, params.id),
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    const paymentJson = order.paymentJson as any || {}

    // Update payment method
    const updatedPaymentJson = {
      method: validated.method,
      status: validated.status || 'pending',
      updatedAt: new Date().toISOString(),
    }

    // For cash, add payment pending message
    if (validated.method === 'cash') {
      updatedPaymentJson.message = 'Pago pendiente en efectivo al momento de la entrega'
    }

    await db
      .update(orders)
      .set({
        paymentJson: updatedPaymentJson,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, params.id))

    logger.info(`Order ${params.id} payment method updated to ${validated.method}`)

    return NextResponse.json({
      success: true,
      paymentMethod: validated.method,
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    logger.error(`Error updating order payment: ${error.message}`)
    return NextResponse.json(
      { error: 'Failed to update payment method' },
      { status: 500 }
    )
  }
}
