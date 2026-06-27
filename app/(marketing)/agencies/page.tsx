import type { Metadata } from 'next'
import Link from 'next/link'
import { BadgeCheck, Users, LayoutGrid, TrendingUp, Shield, Zap, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { getT } from '@/lib/i18n/server'
import { AgencyCalculator } from './agency-calculator'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return {
    title: t('agencies.meta.title'),
    description: t('agencies.meta.description'),
  }
}

const CASES = [
  { icon: '🍕', key: 'restaurants' },
  { icon: '👗', key: 'brand' },
  { icon: '📦', key: 'b2b' },
  { icon: '🏪', key: 'multibranch' },
]

const BENEFITS = [
  { icon: LayoutGrid, key: 'multiCatalog' },
  { icon: TrendingUp, key: 'recurring' },
  { icon: Shield, key: 'noCommissions' },
  { icon: Users, key: 'roles' },
  { icon: Zap, key: 'bulk' },
  { icon: Globe, key: 'whitelabel' },
]

const AGENCY_FAQ_KEYS = ['try', 'billing', 'whitelabel', 'extra', 'owner']

export default async function AgenciesPage() {
  const t = await getT()
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="gradient-hero px-4 pb-24 pt-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary-100 px-4 py-1.5 text-sm font-semibold text-primary-700">
            <BadgeCheck className="h-4 w-4" />
            {t('agencies.hero.badge')}
          </div>
          <h1 className="text-balance text-5xl font-extrabold leading-tight text-night-800 sm:text-6xl">
            {t('agencies.hero.titleA')}{' '}
            <span className="text-primary-500">{t('agencies.hero.titleB')}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-warm-600">
            {t('agencies.hero.subtitle')}
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="xl">
              <Link href="/signup">{t('agencies.hero.ctaStart')}</Link>
            </Button>
            <Button asChild size="xl" variant="outline">
              <Link href="#demo">{t('agencies.hero.ctaDemo')}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* "Sin comisiones" badge */}
      <div className="bg-night-800 px-4 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-center gap-3">
          <BadgeCheck className="h-6 w-6 text-lime-400" />
          <p className="text-center font-bold text-white">
            {t('agencies.banner')}
          </p>
          <BadgeCheck className="h-6 w-6 text-lime-400" />
        </div>
      </div>

      {/* Calculator */}
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="text-4xl font-extrabold text-night-800">{t('agencies.growth.title')}</h2>
            <p className="mt-3 text-lg text-warm-500">
              {t('agencies.growth.subtitle')}
            </p>
          </div>
          <AgencyCalculator />
        </div>
      </section>

      {/* Use cases */}
      <section className="bg-warm-50 px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="text-4xl font-extrabold text-night-800">{t('agencies.cases.title')}</h2>
            <p className="mt-3 text-warm-500">{t('agencies.cases.subtitle')}</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {CASES.map((c) => (
              <div key={c.key} className="flex gap-4 rounded-2xl border border-warm-200 bg-white p-6 shadow-card">
                <span className="text-4xl">{c.icon}</span>
                <div>
                  <h3 className="font-bold text-night-800">{t(`agencies.cases.${c.key}.title`)}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-warm-500">{t(`agencies.cases.${c.key}.desc`)}</p>
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
            <h2 className="text-4xl font-extrabold text-night-800">{t('agencies.benefits.title')}</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((b) => (
              <div key={b.key} className="rounded-2xl border border-warm-200 bg-white p-6 shadow-card">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100">
                  <b.icon className="h-5 w-5 text-primary-500" />
                </div>
                <h3 className="font-bold text-night-800">{t(`agencies.benefits.${b.key}.title`)}</h3>
                <p className="mt-1 text-sm leading-relaxed text-warm-500">{t(`agencies.benefits.${b.key}.desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Video section */}
      <section className="bg-night-800 px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-extrabold text-white">{t('agencies.video.title')}</h2>
          <p className="mt-3 text-night-100/60">{t('agencies.video.subtitle')}</p>
          <div className="mt-10 overflow-hidden rounded-2xl bg-night-700 aspect-video flex items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-500 cursor-pointer hover:bg-primary-400 transition-colors">
                <svg viewBox="0 0 24 24" fill="white" className="h-7 w-7 ml-1">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <p className="text-sm text-night-100/50">{t('agencies.video.comingSoon')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-10 text-center text-3xl font-extrabold text-night-800">
            {t('agencies.faqTitle')}
          </h2>
          <Accordion type="single" collapsible>
            {AGENCY_FAQ_KEYS.map((k, i) => (
              <AccordionItem key={k} value={`faq-${i}`}>
                <AccordionTrigger className="text-base">{t(`agencies.faq.${k}.q`)}</AccordionTrigger>
                <AccordionContent className="text-base leading-relaxed">{t(`agencies.faq.${k}.a`)}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA demo */}
      <section id="demo" className="gradient-hero px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-4xl font-extrabold text-night-800">{t('agencies.ctaDemo.title')}</h2>
          <p className="mt-4 text-lg text-warm-600">
            {t('agencies.ctaDemo.subtitle')}
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="xl">
              <Link href="/signup">{t('agencies.ctaDemo.start')}</Link>
            </Button>
            <Button asChild size="xl" variant="outline">
              <a href="mailto:agencias@domicilios.app">{t('agencies.ctaDemo.contact')}</a>
            </Button>
          </div>
          <p className="mt-4 text-sm text-warm-400">
            {t('agencies.ctaDemo.note')}
          </p>
        </div>
      </section>
    </div>
  )
}
