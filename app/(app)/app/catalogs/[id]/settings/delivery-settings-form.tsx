'use client'

import { useState, useTransition } from 'react'
import { MessageCircle, Mail, Store, Bike, UtensilsCrossed, Clock } from 'lucide-react'
import { saveDeliverySettings } from '@/lib/actions/settings'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

const DAYS = [
  { key: 'mon', label: 'Lunes' },
  { key: 'tue', label: 'Martes' },
  { key: 'wed', label: 'Miércoles' },
  { key: 'thu', label: 'Jueves' },
  { key: 'fri', label: 'Viernes' },
  { key: 'sat', label: 'Sábado' },
  { key: 'sun', label: 'Domingo' },
]

const DEFAULT_HOURS = { open: '09:00', close: '18:00', enabled: true }

interface InitialValues {
  orderChannel: 'whatsapp' | 'email'
  contactPhone: string
  contactCountryCode: string
  contactEmail: string
  pickupEnabled: boolean
  deliveryEnabled: boolean
  deliveryFee: number
  deliveryMinOrder: number
  dineInEnabled: boolean
  businessHours: Record<string, { open: string; close: string; enabled: boolean }>
}

interface Props {
  catalogId: string
  initial: InitialValues
}

export function DeliverySettingsForm({ catalogId, initial }: Props) {
  const [isPending, startTransition] = useTransition()
  const [channel, setChannel] = useState(initial.orderChannel)
  const [phone, setPhone] = useState(initial.contactPhone)
  const [countryCode, setCountryCode] = useState(initial.contactCountryCode)
  const [email, setEmail] = useState(initial.contactEmail)
  const [pickup, setPickup] = useState(initial.pickupEnabled)
  const [delivery, setDelivery] = useState(initial.deliveryEnabled)
  const [deliveryFee, setDeliveryFee] = useState(initial.deliveryFee)
  const [deliveryMin, setDeliveryMin] = useState(initial.deliveryMinOrder)
  const [dineIn, setDineIn] = useState(initial.dineInEnabled)
  type DayHours = { open: string; close: string; enabled: boolean }
  const [hours, setHours] = useState<Record<string, DayHours>>(() => {
    const h: Record<string, DayHours> = {}
    DAYS.forEach(({ key }) => {
      h[key] = initial.businessHours[key] ?? { ...DEFAULT_HOURS }
    })
    return h
  })

  function handleHour(day: string, field: 'open' | 'close' | 'enabled', val: string | boolean) {
    setHours((prev) => ({ ...prev, [day]: { ...prev[day], [field]: val } }))
  }

  function handleSave() {
    startTransition(async () => {
      const res = await saveDeliverySettings({
        catalogId,
        orderChannel: channel,
        contactPhone: phone,
        contactCountryCode: countryCode,
        contactEmail: email,
        pickupEnabled: pickup,
        deliveryEnabled: delivery,
        deliveryFee,
        deliveryMinOrder: deliveryMin,
        dineInEnabled: dineIn,
        businessHours: hours,
      })
      if (res?.error) {
        toast.error('Error al guardar configuración')
      } else {
        toast.success('Configuración guardada')
      }
    })
  }

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Canal de pedidos */}
      <section className="rounded-2xl border border-warm-200 bg-white p-6">
        <h2 className="mb-4 font-semibold text-night-800">Canal de pedidos</h2>
        <div className="grid grid-cols-2 gap-3">
          {(['whatsapp', 'email'] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setChannel(c)}
              className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition ${
                channel === c
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-warm-200 hover:border-primary-200'
              }`}
            >
              {c === 'whatsapp' ? (
                <MessageCircle className={`h-5 w-5 ${channel === c ? 'text-primary-500' : 'text-night-400'}`} />
              ) : (
                <Mail className={`h-5 w-5 ${channel === c ? 'text-primary-500' : 'text-night-400'}`} />
              )}
              <span className={`font-medium capitalize ${channel === c ? 'text-primary-700' : 'text-night-600'}`}>
                {c === 'whatsapp' ? 'WhatsApp' : 'Email'}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          {channel === 'whatsapp' ? (
            <div className="col-span-2 flex gap-2">
              <div>
                <Label htmlFor="countryCode" className="text-xs">Código país</Label>
                <Input id="countryCode" value={countryCode} onChange={(e) => setCountryCode(e.target.value)} placeholder="+57" className="w-24" />
              </div>
              <div className="flex-1">
                <Label htmlFor="phone" className="text-xs">Teléfono WhatsApp</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="3001234567" type="tel" />
              </div>
            </div>
          ) : (
            <div className="col-span-2">
              <Label htmlFor="email" className="text-xs">Email de contacto</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@negocio.com" />
            </div>
          )}
        </div>
      </section>

      {/* Tipos de entrega */}
      <section className="rounded-2xl border border-warm-200 bg-white p-6">
        <h2 className="mb-4 font-semibold text-night-800">Tipos de entrega</h2>
        <div className="space-y-4">
          {/* Pickup */}
          <div className="flex items-center justify-between rounded-xl border border-warm-100 p-4">
            <div className="flex items-center gap-3">
              <Store className="h-5 w-5 text-night-400" />
              <div>
                <p className="font-medium text-night-800">Recoger en tienda</p>
                <p className="text-xs text-night-400">El cliente recoge en tu local</p>
              </div>
            </div>
            <Switch checked={pickup} onCheckedChange={setPickup} />
          </div>

          {/* Delivery */}
          <div className="space-y-3 rounded-xl border border-warm-100 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bike className="h-5 w-5 text-night-400" />
                <div>
                  <p className="font-medium text-night-800">A domicilio</p>
                  <p className="text-xs text-night-400">Envías el pedido al cliente</p>
                </div>
              </div>
              <Switch checked={delivery} onCheckedChange={setDelivery} />
            </div>
            {delivery && (
              <div className="grid grid-cols-2 gap-3 border-t border-warm-100 pt-3">
                <div>
                  <Label className="text-xs">Costo de envío</Label>
                  <Input
                    type="number"
                    min={0}
                    value={deliveryFee}
                    onChange={(e) => setDeliveryFee(Number(e.target.value))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className="text-xs">Pedido mínimo</Label>
                  <Input
                    type="number"
                    min={0}
                    value={deliveryMin}
                    onChange={(e) => setDeliveryMin(Number(e.target.value))}
                    placeholder="0"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Dine-in */}
          <div className="flex items-center justify-between rounded-xl border border-warm-100 p-4">
            <div className="flex items-center gap-3">
              <UtensilsCrossed className="h-5 w-5 text-night-400" />
              <div>
                <p className="font-medium text-night-800">Pedir en mesa</p>
                <p className="text-xs text-night-400">Para restaurantes y cafés</p>
              </div>
            </div>
            <Switch checked={dineIn} onCheckedChange={setDineIn} />
          </div>
        </div>
      </section>

      {/* Horarios */}
      <section className="rounded-2xl border border-warm-200 bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-night-400" />
          <h2 className="font-semibold text-night-800">Horarios de atención</h2>
        </div>
        <div className="space-y-3">
          {DAYS.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-3">
              <Switch
                checked={hours[key]?.enabled ?? true}
                onCheckedChange={(v) => handleHour(key, 'enabled', v)}
              />
              <span className={`w-20 text-sm font-medium ${hours[key]?.enabled ? 'text-night-700' : 'text-night-300'}`}>
                {label}
              </span>
              <input
                type="time"
                value={hours[key]?.open ?? '09:00'}
                onChange={(e) => handleHour(key, 'open', e.target.value)}
                disabled={!hours[key]?.enabled}
                className="rounded-lg border border-warm-200 px-2 py-1.5 text-sm text-night-700 disabled:opacity-40"
              />
              <span className="text-night-400">—</span>
              <input
                type="time"
                value={hours[key]?.close ?? '18:00'}
                onChange={(e) => handleHour(key, 'close', e.target.value)}
                disabled={!hours[key]?.enabled}
                className="rounded-lg border border-warm-200 px-2 py-1.5 text-sm text-night-700 disabled:opacity-40"
              />
            </div>
          ))}
        </div>
      </section>

      <button
        type="button"
        onClick={handleSave}
        disabled={isPending}
        className="flex items-center gap-2 rounded-xl bg-primary-500 px-6 py-3 font-semibold text-white transition hover:bg-primary-600 disabled:opacity-60"
      >
        {isPending ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        ) : null}
        {isPending ? 'Guardando…' : 'Guardar configuración'}
      </button>
    </div>
  )
}
