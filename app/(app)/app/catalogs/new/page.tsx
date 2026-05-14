'use client'

import { useState, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, ArrowRight, Check, Loader2, Globe, MessageCircle, Mail, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { createCatalog, checkSlugAvailable } from '@/lib/actions/catalogs'

const CURRENCIES = ['COP', 'MXN', 'USD', 'BRL', 'ARS', 'PEN', 'CLP', 'EUR']
const LANGUAGES = [{ code: 'es', label: 'Español' }, { code: 'en', label: 'English' }, { code: 'pt', label: 'Português' }]
const COUNTRY_CODES = [
  { code: '+57', flag: '🇨🇴', label: 'Colombia' },
  { code: '+52', flag: '🇲🇽', label: 'México' },
  { code: '+54', flag: '🇦🇷', label: 'Argentina' },
  { code: '+51', flag: '🇵🇪', label: 'Perú' },
  { code: '+56', flag: '🇨🇱', label: 'Chile' },
  { code: '+55', flag: '🇧🇷', label: 'Brasil' },
  { code: '+1', flag: '🇺🇸', label: 'USA' },
  { code: '+34', flag: '🇪🇸', label: 'España' },
]

const step1Schema = z.object({
  slug: z.string().regex(/^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/, 'Solo letras minúsculas, números y guiones (3-30 chars)'),
})

const step2Schema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres').max(64),
  aiPrompt: z.string().min(20, 'Describe más tu negocio (mínimo 20 caracteres)').max(500),
})

const step3Schema = z.object({
  orderChannel: z.enum(['whatsapp', 'email']),
  contactPhone: z.string().optional(),
  contactCountryCode: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
})

type Step = 1 | 2 | 3

export default function NewCatalogPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [isPending, startTransition] = useTransition()
  const [slugOk, setSlugOk] = useState<boolean | null>(null)
  const [checkingSlug, setCheckingSlug] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    slug: '', name: '', aiPrompt: '', language: 'es', currency: 'COP',
    orderChannel: 'whatsapp' as 'whatsapp' | 'email',
    contactPhone: '', contactCountryCode: '+57', contactEmail: '',
  })

  // Step 1: slug
  const form1 = useForm({ resolver: zodResolver(step1Schema), defaultValues: { slug: formData.slug }, mode: 'onChange' })
  // Step 2: name + prompt
  const form2 = useForm({ resolver: zodResolver(step2Schema), defaultValues: { name: formData.name, aiPrompt: formData.aiPrompt }, mode: 'onChange' })
  // Step 3: contact
  const form3 = useForm({ resolver: zodResolver(step3Schema), defaultValues: { orderChannel: formData.orderChannel }, mode: 'onChange' })

  const checkSlug = useCallback(async (slug: string) => {
    if (!step1Schema.safeParse({ slug }).success) { setSlugOk(null); return }
    setCheckingSlug(true)
    try {
      const ok = await checkSlugAvailable(slug)
      setSlugOk(ok)
    } catch { setSlugOk(null) } finally { setCheckingSlug(false) }
  }, [])

  const goStep2 = form1.handleSubmit((data) => {
    if (!slugOk) return
    setFormData((p) => ({ ...p, slug: data.slug }))
    setStep(2)
  })

  const goStep3 = form2.handleSubmit((data) => {
    setFormData((p) => ({ ...p, ...data }))
    setStep(3)
  })

  const submit = form3.handleSubmit((data) => {
    setServerError(null)
    const fd = new FormData()
    const merged = { ...formData, ...data }
    Object.entries(merged).forEach(([k, v]) => v && fd.append(k, v as string))

    startTransition(async () => {
      try {
        await createCatalog(fd)
      } catch (e) {
        setServerError(e instanceof Error ? e.message : 'Error al crear el catálogo')
      }
    })
  })

  const steps = [
    { num: 1, label: 'Enlace único' },
    { num: 2, label: 'Tu negocio' },
    { num: 3, label: 'Pedidos' },
  ]

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 bg-warm-50">
      {/* Step indicator */}
      <div className="mb-8 flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s.num} className="flex items-center gap-2">
            <div className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold',
              step > s.num ? 'bg-lime-400 text-night-800' :
              step === s.num ? 'bg-primary-500 text-white' : 'bg-warm-200 text-warm-400',
            )}>
              {step > s.num ? <Check className="h-4 w-4" /> : s.num}
            </div>
            <span className={cn('text-sm font-medium', step === s.num ? 'text-night-800' : 'text-warm-400')}>
              {s.label}
            </span>
            {i < steps.length - 1 && <div className="mx-1 h-px w-8 bg-warm-200" />}
          </div>
        ))}
      </div>

      <div className="w-full max-w-md rounded-2xl border border-warm-200 bg-white p-8 shadow-elevated">
        {/* ── STEP 1: Slug ── */}
        {step === 1 && (
          <form onSubmit={goStep2} className="space-y-6">
            <div className="text-center">
              <div className="mb-2 text-4xl">🔗</div>
              <h1 className="text-2xl font-extrabold text-night-800">Elige tu enlace único</h1>
              <p className="mt-2 text-sm text-warm-500">Una vez seleccionado no podrá cambiarse. Puedes conectar tu dominio propio después.</p>
            </div>

            <div className="space-y-1.5">
              <Label>URL de tu tienda</Label>
              <div className="flex items-center gap-1 rounded-xl border-2 border-warm-200 bg-warm-50 px-3 py-2.5 focus-within:border-primary-400">
                <Globe className="h-4 w-4 shrink-0 text-warm-300" />
                <span className="text-sm text-warm-400 whitespace-nowrap">domicilios.app/</span>
                <input
                  {...form1.register('slug', {
                    onChange: (e) => checkSlug(e.target.value),
                  })}
                  maxLength={30}
                  placeholder="mi-tienda"
                  className="min-w-0 flex-1 bg-transparent text-sm font-medium text-night-800 outline-none placeholder:text-warm-300"
                />
                {checkingSlug && <Loader2 className="h-4 w-4 animate-spin text-warm-300" />}
                {!checkingSlug && slugOk === true && <Check className="h-4 w-4 text-lime-500" />}
                {!checkingSlug && slugOk === false && <AlertCircle className="h-4 w-4 text-red-400" />}
              </div>
              <div className="flex items-center justify-between">
                {form1.formState.errors.slug && (
                  <p className="text-xs text-red-600">{form1.formState.errors.slug.message}</p>
                )}
                {slugOk === false && <p className="text-xs text-red-500">Este enlace ya está tomado</p>}
                {slugOk === true && <p className="text-xs text-lime-600">¡Disponible!</p>}
                <span className="ml-auto text-xs text-warm-400">{form1.watch('slug')?.length ?? 0}/30</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Idioma</Label>
                <select
                  value={formData.language}
                  onChange={(e) => setFormData((p) => ({ ...p, language: e.target.value }))}
                  className="w-full rounded-md border border-warm-200 bg-white py-2 pl-3 pr-8 text-sm text-night-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Moneda</Label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData((p) => ({ ...p, currency: e.target.value }))}
                  className="w-full rounded-md border border-warm-200 bg-white py-2 pl-3 pr-8 text-sm text-night-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={!form1.formState.isValid || !slugOk}>
              Continuar <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        )}

        {/* ── STEP 2: Name + AI prompt ── */}
        {step === 2 && (
          <form onSubmit={goStep3} className="space-y-6">
            <div className="text-center">
              <div className="mb-2 text-4xl">🪄</div>
              <h1 className="text-2xl font-extrabold text-night-800">Cuéntanos sobre tu negocio</h1>
              <p className="mt-2 text-sm text-warm-500">Mientras más detallado, mejor será el catálogo generado.</p>
            </div>

            <div className="space-y-1.5">
              <Label>Nombre de tu negocio</Label>
              <Input placeholder="Ej. Pasteles de Sandra" {...form2.register('name')} />
              {form2.formState.errors.name && <p className="text-xs text-red-600">{form2.formState.errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>¿De qué se trata tu negocio?</Label>
              <Textarea
                placeholder="Ej. Soy una pastelería artesanal que vende tortas personalizadas, cupcakes y postres para eventos. Usamos colores rosados y dorados, con un estilo elegante y femenino."
                rows={5}
                maxLength={500}
                {...form2.register('aiPrompt')}
              />
              <div className="flex items-center justify-between">
                {form2.formState.errors.aiPrompt && <p className="text-xs text-red-600">{form2.formState.errors.aiPrompt.message}</p>}
                <span className="ml-auto text-xs text-warm-400">{form2.watch('aiPrompt')?.length ?? 0}/500</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                <ArrowLeft className="h-4 w-4" /> Atrás
              </Button>
              <Button type="submit" className="flex-1" disabled={!form2.formState.isValid}>
                Continuar <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </form>
        )}

        {/* ── STEP 3: Contact/channel ── */}
        {step === 3 && (
          <form onSubmit={submit} className="space-y-6">
            <div className="text-center">
              <div className="mb-2 text-4xl">📬</div>
              <h1 className="text-2xl font-extrabold text-night-800">¿Dónde recibes pedidos?</h1>
              <p className="mt-2 text-sm text-warm-500">Los clientes enviarán su pedido a este contacto.</p>
            </div>

            {/* Channel selector */}
            <div className="grid grid-cols-2 gap-3">
              {(['whatsapp', 'email'] as const).map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => { form3.setValue('orderChannel', ch); setFormData((p) => ({ ...p, orderChannel: ch })) }}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all',
                    formData.orderChannel === ch ? 'border-primary-500 bg-primary-50' : 'border-warm-200 hover:border-primary-200',
                  )}
                >
                  {ch === 'whatsapp' ? <MessageCircle className={cn('h-6 w-6', formData.orderChannel === ch ? 'text-primary-500' : 'text-warm-400')} /> : <Mail className={cn('h-6 w-6', formData.orderChannel === ch ? 'text-primary-500' : 'text-warm-400')} />}
                  <span className={cn('text-sm font-semibold', formData.orderChannel === ch ? 'text-primary-600' : 'text-warm-500')}>
                    {ch === 'whatsapp' ? 'WhatsApp' : 'Email'}
                  </span>
                </button>
              ))}
            </div>

            {formData.orderChannel === 'whatsapp' ? (
              <div className="space-y-1.5">
                <Label>Número de WhatsApp</Label>
                <div className="flex gap-2">
                  <select
                    value={formData.contactCountryCode}
                    onChange={(e) => setFormData((p) => ({ ...p, contactCountryCode: e.target.value }))}
                    className="w-28 rounded-md border border-warm-200 bg-white py-2 pl-3 pr-2 text-sm text-night-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {COUNTRY_CODES.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
                  </select>
                  <Input
                    type="tel"
                    placeholder="3001234567"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData((p) => ({ ...p, contactPhone: e.target.value }))}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label>Correo para pedidos</Label>
                <Input
                  type="email"
                  placeholder="pedidos@tunegocio.com"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData((p) => ({ ...p, contactEmail: e.target.value }))}
                />
              </div>
            )}

            {serverError && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {serverError}
              </div>
            )}

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setStep(2)} className="flex-1">
                <ArrowLeft className="h-4 w-4" /> Atrás
              </Button>
              <Button type="submit" className="flex-1" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Crear catálogo
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
