'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingCart, CalendarDays, Loader2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { updateSalesType } from '@/lib/actions/catalog-type'
import type { BookingConfig } from '@/lib/booking/config'

const DAYS = [
  { v: 1, label: 'Lun' },
  { v: 2, label: 'Mar' },
  { v: 3, label: 'Mié' },
  { v: 4, label: 'Jue' },
  { v: 5, label: 'Vie' },
  { v: 6, label: 'Sáb' },
  { v: 0, label: 'Dom' },
]

interface Props {
  catalogId: string
  initial: {
    type: 'products' | 'appointments'
    ctaLabel: string
    booking: BookingConfig
  }
}

export function SalesTypeForm({ catalogId, initial }: Props) {
  const router = useRouter()
  const [type, setType] = useState<'products' | 'appointments'>(initial.type)
  const [ctaLabel, setCtaLabel] = useState(initial.ctaLabel)
  const [booking, setBooking] = useState<BookingConfig>(initial.booking)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const defaultCta = type === 'appointments' ? 'Agendar' : 'Agregar al carrito'

  const save = async () => {
    setSaving(true)
    setError(null)
    setSaved(false)
    const res = await updateSalesType({ catalogId, type, ctaLabel, booking })
    setSaving(false)
    if ('error' in res) {
      setError(res.error)
    } else {
      setSaved(true)
      router.refresh()
      setTimeout(() => setSaved(false), 2500)
    }
  }

  const toggleDay = (d: number) =>
    setBooking((b) => ({
      ...b,
      days: b.days.includes(d) ? b.days.filter((x) => x !== d) : [...b.days, d].sort(),
    }))

  return (
    <div className="max-w-2xl space-y-8">
      {/* Selector de tipo */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {(
          [
            {
              v: 'products' as const,
              icon: ShoppingCart,
              title: 'Productos (carrito)',
              desc: 'Tus clientes agregan productos al carrito y hacen un pedido.',
            },
            {
              v: 'appointments' as const,
              icon: CalendarDays,
              title: 'Servicios (citas)',
              desc: 'Tus clientes agendan una cita para un servicio en una fecha y hora.',
            },
          ]
        ).map((opt) => {
          const Icon = opt.icon
          const active = type === opt.v
          return (
            <button
              key={opt.v}
              type="button"
              onClick={() => setType(opt.v)}
              className={`flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition ${
                active ? 'border-primary-500 bg-primary-50' : 'border-warm-200 hover:border-warm-300'
              }`}
            >
              <Icon className={`h-6 w-6 ${active ? 'text-primary-600' : 'text-warm-400'}`} />
              <span className="font-semibold text-night-800">{opt.title}</span>
              <span className="text-xs text-night-500">{opt.desc}</span>
            </button>
          )
        })}
      </div>

      {/* Texto del botón */}
      <div>
        <label className="mb-2 block text-sm font-medium text-night-800">
          Texto del botón en las tarjetas
        </label>
        <input
          type="text"
          value={ctaLabel}
          onChange={(e) => setCtaLabel(e.target.value)}
          placeholder={defaultCta}
          className="w-full rounded-lg border border-warm-200 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none"
        />
        <p className="mt-1 text-xs text-warm-400">
          Si lo dejas vacío, se usará &quot;{defaultCta}&quot;.
        </p>
      </div>

      {/* Config de agendamiento (solo en modo citas) */}
      {type === 'appointments' && (
        <div className="space-y-4 rounded-xl border border-warm-200 p-4">
          <h3 className="font-semibold text-night-800">Disponibilidad de agendamiento</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-night-700">Duración (min)</label>
              <input
                type="number"
                min={5}
                step={5}
                value={booking.slotMinutes}
                onChange={(e) => setBooking((b) => ({ ...b, slotMinutes: parseInt(e.target.value) || 60 }))}
                className="w-full rounded-lg border border-warm-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-night-700">Desde</label>
              <input
                type="time"
                value={booking.startHour}
                onChange={(e) => setBooking((b) => ({ ...b, startHour: e.target.value }))}
                className="w-full rounded-lg border border-warm-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-night-700">Hasta</label>
              <input
                type="time"
                value={booking.endHour}
                onChange={(e) => setBooking((b) => ({ ...b, endHour: e.target.value }))}
                className="w-full rounded-lg border border-warm-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-xs font-medium text-night-700">Días disponibles</label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((d) => (
                <button
                  key={d.v}
                  type="button"
                  onClick={() => toggleDay(d.v)}
                  className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                    booking.days.includes(d.v)
                      ? 'border-primary-500 bg-primary-50 text-primary-600'
                      : 'border-warm-200 text-night-600 hover:border-warm-300'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs text-warm-400">
            En modo citas, tus <strong>productos se muestran como servicios</strong> y el botón
            &quot;Agendar&quot; abre el calendario de reserva. Las citas aparecen en la pestaña
            <strong> Citas</strong> del catálogo.
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {saving ? 'Guardando...' : 'Guardar'}
        </Button>
        {saved && <span className="text-sm font-medium text-lime-600">✓ Guardado</span>}
      </div>
    </div>
  )
}
