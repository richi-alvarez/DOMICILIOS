'use client'

import { useRouter } from 'next/navigation'
import { Zap, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { type PlanCode, PLAN_NAMES, formatLimit } from '@/lib/billing/constants-only'

interface Props {
  open: boolean
  onClose: () => void
  feature: string
  currentPlan: PlanCode
  currentLimit: number
  nextPlan?: PlanCode
}

export function UpgradeModal({ open, onClose, feature, currentPlan, currentLimit, nextPlan = 'pro' }: Props) {
  const router = useRouter()

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-night-800/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-elevated p-6">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-warm-400 hover:bg-warm-100 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100">
          <Zap className="h-6 w-6 text-primary-500" />
        </div>

        <h2 className="text-xl font-extrabold text-night-800">Límite alcanzado</h2>
        <p className="mt-2 text-sm text-warm-600">
          Tu plan <strong>{PLAN_NAMES[currentPlan]}</strong> permite{' '}
          <strong>{formatLimit(currentLimit)} {feature}</strong>.
          Actualiza tu plan para continuar creciendo.
        </p>

        <div className="mt-5 rounded-xl border border-primary-200 bg-primary-50 px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-wider text-primary-600 mb-1">
            Plan {PLAN_NAMES[nextPlan]}
          </p>
          <ul className="space-y-1 text-sm text-night-700">
            {nextPlan === 'pro' && (
              <>
                <li className="flex items-center gap-2"><span className="text-lime-600">✓</span> 3 catálogos</li>
                <li className="flex items-center gap-2"><span className="text-lime-600">✓</span> 500 productos</li>
                <li className="flex items-center gap-2"><span className="text-lime-600">✓</span> Pedidos ilimitados</li>
                <li className="flex items-center gap-2"><span className="text-lime-600">✓</span> Dominio personalizado</li>
              </>
            )}
            {nextPlan === 'basic' && (
              <>
                <li className="flex items-center gap-2"><span className="text-lime-600">✓</span> 100 productos</li>
                <li className="flex items-center gap-2"><span className="text-lime-600">✓</span> 300 pedidos/mes</li>
                <li className="flex items-center gap-2"><span className="text-lime-600">✓</span> Sin marca Domicilios</li>
              </>
            )}
          </ul>
        </div>

        <div className="mt-5 flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
          >
            Ahora no
          </Button>
          <Button
            className="flex-1"
            onClick={() => { onClose(); router.push('/plans') }}
          >
            <Zap className="h-4 w-4" /> Ver planes
          </Button>
        </div>
      </div>
    </div>
  )
}
