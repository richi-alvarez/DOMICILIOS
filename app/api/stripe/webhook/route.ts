import { NextRequest, NextResponse } from 'next/server'
import { eq, and } from 'drizzle-orm'
import { db, orders, catalogs, paymentMethods } from '@/db'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 400 })

  // We need to find the right webhook secret.
  // We try with the platform-level secret first (for SaaS billing).
  // Then with catalog-specific secrets for order payments.

  let event: any

  // Try platform webhook first
  const platformSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (platformSecret) {
    try {
      const Stripe = (await import('stripe')).default
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-04-22.dahlia' })
      event = stripe.webhooks.constructEvent(body, sig, platformSecret)
    } catch {
      event = null
    }
  }

  // If not verified, try catalog-specific secrets
  if (!event) {
    try {
      const allMethods = await db.query.paymentMethods.findMany({
        where: eq(paymentMethods.provider, 'stripe'),
      })
      const Stripe = (await import('stripe')).default

      for (const pm of allMethods) {
        const creds = (pm.credentialsJson ?? {}) as Record<string, any>
        if (!creds.webhookSecret || !creds.secretKey) continue
        try {
          const stripe = new Stripe(creds.secretKey, { apiVersion: '2026-04-22.dahlia' })
          event = stripe.webhooks.constructEvent(body, sig, creds.webhookSecret)
          break
        } catch {
          continue
        }
      }
    } catch {
      // DB not configured
    }
  }

  if (!event) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    if (event.type === 'checkout.session.completed') {
      await handleCheckoutCompleted(event.data.object)
    } else if (event.type === 'customer.subscription.updated') {
      await handleSubscriptionUpdated(event.data.object)
    } else if (event.type === 'customer.subscription.deleted') {
      await handleSubscriptionDeleted(event.data.object)
    }
  } catch (err) {
    console.error('[stripe-webhook]', err)
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

async function handleCheckoutCompleted(session: any) {
  const { orderId, catalogId } = session.metadata ?? {}
  if (!orderId || !catalogId) return

  await db
    .update(orders)
    .set({
      status: 'received',
      paymentJson: {
        method: 'stripe',
        status: 'paid',
        stripeSessionId: session.id,
        amount: session.amount_total,
        currency: session.currency,
      },
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId))
}

async function handleSubscriptionUpdated(subscription: any) {
  if (!process.env.DATABASE_URL) return
  try {
    const { subscriptions, organizations } = await import('@/db')
    const { eq: eq2 } = await import('drizzle-orm')

    await db
      .update(subscriptions)
      .set({
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      })
      .where(eq2(subscriptions.stripeSubscriptionId, subscription.id))
  } catch {}
}

async function handleSubscriptionDeleted(subscription: any) {
  if (!process.env.DATABASE_URL) return
  try {
    const { subscriptions } = await import('@/db')
    const { eq: eq2 } = await import('drizzle-orm')

    await db
      .update(subscriptions)
      .set({ status: 'canceled' })
      .where(eq2(subscriptions.stripeSubscriptionId, subscription.id))
  } catch {}
}
