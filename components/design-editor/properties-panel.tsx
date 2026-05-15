'use client'

import { X, Plus, Trash2 } from 'lucide-react'
import { BLOCK_META, type BlockConfig, type SocialNetwork } from '@/lib/design/blocks'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

const SOCIAL_NETWORKS: { value: SocialNetwork; label: string }[] = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'twitter', label: 'Twitter / X' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'whatsapp', label: 'WhatsApp' },
]

interface Props {
  block: BlockConfig
  onChange: (updated: BlockConfig) => void
  onClose: () => void
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-warm-500 uppercase tracking-wider">{label}</Label>
      {children}
    </div>
  )
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 cursor-pointer rounded-lg border border-warm-200 bg-white p-0.5"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="font-mono text-sm"
          placeholder="#000000"
        />
      </div>
    </Field>
  )
}

export function PropertiesPanel({ block, onChange, onClose }: Props) {
  const meta = BLOCK_META[block.type]

  function patch(partialConfig: Partial<typeof block.config>) {
    onChange({ ...block, config: { ...block.config, ...partialConfig } } as BlockConfig)
  }

  return (
    <aside className="flex w-72 flex-shrink-0 flex-col border-l border-warm-200 bg-white">
      <div className="flex items-center justify-between border-b border-warm-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{meta.emoji}</span>
          <p className="font-bold text-night-800">{meta.label}</p>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-warm-400 hover:bg-warm-50 hover:text-night-800 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {block.type === 'announcement' && (
          <>
            <Field label="Texto">
              <Textarea
                value={block.config.text}
                onChange={(e) => patch({ text: e.target.value })}
                rows={2}
              />
            </Field>
            <ColorField label="Color de fondo" value={block.config.bgColor} onChange={(v) => patch({ bgColor: v })} />
            <ColorField label="Color de texto" value={block.config.textColor} onChange={(v) => patch({ textColor: v })} />
            <Field label="Enlace (opcional)">
              <Input value={block.config.link ?? ''} onChange={(e) => patch({ link: e.target.value })} placeholder="https://..." />
            </Field>
          </>
        )}

        {block.type === 'hero' && (
          <>
            <Field label="Título">
              <Input value={block.config.title} onChange={(e) => patch({ title: e.target.value })} />
            </Field>
            <Field label="Subtítulo">
              <Textarea value={block.config.subtitle} onChange={(e) => patch({ subtitle: e.target.value })} rows={2} />
            </Field>
            <Field label="Texto del botón">
              <Input value={block.config.ctaText} onChange={(e) => patch({ ctaText: e.target.value })} />
            </Field>
            <Field label="Enlace del botón">
              <Input value={block.config.ctaLink} onChange={(e) => patch({ ctaLink: e.target.value })} placeholder="https://..." />
            </Field>
            <ColorField label="Color de fondo" value={block.config.bgColor} onChange={(v) => patch({ bgColor: v })} />
            <ColorField label="Color de texto" value={block.config.textColor} onChange={(v) => patch({ textColor: v })} />
          </>
        )}

        {block.type === 'categories' && (
          <>
            <Field label="Título de la sección">
              <Input value={block.config.title} onChange={(e) => patch({ title: e.target.value })} />
            </Field>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showAll"
                checked={block.config.showAll}
                onChange={(e) => patch({ showAll: e.target.checked })}
                className="h-4 w-4 rounded border-warm-300 text-primary-500"
              />
              <Label htmlFor="showAll" className="text-sm text-night-700">Mostrar opción &quot;Todos&quot;</Label>
            </div>
          </>
        )}

        {block.type === 'featured' && (
          <>
            <Field label="Título de la sección">
              <Input value={block.config.title} onChange={(e) => patch({ title: e.target.value })} />
            </Field>
            <Field label="Máximo de productos">
              <Input
                type="number"
                min={1}
                max={12}
                value={block.config.maxProducts}
                onChange={(e) => patch({ maxProducts: Math.max(1, Math.min(12, Number(e.target.value))) })}
              />
            </Field>
          </>
        )}

        {block.type === 'banner' && (
          <>
            <Field label="URL de imagen">
              <Input value={block.config.imageUrl} onChange={(e) => patch({ imageUrl: e.target.value })} placeholder="https://..." />
            </Field>
            <Field label="Título">
              <Input value={block.config.title} onChange={(e) => patch({ title: e.target.value })} />
            </Field>
            <Field label="Subtítulo">
              <Input value={block.config.subtitle} onChange={(e) => patch({ subtitle: e.target.value })} />
            </Field>
            <Field label="Texto del botón">
              <Input value={block.config.ctaText} onChange={(e) => patch({ ctaText: e.target.value })} />
            </Field>
            <Field label="Enlace del botón">
              <Input value={block.config.ctaLink} onChange={(e) => patch({ ctaLink: e.target.value })} placeholder="https://..." />
            </Field>
          </>
        )}

        {block.type === 'cta' && (
          <>
            <Field label="Título">
              <Input value={block.config.title} onChange={(e) => patch({ title: e.target.value })} />
            </Field>
            <Field label="Subtítulo">
              <Textarea value={block.config.subtitle} onChange={(e) => patch({ subtitle: e.target.value })} rows={2} />
            </Field>
            <Field label="Texto del botón">
              <Input value={block.config.btnText} onChange={(e) => patch({ btnText: e.target.value })} />
            </Field>
            <Field label="Enlace del botón">
              <Input value={block.config.btnLink} onChange={(e) => patch({ btnLink: e.target.value })} placeholder="https://..." />
            </Field>
            <ColorField label="Color de fondo" value={block.config.bgColor} onChange={(v) => patch({ bgColor: v })} />
          </>
        )}

        {block.type === 'social' && (
          <div className="space-y-3">
            <Label className="text-xs font-semibold text-warm-500 uppercase tracking-wider">Redes</Label>
            {block.config.items.map((item, i) => (
              <div key={i} className="space-y-2 rounded-xl border border-warm-200 bg-warm-50 p-3">
                <div className="flex items-center justify-between">
                  <select
                    value={item.network}
                    onChange={(e) => {
                      const next = [...block.config.items]
                      next[i] = { ...next[i], network: e.target.value as SocialNetwork }
                      patch({ items: next })
                    }}
                    className="rounded-lg border border-warm-200 bg-white px-2 py-1 text-sm text-night-800"
                  >
                    {SOCIAL_NETWORKS.map((n) => (
                      <option key={n.value} value={n.value}>{n.label}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      const next = block.config.items.filter((_, j) => j !== i)
                      patch({ items: next })
                    }}
                    className="rounded p-1 text-warm-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <Input
                  value={item.url}
                  onChange={(e) => {
                    const next = [...block.config.items]
                    next[i] = { ...next[i], url: e.target.value }
                    patch({ items: next })
                  }}
                  placeholder="https://instagram.com/tu_usuario"
                  className="text-sm"
                />
              </div>
            ))}
            {block.config.items.length < 6 && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => patch({ items: [...block.config.items, { network: 'instagram', url: '' }] })}
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Agregar red
              </Button>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}
