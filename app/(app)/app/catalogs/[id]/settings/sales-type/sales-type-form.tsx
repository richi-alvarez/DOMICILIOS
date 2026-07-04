'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingCart, CalendarDays, Loader2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { updateSalesType } from '@/lib/actions/catalog-type'
import type { BookingConfig } from '@/lib/booking/config'
import { useI18n } from '@/lib/i18n/context'

// Valor del día (0 = Dom … 6 = Sáb) e índice del label localizado (Lun-first).
const DAYS = [
  { v: 1, i: 0 },
  { v: 2, i: 1 },
  { v: 3, i: 2 },
  { v: 4, i: 3 },
  { v: 5, i: 4 },
  { v: 6, i: 5 },
  { v: 0, i: 6 },
]

// Opciones de hora cada 30 min (00:00 … 23:30) para los selectores Desde/Hasta.
const TIME_OPTIONS: string[] = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2)
  const m = i % 2 === 0 ? '00' : '30'
  return `${String(h).padStart(2, '0')}:${m}`
})

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
  const { t, tRaw } = useI18n()
  const WEEKDAYS = tRaw('salesType.weekdays') as string[]
  const [type, setType] = useState<'products' | 'appointments'>(initial.type)
  const [ctaLabel, setCtaLabel] = useState(initial.ctaLabel)
  const [booking, setBooking] = useState<BookingConfig>(initial.booking)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const defaultCta =
    type === 'appointments' ? t('salesType.defaultCtaAppointments') : t('salesType.defaultCtaProducts')

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
              title: t('salesType.products.title'),
              desc: t('salesType.products.desc'),
            },
            {
              v: 'appointments' as const,
              icon: CalendarDays,
              title: t('salesType.appointments.title'),
              desc: t('salesType.appointments.desc'),
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
          {t('salesType.ctaLabel')}
        </label>
        <input
          type="text"
          value={ctaLabel}
          onChange={(e) => setCtaLabel(e.target.value)}
          placeholder={defaultCta}
          className="w-full rounded-lg border border-warm-200 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none"
        />
        <p className="mt-1 text-xs text-warm-400">
          {t('salesType.ctaHintPre')}&quot;{defaultCta}&quot;{t('salesType.ctaHintPost')}
        </p>
      </div>

      {/* Config de agendamiento (solo en modo citas) */}
      {type === 'appointments' && (
        <div className="space-y-4 rounded-xl border border-warm-200 p-4">
          <h3 className="font-semibold text-night-800">{t('salesType.availability')}</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-night-700">{t('salesType.duration')}</label>
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
              <label className="mb-1 block text-xs font-medium text-night-700">{t('salesType.from')}</label>
              <select
                value={booking.startHour}
                onChange={(e) => setBooking((b) => ({ ...b, startHour: e.target.value }))}
                className="w-full rounded-lg border border-warm-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
              >
                {(TIME_OPTIONS.includes(booking.startHour)
                  ? TIME_OPTIONS
                  : [booking.startHour, ...TIME_OPTIONS]
                ).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-night-700">{t('salesType.to')}</label>
              <select
                value={booking.endHour}
                onChange={(e) => setBooking((b) => ({ ...b, endHour: e.target.value }))}
                className="w-full rounded-lg border border-warm-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
              >
                {(TIME_OPTIONS.includes(booking.endHour)
                  ? TIME_OPTIONS
                  : [booking.endHour, ...TIME_OPTIONS]
                ).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-2 block text-xs font-medium text-night-700">{t('salesType.daysLabel')}</label>
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
                  {WEEKDAYS[d.i]}
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs text-warm-400">
            {t('salesType.hint.pre')}
            <strong>{t('salesType.hint.bold1')}</strong>
            {t('salesType.hint.mid')}
            <strong>{t('salesType.hint.bold2')}</strong>
            {t('salesType.hint.post')}
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {saving ? t('salesType.saving') : t('salesType.save')}
        </Button>
        {saved && <span className="text-sm font-medium text-lime-600">{t('salesType.saved')}</span>}
      </div>
    </div>
  )
}
