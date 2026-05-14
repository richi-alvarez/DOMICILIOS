'use client'

import { Plus } from 'lucide-react'
import { BLOCK_META, type BlockType } from '@/lib/design/blocks'

const BLOCK_ORDER: BlockType[] = [
  'announcement',
  'hero',
  'categories',
  'featured',
  'banner',
  'cta',
  'social',
]

interface Props {
  onAdd: (type: BlockType) => void
}

export function BlockPalette({ onAdd }: Props) {
  return (
    <aside className="flex w-60 flex-shrink-0 flex-col border-r border-warm-200 bg-white">
      <div className="border-b border-warm-200 px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-wider text-warm-400">Bloques</p>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {BLOCK_ORDER.map((type) => {
          const meta = BLOCK_META[type]
          return (
            <button
              key={type}
              onClick={() => onAdd(type)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-warm-50 active:bg-warm-100 group"
            >
              <span className="text-xl">{meta.emoji}</span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-night-800">{meta.label}</p>
                <p className="truncate text-xs text-warm-400">{meta.description}</p>
              </div>
              <Plus className="ml-auto h-4 w-4 flex-shrink-0 text-warm-300 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )
        })}
      </div>
    </aside>
  )
}
