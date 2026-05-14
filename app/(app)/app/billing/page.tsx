export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle2, Zap, ExternalLink, TrendingUp, TrendingDown, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PlanBadge } from '@/components/app/plan-badge'
import { UsageBar } from '@/components/app/usage-bar'
import { getOrgUsage } from '@/lib/actions/billing'
import { getOrgTransactions } from '@/lib/actions/payments'
import { PLAN_LIMITS, PLAN_NAMES, type PlanCode } from '@/lib/billing/limits'
import { BillingPortalButton } from './billing-portal-button'
import { auth } from '@/auth'
import { db, memberships } from '@/db'
import { eq } from 'drizzle-orm'

export const metadata: Metadata = { title: 'Plan y facturación' }

const PLAN_ORDER: PlanCode[] = ['free', 'basic', 'pro', 'business']

const PLAN_HIGHLIGHTS: Record<PlanCode, string[]> = {
  free: ['1 catálogo', '30 productos', '30 pedidos/mes', 'Dominio domicilios.app/*'],
  basic: ['1 catálogo', '100 productos', '300 pedidos/mes', 'Sin marca Domicilios'],
  pro: ['3 catálogos', '500 productos', 'Pedidos ilimitados', 'Dominio propio', 'Analítica avanzada', 'IA incluida'],
  business: ['10 catálogos', 'Productos ilimitados', 'Todo lo de Pro', '20 colaboradores', 'Soporte dedicado'],
}

export default async function BillingPage() {
  const usage = await getOrgUsage()
  const session = await auth()

  let transactions: any[] = []
  if (session?.user?.id) {
    const membership = await db.query.memberships.findFirst({
      where: eq(memberships.userId, session.user.id as string),
    })
    if (membership) {
      const result = await getOrgTransactions(membership.organizationId, 10)
      transactions = result.transactions || []
    }
  }

  const planCode = usage?.planCode ?? 'free'
  const limits = PLAN_LIMITS[planCode]

  const isFreePlan = planCode === 'free'
  const nextPlan: PlanCode = planCode === 'free' ? 'basic' : planCode === 'basic' ? 'pro' : 'business'

  return (
    <div className="px-6 py-8 max-w-3xl">
      <h1 className="text-2xl font-extrabold text-night-800">Plan y facturación</h1>
      <p className="mt-1 mb-8 text-sm text-warm-500">Gestiona tu suscripción y monitorea el uso de tu cuenta.</p>

      {/* Current plan */}
      <div className="mb-6 rounded-2xl border border-warm-200 bg-white p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="font-extrabold text-night-800 text-lg">Plan actual</h2>
                <PlanBadge plan={planCode} />
              </div>
              <p className="text-sm text-warm-500">
                {isFreePlan
                  ? 'Estás en el plan gratuito. Actualiza para desbloquear más funciones.'
                  : `Suscripción activa al plan ${PLAN_NAMES[planCode]}.`}
              </p>
            </div>
          </div>
          {planCode !== 'business' && (
            <Button asChild size="sm">
              <Link href="/plans">
                <Zap className="h-3.5 w-3.5" /> Mejorar plan
              </Link>
            </Button>
          )}
        </div>

        {/* Usage bars */}
        {usage && (
          <div className="space-y-4">
            <UsageBar
              label="Catálogos"
              used={usage.catalogs.used}
              limit={usage.catalogs.limit}
            />
            <UsageBar
              label="Productos (todos los catálogos)"
              used={usage.products.used}
              limit={usage.products.limit}
            />
            <UsageBar
              label="Pedidos este mes"
              used={usage.ordersThisMonth.used}
              limit={usage.ordersThisMonth.limit}
            />
          </div>
        )}

        {!usage && (
          <p className="text-sm text-warm-400 rounded-xl bg-warm-50 px-4 py-3">
            Conecta la base de datos para ver el uso detallado.
          </p>
        )}
      </div>

      {/* Plan comparison */}
      <h2 className="mb-4 font-bold text-night-800">Comparar planes</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {PLAN_ORDER.map((plan) => {
          const isCurrent = plan === planCode
          const highlights = PLAN_HIGHLIGHTS[plan]
          return (
            <div
              key={plan}
              className={`rounded-2xl border-2 p-4 transition-all ${
                isCurrent
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-warm-200 bg-white hover:border-warm-300'
              }`}
            >
              <div className="mb-3 flex items-center justify-between">
                <PlanBadge plan={plan} />
                {isCurrent && <span className="text-[10px] font-bold text-primary-600">ACTUAL</span>}
              </div>
              <ul className="space-y-1.5">
                {highlights.map((h) => (
                  <li key={h} className="flex items-start gap-1.5 text-xs text-night-700">
                    <CheckCircle2 className={`mt-0.5 h-3 w-3 flex-shrink-0 ${isCurrent ? 'text-primary-500' : 'text-warm-400'}`} />
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>

      {planCode !== 'business' && (
        <div className="mt-6 rounded-2xl bg-gradient-to-br from-night-800 to-night-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-night-300 mb-1">
                Próximo nivel
              </p>
              <h3 className="text-lg font-extrabold">Plan {PLAN_NAMES[nextPlan]}</h3>
              <p className="mt-1 text-sm text-night-300">
                {nextPlan === 'basic' && 'Más productos, sin límite de marca.'}
                {nextPlan === 'pro' && 'Escala sin límites. Dominio propio + IA incluida.'}
                {nextPlan === 'business' && 'Para equipos grandes. Todo ilimitado.'}
              </p>
            </div>
            <Button asChild variant="lime" size="sm">
              <Link href="/plans">
                Ver precios <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Billing management */}
      <div className="mt-8">
        <h2 className="mb-4 font-bold text-night-800">Gestión de facturación</h2>
        <div className="rounded-2xl border border-warm-200 bg-white px-6 py-6">
          {isFreePlan ? (
            <p className="text-sm text-warm-500">Sin suscripción activa. Estás en el plan gratuito.</p>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-night-800">Portal de facturación Stripe</p>
                <p className="text-sm text-warm-500">Gestiona tu suscripción, métodos de pago e historial de facturas.</p>
              </div>
              <BillingPortalButton />
            </div>
          )}
        </div>
      </div>

      {/* Transaction history */}
      {transactions.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 font-bold text-night-800">Historial de transacciones</h2>
          <div className="rounded-2xl border border-warm-200 bg-white overflow-hidden">
            <div className="divide-y divide-warm-100">
              {transactions.map((txn: any) => (
                <div key={txn.id} className="flex items-center justify-between px-6 py-4 hover:bg-warm-50">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${txn.status === 'paid' ? 'bg-lime-50' : txn.status === 'pending' ? 'bg-warm-100' : 'bg-red-50'}`}>
                      {txn.status === 'paid' ? (
                        <TrendingUp className="h-4 w-4 text-lime-600" />
                      ) : txn.status === 'failed' ? (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      ) : (
                        <Clock className="h-4 w-4 text-warm-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-night-800 text-sm">{txn.description || txn.type}</p>
                      <p className="text-xs text-warm-500">
                        {new Date(txn.createdAt).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold text-sm ${txn.status === 'paid' ? 'text-lime-600' : txn.status === 'failed' ? 'text-red-600' : 'text-warm-600'}`}>
                      ${(txn.amount / 100).toFixed(2)} {txn.currency}
                    </p>
                    <p className="text-xs text-warm-500 capitalize">{txn.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
