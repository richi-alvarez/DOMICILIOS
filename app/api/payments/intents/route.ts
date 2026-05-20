import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db, orders, catalogs } from '@/db'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

const stripe = require('stripe')

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { orderId, amount, currency = 'usd' } = await req.json()

    // Validate input
    if (!orderId || !amount || amount < 1) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }

    // Get order details
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
    })

    if (!order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
    }

    // Verify user owns this order (via catalog)
    const catalog = await db.query.catalogs.findFirst({
      where: eq(catalogs.id, order.catalogId),
    })

    if (!catalog) {
      return NextResponse.json({ error: 'Catálogo no encontrado' }, { status: 404 })
    }

    // Check Stripe configuration
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY no configurado')
      return NextResponse.json(
        { error: 'Pagos no disponibles en este momento' },
        { status: 500 }
      )
    }

    // Initialize Stripe
    const stripeClient = new stripe.default(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-04-22.dahlia',
    })

    // Create payment intent
    const paymentIntent = await stripeClient.paymentIntents.create({
      amount: Math.round(amount), // Always in cents
      currency: currency.toLowerCase(),
      metadata: {
        orderId,
        catalogId: order.catalogId,
        userId: session.user.id,
      },
      description: `Pedido ${order.id} - Catálogo: ${catalog.name}`,
      statement_descriptor: 'WASTORE PEDIDO',
    })

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    })
  } catch (error: any) {
    console.error('Error creating payment intent:', error)

    // Don't leak Stripe errors to client
    if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json({ error: 'Error de configuración de pago' }, { status: 500 })
    }

    return NextResponse.json(
      { error: error.message || 'Error al crear intención de pago' },
      { status: 500 }
    )
  }
}
