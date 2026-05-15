import { cn } from '@/lib/utils'
import { usagePercent, formatLimit } from '@/lib/billing/constants-only'

interface Props {
  label: string
  used: number
  limit: number
  className?: string
}

export function UsageBar({ label, used, limit, className }: Props) {
  const pct = usagePercent(used, limit)
  const isUnlimited = limit === -1
  const isWarning = pct >= 80
  const isAtLimit = pct >= 100

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-night-700">{label}</span>
        <span className={cn(
          'text-xs font-semibold',
          isAtLimit ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-warm-500',
        )}>
          {isUnlimited ? `${used} / ∞` : `${used} / ${formatLimit(limit)}`}
        </span>
      </div>
      {!isUnlimited && (
        <div className="h-2 w-full overflow-hidden rounded-full bg-warm-100">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300',
              isAtLimit ? 'bg-red-500' : isWarning ? 'bg-amber-400' : 'bg-primary-500',
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  )
}
