'use client'

import { useState, useTransition } from 'react'
import { ExternalLink, Save, Loader2, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BlockPalette } from './block-palette'
import { Canvas } from './canvas'
import { PropertiesPanel } from './properties-panel'
import { createBlock, type BlockConfig, type BlockType } from '@/lib/design/blocks'
import { saveDesign } from '@/lib/actions/design'
import { toast } from 'sonner'

interface Props {
  catalogId: string
  catalogSlug: string
  initialBlocks: BlockConfig[]
}

export function DesignEditor({ catalogId, catalogSlug, initialBlocks }: Props) {
  const [blocks, setBlocks] = useState<BlockConfig[]>(initialBlocks)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  const selectedBlock = blocks.find((b) => b.id === selectedId) ?? null

  function addBlock(type: BlockType) {
    const block = createBlock(type)
    setBlocks((prev) => [...prev, block])
    setSelectedId(block.id)
    setDirty(true)
    setSaved(false)
  }

  function updateBlock(updated: BlockConfig) {
    setBlocks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)))
    setDirty(true)
    setSaved(false)
  }

  function reorderBlocks(next: BlockConfig[]) {
    setBlocks(next)
    setDirty(true)
    setSaved(false)
  }

  function toggleActive(id: string) {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, active: !b.active } : b)),
    )
    setDirty(true)
    setSaved(false)
  }

  function deleteBlock(id: string) {
    setBlocks((prev) => prev.filter((b) => b.id !== id))
    if (selectedId === id) setSelectedId(null)
    setDirty(true)
    setSaved(false)
  }

  function handleSave() {
    startTransition(async () => {
      const result = await saveDesign(catalogId, blocks)
      if (result.error) {
        toast.error(result.error)
      } else {
        setDirty(false)
        setSaved(true)
        toast.success('Diseño guardado')
        setTimeout(() => setSaved(false), 3000)
      }
    })
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-warm-200 bg-white px-5 py-3">
        <div>
          <h1 className="text-base font-extrabold text-night-800">Editor de diseño</h1>
          <p className="text-xs text-warm-400">
            {blocks.length} bloque{blocks.length !== 1 ? 's' : ''}
            {dirty && <span className="ml-2 text-amber-500">· Sin guardar</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/s/${catalogSlug}`}
            target="_blank"
            className="flex items-center gap-1.5 rounded-xl border border-warm-200 bg-white px-3 py-1.5 text-sm font-medium text-night-700 hover:bg-warm-50 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Ver storefront
          </Link>
          <Button onClick={handleSave} disabled={isPending || !dirty}>
            {isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</>
            ) : saved ? (
              <><CheckCircle2 className="h-4 w-4" /> Guardado</>
            ) : (
              <><Save className="h-4 w-4" /> Guardar</>
            )}
          </Button>
        </div>
      </div>

      {/* Editor body */}
      <div className="flex flex-1 overflow-hidden">
        <BlockPalette onAdd={addBlock} />

        <Canvas
          blocks={blocks}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onReorder={reorderBlocks}
          onToggleActive={toggleActive}
          onDelete={deleteBlock}
        />

        {selectedBlock && (
          <PropertiesPanel
            block={selectedBlock}
            onChange={updateBlock}
            onClose={() => setSelectedId(null)}
          />
        )}
      </div>
    </div>
  )
}
