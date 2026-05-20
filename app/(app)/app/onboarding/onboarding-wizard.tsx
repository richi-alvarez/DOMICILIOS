'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, ArrowLeft, Loader2, CheckCircle2, Store, Utensils, ShoppingBag, Briefcase, MessageCircle, Mail, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { checkSlugAvailable, createCatalogReturn, canAccessAIFeatures } from '@/lib/actions/catalogs'
import { cn } from '@/lib/utils'
import { AICatalogGenerator } from '@/components/app/ai-catalog-generator'
import { CountryCodeSelect } from '@/components/app/country-code-select'
import type { GeneratedCatalogStructure } from '@/lib/actions/catalogs/generate-ai-catalog'

const BUSINESS_TYPES = [
  { value: 'restaurant', label: 'Restaurante', icon: Utensils, desc: 'Menú digital, pedidos por WhatsApp' },
  { value: 'store', label: 'Tienda', icon: ShoppingBag, desc: 'Catálogo de productos' },
  { value: 'service', label: 'Servicios', icon: Briefcase, desc: 'Portafolio de servicios' },
  { value: 'other', label: 'Otro', icon: Store, desc: 'Cualquier tipo de negocio' },
]

interface Props {
  userName: string
}

export function OnboardingWizard({ userName }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isPending, startTransition] = useTransition()

  // AI feature access
  const [canUseAI, setCanUseAI] = useState(false)
  const [useAI, setUseAI] = useState(false)
  const [generatedCatalog, setGeneratedCatalog] = useState<GeneratedCatalogStructure | null>(null)

  // Form state
  const [businessName, setBusinessName] = useState('')
  const [businessType, setBusinessType] = useState('')
  const [businessDescription, setBusinessDescription] = useState('')
  const [currency, setCurrency] = useState('COP')
  const [slug, setSlug] = useState('')
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle')
  const [orderChannel, setOrderChannel] = useState<'whatsapp' | 'email'>('whatsapp')
  const [contactPhone, setContactPhone] = useState('')
  const [contactCountryCode, setContactCountryCode] = useState('+57')
  const [contactEmail, setContactEmail] = useState('')
  const [error, setError] = useState('')

  // Check AI access on mount
  useEffect(() => {
    const checkAI = async () => {
      const hasAccess = await canAccessAIFeatures()
      setCanUseAI(hasAccess)
    }
    checkAI()
  }, [])

  // Derivar slug del nombre del negocio
  useEffect(() => {
    if (businessName && step === 1) {
      const derived = businessName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .slice(0, 30)
      if (derived.length >= 3) setSlug(derived)
    }
  }, [businessName, step])

  // Check slug availability
  useEffect(() => {
    if (!slug || slug.length < 3) { setSlugStatus('idle'); return }
    const valid = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/.test(slug)
    if (!valid) { setSlugStatus('invalid'); return }

    setSlugStatus('checking')
    const timer = setTimeout(async () => {
      try {
        const available = await checkSlugAvailable(slug)
        setSlugStatus(available ? 'available' : 'taken')
      } catch { setSlugStatus('idle') }
    }, 500)
    return () => clearTimeout(timer)
  }, [slug])

  function canProceedStep1() {
    return businessName.trim().length >= 2 && businessType !== ''
  }

  function canProceedStep2() {
    return slugStatus === 'available'
  }

  function canProceedStep3() {
    return businessDescription.trim().length >= 20 && currency
  }

  function canProceedStep4() {
    if (orderChannel === 'whatsapp') return contactPhone.length >= 10
    return contactEmail.includes('@')
  }

  function handleCreate() {
    setError('')
    startTransition(async () => {
      const result = await createCatalogReturn({
        name: businessName,
        slug,
        description: businessDescription,
        orderChannel,
        contactPhone: orderChannel === 'whatsapp' ? contactPhone : undefined,
        contactCountryCode: orderChannel === 'whatsapp' ? contactCountryCode : '+57',
        currency,
        language: 'es',
        businessType,
        catalog: generatedCatalog,
      })

      if ('error' in result) {
        setError(result.error)
      } else {
        const nextStep = useAI ? 6 : 5
        setStep(nextStep)
        setTimeout(() => router.push(`/app/catalogs/${result.id}`), 1800)
      }
    })
  }

  const firstName = userName.split(' ')[0] || 'usuario'
  const totalSteps = 5
  const progressSteps = [1, 2, 3, 4, 5]

  return (
    <div className="w-full max-w-lg">
      {/* Progress */}
      {step < 6 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            {progressSteps.map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all',
                  step > s ? 'bg-lime-400 text-night-800' :
                  step === s ? 'bg-primary-500 text-white' :
                  'bg-warm-200 text-warm-500',
                )}>
                  {step > s ? '✓' : s}
                </div>
                {s < 5 && <div className={cn('h-0.5 flex-1 w-12 rounded-full transition-all', step > s ? 'bg-lime-400' : 'bg-warm-200')} />}
              </div>
            ))}
          </div>
          <p className="text-xs text-warm-400">Paso {step} de {totalSteps}</p>
        </div>
      )}

      <div className="rounded-2xl border border-warm-200 bg-white p-8 shadow-elevated">
        {/* Step 1: Negocio */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-extrabold text-night-800">
                ¡Bienvenido, {firstName}!
              </h1>
              <p className="mt-1 text-sm text-warm-500">
                Cuéntanos sobre tu negocio para personalizar tu experiencia.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="font-semibold text-night-700">Nombre del negocio *</Label>
              <Input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Ej: Hamburguesas La Cumbre"
                autoFocus
                maxLength={64}
              />
            </div>

            <div className="space-y-2">
              <Label className="font-semibold text-night-700">Tipo de negocio *</Label>
              <div className="grid grid-cols-2 gap-2">
                {BUSINESS_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setBusinessType(type.value)}
                    className={cn(
                      'flex flex-col items-start gap-1 rounded-xl border-2 p-3 text-left transition-all',
                      businessType === type.value
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-warm-200 hover:border-warm-300',
                    )}
                  >
                    <type.icon className={cn('h-5 w-5', businessType === type.value ? 'text-primary-500' : 'text-warm-400')} />
                    <span className="text-sm font-semibold text-night-800">{type.label}</span>
                    <span className="text-xs text-warm-500">{type.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <Button
              className="w-full"
              disabled={!canProceedStep1()}
              onClick={() => setStep(2)}
            >
              Continuar <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Step 2: Slug */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <button onClick={() => setStep(1)} className="mb-4 flex items-center gap-1.5 text-xs text-warm-500 hover:text-night-700">
                <ArrowLeft className="h-3.5 w-3.5" /> Atrás
              </button>
              <h1 className="text-2xl font-extrabold text-night-800">Tu enlace único</h1>
              <p className="mt-1 text-sm text-warm-500">
                Este será el link público de tu tienda. Una vez creado no se puede cambiar (salvo dominio propio).
              </p>
            </div>

            <div className="space-y-2">
              <Label className="font-semibold text-night-700">Enlace de tu tienda</Label>
              <div className={cn(
                'flex items-center gap-1 rounded-xl border-2 px-3 py-2 transition-all',
                slugStatus === 'available' ? 'border-lime-400 bg-lime-50' :
                slugStatus === 'taken' || slugStatus === 'invalid' ? 'border-red-300 bg-red-50' :
                'border-warm-200',
              )}>
                <span className="whitespace-nowrap text-sm text-warm-400">domicilios.app/s/</span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 30))}
                  className="min-w-0 flex-1 bg-transparent font-mono text-sm font-medium text-night-800 outline-none"
                  placeholder="mi-tienda"
                />
                <span className="ml-2 flex-shrink-0">
                  {slugStatus === 'checking' && <Loader2 className="h-4 w-4 animate-spin text-warm-400" />}
                  {slugStatus === 'available' && <CheckCircle2 className="h-4 w-4 text-lime-600" />}
                  {(slugStatus === 'taken' || slugStatus === 'invalid') && <span className="text-xs text-red-500">✗</span>}
                </span>
              </div>
              {slugStatus === 'taken' && <p className="text-xs text-red-500">Ese enlace ya está en uso. Prueba otro.</p>}
              {slugStatus === 'invalid' && <p className="text-xs text-red-500">Mínimo 3 caracteres, solo letras, números y guiones.</p>}
              {slugStatus === 'available' && <p className="text-xs text-lime-600">¡Disponible! Este enlace es tuyo.</p>}
            </div>

            <div className="rounded-xl bg-warm-50 border border-warm-200 px-4 py-3">
              <p className="text-xs text-warm-600">
                Tu tienda será accesible en{' '}
                <strong className="text-night-700">domicilios.app/s/{slug || '...'}</strong>.
                Con el plan Pro puedes conectar tu propio dominio.
              </p>
            </div>

            <Button
              className="w-full"
              disabled={!canProceedStep2()}
              onClick={() => setStep(3)}
            >
              Continuar <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Step 3: Moneda y Descripción del negocio */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <button onClick={() => setStep(2)} className="mb-4 flex items-center gap-1.5 text-xs text-warm-500 hover:text-night-700">
                <ArrowLeft className="h-3.5 w-3.5" /> Atrás
              </button>
              <h1 className="text-2xl font-extrabold text-night-800">Más detalles de tu negocio</h1>
              <p className="mt-1 text-sm text-warm-500">
                Esta información ayudará a la IA a generar un catálogo más personalizado.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="font-semibold text-night-700">Moneda *</Label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full rounded-lg border border-warm-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="COP">COP - Peso Colombiano</option>
                <option value="USD">USD - Dólar Estadounidense</option>
                <option value="EUR">EUR - Euro</option>
                <option value="BRL">BRL - Real Brasileño</option>
                <option value="MXN">MXN - Peso Mexicano</option>
                <option value="ARS">ARS - Peso Argentino</option>
                <option value="CLP">CLP - Peso Chileno</option>
                <option value="PEN">PEN - Sol Peruano</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label className="font-semibold text-night-700">¿De qué se trata tu negocio? *</Label>
              <p className="text-xs text-warm-500 mb-2">Cuéntanos más detalles para que la IA genere un catálogo personalizado.</p>
              <textarea
                value={businessDescription}
                onChange={(e) => setBusinessDescription(e.target.value.slice(0, 500))}
                placeholder="Ej. Soy una pastelería artesanal que vende tortas personalizadas, cupcakes y postres para eventos. Usamos colores rosados y dorados, con un estilo elegante y femenino."
                className="w-full rounded-lg border border-warm-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={4}
              />
              <p className="text-xs text-warm-400">{businessDescription.length}/500</p>
            </div>

            <Button
              className="w-full"
              disabled={!canProceedStep3()}
              onClick={() => setStep(4)}
            >
              Continuar <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Step 4: Canal de pedidos */}
        {step === 4 && !useAI && (
          <div className="space-y-6">
            <div>
              <button onClick={() => setStep(3)} className="mb-4 flex items-center gap-1.5 text-xs text-warm-500 hover:text-night-700">
                <ArrowLeft className="h-3.5 w-3.5" /> Atrás
              </button>
              <h1 className="text-2xl font-extrabold text-night-800">¿Cómo recibirás pedidos?</h1>
              <p className="mt-1 text-sm text-warm-500">
                Puedes cambiar esto después en la configuración.
              </p>
            </div>

            {canUseAI && (
              <div className="rounded-2xl border-0 bg-blue-50 p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-6 w-6 text-blue-600 mt-0 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-blue-900">Generar catálogo con IA</h3>
                    <p className="text-sm text-blue-700 mt-2 leading-relaxed">
                      Analiza tu negocio y genera automáticamente la estructura óptima del catálogo, incluyendo secciones, productos destacados y recomendaciones de diseño.
                    </p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={() => setUseAI(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                  >
                    Generar Ahora
                  </Button>
                </div>
              </div>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-warm-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-2 text-warm-500">O configura manualmente</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setOrderChannel('whatsapp')}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-xl border-2 py-5 px-3 transition-all',
                  orderChannel === 'whatsapp' ? 'border-primary-500 bg-primary-50' : 'border-warm-200 hover:border-warm-300',
                )}
              >
                <MessageCircle className={cn('h-8 w-8', orderChannel === 'whatsapp' ? 'text-primary-500' : 'text-warm-400')} />
                <span className="font-bold text-night-800">WhatsApp</span>
                <span className="text-xs text-warm-500 text-center">Los clientes te escriben directamente</span>
              </button>
              <button
                onClick={() => setOrderChannel('email')}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-xl border-2 py-5 px-3 transition-all',
                  orderChannel === 'email' ? 'border-primary-500 bg-primary-50' : 'border-warm-200 hover:border-warm-300',
                )}
              >
                <Mail className={cn('h-8 w-8', orderChannel === 'email' ? 'text-primary-500' : 'text-warm-400')} />
                <span className="font-bold text-night-800">Email</span>
                <span className="text-xs text-warm-500 text-center">Recibe pedidos por correo</span>
              </button>
            </div>

            {orderChannel === 'whatsapp' && (
              <div className="space-y-2">
                <Label className="font-semibold text-night-700">Número de WhatsApp</Label>
                <div className="flex gap-2">
                  <CountryCodeSelect
                    value={contactCountryCode}
                    onChange={setContactCountryCode}
                    disabled={false}
                  />
                  <Input
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="3001234567"
                    className="flex-1 font-mono"
                  />
                </div>
                <p className="text-xs text-warm-400">Los pedidos llegarán a este número. Puedes cambiarlo después.</p>
              </div>
            )}

            {orderChannel === 'email' && (
              <div className="space-y-2">
                <Label className="font-semibold text-night-700">Email para pedidos</Label>
                <Input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="pedidos@tunegocio.com"
                />
              </div>
            )}

            {error && <p className="text-sm text-red-500 rounded-xl bg-red-50 px-3 py-2">{error}</p>}

            <Button
              className="w-full"
              disabled={isPending}
              onClick={handleCreate}
            >
              {isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Creando tu tienda...</>
              ) : (
                <>¡Crear mi tienda! <ArrowRight className="h-4 w-4" /></>
              )}
            </Button>
          </div>
        )}

        {/* Step 4: AI Generator */}
        {step === 4 && useAI && !generatedCatalog && (
          <div className="space-y-6">
            <div>
              <button onClick={() => { setUseAI(false); setGeneratedCatalog(null) }} className="mb-4 flex items-center gap-1.5 text-xs text-warm-500 hover:text-night-700">
                <ArrowLeft className="h-3.5 w-3.5" /> Atrás
              </button>
              <h1 className="text-2xl font-extrabold text-night-800">Genera tu catálogo con IA</h1>
              <p className="mt-1 text-sm text-warm-500">
                La IA analizará tu información y generará una estructura óptima para tu catálogo.
              </p>
            </div>

            <AICatalogGenerator
              businessName={businessName}
              businessDescription={businessDescription}
              businessType={businessType}
              onGenerated={(catalog) => {
                setGeneratedCatalog(catalog)
                setStep(5)
              }}
            />
          </div>
        )}

        {/* Step 5: AI Review */}
        {step === 5 && useAI && generatedCatalog && (
          <div className="space-y-6">
            <div>
              <button onClick={() => { setGeneratedCatalog(null); setStep(4) }} className="mb-4 flex items-center gap-1.5 text-xs text-warm-500 hover:text-night-700">
                <ArrowLeft className="h-3.5 w-3.5" /> Atrás
              </button>
              <h1 className="text-2xl font-extrabold text-night-800">Configura los detalles</h1>
              <p className="mt-1 text-sm text-warm-500">
                Selecciona cómo recibirás los pedidos.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setOrderChannel('whatsapp')}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-xl border-2 py-5 px-3 transition-all',
                  orderChannel === 'whatsapp' ? 'border-primary-500 bg-primary-50' : 'border-warm-200 hover:border-warm-300',
                )}
              >
                <MessageCircle className={cn('h-8 w-8', orderChannel === 'whatsapp' ? 'text-primary-500' : 'text-warm-400')} />
                <span className="font-bold text-night-800">WhatsApp</span>
                <span className="text-xs text-warm-500 text-center">Los clientes te escriben directamente</span>
              </button>
              <button
                onClick={() => setOrderChannel('email')}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-xl border-2 py-5 px-3 transition-all',
                  orderChannel === 'email' ? 'border-primary-500 bg-primary-50' : 'border-warm-200 hover:border-warm-300',
                )}
              >
                <Mail className={cn('h-8 w-8', orderChannel === 'email' ? 'text-primary-500' : 'text-warm-400')} />
                <span className="font-bold text-night-800">Email</span>
                <span className="text-xs text-warm-500 text-center">Recibe pedidos por correo</span>
              </button>
            </div>

            {orderChannel === 'whatsapp' && (
              <div className="space-y-2">
                <Label className="font-semibold text-night-700">Número de WhatsApp</Label>
                <div className="flex gap-2">
                  <CountryCodeSelect
                    value={contactCountryCode}
                    onChange={setContactCountryCode}
                    disabled={false}
                  />
                  <Input
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="3001234567"
                    className="flex-1 font-mono"
                  />
                </div>
                <p className="text-xs text-warm-400">Los pedidos llegarán a este número. Puedes cambiarlo después.</p>
              </div>
            )}

            {orderChannel === 'email' && (
              <div className="space-y-2">
                <Label className="font-semibold text-night-700">Email para pedidos</Label>
                <Input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="pedidos@tunegocio.com"
                />
              </div>
            )}

            {error && <p className="text-sm text-red-500 rounded-xl bg-red-50 px-3 py-2">{error}</p>}

            <Button
              className="w-full"
              disabled={isPending}
              onClick={handleCreate}
            >
              {isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Creando tu tienda...</>
              ) : (
                <>¡Crear mi tienda! <ArrowRight className="h-4 w-4" /></>
              )}
            </Button>
          </div>
        )}

        {/* Done: Manual flow */}
        {step === 5 && !useAI && (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-lime-100">
              <CheckCircle2 className="h-9 w-9 text-lime-600" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-night-800">¡Tienda creada!</h1>
              <p className="mt-2 text-sm text-warm-500">
                <strong>{businessName}</strong> está lista. Redirigiendo al panel...
              </p>
            </div>
            <Loader2 className="h-5 w-5 animate-spin text-primary-500" />
          </div>
        )}

        {/* Done: AI flow */}
        {step === 6 && useAI && (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-lime-100">
              <CheckCircle2 className="h-9 w-9 text-lime-600" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-night-800">¡Tienda creada!</h1>
              <p className="mt-2 text-sm text-warm-500">
                <strong>{businessName}</strong> está lista con estructura generada por IA. Redirigiendo al panel...
              </p>
            </div>
            <Loader2 className="h-5 w-5 animate-spin text-primary-500" />
          </div>
        )}
      </div>
    </div>
  )
}
