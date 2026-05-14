import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Check, Globe, Shield, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Cómo Vender Productos de Proveedores Chinos por WhatsApp',
  description:
    'Guía completa para distribuidores y revendedores: crea tu catálogo digital con productos importados y recibe pedidos por WhatsApp.',
}

const tips = [
  'Crea categorías por tipo de producto o proveedor',
  'Sube fotos del proveedor o toma las tuyas con fondo blanco',
  'Incluye talla, color y variantes para evitar confusiones',
  'Muestra el precio en pesos, no en dólares',
  'Especifica el tiempo de entrega estimado',
  'Agrega una política de cambios y devoluciones visible',
]

export default function ProveedoresChinosPage() {
  return (
    <div>
      <section className="gradient-hero px-4 pb-24 pt-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <nav className="mb-6 text-sm text-warm-400">
            <Link href="/" className="hover:text-primary-500">Inicio</Link>
            {' › '}
            <span>Proveedores chinos</span>
          </nav>
          <h1 className="text-balance text-5xl font-extrabold text-night-800">
            Vende productos importados con tu catálogo digital
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-warm-600">
            Guía para distribuidores y revendedores: cómo presentar tu inventario importado de
            forma profesional y recibir pedidos por WhatsApp sin confusiones.
          </p>
          <Button asChild size="xl" className="mt-8">
            <Link href="/signup">
              Crear catálogo de importados gratis <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { icon: Globe, title: 'Directo del importador', desc: 'Sin intermediarios que inflen el precio. Tu margen, tu regla.' },
              { icon: Shield, title: 'Catálogo profesional', desc: 'Presenta tu inventario como una tienda establecida, no en listas de grupos.' },
              { icon: TrendingUp, title: 'Escala rápido', desc: 'Agrega nuevas referencias en segundos con ayuda de la IA.' },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-warm-200 bg-white p-6 text-center shadow-card">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100">
                  <item.icon className="h-5 w-5 text-primary-500" />
                </div>
                <h3 className="font-bold text-night-800">{item.title}</h3>
                <p className="mt-1 text-sm text-warm-500">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-16">
            <h2 className="text-3xl font-extrabold text-night-800">
              Consejos para tu catálogo de importados
            </h2>
            <ul className="mt-8 space-y-4">
              {tips.map((tip) => (
                <li key={tip} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-lime-100">
                    <Check className="h-3 w-3 text-lime-600" />
                  </div>
                  <span className="text-night-700">{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-16 rounded-2xl bg-night-800 p-8 text-center text-white">
            <h2 className="text-2xl font-extrabold">¿Listo para profesionalizar tu negocio?</h2>
            <p className="mt-2 text-night-100/70">Crea tu catálogo digital gratis en minutos.</p>
            <Button asChild size="lg" variant="lime" className="mt-6">
              <Link href="/signup">Crear catálogo ahora</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
