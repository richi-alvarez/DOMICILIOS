import type { Metadata } from 'next'
import { PricingClient } from './pricing-client'

export const metadata: Metadata = {
  title: 'Planes y Precios',
  description:
    'Compara planes Gratis, Basic, Pro y Business. Sin comisiones sobre ventas. Elige el plan ideal para tu negocio.',
}

export default function PlansPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="gradient-hero px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-balance text-5xl font-extrabold text-night-800">
            Planes sin comisiones sobre ventas
          </h1>
          <p className="mt-4 text-lg text-warm-600">
            Empieza gratis. Crece cuando estés listo. Sin sorpresas en la factura.
          </p>
        </div>
      </section>

      {/* Pricing section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <PricingClient />
        </div>
      </section>
    </div>
  )
}
