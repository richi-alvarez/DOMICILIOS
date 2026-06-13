'use server'

import { db, catalogs, memberships } from '@/db'
import { and, eq } from 'drizzle-orm'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { DEFAULT_BOOKING, type BookingConfig } from '@/lib/booking/config'

const schema = z.object({
  catalogId: z.string().uuid(),
  type: z.enum(['products', 'appointments']),
  ctaLabel: z.string().max(40).optional(),
  booking: z
    .object({
      slotMinutes: z.number().int().min(5).max(480),
      startHour: z.string(),
      endHour: z.string(),
      days: z.array(z.number().int().min(0).max(6)),
    })
    .optional(),
})

/** Actualiza el tipo de catálogo (productos/citas), el texto del botón y la
 *  configuración de agendamiento. */
export async function updateSalesType(input: z.input<typeof schema>) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'No autenticado' }

  const parsed = schema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.errors[0].message }
  const { catalogId, type, ctaLabel, booking } = parsed.data

  const catalog = await db.query.catalogs.findFirst({ where: eq(catalogs.id, catalogId) })
  if (!catalog) return { error: 'Catálogo no encontrado' }
  const member = await db.query.memberships.findFirst({
    where: and(eq(memberships.userId, session.user.id), eq(memberships.organizationId, catalog.orgId)),
  })
  if (!member) return { error: 'Sin acceso al catálogo' }

  const settings = (catalog.settingsJson ?? {}) as Record<string, unknown>
  const updatedSettings = {
    ...settings,
    ctaLabel: ctaLabel?.trim() || (type === 'appointments' ? 'Agendar' : 'Agregar al carrito'),
    booking: booking ?? (settings.booking as BookingConfig) ?? DEFAULT_BOOKING,
  }

  await db
    .update(catalogs)
    .set({ type, settingsJson: updatedSettings, updatedAt: new Date() })
    .where(eq(catalogs.id, catalogId))

  revalidatePath(`/app/catalogs/${catalogId}/settings/sales-type`)
  revalidatePath(`/s/${catalog.slug}`)
  return { ok: true as const }
}
