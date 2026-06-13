'use server'

import { db, appointments, catalogs, organizations, memberships } from '@/db'
import { and, eq } from 'drizzle-orm'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed'

export interface AppointmentDTO {
  id: string
  code: string
  service: string
  startAt: string
  endAt: string
  status: AppointmentStatus
  customer: { name: string; phone: string; email?: string }
  notes?: string | null
}

const createSchema = z.object({
  catalogId: z.string().uuid(),
  service: z.string().min(1, 'Servicio requerido'),
  startAt: z.string(), // ISO
  endAt: z.string(),
  customer: z.object({
    name: z.string().min(1, 'Nombre requerido'),
    phone: z.string().min(1, 'Teléfono requerido'),
    email: z.string().email().optional().or(z.literal('')),
  }),
  notes: z.string().optional(),
})

function appointmentCode(seq: number): string {
  const d = new Date()
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  return `C${ymd}${String(seq).padStart(3, '0')}`
}

function toDTO(a: typeof appointments.$inferSelect): AppointmentDTO {
  return {
    id: a.id,
    code: a.code,
    service: a.service,
    startAt: a.startAt.toISOString(),
    endAt: a.endAt.toISOString(),
    status: a.status as AppointmentStatus,
    customer: (a.customerJson ?? {}) as AppointmentDTO['customer'],
    notes: a.notes,
  }
}

/** Verifica que el usuario sea dueño/miembro del catálogo. */
async function assertCatalogOwnership(catalogId: string, userId: string) {
  const catalog = await db.query.catalogs.findFirst({ where: eq(catalogs.id, catalogId) })
  if (!catalog) return null
  const member = await db.query.memberships.findFirst({
    where: and(eq(memberships.userId, userId), eq(memberships.organizationId, catalog.orgId)),
  })
  return member ? catalog : null
}

/**
 * Crea una cita desde el storefront (público, sin sesión). Notifica y
 * sincroniza con Google Calendar de forma best-effort.
 */
export async function createAppointment(input: z.input<typeof createSchema>) {
  const parsed = createSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.errors[0].message }
  const { catalogId, service, startAt, endAt, customer, notes } = parsed.data

  const catalog = await db.query.catalogs.findFirst({ where: eq(catalogs.id, catalogId) })
  if (!catalog) return { error: 'Catálogo no encontrado' }

  const start = new Date(startAt)
  const end = new Date(endAt)
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
    return { error: 'Fecha/hora inválida' }
  }

  // Secuencia diaria por catálogo para el código.
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const all = await db.query.appointments.findMany({ where: eq(appointments.catalogId, catalogId) })
  const seq = all.filter((a) => a.createdAt >= today).length + 1
  const code = appointmentCode(seq)

  const [appt] = await db
    .insert(appointments)
    .values({
      code,
      catalogId,
      service,
      startAt: start,
      endAt: end,
      customerJson: { name: customer.name, phone: customer.phone, ...(customer.email ? { email: customer.email } : {}) },
      notes: notes || null,
      status: 'pending',
    })
    .returning()

  // Best-effort: Google Calendar + notificaciones (no bloquean la creación).
  ;(async () => {
    try {
      const { createGoogleEvent } = await import('@/lib/google/calendar')
      const eventId = await createGoogleEvent(catalog.orgId, appt)
      if (eventId) {
        await db.update(appointments).set({ googleEventId: eventId }).where(eq(appointments.id, appt.id))
      }
    } catch (e) {
      console.error('[appointments] google sync failed:', e)
    }
  })()
  ;(async () => {
    try {
      const { notifyAppointmentCreated } = await import('@/lib/whatsapp/appointment-messages')
      await notifyAppointmentCreated(catalog, appt)
    } catch (e) {
      console.error('[appointments] notify failed:', e)
    }
  })()

  revalidatePath(`/app/catalogs/${catalogId}/citas`)
  return { ok: true as const, appointment: { id: appt.id, code: appt.code } }
}

/** Lista las citas de un catálogo (admin). */
export async function listAppointments(catalogId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'No autenticado' }
  const catalog = await assertCatalogOwnership(catalogId, session.user.id)
  if (!catalog) return { error: 'Sin acceso al catálogo' }

  const rows = await db.query.appointments.findMany({
    where: eq(appointments.catalogId, catalogId),
    orderBy: (t, { asc }) => [asc(t.startAt)],
  })
  return { appointments: rows.map(toDTO) }
}

/** Cambia el estado de una cita y sincroniza el evento de Google. */
export async function updateAppointmentStatus(id: string, status: AppointmentStatus) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'No autenticado' }

  const appt = await db.query.appointments.findFirst({ where: eq(appointments.id, id) })
  if (!appt) return { error: 'Cita no encontrada' }
  const catalog = await assertCatalogOwnership(appt.catalogId, session.user.id)
  if (!catalog) return { error: 'Sin acceso' }

  await db.update(appointments).set({ status, updatedAt: new Date() }).where(eq(appointments.id, id))

  // Best-effort Google sync: cancelar = borrar evento; otro = actualizar.
  ;(async () => {
    try {
      const { updateGoogleEventStatus } = await import('@/lib/google/calendar')
      await updateGoogleEventStatus(catalog.orgId, { ...appt, status })
    } catch (e) {
      console.error('[appointments] google status sync failed:', e)
    }
  })()

  revalidatePath(`/app/catalogs/${appt.catalogId}/citas`)
  return { ok: true as const }
}
