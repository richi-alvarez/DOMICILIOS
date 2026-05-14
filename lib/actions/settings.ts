'use server'

import { eq } from 'drizzle-orm'
import { db, catalogs, memberships } from '@/db'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const deliverySettingsSchema = z.object({
  catalogId: z.string().uuid(),
  orderChannel: z.enum(['whatsapp', 'email']),
  contactPhone: z.string().optional(),
  contactCountryCode: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  pickupEnabled: z.boolean().default(true),
  deliveryEnabled: z.boolean().default(false),
  deliveryFee: z.number().min(0).default(0),
  deliveryMinOrder: z.number().min(0).default(0),
  dineInEnabled: z.boolean().default(false),
  businessHours: z.record(
    z.object({ open: z.string(), close: z.string(), enabled: z.boolean() }),
  ).optional(),
})

export type DeliverySettings = z.infer<typeof deliverySettingsSchema>

export async function saveDeliverySettings(data: DeliverySettings) {
  const parsed = deliverySettingsSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.data }

  const session = await auth()
  if (!session?.user?.id) return { error: 'No autenticado' }

  const { catalogId, orderChannel, contactPhone, contactCountryCode, contactEmail, ...rest } = parsed.data

  const catalog = await db.query.catalogs.findFirst({ where: eq(catalogs.id, catalogId) })
  if (!catalog) return { error: 'Catálogo no encontrado' }

  // merge delivery config into settingsJson
  const currentSettings = (catalog.settingsJson ?? {}) as Record<string, unknown>
  const updatedSettings = {
    ...currentSettings,
    delivery: {
      pickup_enabled: rest.pickupEnabled,
      delivery_enabled: rest.deliveryEnabled,
      delivery_fee: rest.deliveryFee,
      delivery_min_order: rest.deliveryMinOrder,
      dine_in_enabled: rest.dineInEnabled,
    },
    hours: rest.businessHours,
  }

  await db.update(catalogs).set({
    orderChannel,
    contactPhone: contactPhone || null,
    contactCountryCode: contactCountryCode || null,
    contactEmail: contactEmail || null,
    settingsJson: updatedSettings,
    updatedAt: new Date(),
  }).where(eq(catalogs.id, catalogId))

  revalidatePath(`/app/catalogs/${catalogId}/settings`)
  revalidatePath(`/s/${catalog.slug}`)
  return { ok: true }
}
