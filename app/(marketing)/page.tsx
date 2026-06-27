import Link from 'next/link'
import { ArrowRight, CheckCircle2, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Metadata } from 'next'
import { getT } from '@/lib/i18n/server'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return { title: t('landing.meta.title') }
}

// Solo datos no traducibles (emojis/iconos/href); el texto se resuelve con t().
const CHECKLIST_KEYS = ['noCommissions', 'whatsapp', 'ai', 'dashboard', 'payments', 'domain']

const VERTICALS = [
  { emoji: '🍕', key: 'restaurants' },
  { emoji: '👗', key: 'fashion' },
  { emoji: '🧁', key: 'bakeries' },
  { emoji: '💄', key: 'cosmetics' },
  { emoji: '☕', key: 'cafes' },
  { emoji: '💎', key: 'jewelry' },
  { emoji: '👟', key: 'shoes' },
  { emoji: '🌿', key: 'natural' },
]

const FEATURES = [
  { icon: '🤖', key: 'ai' },
  { icon: '📦', key: 'blocks' },
  { icon: '📱', key: 'whatsapp' },
  { icon: '💳', key: 'payments' },
  { icon: '📊', key: 'analytics' },
  { icon: '🌐', key: 'domain' },
]

const HOW_IT_WORKS = [
  { step: '01', emoji: '✍️', key: 'register' },
  { step: '02', emoji: '🤖', key: 'ai' },
  { step: '03', emoji: '🎨', key: 'customize' },
  { step: '04', emoji: '💬', key: 'orders' },
]

const TESTIMONIALS = [
  { name: 'Sandra Morales', avatar: 'SM', stars: 5, key: 'sandra' },
  { name: 'Carlos Reyes', avatar: 'CR', stars: 5, key: 'carlos' },
  { name: 'Valentina López', avatar: 'VL', stars: 5, key: 'valentina' },
]

export default async function HomePage() {
  const t = await getT()
  return (
    <>
      {/* ── Hero ── */}
      <section className="gradient-hero relative overflow-hidden px-4 pb-28 pt-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary-100 px-4 py-1.5 text-sm font-semibold text-primary-700">
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary-500" />
            {t('landing.badge')}
          </div>

          <h1 className="text-balance text-5xl font-extrabold leading-[1.08] text-night-800 sm:text-6xl lg:text-7xl">
            {t('landing.hero.titleA')}{' '}
            <span className="text-primary-500">{t('landing.hero.titleB')}</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-warm-600 sm:text-xl">
            {t('landing.hero.subtitle')}
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="xl">
              <Link href="/signup">
                {t('landing.hero.ctaPrimary')}
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="xl">
              <Link href="/plans">{t('landing.hero.ctaSecondary')}</Link>
            </Button>
          </div>

          <ul className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2">
            {CHECKLIST_KEYS.map((k) => (
              <li key={k} className="flex items-center gap-1.5 text-sm text-warm-600">
                <CheckCircle2 className="h-4 w-4 text-lime-500" />
                {t(`landing.checklist.${k}`)}
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
            {t('landing.verticalsTitle')}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {VERTICALS.map((v) => (
              <span key={v.key} className="inline-flex items-center gap-2 rounded-full border border-warm-200 bg-warm-50 px-4 py-2 text-sm font-medium text-night-700">
                <span>{v.emoji}</span>
                {t(`landing.verticals.${v.key}`)}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Cómo funciona ── */}
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <h2 className="text-4xl font-extrabold text-night-800">{t('landing.how.title')}</h2>
            <p className="mt-3 text-lg text-warm-500">{t('landing.how.subtitle')}</p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.step} className="relative text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100">
                  <span className="text-3xl">{step.emoji}</span>
                </div>
                <div className="mb-2 text-xs font-bold uppercase tracking-widest text-primary-400">{step.step}</div>
                <h3 className="font-bold text-night-800">{t(`landing.how.${step.key}.title`)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-warm-500">{t(`landing.how.${step.key}.desc`)}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Button asChild size="lg">
              <Link href="/signup">{t('landing.how.cta')}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Features grid ── */}
      <section className="bg-warm-50 px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-4xl font-extrabold text-night-800">{t('landing.features.title')}</h2>
            <p className="mt-4 text-lg text-warm-500">{t('landing.features.subtitle')}</p>
          </div>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.key} className="group rounded-2xl border border-warm-200 bg-white p-6 shadow-card transition-shadow hover:shadow-elevated">
                <span className="text-3xl">{f.icon}</span>
                <h3 className="mt-4 text-lg font-bold text-night-800">{t(`landing.features.${f.key}.title`)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-warm-500">{t(`landing.features.${f.key}.desc`)}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="/plans" className="text-sm font-semibold text-primary-500 hover:underline">
              {t('landing.features.compare')}
            </Link>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-4xl font-extrabold text-night-800">{t('landing.testimonials.title')}</h2>
            <p className="mt-3 text-warm-500">{t('landing.testimonials.subtitle')}</p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {TESTIMONIALS.map((tm) => (
              <div key={tm.key} className="flex flex-col rounded-2xl border border-warm-200 bg-white p-6 shadow-card">
                <div className="mb-4 flex">
                  {Array.from({ length: tm.stars }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary-500 text-primary-500" />
                  ))}
                </div>
                <p className="flex-1 text-sm leading-relaxed text-night-700">&ldquo;{t(`landing.testimonials.${tm.key}.text`)}&rdquo;</p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-600">
                    {tm.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-night-800">{tm.name}</div>
                    <div className="text-xs text-warm-400">{t(`landing.testimonials.${tm.key}.role`)}</div>
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
          <h2 className="text-4xl font-extrabold text-white">{t('landing.finalCta.title')}</h2>
          <p className="mt-4 text-lg text-night-100/70">{t('landing.finalCta.subtitle')}</p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="xl" variant="lime">
              <Link href="/signup">
                {t('landing.finalCta.ctaPrimary')}
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="xl" variant="ghost" className="text-white hover:bg-night-700">
              <Link href="/plans">{t('landing.finalCta.ctaSecondary')}</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
