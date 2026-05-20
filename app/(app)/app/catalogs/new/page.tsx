'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, ArrowLeft, Loader2, CheckCircle2, MessageCircle, Mail, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { checkSlugAvailable, createCatalogReturn, canAccessAIFeatures } from '@/lib/actions/catalogs'
import { cn } from '@/lib/utils'
import { AICatalogGenerator } from '@/components/app/ai-catalog-generator'
import { CountryCodeSelect } from '@/components/app/country-code-select'
import type { GeneratedCatalogStructure } from '@/lib/actions/catalogs/generate-ai-catalog'

const CURRENCIES = ['COP', 'MXN', 'USD', 'BRL', 'ARS', 'PEN', 'CLP', 'EUR']

export default function NewCatalogPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isPending, startTransition] = useTransition()

  // AI feature access
  const [canUseAI, setCanUseAI] = useState(false)
  const [useAI, setUseAI] = useState(false)
  const [generatedCatalog, setGeneratedCatalog] = useState<GeneratedCatalogStructure | null>(null)

  // Form state
  const [businessName, setBusinessName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle')
  const [businessDescription, setBusinessDescription] = useState('')
  const [currency, setCurrency] = useState('COP')
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
    return businessName.trim().length >= 2
  }

  function canProceedStep2() {
    return slugStatus === 'available'
  }

  function canProceedStep3() {
    return businessDescription.trim().length >= 20 && currency
  }

  function canProceedStep4() {
    if (orderChannel === 'whatsapp') {
      return contactPhone.trim().length >= 7
    } else {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)
    }
  }

  function goStep(nextStep: number) {
    if (nextStep === 2 && !canProceedStep1()) return
    if (nextStep === 3 && !canProceedStep2()) return
    if (nextStep === 4 && !canProceedStep3()) return
    setStep(nextStep)
  }

  function handleCreateCatalog(withAI: boolean) {
    if (!canProceedStep4()) return

    setError('')
    const payload = {
      name: businessName,
      slug,
      description: businessDescription,
      orderChannel,
      contactPhone: orderChannel === 'whatsapp' ? contactPhone : undefined,
      contactCountryCode: orderChannel === 'whatsapp' ? contactCountryCode : '+57',
      currency,
      language: 'es',
      ...(withAI && generatedCatalog && { catalog: generatedCatalog }),
    }

    startTransition(async () => {
      try {
        const result = await createCatalogReturn(payload as any)
        if ('error' in result) {
          setError(result.error)
        } else if ('id' in result) {
          setStep(99)
          setTimeout(() => router.push(`/app/catalogs/${result.id}`), 1800)
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error creando catálogo')
      }
    })
  }

  const progressSteps = [1, 2, 3, 4]
  const currentProgress = step <= 4 ? step : 4

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 bg-warm-50">
      {/* Done screen */}
      {step === 99 && (
        <div className="w-full max-w-md rounded-2xl border border-warm-200 bg-white p-8 shadow-elevated text-center">
          <div className="mb-4 text-6xl">✨</div>
          <h1 className="text-2xl font-extrabold text-night-800">¡Catálogo creado!</h1>
          <p className="mt-2 text-sm text-warm-500">Redirigiendo a tu catálogo...</p>
        </div>
      )}

      {step !== 99 && (
        <>
          {/* Progress bar */}
          <div className="mb-8 flex items-center gap-2">
            {progressSteps.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors',
                  currentProgress > s ? 'bg-lime-400 text-night-800' :
                  currentProgress === s ? 'bg-primary-500 text-white' : 'bg-warm-200 text-warm-400',
                )}>
                  {currentProgress > s ? <CheckCircle2 className="h-4 w-4" /> : s}
                </div>
                {i < progressSteps.length - 1 && <div className="mx-1 h-px w-8 bg-warm-200" />}
              </div>
            ))}
          </div>

          <div className="w-full max-w-md rounded-2xl border border-warm-200 bg-white p-8 shadow-elevated">
            {/* STEP 1: Business name */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="mb-2 text-4xl">🏢</div>
                  <h1 className="text-2xl font-extrabold text-night-800">Nombre del negocio</h1>
                  <p className="mt-2 text-sm text-warm-500">¿Cuál es el nombre de tu negocio?</p>
                </div>

                <div className="space-y-1.5">
                  <Label>Nombre del negocio</Label>
                  <Input
                    placeholder="Mi Negocio"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/app/catalogs')}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    onClick={() => goStep(2)}
                    disabled={!canProceedStep1()}
                    className="flex-1"
                  >
                    Continuar <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 2: URL/Slug */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="mb-2 text-4xl">🔗</div>
                  <h1 className="text-2xl font-extrabold text-night-800">Tu enlace único</h1>
                  <p className="mt-2 text-sm text-warm-500">domicilios.app/tu-enlace</p>
                </div>

                <div className="space-y-1.5">
                  <Label>URL de tu catálogo</Label>
                  <div className="flex items-center gap-1 rounded-xl border-2 border-warm-200 bg-warm-50 px-3 py-2.5 focus-within:border-primary-400">
                    <span className="text-sm text-warm-400 whitespace-nowrap">domicilios.app/</span>
                    <input
                      maxLength={30}
                      placeholder="mi-negocio"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      className="min-w-0 flex-1 bg-transparent text-sm font-medium text-night-800 outline-none placeholder:text-warm-300"
                    />
                    {slugStatus === 'checking' && <Loader2 className="h-4 w-4 animate-spin text-warm-300" />}
                    {slugStatus === 'available' && <CheckCircle2 className="h-4 w-4 text-lime-500" />}
                    {slugStatus === 'taken' && <span className="text-xs text-red-500">Tomado</span>}
                  </div>
                  {slugStatus === 'invalid' && <p className="text-xs text-red-500">Solo letras minúsculas, números y guiones</p>}
                  {slugStatus === 'taken' && <p className="text-xs text-red-500">Este enlace ya está en uso</p>}
                  {slugStatus === 'available' && <p className="text-xs text-lime-600">¡Disponible!</p>}
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => goStep(1)}
                    className="flex-1"
                  >
                    <ArrowLeft className="h-4 w-4" /> Atrás
                  </Button>
                  <Button
                    type="button"
                    onClick={() => goStep(3)}
                    disabled={!canProceedStep2()}
                    className="flex-1"
                  >
                    Continuar <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3: Currency + Description */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="mb-2 text-4xl">💰</div>
                  <h1 className="text-2xl font-extrabold text-night-800">Configuración</h1>
                  <p className="mt-2 text-sm text-warm-500">Moneda y descripción de tu negocio</p>
                </div>

                <div className="space-y-1.5">
                  <Label>Moneda</Label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full rounded-md border border-warm-200 bg-white py-2 pl-3 pr-8 text-sm text-night-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label>Descripción del negocio</Label>
                  <Textarea
                    placeholder="Describe tu negocio. Esta información se usará como referencia para generar el catálogo con IA."
                    value={businessDescription}
                    onChange={(e) => setBusinessDescription(e.target.value)}
                    rows={4}
                    maxLength={500}
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-warm-500">Mínimo 20 caracteres</p>
                    <span className="text-xs text-warm-400">{businessDescription.length}/500</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => goStep(2)}
                    className="flex-1"
                  >
                    <ArrowLeft className="h-4 w-4" /> Atrás
                  </Button>
                  <Button
                    type="button"
                    onClick={() => goStep(4)}
                    disabled={!canProceedStep3()}
                    className="flex-1"
                  >
                    Continuar <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 4: Order channel + Two buttons */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="mb-2 text-4xl">📞</div>
                  <h1 className="text-2xl font-extrabold text-night-800">Canal de pedidos</h1>
                  <p className="mt-2 text-sm text-warm-500">¿Cómo quieres recibir pedidos?</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {(['whatsapp', 'email'] as const).map((ch) => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => setOrderChannel(ch)}
                      className={cn(
                        'flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all',
                        orderChannel === ch ? 'border-primary-500 bg-primary-50' : 'border-warm-200 hover:border-primary-200',
                      )}
                    >
                      {ch === 'whatsapp' ? (
                        <MessageCircle className={cn('h-6 w-6', orderChannel === ch ? 'text-primary-500' : 'text-warm-400')} />
                      ) : (
                        <Mail className={cn('h-6 w-6', orderChannel === ch ? 'text-primary-500' : 'text-warm-400')} />
                      )}
                      <span className={cn('text-sm font-semibold', orderChannel === ch ? 'text-primary-600' : 'text-warm-500')}>
                        {ch === 'whatsapp' ? 'WhatsApp' : 'Email'}
                      </span>
                    </button>
                  ))}
                </div>

                {orderChannel === 'whatsapp' ? (
                  <div className="space-y-1.5">
                    <Label>Número de WhatsApp</Label>
                    <div className="flex gap-2">
                      <CountryCodeSelect
                        value={contactCountryCode}
                        onChange={setContactCountryCode}
                        disabled={false}
                      />
                      <Input
                        type="tel"
                        placeholder="3001234567"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label>Correo de pedidos</Label>
                    <Input
                      type="email"
                      placeholder="pedidos@tunegocio.com"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                    />
                  </div>
                )}

                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                {/* AI Generator Section */}
                {canUseAI && (
                  <div className="border-t border-warm-200 pt-6">
                    <AICatalogGenerator
                      businessName={businessName}
                      businessDescription={businessDescription}
                      businessType=""
                      onGenerated={(catalog) => {
                        setGeneratedCatalog(catalog)
                        setUseAI(true)
                      }}
                    />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => goStep(3)}
                    className="flex-1"
                  >
                    <ArrowLeft className="h-4 w-4" /> Atrás
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleCreateCatalog(false)}
                    disabled={!canProceedStep4() || isPending}
                    className="flex-1"
                  >
                    {isPending && !useAI ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Crear catálogo
                  </Button>
                  {canUseAI && (
                    <Button
                      type="button"
                      onClick={() => handleCreateCatalog(true)}
                      disabled={!canProceedStep4() || !generatedCatalog || isPending}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      {isPending && useAI ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      Crear con IA
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
