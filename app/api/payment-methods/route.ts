import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db, memberships } from '@/db'
import { eq } from 'drizzle-orm'

const stripe = require('stripe')

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ paymentMethods: [] })
    }

    const stripeClient = new stripe.default(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-04-22.dahlia',
    })

    // Get user's Stripe customer ID from metadata (if exists)
    // For now, return empty list - actual implementation would link user to Stripe customer
    const paymentMethods = []

    return NextResponse.json({
      success: true,
      paymentMethods,
      count: paymentMethods.length,
    })
  } catch (error: any) {
    console.error('Error fetching payment methods:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener métodos de pago' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { paymentMethodId } = await req.json()

    if (!paymentMethodId) {
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

    // In a real implementation, you would:
    // 1. Get or create a Stripe customer for the user
    // 2. Attach the payment method to the customer
    // 3. Save the customer ID in your database

    // For now, just return success
    return NextResponse.json({
      success: true,
      message: 'Método de pago guardado correctamente',
    })
  } catch (error: any) {
    console.error('Error saving payment method:', error)
    return NextResponse.json(
      { error: error.message || 'Error al guardar método de pago' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { paymentMethodId } = await req.json()

    if (!paymentMethodId) {
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

    // Detach payment method
    await stripeClient.paymentMethods.detach(paymentMethodId)

    return NextResponse.json({
      success: true,
      message: 'Método de pago eliminado',
    })
  } catch (error: any) {
    console.error('Error deleting payment method:', error)
    return NextResponse.json(
      { error: error.message || 'Error al eliminar método de pago' },
      { status: 500 }
    )
  }
}
