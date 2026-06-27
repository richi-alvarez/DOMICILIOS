import type { Metadata } from 'next'
import { getT } from '@/lib/i18n/server'
import { PricingClient } from './pricing-client'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return {
    title: t('plans.meta.title'),
    description: t('plans.meta.description'),
  }
}

export default async function PlansPage() {
  const t = await getT()
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="gradient-hero px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-balance text-5xl font-extrabold text-night-800">
            {t('plans.hero.title')}
          </h1>
          <p className="mt-4 text-lg text-warm-600">
            {t('plans.hero.subtitle')}
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
