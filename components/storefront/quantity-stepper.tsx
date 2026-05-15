'use client'

import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  qty: number
  onIncrement: () => void
  onDecrement: () => void
  min?: number
  max?: number
  size?: 'sm' | 'md'
}

export function QuantityStepper({ qty, onIncrement, onDecrement, min = 0, max, size = 'md' }: Props) {
  const btnClass = cn(
    'flex items-center justify-center rounded-full bg-warm-100 text-night-800 transition hover:bg-warm-200 active:scale-95',
    size === 'sm' ? 'h-6 w-6' : 'h-8 w-8',
  )
  const numClass = cn(
    'min-w-[1.5rem] text-center font-semibold tabular-nums',
    size === 'sm' ? 'text-sm' : 'text-base',
  )

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onDecrement}
        disabled={qty <= min}
        className={cn(btnClass, 'disabled:opacity-40')}
        aria-label="Disminuir cantidad"
      >
        <Minus className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
      </button>
      <span className={numClass}>{qty}</span>
      <button
        type="button"
        onClick={onIncrement}
        disabled={max !== undefined && qty >= max}
        className={cn(btnClass, 'disabled:opacity-40')}
        aria-label="Aumentar cantidad"
      >
        <Plus className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
      </button>
    </div>
  )
}
