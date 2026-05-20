'use server'

import { auth } from '@/auth'
import { db, memberships, organizations, plans, subscriptions } from '@/db'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

const stripe = require('stripe')

const checkoutSchema = z.object({
  planCode: z.enum(['free', 'pro', 'team', 'premium']),
  interval: z.enum(['monthly', 'annual']),
})

export async function createSubscriptionCheckout(
  data: z.infer<typeof checkoutSchema>
): Promise<{ url?: string; error?: string }> {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: 'No autenticado' }

    const parsed = checkoutSchema.safeParse(data)
    if (!parsed.success) return { error: 'Datos inválidos' }

    // Get user's organization
    const membership = await db.query.memberships.findFirst({
      where: eq(memberships.userId, session.user.id),
    })

    if (!membership) return { error: 'Organización no encontrada' }

    // Get plan details
    const plan = await db.query.plans.findFirst({
      where: eq(plans.code, parsed.data.planCode),
    })

    if (!plan) return { error: 'Plan no encontrado' }

    if (!process.env.STRIPE_SECRET_KEY) {
      return { error: 'Pagos no configurados' }
    }

    if (!process.env.NEXT_PUBLIC_APP_URL) {
      return { error: 'URL de aplicación no configurada' }
    }

    const stripeClient = new stripe.default(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-04-22.dahlia',
    })

    // Get pricing info from plan
    const pricesJson = (plan.pricesJson ?? {}) as Record<string, number>
    const price = pricesJson[parsed.data.interval] || 0

    // Create checkout session
    const checkoutSession = await stripeClient.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Plan ${plan.name}`,
              description: `Suscripción ${parsed.data.interval} al plan ${plan.name}`,
            },
            unit_amount: price,
            recurring: {
              interval: parsed.data.interval === 'annual' ? 'year' : 'month',
              interval_count: 1,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?cancelled=true`,
      customer_email: session.user.email || undefined,
      metadata: {
        organizationId: membership.organizationId,
        planCode: parsed.data.planCode,
        interval: parsed.data.interval,
        userId: session.user.id,
      },
    })

    if (!checkoutSession.url) {
      return { error: 'Error al crear sesión de checkout' }
    }

    return { url: checkoutSession.url }
  } catch (error: any) {
    console.error('Error creating subscription checkout:', error)
    return {
      error: error.message || 'Error al crear sesión de pago',
    }
  }
}

export async function getSubscriptionStatus() {
  try {
    const session = await auth()
    if (!session?.user?.id) return null

    const membership = await db.query.memberships.findFirst({
      where: eq(memberships.userId, session.user.id),
    })

    if (!membership) return null

    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.organizationId, membership.organizationId),
      with: {
        plan: true,
      },
    })

    if (!subscription) return null

    return {
      planCode: subscription.plan?.code,
      planName: subscription.plan?.name,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd,
      interval: subscription.interval,
    }
  } catch (error) {
    console.error('Error fetching subscription:', error)
    return null
  }
}
