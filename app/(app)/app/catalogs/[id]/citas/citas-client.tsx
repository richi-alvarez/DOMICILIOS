'use client'

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, X, Phone, User, CalendarDays, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { updateAppointmentStatus, type AppointmentDTO, type AppointmentStatus } from '@/lib/actions/appointments'

const STATUS_META: Record<AppointmentStatus, { label: string; chip: string; dot: string }> = {
  pending: { label: 'Pendiente', chip: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  confirmed: { label: 'Confirmada', chip: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  completed: { label: 'Completada', chip: 'bg-lime-100 text-lime-700', dot: 'bg-lime-500' },
  cancelled: { label: 'Cancelada', chip: 'bg-warm-100 text-warm-500 line-through', dot: 'bg-warm-400' },
}

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

// Las horas de las citas se guardan en UTC. Al ser este un componente cliente
// con SSR, formatear sin zona horaria usaba la TZ del servidor (UTC) en el
// render del servidor y la del navegador al hidratar → la hora "saltaba" (p. ej.
// 03:00 p. m. → 10:00 a. m.). Fijamos la TZ del negocio (Colombia, coherente con
// es-CO/COP) para que servidor y cliente muestren siempre la misma hora local.
const APP_TZ = 'America/Bogota'

function ymd(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}
function startOfWeek(d: Date) {
  const x = new Date(d)
  const day = (x.getDay() + 6) % 7 // lunes = 0
  x.setDate(x.getDate() - day)
  x.setHours(0, 0, 0, 0)
  return x
}

export function CitasClient({ appointments: initial }: { appointments: AppointmentDTO[] }) {
  const [appointments, setAppointments] = useState(initial)
  const [view, setView] = useState<'month' | 'week'>('month')
  const [anchor, setAnchor] = useState(() => new Date())
  const [selected, setSelected] = useState<AppointmentDTO | null>(null)
  const [updating, setUpdating] = useState(false)

  // Mapa fecha → citas (orden por hora).
  const byDay = useMemo(() => {
    const m = new Map<string, AppointmentDTO[]>()
    for (const a of appointments) {
      const d = new Date(a.startAt)
      const k = ymd(d)
      const arr = m.get(k) ?? []
      arr.push(a)
      m.set(k, arr)
    }
    for (const arr of m.values()) arr.sort((x, y) => +new Date(x.startAt) - +new Date(y.startAt))
    return m
  }, [appointments])

  const move = (dir: number) => {
    const d = new Date(anchor)
    if (view === 'month') d.setMonth(d.getMonth() + dir)
    else d.setDate(d.getDate() + dir * 7)
    setAnchor(d)
  }

  const days = useMemo(() => {
    if (view === 'week') {
      const start = startOfWeek(anchor)
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(start)
        d.setDate(start.getDate() + i)
        return d
      })
    }
    // Mes: desde el lunes de la semana del día 1 hasta completar 6 semanas.
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
    const start = startOfWeek(first)
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      return d
    })
  }, [view, anchor])

  const title =
    view === 'month'
      ? `${MONTHS[anchor.getMonth()]} ${anchor.getFullYear()}`
      : (() => {
          const s = startOfWeek(anchor)
          const e = new Date(s)
          e.setDate(s.getDate() + 6)
          return `${s.getDate()} ${MONTHS[s.getMonth()].slice(0, 3)} – ${e.getDate()} ${MONTHS[e.getMonth()].slice(0, 3)}`
        })()

  const todayKey = ymd(new Date())

  const changeStatus = async (status: AppointmentStatus) => {
    if (!selected) return
    setUpdating(true)
    const res = await updateAppointmentStatus(selected.id, status)
    setUpdating(false)
    if (!('error' in res)) {
      setAppointments((prev) => prev.map((a) => (a.id === selected.id ? { ...a, status } : a)))
      setSelected((s) => (s ? { ...s, status } : s))
    }
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => move(-1)} className="rounded-lg border border-warm-200 p-2 hover:bg-warm-50">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setAnchor(new Date())}
            className="rounded-lg border border-warm-200 px-3 py-2 text-sm hover:bg-warm-50"
          >
            Hoy
          </button>
          <button onClick={() => move(1)} className="rounded-lg border border-warm-200 p-2 hover:bg-warm-50">
            <ChevronRight className="h-4 w-4" />
          </button>
          <span className="ml-2 font-semibold capitalize text-night-800">{title}</span>
        </div>
        <div className="flex rounded-lg border border-warm-200 p-0.5">
          {(['month', 'week'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                view === v ? 'bg-primary-500 text-white' : 'text-night-600 hover:bg-warm-50'
              }`}
            >
              {v === 'month' ? 'Mes' : 'Semana'}
            </button>
          ))}
        </div>
      </div>

      {/* Encabezado de días */}
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-t-lg border border-warm-200 bg-warm-200 text-center text-xs font-semibold text-warm-500">
        {WEEKDAYS.map((w) => (
          <div key={w} className="bg-warm-50 py-2">
            {w}
          </div>
        ))}
      </div>

      {/* Grilla */}
      <div
        className={`grid grid-cols-7 gap-px overflow-hidden rounded-b-lg border border-t-0 border-warm-200 bg-warm-200 ${
          view === 'week' ? 'min-h-[28rem]' : ''
        }`}
      >
        {days.map((d) => {
          const key = ymd(d)
          const inMonth = view === 'week' || d.getMonth() === anchor.getMonth()
          const dayAppts = byDay.get(key) ?? []
          return (
            <div
              key={key}
              className={`min-h-[5.5rem] bg-white p-1.5 ${view === 'week' ? 'min-h-[28rem]' : ''} ${
                inMonth ? '' : 'bg-warm-50/60'
              }`}
            >
              <div
                className={`mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                  key === todayKey ? 'bg-primary-500 font-bold text-white' : inMonth ? 'text-night-700' : 'text-warm-300'
                }`}
              >
                {d.getDate()}
              </div>
              <div className="space-y-1">
                {dayAppts.map((a) => {
                  const meta = STATUS_META[a.status]
                  const t = new Date(a.startAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', timeZone: APP_TZ })
                  return (
                    <button
                      key={a.id}
                      onClick={() => setSelected(a)}
                      className={`flex w-full items-center gap-1 truncate rounded px-1.5 py-1 text-left text-[11px] ${meta.chip}`}
                      title={`${t} · ${a.service} · ${a.customer.name}`}
                    >
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${meta.dot}`} />
                      <span className="truncate">
                        {t} {a.service}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Leyenda */}
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-warm-500">
        {(Object.keys(STATUS_META) as AppointmentStatus[]).map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${STATUS_META[s].dot}`} />
            {STATUS_META[s].label}
          </span>
        ))}
      </div>

      {/* Modal de detalle */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-night-800">{selected.service}</h2>
                <p className="text-xs text-warm-400">Cita #{selected.code}</p>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-lg p-1 hover:bg-warm-100">
                <X className="h-5 w-5 text-warm-400" />
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-night-700">
                <CalendarDays className="h-4 w-4 text-warm-400" />
                {new Date(selected.startAt).toLocaleString('es-CO', {
                  weekday: 'long',
                  day: '2-digit',
                  month: 'long',
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZone: APP_TZ,
                })}
              </div>
              <div className="flex items-center gap-2 text-night-700">
                <User className="h-4 w-4 text-warm-400" />
                {selected.customer.name}
              </div>
              <div className="flex items-center gap-2 text-night-700">
                <Phone className="h-4 w-4 text-warm-400" />
                <a href={`tel:${selected.customer.phone}`} className="text-primary-600 hover:underline">
                  {selected.customer.phone}
                </a>
              </div>
              {selected.notes && <p className="text-night-500">📝 {selected.notes}</p>}
              <div className="pt-1">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_META[selected.status].chip}`}>
                  {STATUS_META[selected.status].label}
                </span>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {selected.status !== 'confirmed' && selected.status !== 'cancelled' && (
                <Button size="sm" variant="outline" disabled={updating} onClick={() => changeStatus('confirmed')}>
                  Confirmar
                </Button>
              )}
              {selected.status !== 'completed' && (
                <Button size="sm" disabled={updating} onClick={() => changeStatus('completed')} className="gap-1">
                  {updating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  Marcar completada
                </Button>
              )}
              {selected.status !== 'cancelled' && (
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={updating}
                  onClick={() => changeStatus('cancelled')}
                >
                  Cancelar cita
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
