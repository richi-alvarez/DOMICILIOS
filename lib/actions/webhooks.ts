'use server'

import { db } from '@/db'
import { webhooks, webhookDeliveries, catalogs, memberships } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'
import crypto from 'crypto'

export async function createWebhook(
  catalogId: string,
  url: string,
  events: string[],
) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'No autenticado' }

  // Validar URL
  try {
    new URL(url)
  } catch {
    return { error: 'URL inválida' }
  }

  // Validar que el usuario sea owner/admin del catálogo
  const membership = await db.query.memberships.findFirst({
    where: eq(memberships.userId, session.user.id as string),
  })

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return { error: 'No tienes permisos' }
  }

  const catalog = await db.query.catalogs.findFirst({
    where: eq(catalogs.id, catalogId),
  })

  if (!catalog || catalog.orgId !== membership.organizationId) {
    return { error: 'Catálogo no encontrado' }
  }

  const secret = crypto.randomBytes(32).toString('hex')

  await db.insert(webhooks).values({
    catalogId,
    url,
    events: events.length > 0 ? events : ['order.created'],
    secret,
  })

  revalidatePath(`/app/catalogs/${catalogId}/settings/webhooks`)
  return { success: true, secret }
}

export async function deleteWebhook(catalogId: string, webhookId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'No autenticado' }

  const membership = await db.query.memberships.findFirst({
    where: eq(memberships.userId, session.user.id as string),
  })

  if (!membership) return { error: 'No tienes permisos' }

  const webhook = await db.query.webhooks.findFirst({
    where: eq(webhooks.id, webhookId),
  })

  if (!webhook) return { error: 'Webhook no encontrado' }

  const catalog = await db.query.catalogs.findFirst({
    where: eq(catalogs.id, catalogId),
  })

  if (!catalog || catalog.orgId !== membership.organizationId) {
    return { error: 'No tienes permisos' }
  }

  await db.delete(webhooks).where(eq(webhooks.id, webhookId))

  revalidatePath(`/app/catalogs/${catalogId}/settings/webhooks`)
  return { success: true }
}

export async function toggleWebhook(catalogId: string, webhookId: string, active: boolean) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'No autenticado' }

  const membership = await db.query.memberships.findFirst({
    where: eq(memberships.userId, session.user.id as string),
  })

  if (!membership) return { error: 'No tienes permisos' }

  const webhook = await db.query.webhooks.findFirst({
    where: eq(webhooks.id, webhookId),
  })

  if (!webhook) return { error: 'Webhook no encontrado' }

  const catalog = await db.query.catalogs.findFirst({
    where: eq(catalogs.id, catalogId),
  })

  if (!catalog || catalog.orgId !== membership.organizationId) {
    return { error: 'No tienes permisos' }
  }

  await db.update(webhooks).set({ active }).where(eq(webhooks.id, webhookId))

  revalidatePath(`/app/catalogs/${catalogId}/settings/webhooks`)
  return { success: true }
}

export async function getWebhooks(catalogId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'No autenticado', webhooks: [] }

  const membership = await db.query.memberships.findFirst({
    where: eq(memberships.userId, session.user.id as string),
  })

  if (!membership) return { error: 'No tienes permisos', webhooks: [] }

  const catalog = await db.query.catalogs.findFirst({
    where: eq(catalogs.id, catalogId),
  })

  if (!catalog || catalog.orgId !== membership.organizationId) {
    return { error: 'No tienes permisos', webhooks: [] }
  }

  const whks = await db.query.webhooks.findMany({
    where: eq(webhooks.catalogId, catalogId),
  })

  return { webhooks: whks }
}

export async function getWebhookDeliveries(webhookId: string, limit = 20) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'No autenticado', deliveries: [] }

  const webhook = await db.query.webhooks.findFirst({
    where: eq(webhooks.id, webhookId),
  })

  if (!webhook) return { error: 'Webhook no encontrado', deliveries: [] }

  const membership = await db.query.memberships.findFirst({
    where: eq(memberships.userId, session.user.id as string),
  })

  if (!membership) return { error: 'No tienes permisos', deliveries: [] }

  const catalog = await db.query.catalogs.findFirst({
    where: eq(catalogs.id, webhook.catalogId),
  })

  if (!catalog || catalog.orgId !== membership.organizationId) {
    return { error: 'No tienes permisos', deliveries: [] }
  }

  const deliveries = await db.query.webhookDeliveries.findMany({
    where: eq(webhookDeliveries.webhookId, webhookId),
    orderBy: (t) => [t.createdAt],
    limit,
  })

  return { deliveries }
}

export async function triggerWebhookDelivery(
  webhookId: string,
  event: string,
  payload: Record<string, any>,
) {
  // This is called internally from order creation, etc
  const webhook = await db.query.webhooks.findFirst({
    where: eq(webhooks.id, webhookId),
  })

  if (!webhook || !webhook.active || !webhook.events.includes(event)) {
    return
  }

  // Create delivery record
  await db.insert(webhookDeliveries).values({
    webhookId,
    event,
    payload,
    attempt: 1,
  })

  // Trigger async delivery
  triggerWebhookAsync(webhook.url, webhook.secret, event, payload, webhookId)
}

async function triggerWebhookAsync(
  url: string,
  secret: string,
  event: string,
  payload: Record<string, any>,
  webhookId: string,
) {
  const timestamp = Date.now()
  const signature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload) + timestamp)
    .digest('hex')

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Timestamp': timestamp.toString(),
        'X-Webhook-Event': event,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    const deliveries = await db.query.webhookDeliveries.findFirst({
      where: and(
        eq(webhookDeliveries.webhookId, webhookId),
        eq(webhookDeliveries.event, event),
      ),
    })

    if (deliveries) {
      await db.update(webhookDeliveries).set({
        statusCode: response.status,
        deliveredAt: new Date(),
      })
    }
  } catch (err) {
    // Schedule retry
    const nextRetry = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    const delivery = await db.query.webhookDeliveries.findFirst({
      where: and(
        eq(webhookDeliveries.webhookId, webhookId),
        eq(webhookDeliveries.event, event),
      ),
    })

    if (delivery) {
      await db.update(webhookDeliveries).set({
        nextRetry,
        attempt: (delivery.attempt || 0) + 1,
      })
    }
  }
}
