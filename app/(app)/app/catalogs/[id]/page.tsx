export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Globe, Copy, ExternalLink, Package, BarChart2, ShoppingCart, CheckCircle2, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PublishButton } from './publish-button'
import { formatDate } from '@/lib/utils'

export const metadata: Metadata = { title: 'Detalles del catálogo' }

async function getCatalog(id: string) {
  if (!process.env.DATABASE_URL) return null
  try {
    const { db, catalogs } = await import('@/db')
    const { eq } = await import('drizzle-orm')
    return db.query.catalogs.findFirst({ where: eq(catalogs.id, id) })
  } catch { return null }
}

export default async function CatalogDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const catalog = await getCatalog(id)
  if (!catalog) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center">
        <div className="text-6xl">🔗</div>
        <h1 className="text-2xl font-bold text-night-800">Catálogo no disponible</h1>
        <p className="text-warm-500 text-sm">Configura tu DATABASE_URL para ver los datos del catálogo.</p>
        <Button asChild variant="outline"><Link href="/app">Volver a catálogos</Link></Button>
      </div>
    )
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3003'
  const publicUrl = `${appUrl}/s/${catalog.slug}`

  return (
    <div className="px-6 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-night-800">{catalog.name}</h1>
            <Badge variant={catalog.status === 'published' ? 'lime' : 'muted'}>
              {catalog.status === 'published' ? 'Publicado' : 'Borrador'}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-warm-400">
            Creado el {formatDate(catalog.createdAt)} · Última actualización {formatDate(catalog.updatedAt)}
          </p>
        </div>
        <PublishButton catalogId={id} status={catalog.status as 'draft' | 'published'} />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Enlace público */}
        <div className="rounded-2xl border border-warm-200 bg-white p-6 shadow-card">
          <h2 className="mb-4 font-bold text-night-800 flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary-500" />
            Enlace público
          </h2>
          <div className="flex items-center gap-2 rounded-xl bg-warm-50 p-3">
            <span className="min-w-0 flex-1 truncate text-sm text-night-700">{publicUrl}</span>
            <button
              onClick={() => navigator.clipboard.writeText(publicUrl)}
              className="shrink-0 rounded-lg p-1.5 text-warm-400 hover:bg-warm-200 hover:text-night-700"
              title="Copiar"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
          {catalog.status === 'published' && (
            <Link
              href={`/s/${catalog.slug}`}
              target="_blank"
              className="mt-3 flex items-center gap-1.5 text-sm font-medium text-primary-500 hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              Visitar tienda
            </Link>
          )}
        </div>

        {/* Info */}
        <div className="rounded-2xl border border-warm-200 bg-white p-6 shadow-card">
          <h2 className="mb-4 font-bold text-night-800">Información</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-warm-500">Idioma</dt>
              <dd className="font-medium text-night-700">{catalog.language?.toUpperCase()}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-warm-500">Moneda</dt>
              <dd className="font-medium text-night-700">{catalog.currency}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-warm-500">Canal de pedidos</dt>
              <dd className="font-medium text-night-700">
                {catalog.orderChannel === 'whatsapp' ? 'WhatsApp' : 'Email'}
              </dd>
            </div>
            {catalog.contactPhone && (
              <div className="flex justify-between">
                <dt className="text-warm-500">Teléfono</dt>
                <dd className="font-medium text-night-700">{catalog.contactCountryCode}{catalog.contactPhone}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Quick actions */}
        <div className="rounded-2xl border border-warm-200 bg-white p-6 shadow-card sm:col-span-2">
          <h2 className="mb-4 font-bold text-night-800">Accesos rápidos</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { href: `/app/catalogs/${id}/products`, icon: Package, label: 'Productos' },
              { href: `/app/catalogs/${id}/orders`, icon: ShoppingCart, label: 'Pedidos' },
              { href: `/app/catalogs/${id}/analytics`, icon: BarChart2, label: 'Estadísticas' },
              { href: `/app/catalogs/${id}/settings`, icon: Globe, label: 'Configuración' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-2 rounded-xl border border-warm-200 p-4 text-center transition-colors hover:border-primary-300 hover:bg-primary-50"
              >
                <item.icon className="h-6 w-6 text-primary-500" />
                <span className="text-sm font-medium text-night-700">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Status info */}
        <div className={`rounded-2xl border p-6 sm:col-span-2 ${catalog.status === 'published' ? 'border-lime-200 bg-lime-50' : 'border-warm-200 bg-warm-50'}`}>
          <div className="flex items-start gap-3">
            {catalog.status === 'published' ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-lime-600" />
            ) : (
              <Clock className="mt-0.5 h-5 w-5 shrink-0 text-warm-400" />
            )}
            <div>
              <p className="font-semibold text-night-800">
                {catalog.status === 'published' ? 'Tu catálogo está en línea' : 'Tu catálogo es un borrador'}
              </p>
              <p className="mt-1 text-sm text-warm-600">
                {catalog.status === 'published'
                  ? `Publicado el ${formatDate(catalog.publishedAt!)}. Tus clientes pueden verlo y hacer pedidos.`
                  : 'Agrega productos y personaliza el diseño antes de publicar.'}
              </p>
              {catalog.status === 'draft' && (
                <div className="mt-3 flex gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/app/catalogs/${id}/products`}>Agregar productos</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
