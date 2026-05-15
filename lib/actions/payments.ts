'use server'

import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { db, memberships, catalogs, paymentMethods, orders } from '@/db'
import { z } from 'zod'

// ── Auth helper ──────────────────────────────────────────────────────────
async function getOrgIdForUser(userId: string) {
  const m = await db.query.memberships.findFirst({ where: eq(memberships.userId, userId) })
  return m?.organizationId ?? null
}

async function assertCatalogOwner(catalogId: string, userId: string) {
  const orgId = await getOrgIdForUser(userId)
  if (!orgId) return null
  const catalog = await db.query.catalogs.findFirst({ where: eq(catalogs.id, catalogId) })
  if (!catalog || catalog.orgId !== orgId) return null
  return catalog
}

// ── Get payment methods for a catalog ────────────────────────────────────
export interface CatalogPaymentMethod {
  id: string
  provider: string
  enabled: boolean
  credentials: Record<string, any>
}

export async function getPaymentMethods(catalogId: string): Promise<CatalogPaymentMethod[]> {
  try {
    const rows = await db.query.paymentMethods.findMany({
      where: eq(paymentMethods.catalogId, catalogId),
    })
    return rows.map((r) => ({
      id: r.id,
      provider: r.provider,
      enabled: r.enabled,
      credentials: (r.credentialsJson ?? {}) as Record<string, any>,
    }))
  } catch {
    return []
  }
}

// ── Save/update Stripe settings for a catalog ────────────────────────────
const stripeSettingsSchema = z.object({
  publicKey: z.string().min(10, 'Clave pública inválida').startsWith('pk_', 'Debe empezar con pk_'),
  secretKey: z.string().min(10, 'Clave secreta inválida').startsWith('sk_', 'Debe empezar con sk_'),
  webhookSecret: z.string().optional(),
  enabled: z.boolean().default(false),
})

export async function saveStripeSettings(
  catalogId: string,
  data: z.infer<typeof stripeSettingsSchema>,
): Promise<{ error?: string; success?: boolean }> {
  const session = await auth()
  if (!session?.user?.id) return { error: 'No autenticado' }

  const catalog = await assertCatalogOwner(catalogId, session.user.id)
  if (!catalog) return { error: 'Catálogo no encontrado' }

  const parsed = stripeSettingsSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const existing = await db.query.paymentMethods.findFirst({
    where: and(eq(paymentMethods.catalogId, catalogId), eq(paymentMethods.provider, 'stripe')),
  })

  if (existing) {
    await db
      .update(paymentMethods)
      .set({
        enabled: parsed.data.enabled,
        credentialsJson: {
          publicKey: parsed.data.publicKey,
          secretKey: parsed.data.secretKey,
          webhookSecret: parsed.data.webhookSecret ?? '',
        },
      })
      .where(eq(paymentMethods.id, existing.id))
  } else {
    await db.insert(paymentMethods).values({
      catalogId,
      provider: 'stripe',
      enabled: parsed.data.enabled,
      credentialsJson: {
        publicKey: parsed.data.publicKey,
        secretKey: parsed.data.secretKey,
        webhookSecret: parsed.data.webhookSecret ?? '',
      },
    })
  }

  revalidatePath(`/app/catalogs/${catalogId}/settings/payments`)
  return { success: true }
}

// ── Create Stripe Checkout Session for an order ──────────────────────────
export interface CheckoutSessionResult {
  url?: string
  error?: string
}

export async function createStripeCheckoutSession(
  orderId: string,
  slug: string,
): Promise<CheckoutSessionResult> {
  try {
    const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) })
    if (!order) return { error: 'Pedido no encontrado' }

    const catalog = await db.query.catalogs.findFirst({
      where: eq(catalogs.id, order.catalogId),
    })
    if (!catalog) return { error: 'Catálogo no encontrado' }

    const pm = await db.query.paymentMethods.findFirst({
      where: and(
        eq(paymentMethods.catalogId, order.catalogId),
        eq(paymentMethods.provider, 'stripe'),
      ),
    })

    if (!pm || !pm.enabled) return { error: 'Pagos con tarjeta no habilitados en este catálogo' }

    const creds = (pm.credentialsJson ?? {}) as Record<string, any>
    if (!creds.secretKey) return { error: 'Stripe no configurado correctamente' }

    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(creds.secretKey, { apiVersion: '2026-04-22.dahlia' })

    const totals = (order.totalsJson ?? {}) as Record<string, any>
    const items = (order.itemsJson ?? []) as Array<{ name: string; price: number; qty: number; variantLabel?: string }>
    const currency = (totals.currency ?? 'usd').toLowerCase()

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: items.map((item) => ({
        price_data: {
          currency,
          product_data: {
            name: item.variantLabel ? `${item.name} (${item.variantLabel})` : item.name,
          },
          unit_amount: item.price, // already in cents / base unit
        },
        quantity: item.qty,
      })),
      ...(totals.shipping > 0 && {
        shipping_options: [
          {
            shipping_rate_data: {
              type: 'fixed_amount',
              fixed_amount: { amount: totals.shipping, currency },
              display_name: 'Costo de envío',
            },
          },
        ],
      }),
      metadata: {
        orderId: order.id,
        orderCode: order.code,
        catalogId: order.catalogId,
        slug,
      },
      success_url: `${appUrl}/s/${slug}/checkout/confirm?code=${order.code}&id=${order.id}&cid=${order.catalogId}&paid=1`,
      cancel_url: `${appUrl}/s/${slug}/checkout/summary`,
    })

    return { url: session.url ?? undefined }
  } catch (err: any) {
    return { error: err.message ?? 'Error al crear sesión de pago' }
  }
}

// ── Create Stripe Checkout Session for SaaS subscription upgrade ─────────
export async function createSubscriptionCheckoutSession(
  planCode: string,
  interval: 'monthly' | 'annual',
): Promise<{ url?: string; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { error: 'No autenticado' }
  if (!process.env.STRIPE_SECRET_KEY) return { error: 'Stripe no configurado en el servidor' }

  try {
    const { db: database, memberships: mbs, organizations, plans } = await import('@/db')
    const { eq: eq2 } = await import('drizzle-orm')

    const membership = await database.query.memberships.findFirst({
      where: eq2(mbs.userId, session.user.id as string),
    })
    if (!membership) return { error: 'Sin organización' }

    const plan = await database.query.plans.findFirst({
      where: eq2(plans.code, planCode),
    })
    if (!plan) return { error: 'Plan no encontrado' }

    const priceId =
      interval === 'annual' ? plan.stripePriceIdAnnual : plan.stripePriceIdMonthly
    if (!priceId) return { error: 'Precio de Stripe no configurado para este plan. Configura los Price IDs en Stripe Dashboard.' }

    const org = await database.query.organizations.findFirst({
      where: eq2(organizations.id, membership.organizationId),
    })

    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-04-22.dahlia' })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      ...(org?.stripeCustomerId ? { customer: org.stripeCustomerId } : {}),
      metadata: {
        organizationId: membership.organizationId,
        planCode,
        interval,
      },
      success_url: `${appUrl}/app/billing?upgraded=1`,
      cancel_url: `${appUrl}/plans`,
    })

    return { url: checkoutSession.url ?? undefined }
  } catch (err: any) {
    return { error: err.message ?? 'Error al crear sesión de pago' }
  }
}

// ── Stripe billing portal for SaaS subscriptions ─────────────────────────
export async function createBillingPortalSession(): Promise<{ url?: string; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { error: 'No autenticado' }

  if (!process.env.STRIPE_SECRET_KEY) return { error: 'Stripe no configurado' }

  try {
    const { db: database, organizations, memberships: mbs } = await import('@/db')
    const { eq: eq2 } = await import('drizzle-orm')

    const membership = await database.query.memberships.findFirst({
      where: eq2(mbs.userId, session.user.id as string),
    })
    if (!membership) return { error: 'Sin organización' }

    const org = await database.query.organizations.findFirst({
      where: eq2(organizations.id, membership.organizationId),
    })
    if (!org?.stripeCustomerId) return { error: 'Sin suscripción activa' }

    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-04-22.dahlia' })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: org.stripeCustomerId,
      return_url: `${appUrl}/app/billing`,
    })

    return { url: portalSession.url }
  } catch (err: any) {
    return { error: err.message }
  }
}

// ── Get transactions for organization ────────────────────────────────────
export async function getOrgTransactions(organizationId: string, limit = 20) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'No autenticado', transactions: [] }

  try {
    const { db: database, memberships: mbs, transactions: txns } = await import('@/db')
    const { eq: eq2, desc: desc2 } = await import('drizzle-orm')

    const membership = await database.query.memberships.findFirst({
      where: eq2(mbs.userId, session.user.id as string),
    })
    if (!membership || membership.organizationId !== organizationId) {
      return { error: 'No tienes permisos', transactions: [] }
    }

    const txnData = await database.query.transactions.findMany({
      where: eq2(txns.organizationId, organizationId),
      orderBy: desc2(txns.createdAt),
      limit,
    })

    return { transactions: txnData }
  } catch (err: any) {
    return { error: err.message, transactions: [] }
  }
}
