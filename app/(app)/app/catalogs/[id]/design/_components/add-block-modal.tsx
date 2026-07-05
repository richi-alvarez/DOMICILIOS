'use client'

import { X } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'

// Categorías de bloques: tipo/icono/plan son datos; label y descripción salen de i18n.
const BLOCK_CATEGORIES = [
  {
    catKey: 'catPresentation',
    blocks: [
      { type: 'presentation', k: 'presentation', icon: '🎯', plan: 'BASIC' },
      { type: 'carousel', k: 'carousel', icon: '🎠', plan: 'BASIC' },
      { type: 'benefits', k: 'benefits', icon: '⭐', plan: 'BASIC' },
      { type: 'socialproof', k: 'socialproof', icon: '💬', plan: 'BASIC' },
    ],
  },
  {
    catKey: 'catContent',
    blocks: [
      { type: 'text', k: 'text', icon: '📝', plan: 'BASIC' },
      { type: 'cta-reinforcement', k: 'cta', icon: '🎬', plan: 'BASIC' },
    ],
  },
  {
    catKey: 'catEcommerce',
    blocks: [
      { type: 'catalog', k: 'catalog', icon: '📦', plan: 'BASIC' },
      { type: 'cart', k: 'cart', icon: '🛒', plan: 'BASIC' },
    ],
  },
  {
    catKey: 'catInstitutional',
    blocks: [{ type: 'footer', k: 'footer', icon: '🏛️', plan: 'BASIC' }],
  },
] as const

interface AddBlockModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddBlock: (type: 'presentation' | 'catalog' | 'cart' | 'text' | 'carousel' | 'benefits' | 'socialproof' | 'cta-reinforcement' | 'footer') => void
}

export default function AddBlockModal({ open, onOpenChange, onAddBlock }: AddBlockModalProps) {
  const { t } = useI18n()
  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t('design.addBlock.title')}</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {BLOCK_CATEGORIES.map(({ catKey, blocks }) => (
            <div key={catKey}>
              <h3 className="font-semibold text-sm mb-3 text-gray-700">{t(`design.addBlock.${catKey}`)}</h3>
              <div className="space-y-2">
                {blocks.map((block) => (
                  <button
                    key={block.type}
                    onClick={() => {
                      onAddBlock(block.type as any)
                      onOpenChange(false)
                    }}
                    className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{block.icon}</span>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{t(`design.addBlock.${block.k}Label`)}</p>
                        <p className="text-xs text-gray-600 mt-1">{t(`design.addBlock.${block.k}Desc`)}</p>
                        <div className="mt-2">
                          <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                            {block.plan}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
