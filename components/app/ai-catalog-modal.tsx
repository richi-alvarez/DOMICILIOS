'use client'

import { useEffect, useState } from 'react'
import { createCatalogFromAI, getPromptGuide, isSlugAvailable } from '@/lib/actions/ai-catalog'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle2, Loader2, Sparkles, Trash2, X } from 'lucide-react'

interface AICatalogModalProps {
  isOpen: boolean
  onClose: () => void
}

const businessTypes = [
  { id: 'restaurant', name: 'Restaurante', description: 'Menú de comida y bebidas', icon: '🍔' },
  { id: 'cafe', name: 'Cafetería', description: 'Menú de café y postres', icon: '☕' },
  { id: 'store', name: 'Tienda', description: 'Catálogo de productos', icon: '🛍️' },
  { id: 'barbershop', name: 'Barbería', description: 'Servicios de corte y afeitado', icon: '💈' },
  {
    id: 'salon',
    name: 'Salón especializado y cuidado',
    description: 'Servicios de belleza y cuidado personal',
    icon: '💅',
  },
  { id: 'other', name: 'Otros', description: 'Describe tu tipo de negocio', icon: '✨' },
]

const CURRENCIES = [
  { code: 'COP', label: 'COP - Peso Colombiano' },
  { code: 'USD', label: 'USD - Dólar Estadounidense' },
  { code: 'EUR', label: 'EUR - Euro' },
  { code: 'BRL', label: 'BRL - Real Brasileño' },
  { code: 'MXN', label: 'MXN - Peso Mexicano' },
  { code: 'ARS', label: 'ARS - Peso Argentino' },
  { code: 'CLP', label: 'CLP - Peso Chileno' },
  { code: 'PEN', label: 'PEN - Sol Peruano' },
]

type Step = 'business' | 'slug' | 'details'
type SlugStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 30)
}

export function AICatalogModal({ isOpen, onClose }: AICatalogModalProps) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('business')
  const [businessName, setBusinessName] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [slug, setSlug] = useState('')
  const [slugStatus, setSlugStatus] = useState<SlugStatus>('idle')
  const [currency, setCurrency] = useState('COP')
  const [description, setDescription] = useState('')
  const [guidePrompt, setGuidePrompt] = useState<string | null>(null)
  const [filledFromGuide, setFilledFromGuide] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const selectedBusiness = businessTypes.find((t) => t.id === selectedType)
  const descriptionRequired = selectedType === 'other'

  // Derivar el enlace del nombre mientras estamos en el primer paso.
  useEffect(() => {
    if (businessName && step === 'business') {
      const derived = slugify(businessName)
      if (derived.length >= 3) setSlug(derived)
    }
  }, [businessName, step])

  // Comprobar disponibilidad del enlace (debounce).
  useEffect(() => {
    if (!slug || slug.length < 3) {
      setSlugStatus('idle')
      return
    }
    if (!/^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/.test(slug)) {
      setSlugStatus('invalid')
      return
    }
    setSlugStatus('checking')
    const timer = setTimeout(async () => {
      try {
        const available = await isSlugAvailable(slug)
        setSlugStatus(available ? 'available' : 'taken')
      } catch {
        setSlugStatus('idle')
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [slug])

  const resetAndClose = () => {
    setStep('business')
    setBusinessName('')
    setSelectedType('')
    setSlug('')
    setSlugStatus('idle')
    setCurrency('COP')
    setDescription('')
    setGuidePrompt(null)
    setFilledFromGuide(false)
    setError('')
    onClose()
  }

  const handleSelectType = async (typeId: string) => {
    const typeChanged = typeId !== selectedType
    setSelectedType(typeId)
    setError('')
    setGuidePrompt(null)
    // Si cambiamos de tipo de negocio, no arrastrar el ejemplo del anterior.
    if (typeChanged && filledFromGuide) {
      setDescription('')
      setFilledFromGuide(false)
    }
    try {
      const guide = await getPromptGuide(typeId)
      setGuidePrompt(guide)
    } catch {
      setGuidePrompt(null)
    }
  }

  const handleUseGuide = () => {
    if (guidePrompt) {
      setDescription(guidePrompt)
      setFilledFromGuide(true)
      setError('')
    }
  }

  const handleClearExample = () => {
    setDescription('')
    setFilledFromGuide(false)
    setError('')
  }

  const canContinueBusiness = businessName.trim().length >= 2 && selectedType !== ''
  const canContinueSlug = slugStatus === 'available'

  const handleCreate = async () => {
    if (descriptionRequired && !description.trim()) {
      setError('Describe tu negocio para que la IA genere el catálogo')
      return
    }
    setIsLoading(true)
    setError('')
    try {
      const result = await createCatalogFromAI({
        businessType: selectedType,
        businessName: businessName.trim(),
        slug,
        currency,
        description: description.trim(),
      })
      if (result.success && result.catalogId) {
        router.push(`/app/catalogs/${result.catalogId}`)
        resetAndClose()
      } else {
        setError(result.error || 'Error al crear el catálogo')
      }
    } catch (err) {
      setError('Error inesperado')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  const stepIndex = step === 'business' ? 1 : step === 'slug' ? 2 : 3

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {step !== 'business' && (
              <button
                onClick={() => setStep(step === 'details' ? 'slug' : 'business')}
                disabled={isLoading}
                className="p-1 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
                aria-label="Volver"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <Sparkles className="w-6 h-6 text-primary-500" />
            <h2 className="text-2xl font-bold">Crear con IA</h2>
          </div>
          <button onClick={resetAndClose} className="p-1 hover:bg-gray-100 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition ${
                s <= stepIndex ? 'bg-primary-500' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Step 1: Nombre + Tipo de negocio */}
        {step === 'business' && (
          <>
            <div className="space-y-2">
              <label htmlFor="ai-business-name" className="block text-sm font-medium text-gray-900">
                Nombre del negocio
              </label>
              <input
                id="ai-business-name"
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value.slice(0, 64))}
                autoFocus
                placeholder="Ej: Barbería La Cumbre"
                className="w-full p-3 rounded-lg border-2 border-gray-200 focus:border-primary-400 focus:outline-none text-sm"
              />
            </div>

            <div className="space-y-2">
              <p className="block text-sm font-medium text-gray-900">Tipo de negocio</p>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {businessTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => handleSelectType(type.id)}
                    className={`w-full p-3 rounded-lg border-2 transition text-left ${
                      selectedType === type.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-primary-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{type.icon}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900">{type.name}</h3>
                        <p className="text-sm text-gray-600">{type.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={resetAndClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => setStep('slug')}
                disabled={!canContinueBusiness}
                className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition disabled:opacity-50"
              >
                Continuar
              </button>
            </div>
          </>
        )}

        {/* Step 2: Enlace único */}
        {step === 'slug' && (
          <>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Tu enlace único</h3>
              <p className="text-sm text-gray-600">Este será el link público de tu tienda.</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="ai-slug" className="block text-sm font-medium text-gray-900">
                Enlace de tu tienda
              </label>
              <div
                className={`flex items-center gap-1 rounded-lg border-2 px-3 py-2 transition ${
                  slugStatus === 'available'
                    ? 'border-green-400 bg-green-50'
                    : slugStatus === 'taken' || slugStatus === 'invalid'
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-200'
                }`}
              >
                <span className="whitespace-nowrap text-sm text-gray-400">/s/</span>
                <input
                  id="ai-slug"
                  type="text"
                  value={slug}
                  onChange={(e) =>
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 30))
                  }
                  className="min-w-0 flex-1 bg-transparent font-mono text-sm font-medium text-gray-900 outline-none"
                  placeholder="mi-tienda"
                />
                <span className="ml-2 flex-shrink-0">
                  {slugStatus === 'checking' && (
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  )}
                  {slugStatus === 'available' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                  {(slugStatus === 'taken' || slugStatus === 'invalid') && (
                    <span className="text-xs text-red-500">✗</span>
                  )}
                </span>
              </div>
              {slugStatus === 'taken' && (
                <p className="text-xs text-red-500">Ese enlace ya está en uso. Prueba otro.</p>
              )}
              {slugStatus === 'invalid' && (
                <p className="text-xs text-red-500">
                  Mínimo 3 caracteres, solo letras, números y guiones.
                </p>
              )}
              {slugStatus === 'available' && (
                <p className="text-xs text-green-600">¡Disponible! Este enlace es tuyo.</p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep('business')}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Atrás
              </button>
              <button
                onClick={() => setStep('details')}
                disabled={!canContinueSlug}
                className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition disabled:opacity-50"
              >
                Continuar
              </button>
            </div>
          </>
        )}

        {/* Step 3: Moneda + Descripción */}
        {step === 'details' && (
          <>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-primary-50 border border-primary-200">
              <span className="text-2xl">{selectedBusiness?.icon}</span>
              <div>
                <h3 className="font-semibold text-gray-900">{businessName}</h3>
                <p className="text-sm text-gray-600">{selectedBusiness?.name}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="ai-currency" className="block text-sm font-medium text-gray-900">
                Moneda
              </label>
              <select
                id="ai-currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full p-3 rounded-lg border-2 border-gray-200 focus:border-primary-400 focus:outline-none text-sm"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="ai-description" className="block text-sm font-medium text-gray-900">
                  Describe tu negocio
                  {!descriptionRequired && (
                    <span className="font-normal text-gray-500"> (opcional)</span>
                  )}
                </label>
                <div className="flex items-center gap-3">
                  {guidePrompt && (
                    <button
                      type="button"
                      onClick={handleUseGuide}
                      disabled={isLoading}
                      className="flex items-center gap-1 text-xs font-medium text-primary-500 hover:text-primary-600 transition disabled:opacity-50"
                    >
                      <Sparkles className="w-4 h-4" />
                      Usar ejemplo
                    </button>
                  )}
                  {description.trim() && (
                    <button
                      type="button"
                      onClick={handleClearExample}
                      disabled={isLoading}
                      className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-red-600 transition disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Eliminar
                    </button>
                  )}
                </div>
              </div>
              <textarea
                id="ai-description"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value.slice(0, 500))
                  setFilledFromGuide(false)
                }}
                rows={4}
                placeholder={
                  selectedType === 'other'
                    ? 'Ej: Estudio de tatuajes con servicios de diseño personalizado, retoques y piercings…'
                    : 'Cuéntanos detalles: estilo, productos/servicios destacados, rango de precios, ciudad…'
                }
                className="w-full p-3 rounded-lg border-2 border-gray-200 focus:border-primary-400 focus:outline-none text-sm resize-none"
              />
              <p className="text-xs text-gray-500">
                Mientras más detalles, mejor será el catálogo que genere la IA.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep('slug')}
                disabled={isLoading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
              >
                Atrás
              </button>
              <button
                onClick={handleCreate}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Crear con IA
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              Se generarán productos y categorías automáticamente
            </p>
          </>
        )}
      </div>
    </div>
  )
}
