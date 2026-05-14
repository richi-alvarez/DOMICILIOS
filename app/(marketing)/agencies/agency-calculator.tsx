'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Check } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  AGENCY_TIERS,
  CURRENCIES,
  formatPrice,
  calcAgencyPrice,
  type Currency,
} from '@/lib/pricing'

const CATALOG_MARKS = [5, 10, 20, 50, 100, 200, 300]

export function AgencyCalculator() {
  const [catalogCount, setCatalogCount] = useState(5)
  const [interval, setInterval] = useState<'monthly' | 'annual'>('monthly')
  const [currency, setCurrency] = useState<Currency>('COP')

  const activeTier =
    catalogCount <= 5
      ? AGENCY_TIERS[0]
      : catalogCount <= 20
        ? AGENCY_TIERS[1]
        : AGENCY_TIERS[2]

  const price = calcAgencyPrice(catalogCount, activeTier, currency, interval)
  const pricePerCatalog = Math.round(price / catalogCount)

  const sliderValue = CATALOG_MARKS.indexOf(catalogCount)
  const clampedIndex = sliderValue === -1 ? 0 : sliderValue

  return (
    <div className="rounded-3xl border border-primary-200 bg-white p-8 shadow-elevated lg:p-12">
      <div className="grid gap-10 lg:grid-cols-2">
        {/* Left: controls */}
        <div>
          <h3 className="text-2xl font-extrabold text-night-800">Calcula tu inversión</h3>
          <p className="mt-2 text-warm-500">Ajusta según el número de catálogos que gestionas.</p>

          {/* Catalog slider */}
          <div className="mt-8">
            <div className="mb-2 flex items-baseline justify-between">
              <label className="text-sm font-semibold text-night-700">Catálogos</label>
              <span className="font-display text-3xl font-extrabold text-primary-500">
                {catalogCount}
              </span>
            </div>
            <Slider
              min={0}
              max={CATALOG_MARKS.length - 1}
              step={1}
              value={[clampedIndex]}
              onValueChange={([i]) => setCatalogCount(CATALOG_MARKS[i])}
              className="my-4"
            />
            <div className="flex justify-between">
              {CATALOG_MARKS.map((m) => (
                <span key={m} className="text-[10px] text-warm-400">
                  {m}
                </span>
              ))}
            </div>
          </div>

          {/* Interval toggle */}
          <div className="mt-8">
            <label className="mb-2 block text-sm font-semibold text-night-700">Facturación</label>
            <div className="flex rounded-xl bg-warm-100 p-1">
              {(['monthly', 'annual'] as const).map((int) => (
                <button
                  key={int}
                  onClick={() => setInterval(int)}
                  className={cn(
                    'flex-1 rounded-lg py-2 text-sm font-semibold transition-all',
                    interval === int
                      ? 'bg-white text-night-800 shadow-sm'
                      : 'text-warm-500 hover:text-night-700',
                  )}
                >
                  {int === 'monthly' ? 'Mensual' : 'Anual (−33%)'}
                </button>
              ))}
            </div>
          </div>

          {/* Currency */}
          <div className="mt-6">
            <label className="mb-2 block text-sm font-semibold text-night-700">Moneda</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
              className="w-full rounded-lg border border-warm-200 bg-white py-2 pl-3 pr-8 text-sm font-medium text-night-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: result */}
        <div className="flex flex-col justify-center rounded-2xl bg-night-800 p-8 text-white">
          <div className="mb-2 text-sm font-semibold uppercase tracking-wider text-night-100/50">
            Plan {activeTier.name}
          </div>
          <div className="font-display text-5xl font-extrabold">
            {formatPrice(price, currency)}
          </div>
          <div className="mt-1 text-night-100/60">
            / {interval === 'monthly' ? 'mes' : 'año'}
          </div>

          <div className="mt-4 rounded-xl bg-night-700 px-4 py-3">
            <span className="text-sm text-night-100/70">
              {formatPrice(pricePerCatalog, currency)} por catálogo / mes
            </span>
          </div>

          {interval === 'annual' && (
            <div className="mt-3 flex items-center gap-2 text-lime-400">
              <Check className="h-4 w-4" />
              <span className="text-sm font-semibold">
                Ahorras {formatPrice(calcAgencyPrice(catalogCount, activeTier, currency, 'monthly') * 12 - price, currency)} al año
              </span>
            </div>
          )}

          <ul className="mt-6 space-y-2">
            {[
              `${catalogCount} catálogos incluidos`,
              'Panel multi-cliente unificado',
              'Facturación consolidada',
              'White-label completo',
              'Sin comisiones sobre ventas',
              'Soporte prioritario',
            ].map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-night-100/80">
                <Check className="h-3.5 w-3.5 shrink-0 text-lime-400" />
                {f}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col gap-3">
            <Button asChild variant="lime" size="lg" className="w-full">
              <Link href="/signup">Empezar prueba gratis</Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="w-full border border-night-600 bg-transparent text-white hover:bg-night-700"
            >
              <Link href="#demo">Agendar demo</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Tier comparison */}
      <div className="mt-10 grid gap-4 border-t border-warm-100 pt-10 sm:grid-cols-3">
        {AGENCY_TIERS.map((tier) => (
          <div
            key={tier.name}
            className={cn(
              'rounded-xl border p-4 transition-all',
              activeTier.name === tier.name
                ? 'border-primary-400 bg-primary-50'
                : 'border-warm-200 hover:border-primary-200',
            )}
          >
            <div className="font-bold text-night-800">{tier.name}</div>
            <div className="mt-1 text-sm text-warm-500">
              Desde {tier.baseCatalogs} catálogos
            </div>
            <div className="mt-2 text-lg font-bold text-primary-500">
              {formatPrice(tier.basePrice[currency].monthly, currency)}/mes
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
