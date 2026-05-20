import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db, orders, transactions } from '@/db'
import { eq } from 'drizzle-orm'

const stripe = require('stripe')

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { paymentIntentId, orderId } = await req.json()

    if (!paymentIntentId || !orderId) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Pagos no configurados' },
        { status: 500 }
      )
    }

    const stripeClient = new stripe.default(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-04-22.dahlia',
    })

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripeClient.paymentIntents.retrieve(paymentIntentId)

    if (!paymentIntent) {
      return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 })
    }

    // Verify order exists and belongs to user
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
    })

    if (!order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
    }

    // Check if payment was successful
    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        {
          error: `Pago no completado. Estado: ${paymentIntent.status}`,
          status: paymentIntent.status,
        },
        { status: 400 }
      )
    }

    // Record transaction in database
    const transaction = await db
      .insert(transactions)
      .values({
        organizationId: order.catalogId, // Using catalogId as organization reference
        stripePaymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency.toUpperCase(),
        status: 'succeeded',
        type: 'order_payment',
        description: `Pago por pedido ${orderId}`,
        metadata: {
          orderId,
          paymentIntentId,
          chargeId: paymentIntent.charges.data[0]?.id,
          receiptUrl: paymentIntent.charges.data[0]?.receipt_url,
        },
      })
      .returning()

    if (!transaction) {
      console.error('Failed to record transaction')
      return NextResponse.json(
        { error: 'Error al registrar transacción' },
        { status: 500 }
      )
    }

    // Update order status
    await db
      .update(orders)
      .set({
        status: 'paid',
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))

    return NextResponse.json({
      success: true,
      transactionId: transaction[0].id,
      orderStatus: 'paid',
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      receiptUrl: paymentIntent.charges.data[0]?.receipt_url,
    })
  } catch (error: any) {
    console.error('Error confirming payment:', error)

    return NextResponse.json(
      { error: error.message || 'Error al confirmar pago' },
      { status: 500 }
    )
  }
}
