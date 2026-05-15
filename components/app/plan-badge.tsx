import { cn } from '@/lib/utils'
import { PLAN_COLORS, PLAN_NAMES, type PlanCode } from '@/lib/billing/constants-only'

interface Props {
  plan: PlanCode
  className?: string
}

export function PlanBadge({ plan, className }: Props) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold',
      PLAN_COLORS[plan],
      className,
    )}>
      {PLAN_NAMES[plan]}
    </span>
  )
}
