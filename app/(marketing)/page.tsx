import Link from 'next/link'
import { ArrowRight, CheckCircle2, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Domicilios — Catálogos digitales con pedidos por WhatsApp',
}

const FEATURES_CHECKLIST = [
  'Sin comisiones sobre tus ventas',
  'Pedidos por WhatsApp o email',
  'Catálogo generado con IA',
  'Panel de pedidos en tiempo real',
  'Pagos integrados (Stripe, MercadoPago)',
  'Dominio propio opcional',
]

const VERTICALS = [
  { emoji: '🍕', label: 'Restaurantes' },
  { emoji: '👗', label: 'Ropa y moda' },
  { emoji: '🧁', label: 'Pastelerías' },
  { emoji: '💄', label: 'Cosméticos' },
  { emoji: '☕', label: 'Cafés' },
  { emoji: '💎', label: 'Joyería' },
  { emoji: '👟', label: 'Zapatos' },
  { emoji: '🌿', label: 'Productos naturales' },
]

const FEATURES = [
  {
    icon: '🤖',
    title: 'Catálogo generado con IA',
    desc: 'Describe tu negocio y la IA crea categorías, productos y copys automáticamente.',
  },
  {
    icon: '📦',
    title: 'Editor de bloques',
    desc: 'Diseña tu tienda con bloques drag-and-drop. Hero, galería, testimonios y más.',
  },
  {
    icon: '📱',
    title: 'Pedidos por WhatsApp',
    desc: 'El carrito genera un mensaje prellenado. Tu cliente lo envía con un clic.',
  },
  {
    icon: '💳',
    title: 'Pagos integrados',
    desc: 'Acepta Stripe, MercadoPago, PayPal o transferencia manual. Sin comisiones.',
  },
  {
    icon: '📊',
    title: 'Analítica y pedidos',
    desc: 'Dashboard con visitas, conversiones y gestión de pedidos en tiempo real.',
  },
  {
    icon: '🌐',
    title: 'Dominio propio',
    desc: 'Conecta tu dominio personalizado y oculta nuestra marca en planes Pro+.',
  },
]

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Registra tu negocio',
    desc: 'Crea tu cuenta gratis, elige el nombre de tu tienda y describe tu negocio.',
    emoji: '✍️',
  },
  {
    step: '02',
    title: 'La IA construye tu catálogo',
    desc: 'En segundos tendrás categorías, productos, precios y diseño listos para publicar.',
    emoji: '🤖',
  },
  {
    step: '03',
    title: 'Personaliza y publica',
    desc: 'Ajusta colores, bloques y fotos. Publica con un clic y comparte el enlace o QR.',
    emoji: '🎨',
  },
  {
    step: '04',
    title: 'Recibe pedidos por WhatsApp',
    desc: 'Tu cliente agrega al carrito y el pedido llega a tu WhatsApp con todos los detalles.',
    emoji: '💬',
  },
]

const TESTIMONIALS = [
  {
    name: 'Sandra Morales',
    role: 'Dueña de Pasteles SM · Bogotá, Colombia',
    avatar: 'SM',
    text: 'Antes mandaba fotos por WhatsApp y perdía pedidos. Ahora tengo mi catálogo, mis clientes lo comparten entre ellos y recibo 3x más pedidos.',
    stars: 5,
  },
  {
    name: 'Carlos Reyes',
    role: 'Distribuidora Reyes · Guadalajara, México',
    avatar: 'CR',
    text: 'Tengo 150 productos de importación. El catálogo se ve súper profesional y mis clientes ya no me preguntan por precio, simplemente piden.',
    stars: 5,
  },
  {
    name: 'Valentina López',
    role: 'Agencia Vitrina Digital · Medellín, Colombia',
    avatar: 'VL',
    text: 'Manejo 12 clientes desde un solo panel. El plan de agencia me da todo lo que necesito y no cobro comisiones, así que mis clientes están felices.',
    stars: 5,
  },
]

export default function HomePage() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="gradient-hero relative overflow-hidden px-4 pb-28 pt-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary-100 px-4 py-1.5 text-sm font-semibold text-primary-700">
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary-500" />
            Gratis para empezar · Sin tarjeta de crédito
          </div>

          <h1 className="text-balance text-5xl font-extrabold leading-[1.08] text-night-800 sm:text-6xl lg:text-7xl">
            Tu catálogo digital,{' '}
            <span className="text-primary-500">pedidos por WhatsApp</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-warm-600 sm:text-xl">
            Crea tu tienda en minutos con IA. Gestiona productos, recibe pedidos y cobra — todo
            desde un solo panel. Sin comisiones sobre tus ventas.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="xl">
              <Link href="/signup">
                Crear catálogo gratis
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="xl">
              <Link href="/plans">Ver planes</Link>
            </Button>
          </div>

          <ul className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2">
            {FEATURES_CHECKLIST.map((f) => (
              <li key={f} className="flex items-center gap-1.5 text-sm text-warm-600">
                <CheckCircle2 className="h-4 w-4 text-lime-500" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div aria-hidden className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary-100 opacity-40 blur-3xl" />
        <div aria-hidden className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-lime-100 opacity-50 blur-3xl" />
      </section>

      {/* ── Verticales ── */}
      <section className="border-y border-warm-200 bg-white px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <p className="mb-6 text-center text-sm font-semibold uppercase tracking-wider text-warm-400">
            Para todo tipo de negocio
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {VERTICALS.map((v) => (
              <span key={v.label} className="inline-flex items-center gap-2 rounded-full border border-warm-200 bg-warm-50 px-4 py-2 text-sm font-medium text-night-700">
                <span>{v.emoji}</span>
                {v.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Cómo funciona ── */}
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <h2 className="text-4xl font-extrabold text-night-800">Tu tienda en 4 pasos</h2>
            <p className="mt-3 text-lg text-warm-500">Sin complicaciones. Sin código. Sin agencia de diseño.</p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.step} className="relative text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100">
                  <span className="text-3xl">{step.emoji}</span>
                </div>
                <div className="mb-2 text-xs font-bold uppercase tracking-widest text-primary-400">{step.step}</div>
                <h3 className="font-bold text-night-800">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-warm-500">{step.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Button asChild size="lg">
              <Link href="/signup">Empezar ahora — es gratis</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Features grid ── */}
      <section className="bg-warm-50 px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-4xl font-extrabold text-night-800">Todo lo que necesita tu negocio</h2>
            <p className="mt-4 text-lg text-warm-500">Una plataforma completa para vender online, sin complicaciones.</p>
          </div>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="group rounded-2xl border border-warm-200 bg-white p-6 shadow-card transition-shadow hover:shadow-elevated">
                <span className="text-3xl">{f.icon}</span>
                <h3 className="mt-4 text-lg font-bold text-night-800">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-warm-500">{f.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="/plans" className="text-sm font-semibold text-primary-500 hover:underline">
              Ver comparativa completa de planes →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-4xl font-extrabold text-night-800">Lo que dicen nuestros usuarios</h2>
            <p className="mt-3 text-warm-500">Más de 5,000 negocios ya venden con Domicilios.</p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="flex flex-col rounded-2xl border border-warm-200 bg-white p-6 shadow-card">
                <div className="mb-4 flex">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary-500 text-primary-500" />
                  ))}
                </div>
                <p className="flex-1 text-sm leading-relaxed text-night-700">&ldquo;{t.text}&rdquo;</p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-600">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-night-800">{t.name}</div>
                    <div className="text-xs text-warm-400">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Final ── */}
      <section className="gradient-night px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-4xl font-extrabold text-white">Empieza a vender hoy, gratis</h2>
          <p className="mt-4 text-lg text-night-100/70">Sin tarjeta de crédito. Tu catálogo en minutos con ayuda de la IA.</p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="xl" variant="lime">
              <Link href="/signup">
                Crear mi catálogo gratis
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="xl" variant="ghost" className="text-white hover:bg-night-700">
              <Link href="/plans">Ver todos los planes</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
