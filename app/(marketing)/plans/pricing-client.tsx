'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Check, X, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { cn } from '@/lib/utils'
import {
  PLANS,
  CURRENCIES,
  FEATURE_GROUPS,
  formatPrice,
  type Currency,
  type FeatureValue,
} from '@/lib/pricing'

const FAQ = [
  {
    q: '¿Puedo cambiar de plan en cualquier momento?',
    a: 'Sí. Puedes hacer upgrade o downgrade cuando quieras. El cambio aplica al inicio del siguiente período de facturación.',
  },
  {
    q: '¿Hay comisiones sobre mis ventas?',
    a: 'No cobramos ninguna comisión sobre tus ventas. Pagas solo tu suscripción y las tasas de tu pasarela de pago (Stripe, MercadoPago, etc.).',
  },
  {
    q: '¿Qué pasa si supero el límite de pedidos en el plan Gratis?',
    a: 'Tu catálogo seguirá activo, pero los nuevos pedidos quedarán en cola. Te notificamos para que puedas hacer upgrade sin perder pedidos.',
  },
  {
    q: '¿Puedo probar el plan Pro antes de pagar?',
    a: 'Todos los planes de pago incluyen 14 días de prueba gratuita sin tarjeta de crédito.',
  },
  {
    q: '¿Cómo funciona el pago anual?',
    a: 'El pago anual se cobra en un solo cobro al inicio del año. Ahorras hasta un 33% respecto al precio mensual.',
  },
  {
    q: '¿Puedo cancelar en cualquier momento?',
    a: 'Sí. Si cancelas, tu plan sigue activo hasta el final del período pagado. No hay penalizaciones.',
  },
]

function FeatureCellValue({ value }: { value: FeatureValue }) {
  if (value === true) return <Check className="mx-auto h-4 w-4 text-lime-500" />
  if (value === false) return <X className="mx-auto h-4 w-4 text-warm-300" />
  if (value === 'Agency') return <span className="text-xs font-medium text-primary-500">Agency</span>
  return <span className="text-xs font-medium text-night-700">{value}</span>
}

export function PricingClient() {
  const [interval, setInterval] = useState<'monthly' | 'annual'>('monthly')
  const [currency, setCurrency] = useState<Currency>('COP')
  const [showComparison, setShowComparison] = useState(false)

  return (
    <div>
      {/* Controls */}
      <div className="mb-10 flex flex-col items-center gap-4">
        {/* Billing toggle */}
        <div className="flex items-center gap-1 rounded-xl bg-warm-100 p-1">
          <button
            onClick={() => setInterval('monthly')}
            className={cn(
              'rounded-lg px-5 py-2 text-sm font-semibold transition-all',
              interval === 'monthly'
                ? 'bg-white text-night-800 shadow-sm'
                : 'text-warm-500 hover:text-night-700',
            )}
          >
            Mensual
          </button>
          <button
            onClick={() => setInterval('annual')}
            className={cn(
              'flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold transition-all',
              interval === 'annual'
                ? 'bg-white text-night-800 shadow-sm'
                : 'text-warm-500 hover:text-night-700',
            )}
          >
            Anual
            <span className="rounded-full bg-lime-400 px-2 py-0.5 text-[10px] font-bold text-night-800">
              3 meses gratis
            </span>
          </button>
        </div>

        {/* Currency picker */}
        <div className="relative">
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as Currency)}
            className="rounded-lg border border-warm-200 bg-white py-2 pl-3 pr-8 text-sm font-medium text-night-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((plan) => {
          const price = plan.prices[currency][interval]
          const monthlyPrice = plan.prices[currency]['monthly']
          const saving = interval === 'annual' && monthlyPrice > 0
            ? Math.round(((monthlyPrice - price) / monthlyPrice) * 100)
            : 0

          return (
            <div
              key={plan.code}
              className={cn(
                'relative flex flex-col rounded-2xl border p-6 transition-shadow',
                plan.highlight
                  ? 'border-primary-500 bg-night-800 shadow-modal'
                  : 'border-warm-200 bg-white shadow-card hover:shadow-elevated',
              )}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant="default" className="shadow-sm">
                    {plan.badge}
                  </Badge>
                </div>
              )}

              <div className="mb-6">
                <h3
                  className={cn(
                    'text-lg font-bold',
                    plan.highlight ? 'text-white' : 'text-night-800',
                  )}
                >
                  {plan.name}
                </h3>
                <p
                  className={cn(
                    'mt-1 text-sm',
                    plan.highlight ? 'text-night-100/60' : 'text-warm-500',
                  )}
                >
                  {plan.tagline}
                </p>

                <div className="mt-4 flex items-end gap-1">
                  <span
                    className={cn(
                      'font-display text-4xl font-extrabold',
                      plan.highlight ? 'text-white' : 'text-night-800',
                    )}
                  >
                    {price === 0 ? 'Gratis' : formatPrice(price, currency)}
                  </span>
                  {price > 0 && (
                    <span
                      className={cn(
                        'mb-1 text-sm',
                        plan.highlight ? 'text-night-100/50' : 'text-warm-400',
                      )}
                    >
                      /mes
                    </span>
                  )}
                </div>
                {interval === 'annual' && price > 0 && (
                  <p
                    className={cn(
                      'mt-1 text-xs',
                      plan.highlight ? 'text-lime-400' : 'text-lime-600',
                    )}
                  >
                    Ahorras {saving}% · facturado anualmente
                  </p>
                )}
              </div>

              <ul className="mb-8 flex-1 space-y-2.5">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className={cn(
                      'flex items-start gap-2 text-sm',
                      plan.highlight ? 'text-night-100/80' : 'text-night-700',
                    )}
                  >
                    <Check
                      className={cn(
                        'mt-0.5 h-4 w-4 shrink-0',
                        plan.highlight ? 'text-lime-400' : 'text-lime-500',
                      )}
                    />
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                asChild
                variant={plan.highlight ? 'lime' : plan.code === 'free' ? 'outline' : 'default'}
                className="w-full"
              >
                <Link href="/signup">
                  {plan.code === 'free' ? 'Empezar gratis' : 'Probar 14 días gratis'}
                </Link>
              </Button>
            </div>
          )
        })}
      </div>

      {/* Agency CTA */}
      <div className="mt-8 rounded-2xl border border-primary-200 bg-primary-50 p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-primary-500">
              Para agencias y multi-marca
            </p>
            <h3 className="mt-1 text-xl font-bold text-night-800">
              ¿Gestionas catálogos de varios clientes?
            </h3>
            <p className="mt-1 text-sm text-warm-500">
              Planes especiales desde 5 hasta 300 catálogos. Un solo panel, facturación consolidada.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <Button asChild variant="default">
              <Link href="/agencies">Ver planes de agencia</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/agencies#demo">Agendar demo</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Feature comparison */}
      <div className="mt-16">
        <button
          onClick={() => setShowComparison(!showComparison)}
          className="mx-auto flex items-center gap-2 rounded-xl border border-warm-200 bg-white px-6 py-3 text-sm font-semibold text-night-800 shadow-sm transition hover:border-primary-300 hover:text-primary-500"
        >
          {showComparison ? (
            <>
              <ChevronUp className="h-4 w-4" /> Ocultar comparativa de planes
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" /> Ver comparativa completa de planes
            </>
          )}
        </button>

        {showComparison && (
          <div className="mt-8 overflow-x-auto rounded-2xl border border-warm-200 bg-white shadow-card">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-warm-200 bg-warm-50">
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-warm-400">
                    Funcionalidad
                  </th>
                  {PLANS.map((p) => (
                    <th
                      key={p.code}
                      className={cn(
                        'px-4 py-4 text-center text-sm font-bold',
                        p.highlight ? 'text-primary-500' : 'text-night-800',
                      )}
                    >
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FEATURE_GROUPS.map((group) => (
                  <React.Fragment key={group.group}>
                    <tr className="bg-warm-50">
                      <td
                        colSpan={5}
                        className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-warm-500"
                      >
                        {group.group}
                      </td>
                    </tr>
                    {group.rows.map((row) => (
                      <tr
                        key={row.label}
                        className="border-t border-warm-100 transition-colors hover:bg-warm-50"
                      >
                        <td className="px-6 py-3 text-night-700">{row.label}</td>
                        <td className="px-4 py-3 text-center">
                          <FeatureCellValue value={row.free} />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <FeatureCellValue value={row.basic} />
                        </td>
                        <td className="bg-primary-50/30 px-4 py-3 text-center">
                          <FeatureCellValue value={row.pro} />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <FeatureCellValue value={row.business} />
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* FAQ */}
      <div className="mx-auto mt-20 max-w-3xl">
        <h2 className="mb-8 text-center text-3xl font-extrabold text-night-800">
          Preguntas frecuentes
        </h2>
        <Accordion type="single" collapsible className="divide-y divide-warm-200">
          {FAQ.map((item, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border-0">
              <AccordionTrigger className="text-base">{item.q}</AccordionTrigger>
              <AccordionContent className="text-base leading-relaxed">{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  )
}
