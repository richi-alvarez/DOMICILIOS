import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Catálogo Digital para tu Negocio',
  description:
    'Crea tu catálogo digital con fotos, precios y pedidos por WhatsApp. Sin necesidad de una app. Ideal para tiendas, distribuidores y marcas.',
}

const features = [
  'Catálogo con imágenes y precios actualizables en tiempo real',
  'Pedidos por WhatsApp o email sin intermediarios',
  'Generado con IA en minutos a partir de tu descripción',
  'QR descargable para imprimir en local o compartir en redes',
  'Dominio propio (tutienda.com) en planes Pro',
  'Sin comisiones sobre tus ventas',
]

const useCases = [
  { emoji: '🛍️', title: 'Tiendas de ropa', desc: 'Muestra colecciones con tallas, colores y precios. Actualiza en segundos.' },
  { emoji: '💄', title: 'Cosméticos y belleza', desc: 'Catálogo con fotos profesionales y compra directa por WhatsApp.' },
  { emoji: '💎', title: 'Joyería y accesorios', desc: 'Galerías elegantes con variantes, materiales y precios personalizados.' },
  { emoji: '📦', title: 'Distribuidores B2B', desc: 'Catálogos por segmento de cliente con precios diferenciados.' },
  { emoji: '🧸', title: 'Artesanías y manualidades', desc: 'Vende tus creaciones con historia, materiales y pedidos personalizados.' },
  { emoji: '🌿', title: 'Productos naturales', desc: 'Catálogo con beneficios, ingredientes y suscripciones recurrentes.' },
]

export default function DigitalCatalogPage() {
  return (
    <div>
      {/* Hero */}
      <section className="gradient-hero px-4 pb-24 pt-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary-100 px-4 py-1.5 text-sm font-semibold text-primary-700">
            Catálogo digital sin apps
          </div>
          <h1 className="text-balance text-5xl font-extrabold text-night-800 sm:text-6xl">
            Tu catálogo digital, <span className="text-primary-500">listo en minutos</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-warm-600">
            Muestra tus productos con fotos, precios y descripción. Recibe pedidos por WhatsApp
            sin necesidad de una app ni de una tienda online compleja.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="xl">
              <Link href="/signup">
                Crear catálogo gratis <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="xl" variant="outline">
              <Link href="/plans">Ver planes</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-4xl font-extrabold text-night-800">
                Todo lo que necesita un catálogo profesional
              </h2>
              <ul className="mt-8 space-y-4">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-lime-100">
                      <Check className="h-3 w-3 text-lime-600" />
                    </div>
                    <span className="text-night-700">{f}</span>
                  </li>
                ))}
              </ul>
              <Button asChild size="lg" className="mt-8">
                <Link href="/signup">Empezar gratis</Link>
              </Button>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-primary-50 to-lime-50 p-8">
              <div className="space-y-4">
                {[
                  { emoji: '📸', label: 'Sube fotos de tus productos' },
                  { emoji: '🤖', label: 'La IA escribe las descripciones' },
                  { emoji: '🔗', label: 'Comparte el enlace o QR' },
                  { emoji: '📱', label: 'Tu cliente pide por WhatsApp' },
                  { emoji: '✅', label: 'Tú confirmas y entregas' },
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-card">
                    <span className="text-2xl">{step.emoji}</span>
                    <span className="font-medium text-night-800">{step.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="bg-warm-50 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-4xl font-extrabold text-night-800">
            Ideal para todo tipo de negocio
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {useCases.map((uc) => (
              <div key={uc.title} className="rounded-2xl border border-warm-200 bg-white p-6 shadow-card">
                <span className="text-3xl">{uc.emoji}</span>
                <h3 className="mt-3 font-bold text-night-800">{uc.title}</h3>
                <p className="mt-1 text-sm text-warm-500">{uc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="gradient-night px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-3xl font-extrabold text-white">Crea tu catálogo hoy</h2>
          <p className="mt-3 text-night-100/70">Gratis para siempre. Sin tarjeta de crédito.</p>
          <Button asChild size="xl" variant="lime" className="mt-8">
            <Link href="/signup">Crear catálogo digital gratis</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
