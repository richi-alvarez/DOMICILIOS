'use client'
import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { QRCustomizer } from './_components/qr-customizer'
import { PublishButton } from './publish-button'

interface Catalog {
  id: string
  name: string
  slug: string
  status: string
  language: string
  currency: string
  orderChannel: string
  contactEmail?: string
  contactPhone?: string
  createdAt: Date
  updatedAt: Date
  publishedAt?: Date | null
}

export default function CatalogDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [appUrl] = useState(() => process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001')

  useEffect(() => {
    async function loadCatalog() {
      try {
        const { id } = await params
        const response = await fetch(`/api/catalogs/${id}`)
        if (!response.ok) throw new Error('Catálogo no encontrado')
        const data = await response.json()
        setCatalog(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar el catálogo')
      } finally {
        setLoading(false)
      }
    }
    loadCatalog()
  }, [params])

  if (loading) return <div className="flex items-center justify-center min-h-screen">Cargando...</div>
  if (error || !catalog) return <div className="flex items-center justify-center min-h-screen text-red-600">{error || 'Catálogo no encontrado'}</div>

  const publicUrl = `${appUrl}/s/${catalog.slug}`
  const isPublished = catalog.status === 'published'

  const formatDate = (date?: Date | string | null) => {
    if (!date) return '—'
    const parsed = new Date(date)
    if (isNaN(parsed.getTime())) return '—'
    return parsed.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <div className="border-b bg-white p-4 sm:p-6 sticky top-0 z-10 flex items-center justify-between gap-3">
        <Link href="/app/catalogs" className="inline-flex items-center gap-3 cursor-pointer hover:text-blue-600 transition min-w-0">
          <ArrowLeft className="w-5 h-5 shrink-0" />
          <h1 className="text-lg sm:text-xl font-semibold truncate">{catalog.name}</h1>
        </Link>
        <PublishButton catalogId={catalog.id} status={isPublished ? 'published' : 'draft'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 p-4 sm:p-6 max-w-7xl mx-auto">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* QR Customizer Section */}
          <QRCustomizer publicUrl={publicUrl} catalogSlug={catalog.slug} />

          {/* Information Section */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200">
            <h2 className="text-lg sm:text-xl font-bold mb-4">Información</h2>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="font-semibold text-gray-700">Nombre:</dt>
                <dd className="text-gray-600">{catalog.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-semibold text-gray-700">Slug:</dt>
                <dd className="text-gray-600">/{catalog.slug}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-semibold text-gray-700">Estado:</dt>
                <dd className="text-gray-600">{isPublished ? 'Publicado' : 'Borrador'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-semibold text-gray-700">Idioma:</dt>
                <dd className="text-gray-600">{catalog.language.toUpperCase()}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-semibold text-gray-700">Moneda:</dt>
                <dd className="text-gray-600">{catalog.currency}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-semibold text-gray-700">Canal de pedidos:</dt>
                <dd className="text-gray-600">{catalog.orderChannel === 'whatsapp' ? 'WhatsApp' : 'Email'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-semibold text-gray-700">Fecha de creación:</dt>
                <dd className="text-gray-600">{formatDate(catalog.createdAt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-semibold text-gray-700">Última actualización:</dt>
                <dd className="text-gray-600">{formatDate(catalog.updatedAt)}</dd>
              </div>
              {catalog.contactEmail && (
                <div className="flex justify-between">
                  <dt className="font-semibold text-gray-700">Email de contacto:</dt>
                  <dd className="text-gray-600">{catalog.contactEmail}</dd>
                </div>
              )}
              {catalog.contactPhone && (
                <div className="flex justify-between">
                  <dt className="font-semibold text-gray-700">Teléfono:</dt>
                  <dd className="text-gray-600">{catalog.contactPhone}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* Sidebar - Hidden on mobile */}
        <div className="hidden lg:block">
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200 h-fit sticky top-24">
            <h2 className="text-lg font-bold mb-4">SEO y Vista Previa</h2>
            <button className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition text-sm font-medium">
              📋 Logo y SEO
            </button>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-gray-700 mb-2">
                ¡Conecta tu dominio personalizado!
              </p>
              <p className="text-xs text-gray-600">
                ej. www.mitienda.com
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
