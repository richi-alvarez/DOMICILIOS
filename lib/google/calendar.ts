import { db, accounts, organizations, appointments } from '@/db'
import { and, eq } from 'drizzle-orm'

/**
 * Integración con Google Calendar para el modo Citas. Best-effort: si el dueño
 * del comercio no inició sesión con Google o no concedió el scope de calendario,
 * todas las funciones devuelven null/no-op sin romper el flujo de citas.
 *
 * Para habilitarlo: el proveedor Google de NextAuth (auth.ts) debe pedir el scope
 * `https://www.googleapis.com/auth/calendar.events` con access_type=offline.
 */

const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar'
const EVENTS_URL = 'https://www.googleapis.com/calendar/v3/calendars/primary/events'

type Appointment = typeof appointments.$inferSelect

/** Obtiene (y refresca si hace falta) el access token de Google del dueño del comercio. */
async function getMerchantAccessToken(orgId: string): Promise<string | null> {
  const org = await db.query.organizations.findFirst({ where: eq(organizations.id, orgId) })
  if (!org) return null

  const acc = await db.query.accounts.findFirst({
    where: and(eq(accounts.userId, org.ownerUserId), eq(accounts.provider, 'google')),
  })
  if (!acc?.access_token) return null
  // Sin scope de calendario no podemos crear eventos.
  if (!acc.scope || !acc.scope.includes(CALENDAR_SCOPE)) return null

  const now = Math.floor(Date.now() / 1000)
  const stillValid = acc.expires_at && acc.expires_at - 60 > now
  if (stillValid) return acc.access_token

  // Refrescar con el refresh_token (mismas credenciales que NextAuth).
  const clientId = process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET
  if (!acc.refresh_token || !clientId || !clientSecret) {
    return acc.access_token // último recurso: intentar con el actual
  }
  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
        refresh_token: acc.refresh_token,
      }),
    })
    const data = (await res.json()) as { access_token?: string; expires_in?: number }
    if (!data.access_token) return acc.access_token
    await db
      .update(accounts)
      .set({ access_token: data.access_token, expires_at: now + (data.expires_in ?? 3600) })
      .where(and(eq(accounts.userId, org.ownerUserId), eq(accounts.provider, 'google')))
    return data.access_token
  } catch {
    return acc.access_token
  }
}

function eventBody(appt: Appointment) {
  const customer = (appt.customerJson ?? {}) as { name?: string; phone?: string }
  const cancelled = appt.status === 'cancelled'
  const done = appt.status === 'completed'
  const prefix = cancelled ? '[Cancelada] ' : done ? '[Completada] ' : ''
  return {
    summary: `${prefix}${appt.service} — ${customer.name ?? 'Cliente'}`,
    description: `Cita #${appt.code}\nCliente: ${customer.name ?? ''}\nTeléfono: ${customer.phone ?? ''}${appt.notes ? `\nNotas: ${appt.notes}` : ''}`,
    start: { dateTime: appt.startAt.toISOString() },
    end: { dateTime: appt.endAt.toISOString() },
    status: cancelled ? 'cancelled' : 'confirmed',
  }
}

/** Crea el evento en Google Calendar. Devuelve el eventId o null. */
export async function createGoogleEvent(orgId: string, appt: Appointment): Promise<string | null> {
  const token = await getMerchantAccessToken(orgId)
  if (!token) return null
  try {
    const res = await fetch(EVENTS_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(eventBody(appt)),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { id?: string }
    return data.id ?? null
  } catch {
    return null
  }
}

/** Refleja el cambio de estado en el evento (cancelled = borrar, otro = actualizar). */
export async function updateGoogleEventStatus(orgId: string, appt: Appointment): Promise<void> {
  if (!appt.googleEventId) return
  const token = await getMerchantAccessToken(orgId)
  if (!token) return
  try {
    if (appt.status === 'cancelled') {
      await fetch(`${EVENTS_URL}/${appt.googleEventId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      return
    }
    await fetch(`${EVENTS_URL}/${appt.googleEventId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(eventBody(appt)),
    })
  } catch {
    /* best-effort */
  }
}
