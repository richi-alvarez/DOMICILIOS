import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Check, QrCode } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Menú Digital QR para Restaurantes y Cafés',
  description:
    'Crea tu menú digital con código QR para mesas. Actualiza precios y platos en tiempo real. Pedidos por WhatsApp. Sin apps ni impresión.',
}

const features = [
  'Menú QR en mesas: el cliente escanea y pide desde su celular',
  'Actualiza precios y platos en tiempo real, sin reimprimir',
  'Pedidos directo al WhatsApp del restaurante',
  'Categorías (entradas, platos fuertes, postres, bebidas)',
  'Fotos, alérgenos y descripciones por plato',
  'Sin comisiones sobre los pedidos',
]

const useCases = [
  { emoji: '🍕', title: 'Restaurantes', desc: 'Menú digital en cada mesa. Aumenta el ticket promedio con fotos atractivas.' },
  { emoji: '☕', title: 'Cafés y cafeterías', desc: 'Carta digital para barra y mesas. Actualiza la oferta del día en segundos.' },
  { emoji: '🍔', title: 'Comida rápida', desc: 'Menú de mostrador digital. Pedidos eficientes sin errores de comunicación.' },
  { emoji: '🍺', title: 'Bares y cantinas', desc: 'Carta de cocteles, cervezas y tapas con fotos. QR por mesa o zona.' },
  { emoji: '🍰', title: 'Pastelerías', desc: 'Vitrina digital con tortas del día, precios y pedidos por WhatsApp.' },
  { emoji: '🥗', title: 'Comida saludable', desc: 'Menú con macros, ingredientes y opciones de dieta. Actualizable a diario.' },
]

export default function DigitalMenuPage() {
  return (
    <div>
      {/* Hero */}
      <section className="gradient-hero px-4 pb-24 pt-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary-100 px-4 py-1.5 text-sm font-semibold text-primary-700">
            <QrCode className="h-4 w-4" />
            Menú digital con código QR
          </div>
          <h1 className="text-balance text-5xl font-extrabold text-night-800 sm:text-6xl">
            Deja de imprimir cartas. <span className="text-primary-500">Tu menú vive en el QR</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-warm-600">
            Tus clientes escanean el QR en la mesa, ven el menú con fotos y mandan el pedido por
            WhatsApp. Actualiza precios y platos desde tu celular, sin reimprimir nada.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="xl">
              <Link href="/signup">
                Crear menú digital gratis <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="xl" variant="outline">
              <Link href="/plans">Ver planes</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-4xl font-extrabold text-night-800">
            ¿Cómo funciona?
          </h2>
          <div className="grid gap-6 md:grid-cols-4">
            {[
              { step: '01', emoji: '📋', title: 'Crea tu menú', desc: 'Agrega categorías y platos con fotos y precios.' },
              { step: '02', emoji: '🔲', title: 'Descarga el QR', desc: 'Genera e imprime tu código QR para las mesas.' },
              { step: '03', emoji: '📱', title: 'Cliente escanea', desc: 'Ve el menú desde su celular sin apps.' },
              { step: '04', emoji: '💬', title: 'Pedido por WhatsApp', desc: 'El pedido llega directamente a tu chat.' },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100">
                  <span className="text-2xl">{s.emoji}</span>
                </div>
                <div className="mb-1 text-xs font-bold text-primary-400">{s.step}</div>
                <h3 className="font-bold text-night-800">{s.title}</h3>
                <p className="mt-1 text-sm text-warm-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-warm-50 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-4xl font-extrabold text-night-800">
                Todo lo que necesita tu menú digital
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              {useCases.slice(0, 4).map((uc) => (
                <div key={uc.title} className="rounded-2xl border border-warm-200 bg-white p-5 shadow-card">
                  <span className="text-3xl">{uc.emoji}</span>
                  <h3 className="mt-2 text-sm font-bold text-night-800">{uc.title}</h3>
                  <p className="mt-1 text-xs text-warm-500">{uc.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="gradient-night px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-3xl font-extrabold text-white">Tu menú digital en 5 minutos</h2>
          <p className="mt-3 text-night-100/70">Gratis, sin tarjeta de crédito. QR listo al instante.</p>
          <Button asChild size="xl" variant="lime" className="mt-8">
            <Link href="/signup">Crear mi menú digital gratis</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
