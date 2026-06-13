/** Configuración de agendamiento (modo citas). Tipos y defaults compartidos
 *  entre server actions y componentes (no es un archivo 'use server'). */

export type BookingConfig = {
  slotMinutes: number
  startHour: string
  endHour: string
  days: number[]
}

export const DEFAULT_BOOKING: BookingConfig = {
  slotMinutes: 60,
  startHour: '09:00',
  endHour: '18:00',
  days: [1, 2, 3, 4, 5, 6],
}
