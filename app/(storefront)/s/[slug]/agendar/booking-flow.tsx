'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, Loader2, CalendarDays, Clock, ImageOff } from 'lucide-react'
import { formatMoney } from '@/lib/utils'
import { createAppointment } from '@/lib/actions/appointments'
import type { BookingConfig } from '@/lib/booking/config'
import { useCartState } from '@/components/storefront/cart-context'

interface Service {
  id: string
  name: string
  slug: string
  price: number
  image?: string
}

interface Props {
  catalogId: string
  catalogName: string
  slug: string
  currency: string
  booking: BookingConfig
  services: Service[]
  booked: string[]
  initialServiceSlug?: string
  /** Destino de la flecha de atrás. Por defecto la tienda; desde el carrito, el carrito. */
  backHref?: string
  /** Si venimos del carrito, se muestran solo los servicios seleccionados. */
  fromCart?: boolean
}

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

function hhmmToMinutes(s: string) {
  const [h, m] = s.split(':').map(Number)
  return h * 60 + (m || 0)
}

export function BookingFlow({
  catalogId,
  catalogName,
  slug,
  currency,
  booking,
  services,
  booked,
  initialServiceSlug,
  backHref,
  fromCart,
}: Props) {
  const backTarget = backHref ?? `/s/${slug}`

  // Servicios seleccionados en el carrito (clave por productId === service.id).
  const { items: cartItems } = useCartState()
  const cartQtyById = useMemo(() => {
    const m = new Map<string, number>()
    for (const it of cartItems) m.set(it.productId, (m.get(it.productId) ?? 0) + it.qty)
    return m
  }, [cartItems])

  // En modo carrito mostramos solo los servicios que el cliente eligió. Si el
  // carrito aún no hidrató o no hay coincidencias, mostramos todos (fallback).
  const selectedServices = useMemo(
    () => services.filter((s) => cartQtyById.has(s.id)),
    [services, cartQtyById],
  )
  const displayedServices =
    fromCart && selectedServices.length > 0 ? selectedServices : services
  const [service, setService] = useState<Service | null>(
    services.find((s) => s.slug === initialServiceSlug) ?? (services.length === 1 ? services[0] : null),
  )
  const [date, setDate] = useState<Date | null>(null)
  const [slot, setSlot] = useState<Date | null>(null)
  const [customer, setCustomer] = useState({ name: '', phone: '', email: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<{ code: string } | null>(null)

  const bookedSet = useMemo(() => new Set(booked), [booked])

  // Próximos 21 días que caen en los días habilitados.
  const availableDates = useMemo(() => {
    const out: Date[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    for (let i = 0; i < 28 && out.length < 21; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() + i)
      if (booking.days.includes(d.getDay())) out.push(d)
    }
    return out
  }, [booking.days])

  // Slots de tiempo para la fecha elegida.
  const slots = useMemo(() => {
    if (!date) return []
    const start = hhmmToMinutes(booking.startHour)
    const end = hhmmToMinutes(booking.endHour)
    const step = booking.slotMinutes
    const now = new Date()
    const out: { start: Date; disabled: boolean }[] = []
    for (let m = start; m + step <= end; m += step) {
      const s = new Date(date)
      s.setHours(Math.floor(m / 60), m % 60, 0, 0)
      const disabled = s <= now || bookedSet.has(s.toISOString())
      out.push({ start: s, disabled })
    }
    return out
  }, [date, booking, bookedSet])

  const confirm = async () => {
    if (!service || !slot) return
    setSubmitting(true)
    setError(null)
    const end = new Date(slot.getTime() + booking.slotMinutes * 60000)
    const res = await createAppointment({
      catalogId,
      service: service.name,
      startAt: slot.toISOString(),
      endAt: end.toISOString(),
      customer: { name: customer.name, phone: customer.phone, email: customer.email || undefined },
    })
    setSubmitting(false)
    if ('error' in res) setError(res.error)
    else setDone({ code: res.appointment.code })
  }

  // Confirmación
  if (done) {
    return (
      <div className="min-h-screen bg-warm-50">
        <div className="mx-auto max-w-md px-4 py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-lime-100">
            <Check className="h-8 w-8 text-lime-600" />
          </div>
          <h1 className="font-display text-2xl font-bold text-night-900">¡Cita agendada!</h1>
          <p className="mt-2 text-night-500">
            Tu cita <strong>#{done.code}</strong> para <strong>{service?.name}</strong> quedó registrada.
          </p>
          <p className="mt-1 text-sm text-night-400">
            {slot &&
              slot.toLocaleString('es-CO', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit',
              })}
          </p>
          <Link
            href={`/s/${slug}`}
            className="mt-8 inline-block rounded-xl bg-primary-500 px-6 py-3 font-semibold text-white hover:bg-primary-600"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    )
  }

  const canConfirm = service && slot && customer.name.trim() && customer.phone.trim()

  return (
    <div className="min-h-screen bg-warm-50 pb-16">
      <div className="border-b border-warm-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-4">
          <Link href={backTarget} className="text-night-500 hover:text-night-800">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="font-display text-lg font-bold text-night-900">Agendar cita · {catalogName}</h1>
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
        {/* 1. Servicio */}
        <section>
          <h2 className="mb-2 text-sm font-semibold text-night-700">1. Elige el servicio</h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {services.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setService(s)
                  setSlot(null)
                }}
                className={`flex items-center gap-3 rounded-xl border-2 p-3 text-left transition ${
                  service?.id === s.id ? 'border-primary-500 bg-primary-50' : 'border-warm-200 bg-white hover:border-warm-300'
                }`}
              >
                {s.image ? (
                  <img src={s.image} alt={s.name} className="h-12 w-12 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warm-100">
                    <ImageOff className="h-5 w-5 text-warm-300" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate font-medium text-night-800">{s.name}</p>
                  {s.price > 0 && <p className="text-sm text-primary-600">{formatMoney(s.price, currency)}</p>}
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* 2. Fecha */}
        {service && (
          <section>
            <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-night-700">
              <CalendarDays className="h-4 w-4" /> 2. Elige la fecha
            </h2>
            {availableDates.length === 0 ? (
              <p className="text-sm text-warm-500">No hay días disponibles configurados.</p>
            ) : (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {availableDates.map((d) => {
                  const active = date && d.toDateString() === date.toDateString()
                  return (
                    <button
                      key={d.toISOString()}
                      onClick={() => {
                        setDate(d)
                        setSlot(null)
                      }}
                      className={`flex shrink-0 flex-col items-center rounded-xl border-2 px-3 py-2 transition ${
                        active ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-warm-200 bg-white text-night-600 hover:border-warm-300'
                      }`}
                    >
                      <span className="text-xs">{WEEKDAYS[d.getDay()]}</span>
                      <span className="text-lg font-bold">{d.getDate()}</span>
                      <span className="text-xs">{MONTHS[d.getMonth()]}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </section>
        )}

        {/* 3. Hora */}
        {service && date && (
          <section>
            <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-night-700">
              <Clock className="h-4 w-4" /> 3. Elige la hora
            </h2>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {slots.map(({ start, disabled }) => {
                const active = slot && start.getTime() === slot.getTime()
                return (
                  <button
                    key={start.toISOString()}
                    disabled={disabled}
                    onClick={() => setSlot(start)}
                    className={`rounded-lg border px-2 py-2 text-sm font-medium transition ${
                      disabled
                        ? 'cursor-not-allowed border-warm-100 bg-warm-50 text-warm-300 line-through'
                        : active
                          ? 'border-primary-500 bg-primary-50 text-primary-600'
                          : 'border-warm-200 text-night-600 hover:border-warm-300'
                    }`}
                  >
                    {start.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                  </button>
                )
              })}
              {slots.every((s) => s.disabled) && (
                <p className="col-span-full text-sm text-warm-500">No hay horarios disponibles este día.</p>
              )}
            </div>
          </section>
        )}

        {/* 4. Datos */}
        {service && slot && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-night-700">4. Tus datos</h2>
            <input
              value={customer.name}
              onChange={(e) => setCustomer((c) => ({ ...c, name: e.target.value }))}
              placeholder="Nombre completo *"
              className="w-full rounded-lg border border-warm-200 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none"
            />
            <input
              value={customer.phone}
              onChange={(e) => setCustomer((c) => ({ ...c, phone: e.target.value }))}
              placeholder="Teléfono *"
              inputMode="tel"
              className="w-full rounded-lg border border-warm-200 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none"
            />
            <input
              value={customer.email}
              onChange={(e) => setCustomer((c) => ({ ...c, email: e.target.value }))}
              placeholder="Email (opcional)"
              inputMode="email"
              className="w-full rounded-lg border border-warm-200 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none"
            />
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
            )}
            <button
              onClick={confirm}
              disabled={!canConfirm || submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-500 py-3.5 font-semibold text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
              {submitting ? 'Agendando...' : 'Confirmar cita'}
            </button>
          </section>
        )}
      </div>
    </div>
  )
}
