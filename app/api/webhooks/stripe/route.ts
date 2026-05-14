import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { organizations, subscriptions, transactions, plans } from '@/db/schema'
import { eq } from 'drizzle-orm'
import Stripe from 'stripe'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_WEBHOOK_SECRET || !process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Webhook secret or key not configured' }, { status: 500 })
  }

  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature provided' }, { status: 400 })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2026-04-22.dahlia',
  })

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Signature verification failed' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const metadata = session.metadata as Record<string, any>

        if (metadata.organizationId && metadata.planCode) {
          const planData = await db
            .select()
            .from(plans)
            .where(eq(plans.code, metadata.planCode))
            .limit(1)

          if (planData.length) {
            const interval = metadata.interval || 'monthly'

            await db
              .update(organizations)
              .set({ planId: planData[0].id })
              .where(eq(organizations.id, metadata.organizationId))

            if (session.subscription) {
              await db.insert(subscriptions).values({
                organizationId: metadata.organizationId,
                planId: planData[0].id,
                stripeSubscriptionId: session.subscription as string,
                interval: interval as 'monthly' | 'annual',
                status: 'active',
                currentPeriodEnd: new Date(Date.now() + (interval === 'annual' ? 365 : 30) * 24 * 60 * 60 * 1000),
              })
            }

            const amount = session.amount_total || 0

            await db.insert(transactions).values({
              organizationId: metadata.organizationId,
              amount,
              currency: session.currency?.toUpperCase() || 'USD',
              status: 'paid',
              type: 'subscription',
              description: `Upgrade to ${metadata.planCode} (${interval})`,
              metadata,
            })
          }
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any
        const customerId = subscription.customer as string

        const org = await db
          .select()
          .from(organizations)
          .where(eq(organizations.stripeCustomerId, customerId))
          .limit(1)

        if (org.length) {
          await db
            .update(subscriptions)
            .set({
              status: subscription.status as any,
              currentPeriodEnd: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null,
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
            })
            .where(eq(subscriptions.stripeSubscriptionId, subscription.id))
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        const org = await db
          .select()
          .from(organizations)
          .where(eq(organizations.stripeCustomerId, customerId))
          .limit(1)

        if (org.length && invoice.amount_paid) {
          await db.insert(transactions).values({
            organizationId: org[0].id,
            stripeInvoiceId: invoice.id,
            amount: invoice.amount_paid,
            currency: invoice.currency?.toUpperCase() || 'USD',
            status: 'paid',
            type: 'subscription_payment',
            description: `Invoice ${invoice.number}`,
            metadata: {
              invoiceNumber: invoice.number,
              period: {
                start: new Date(invoice.period_start * 1000),
                end: new Date(invoice.period_end * 1000),
              },
            },
          })
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any
        const customerId = invoice.customer as string

        const org = await db
          .select()
          .from(organizations)
          .where(eq(organizations.stripeCustomerId, customerId))
          .limit(1)

        if (org.length) {
          await db.insert(transactions).values({
            organizationId: org[0].id,
            stripeInvoiceId: invoice.id,
            amount: invoice.amount_due,
            currency: invoice.currency?.toUpperCase() || 'USD',
            status: 'failed',
            type: 'subscription_payment',
            description: `Failed: Invoice ${invoice.number}`,
            metadata: {
              invoiceNumber: invoice.number,
            },
          })

          if (invoice.subscription && typeof invoice.subscription === 'string') {
            await db
              .update(subscriptions)
              .set({ status: 'past_due' })
              .where(eq(subscriptions.stripeSubscriptionId, invoice.subscription))
          }
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        const org = await db
          .select()
          .from(organizations)
          .where(eq(organizations.stripeCustomerId, customerId))
          .limit(1)

        if (org.length) {
          await db
            .update(subscriptions)
            .set({ status: 'canceled' })
            .where(eq(subscriptions.stripeSubscriptionId, subscription.id))
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('Webhook processing error:', err)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
