import type { Metadata } from 'next'
import Link from 'next/link'
import { BadgeCheck, Users, LayoutGrid, TrendingUp, Shield, Zap, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { AgencyCalculator } from './agency-calculator'

export const metadata: Metadata = {
  title: 'Para Agencias — Gestiona múltiples catálogos',
  description:
    'Crea y gestiona múltiples catálogos digitales desde un solo panel. Sin comisiones. Ideal para agencias de marketing, distribuidores y cadenas.',
}

const CASES = [
  {
    icon: '🍕',
    title: 'Agencia con restaurantes',
    desc: 'Gestiona el catálogo de 20 restaurantes desde un panel. Actualiza precios de temporada en segundos.',
  },
  {
    icon: '👗',
    title: 'Marca con varias líneas',
    desc: 'Mujer, hombre, niños: cada línea con su catálogo propio y el mismo panel de administración.',
  },
  {
    icon: '📦',
    title: 'Distribuidor B2B',
    desc: 'Cada cliente tiene su catálogo personalizado con precios diferenciados por segmento.',
  },
  {
    icon: '🏪',
    title: 'Restaurante multi-sucursal',
    desc: 'Menús distintos por sucursal, pedidos centralizados y reportes unificados.',
  },
]

const BENEFITS = [
  { icon: LayoutGrid, title: 'Gestión multi-catálogo', desc: 'Un solo panel para todos tus clientes. Cambia de cuenta con un clic.' },
  { icon: TrendingUp, title: 'Ingresos recurrentes', desc: 'Cobra una mensualidad a cada cliente por gestionar su catálogo.' },
  { icon: Shield, title: 'Sin comisiones', desc: 'Ni nosotros ni tú cobramos comisiones sobre las ventas de tus clientes.' },
  { icon: Users, title: 'Roles y colaboradores', desc: 'Asigna accesos distintos a tu equipo y a los dueños de cada negocio.' },
  { icon: Zap, title: 'Actualización masiva', desc: 'Sube un CSV y actualiza productos en todos los catálogos al mismo tiempo.' },
  { icon: Globe, title: 'White-label', desc: 'Tus clientes ven tu marca, no la nuestra. Emails y storefront personalizados.' },
]

const AGENCY_FAQ = [
  {
    q: '¿Puedo probar el plan de agencia antes de pagar?',
    a: 'Sí. Tienes 14 días de prueba con hasta 5 catálogos activos sin tarjeta de crédito.',
  },
  {
    q: '¿Cómo cobro a mis clientes?',
    a: 'Tú defines tu precio. Nosotros te cobramos el plan de agencia y tú cobras lo que quieras a cada cliente. Sin interferencia.',
  },
  {
    q: '¿Puedo ocultar la marca WaCommerce?',
    a: 'Sí. En los planes Professional y Agency Growth puedes usar tu propio logo, dominio y colores en el storefront y emails transaccionales.',
  },
  {
    q: '¿Qué pasa si necesito más catálogos del plan?',
    a: 'Puedes agregar catálogos extra con un precio unitario reducido. También puedes hacer upgrade de plan en cualquier momento.',
  },
  {
    q: '¿Puedo darle acceso al dueño del negocio?',
    a: 'Sí. Existe el rol "client_owner" que permite al dueño ver pedidos y analítica, sin poder cambiar la configuración del catálogo.',
  },
]

export default function AgenciesPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="gradient-hero px-4 pb-24 pt-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary-100 px-4 py-1.5 text-sm font-semibold text-primary-700">
            <BadgeCheck className="h-4 w-4" />
            Sin comisiones sobre ventas de tus clientes
          </div>
          <h1 className="text-balance text-5xl font-extrabold leading-tight text-night-800 sm:text-6xl">
            Crea y gestiona múltiples catálogos{' '}
            <span className="text-primary-500">desde un solo panel</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-warm-600">
            La herramienta que necesitan las agencias de marketing, distribuidores y cadenas para
            digitalizar a sus clientes y generar ingresos recurrentes.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="xl">
              <Link href="/signup">Empezar gratis</Link>
            </Button>
            <Button asChild size="xl" variant="outline">
              <Link href="#demo">Agendar una demo</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* "Sin comisiones" badge */}
      <div className="bg-night-800 px-4 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-center gap-3">
          <BadgeCheck className="h-6 w-6 text-lime-400" />
          <p className="text-center font-bold text-white">
            SIN COMISIONES SOBRE VENTAS — Pagas solo tu suscripción, sin importar cuánto vendan tus clientes
          </p>
          <BadgeCheck className="h-6 w-6 text-lime-400" />
        </div>
      </div>

      {/* Calculator */}
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="text-4xl font-extrabold text-night-800">Planes de crecimiento</h2>
            <p className="mt-3 text-lg text-warm-500">
              Desde 5 hasta 300 catálogos. Escala tu agencia sin saltos bruscos.
            </p>
          </div>
          <AgencyCalculator />
        </div>
      </section>

      {/* Use cases */}
      <section className="bg-warm-50 px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="text-4xl font-extrabold text-night-800">Casos de uso reales</h2>
            <p className="mt-3 text-warm-500">Para cualquier modelo de negocio multi-catálogo.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {CASES.map((c) => (
              <div key={c.title} className="flex gap-4 rounded-2xl border border-warm-200 bg-white p-6 shadow-card">
                <span className="text-4xl">{c.icon}</span>
                <div>
                  <h3 className="font-bold text-night-800">{c.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-warm-500">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="text-4xl font-extrabold text-night-800">Beneficios para tu agencia</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((b) => (
              <div key={b.title} className="rounded-2xl border border-warm-200 bg-white p-6 shadow-card">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100">
                  <b.icon className="h-5 w-5 text-primary-500" />
                </div>
                <h3 className="font-bold text-night-800">{b.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-warm-500">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Video section */}
      <section className="bg-night-800 px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-extrabold text-white">¿Cómo funciona?</h2>
          <p className="mt-3 text-night-100/60">Mira cómo una agencia gestiona 20 catálogos en minutos.</p>
          <div className="mt-10 overflow-hidden rounded-2xl bg-night-700 aspect-video flex items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-500 cursor-pointer hover:bg-primary-400 transition-colors">
                <svg viewBox="0 0 24 24" fill="white" className="h-7 w-7 ml-1">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <p className="text-sm text-night-100/50">Demo disponible próximamente</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-10 text-center text-3xl font-extrabold text-night-800">
            Preguntas frecuentes de agencias
          </h2>
          <Accordion type="single" collapsible>
            {AGENCY_FAQ.map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-base">{item.q}</AccordionTrigger>
                <AccordionContent className="text-base leading-relaxed">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA demo */}
      <section id="demo" className="gradient-hero px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-4xl font-extrabold text-night-800">¿Listo para escalar tu agencia?</h2>
          <p className="mt-4 text-lg text-warm-600">
            Agenda una demo de 30 minutos y te mostramos cómo funciona para tu caso específico.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="xl">
              <Link href="/signup">Empezar prueba gratis</Link>
            </Button>
            <Button asChild size="xl" variant="outline">
              <a href="mailto:agencias@domicilios.app">Contactar ventas</a>
            </Button>
          </div>
          <p className="mt-4 text-sm text-warm-400">
            Sin tarjeta de crédito · Respuesta en menos de 24 horas
          </p>
        </div>
      </section>
    </div>
  )
}
