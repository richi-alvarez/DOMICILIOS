import type { catalogs as catalogsTable, appointments as appointmentsTable } from '@/db'

type Catalog = typeof catalogsTable.$inferSelect
type Appointment = typeof appointmentsTable.$inferSelect

function fmt(d: Date): string {
  return d.toLocaleString('es-CO', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Notifica una cita recién creada a la tienda (y al cliente) por WhatsApp, si
 * Meta está configurado. Best-effort: no lanza.
 */
export async function notifyAppointmentCreated(catalog: Catalog, appt: Appointment): Promise<void> {
  try {
    const { isMetaConfigured, sendWhatsAppText, normalizePhone } = await import('@/lib/whatsapp/meta-client')
    if (!isMetaConfigured()) return

    const customer = (appt.customerJson ?? {}) as { name?: string; phone?: string }
    const cc = (catalog.contactCountryCode || '+57').replace('+', '')

    const storeMsg = [
      `🗓️ *Nueva cita en ${catalog.name}*`,
      `Cita #${appt.code}`,
      ``,
      `🛎️ Servicio: ${appt.service}`,
      `📅 ${fmt(appt.startAt)}`,
      `👤 ${customer.name ?? ''}`,
      `📞 ${customer.phone ?? ''}`,
    ].join('\n')

    // A la tienda
    if (catalog.contactPhone) {
      const storePhone = normalizePhone(`${cc}${catalog.contactPhone}`)
      await sendWhatsAppText(storePhone, storeMsg).catch(() => {})
    }

    // Al cliente
    if (customer.phone) {
      const digits = normalizePhone(customer.phone)
      const customerPhone = digits.length <= 10 ? normalizePhone(`${cc}${digits}`) : digits
      const customerMsg = [
        `✅ *¡Cita agendada!*`,
        `Hola ${customer.name ?? ''}, tu cita en *${catalog.name}* quedó registrada.`,
        ``,
        `🛎️ ${appt.service}`,
        `📅 ${fmt(appt.startAt)}`,
        `Cita #${appt.code}`,
        ``,
        `Te esperamos. ¡Gracias!`,
      ].join('\n')
      await sendWhatsAppText(customerPhone, customerMsg).catch(() => {})
    }
  } catch {
    /* best-effort */
  }
}
