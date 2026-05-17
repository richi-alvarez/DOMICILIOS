'use client'

import { TrendingUp, TrendingDown } from 'lucide-react'

interface MetricCardProps {
  label: string
  value: string | number
  unit?: string
  trend?: 'up' | 'down' | 'stable'
  trendValue?: string
  description?: string
  variant?: 'default' | 'success' | 'warning' | 'error'
}

export function MetricCard({
  label,
  value,
  unit,
  trend,
  trendValue,
  description,
  variant = 'default',
}: MetricCardProps) {
  const variantClasses = {
    default: 'bg-white border-warm-200',
    success: 'bg-lime-50 border-lime-200',
    warning: 'bg-amber-50 border-amber-200',
    error: 'bg-red-50 border-red-200',
  }

  const trendClasses = {
    up: 'text-lime-600',
    down: 'text-red-600',
    stable: 'text-warm-500',
  }

  return (
    <div className={`border rounded-lg p-4 ${variantClasses[variant]}`}>
      <p className="text-sm text-warm-600 font-medium">{label}</p>

      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-3xl font-bold text-night-800">{value}</span>
        {unit && <span className="text-sm text-warm-500">{unit}</span>}
      </div>

      {description && (
        <p className="mt-1 text-xs text-warm-500">{description}</p>
      )}

      {trend && trendValue && (
        <div className={`mt-3 flex items-center gap-1 text-sm ${trendClasses[trend]}`}>
          {trend === 'up' && <TrendingUp className="h-4 w-4" />}
          {trend === 'down' && <TrendingDown className="h-4 w-4" />}
          <span>{trendValue}</span>
        </div>
      )}
    </div>
  )
}
