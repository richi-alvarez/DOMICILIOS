'use client'

import { useState } from 'react'
import { GripVertical, Eye, EyeOff, Trash2, Layers } from 'lucide-react'
import { BLOCK_META, type BlockConfig } from '@/lib/design/blocks'
import { cn } from '@/lib/utils'

interface Props {
  blocks: BlockConfig[]
  selectedId: string | null
  onSelect: (id: string) => void
  onReorder: (blocks: BlockConfig[]) => void
  onToggleActive: (id: string) => void
  onDelete: (id: string) => void
}

function BlockPreviewContent({ block }: { block: BlockConfig }) {
  if (block.type === 'announcement') {
    return (
      <div
        className="rounded-lg px-3 py-2 text-center text-xs font-medium truncate"
        style={{ background: block.config.bgColor, color: block.config.textColor }}
      >
        {block.config.text || 'Texto del anuncio'}
      </div>
    )
  }
  if (block.type === 'hero') {
    return (
      <div
        className="rounded-lg px-4 py-3"
        style={{ background: block.config.bgColor, color: block.config.textColor }}
      >
        <p className="font-bold text-sm truncate">{block.config.title || 'Título del hero'}</p>
        <p className="text-xs opacity-70 truncate mt-0.5">{block.config.subtitle || 'Subtítulo'}</p>
      </div>
    )
  }
  if (block.type === 'categories') {
    return (
      <div className="rounded-lg bg-warm-50 px-3 py-2">
        <p className="text-xs font-semibold text-night-700">{block.config.title || 'Categorías'}</p>
        <div className="mt-1.5 flex gap-1.5 flex-wrap">
          {['Cat 1', 'Cat 2', 'Cat 3'].map((c) => (
            <span key={c} className="rounded-full bg-white border border-warm-200 px-2 py-0.5 text-xs text-night-600">{c}</span>
          ))}
        </div>
      </div>
    )
  }
  if (block.type === 'featured') {
    return (
      <div className="rounded-lg bg-warm-50 px-3 py-2">
        <p className="text-xs font-semibold text-night-700">{block.config.title || 'Destacados'}</p>
        <div className="mt-1.5 grid grid-cols-4 gap-1">
          {Array.from({ length: Math.min(block.config.maxProducts, 4) }).map((_, i) => (
            <div key={i} className="h-8 rounded bg-warm-200" />
          ))}
        </div>
      </div>
    )
  }
  if (block.type === 'banner') {
    return (
      <div className="rounded-lg overflow-hidden bg-night-800 px-4 py-3 relative">
        {block.config.imageUrl && (
          <div className="absolute inset-0 opacity-30 bg-center bg-cover" style={{ backgroundImage: `url(${block.config.imageUrl})` }} />
        )}
        <p className="relative font-bold text-sm text-white truncate">{block.config.title || 'Título banner'}</p>
        <p className="relative text-xs text-night-300 truncate">{block.config.subtitle || 'Subtítulo'}</p>
      </div>
    )
  }
  if (block.type === 'cta') {
    return (
      <div className="rounded-lg px-4 py-2.5 text-center" style={{ background: block.config.bgColor }}>
        <p className="font-bold text-sm text-night-800 truncate">{block.config.title || 'CTA'}</p>
        <span className="mt-1 inline-block rounded-full bg-night-800 px-3 py-0.5 text-xs text-white">{block.config.btnText || 'Acción'}</span>
      </div>
    )
  }
  if (block.type === 'social') {
    const networkEmoji: Record<string, string> = {
      instagram: '📸', facebook: '👥', tiktok: '🎵', twitter: '🐦', youtube: '▶️', whatsapp: '💬',
    }
    return (
      <div className="rounded-lg bg-warm-50 px-3 py-2">
        <div className="flex gap-2 flex-wrap">
          {block.config.items.slice(0, 4).map((item, i) => (
            <span key={i} className="text-base">{networkEmoji[item.network] ?? '🌐'}</span>
          ))}
          {block.config.items.length === 0 && <span className="text-xs text-warm-400">Sin redes</span>}
        </div>
      </div>
    )
  }
  return null
}

export function Canvas({ blocks, selectedId, onSelect, onReorder, onToggleActive, onDelete }: Props) {
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)

  function handleDragStart(e: React.DragEvent, index: number) {
    setDragIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDropIndex(index)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    if (dragIndex === null || dropIndex === null || dragIndex === dropIndex) {
      setDragIndex(null)
      setDropIndex(null)
      return
    }
    const next = [...blocks]
    const [removed] = next.splice(dragIndex, 1)
    next.splice(dropIndex, 0, removed)
    onReorder(next)
    setDragIndex(null)
    setDropIndex(null)
  }

  function handleDragEnd() {
    setDragIndex(null)
    setDropIndex(null)
  }

  if (blocks.length === 0) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-3 bg-warm-50 px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white border-2 border-dashed border-warm-300">
          <Layers className="h-7 w-7 text-warm-300" />
        </div>
        <p className="font-bold text-night-800">Sin bloques aún</p>
        <p className="text-sm text-warm-500 max-w-xs">
          Haz clic en un bloque del panel izquierdo para agregarlo al diseño.
        </p>
      </main>
    )
  }

  return (
    <main className="flex-1 overflow-y-auto bg-warm-50 p-6">
      <div className="mx-auto max-w-lg space-y-2">
        {blocks.map((block, index) => {
          const meta = BLOCK_META[block.type]
          const isSelected = selectedId === block.id
          const isDragging = dragIndex === index
          const isDropTarget = dropIndex === index && dragIndex !== null && dragIndex !== index

          return (
            <div
              key={block.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              onClick={() => onSelect(block.id)}
              className={cn(
                'group relative cursor-pointer rounded-2xl border-2 bg-white p-3 transition-all',
                isSelected
                  ? 'border-primary-500 shadow-lg shadow-primary-100'
                  : 'border-warm-200 hover:border-warm-300 hover:shadow-sm',
                isDragging && 'opacity-40',
                isDropTarget && 'border-primary-400 border-dashed',
                !block.active && 'opacity-60',
              )}
            >
              <div className="flex items-center gap-3">
                {/* Drag handle */}
                <div className="cursor-grab text-warm-300 active:cursor-grabbing">
                  <GripVertical className="h-4 w-4" />
                </div>

                {/* Block preview */}
                <div className="flex-1 min-w-0">
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <span className="text-sm">{meta.emoji}</span>
                    <span className="text-xs font-bold text-night-600">{meta.label}</span>
                    {!block.active && (
                      <span className="rounded-full bg-warm-100 px-1.5 py-0.5 text-xs text-warm-500">oculto</span>
                    )}
                  </div>
                  <BlockPreviewContent block={block} />
                </div>

                {/* Actions */}
                <div className="flex flex-shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleActive(block.id) }}
                    className="rounded-lg p-1.5 text-warm-400 hover:bg-warm-50 hover:text-night-800 transition-colors"
                    title={block.active ? 'Ocultar' : 'Mostrar'}
                  >
                    {block.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(block.id) }}
                    className="rounded-lg p-1.5 text-warm-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </main>
  )
}
