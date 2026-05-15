'use client'

import { useState, useTransition } from 'react'
import { Save, Loader2, CheckCircle2, ExternalLink, Eye } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  FONT_OPTIONS,
  RADIUS_OPTIONS,
  THEME_DEFAULTS,
  type ThemeConfig,
} from '@/lib/design/theme'
import { saveTheme } from '@/lib/actions/theme'
import { toast } from 'sonner'

interface Props {
  catalogId: string
  catalogSlug: string
  initial: ThemeConfig
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-warm-200 bg-white p-6">
      <h2 className="mb-0.5 font-bold text-night-800">{title}</h2>
      {description && <p className="mb-5 text-sm text-warm-500">{description}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="font-semibold text-night-700">{label}</Label>
      {hint && <p className="text-xs text-warm-400">{hint}</p>}
      {children}
    </div>
  )
}

function ColorField({ label, hint, value, onChange }: { label: string; hint?: string; value: string; onChange: (v: string) => void }) {
  return (
    <Field label={label} hint={hint}>
      <div className="flex items-center gap-3">
        <label className="relative cursor-pointer">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="sr-only"
          />
          <div
            className="h-10 w-10 rounded-xl border-2 border-warm-200 shadow-sm transition-transform hover:scale-105"
            style={{ background: value }}
          />
        </label>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-32 font-mono text-sm"
          maxLength={7}
        />
        <span className="text-sm text-warm-400">{value}</span>
      </div>
    </Field>
  )
}

export function ThemeEditor({ catalogId, catalogSlug, initial }: Props) {
  const [theme, setTheme] = useState<ThemeConfig>({ ...THEME_DEFAULTS, ...initial })
  const [dirty, setDirty] = useState(false)
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  function patch(partial: Partial<ThemeConfig>) {
    setTheme((prev) => ({ ...prev, ...partial }))
    setDirty(true)
    setSaved(false)
  }

  function handleSave() {
    startTransition(async () => {
      const result = await saveTheme(catalogId, theme)
      if (result.error) {
        toast.error(result.error)
      } else {
        setDirty(false)
        setSaved(true)
        toast.success('Tema guardado')
        setTimeout(() => setSaved(false), 3000)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-night-800">Tema visual</h1>
          <p className="mt-0.5 text-sm text-warm-500">
            Personaliza colores, tipografía y branding de tu tienda.
            {dirty && <span className="ml-2 font-medium text-amber-500">· Sin guardar</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/s/${catalogSlug}`}
            target="_blank"
            className="flex items-center gap-1.5 rounded-xl border border-warm-200 bg-white px-3 py-1.5 text-sm font-medium text-night-700 hover:bg-warm-50 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Ver tienda
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

      {/* Live preview strip */}
      <div className="overflow-hidden rounded-2xl border-2 border-dashed border-warm-200">
        <div className="flex items-center gap-3 border-b border-warm-100 bg-warm-50 px-4 py-2">
          <Eye className="h-3.5 w-3.5 text-warm-400" />
          <span className="text-xs font-semibold text-warm-500 uppercase tracking-wider">Preview del header</span>
        </div>
        <div
          className="flex h-14 items-center justify-between px-5"
          style={{ background: theme.headerBg }}
        >
          <div className="flex items-center gap-3">
            {theme.logoUrl ? (
              <img src={theme.logoUrl} alt="Logo" className="h-8 w-auto object-contain" />
            ) : (
              <span
                className="font-bold text-lg"
                style={{ fontFamily: `var(--sf-heading-font, ${theme.headingFont})`, color: '#0B1F3A' }}
              >
                Tu Tienda
              </span>
            )}
          </div>
          <div
            className="rounded-full px-4 py-1.5 text-sm font-semibold"
            style={{ background: theme.primaryColor, color: theme.primaryTextColor }}
          >
            Pedido
          </div>
        </div>
      </div>

      {/* Colors */}
      <Section title="Colores" description="Define la paleta principal de tu tienda.">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <ColorField
            label="Color primario"
            hint="Botones, badges, acentos"
            value={theme.primaryColor}
            onChange={(v) => patch({ primaryColor: v })}
          />
          <ColorField
            label="Texto sobre primario"
            hint="Color del texto en botones"
            value={theme.primaryTextColor}
            onChange={(v) => patch({ primaryTextColor: v })}
          />
          <ColorField
            label="Fondo de la página"
            hint="Color de fondo general"
            value={theme.bgColor}
            onChange={(v) => patch({ bgColor: v })}
          />
          <ColorField
            label="Fondo del header"
            hint="Color de la barra superior"
            value={theme.headerBg}
            onChange={(v) => patch({ headerBg: v })}
          />
        </div>
      </Section>

      {/* Typography */}
      <Section title="Tipografía" description="Elige las fuentes para tu tienda.">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Field label="Fuente de títulos">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {FONT_OPTIONS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => patch({ headingFont: f.value })}
                  className={`rounded-xl border-2 px-3 py-2.5 text-sm transition-all ${
                    theme.headingFont === f.value
                      ? 'border-primary-500 bg-primary-50 text-primary-700 font-semibold'
                      : 'border-warm-200 text-night-700 hover:border-warm-300'
                  }`}
                  style={{ fontFamily: f.family }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Fuente del cuerpo">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {FONT_OPTIONS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => patch({ bodyFont: f.value })}
                  className={`rounded-xl border-2 px-3 py-2.5 text-sm transition-all ${
                    theme.bodyFont === f.value
                      ? 'border-primary-500 bg-primary-50 text-primary-700 font-semibold'
                      : 'border-warm-200 text-night-700 hover:border-warm-300'
                  }`}
                  style={{ fontFamily: f.family }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </Field>
        </div>
      </Section>

      {/* Shape */}
      <Section title="Forma de los elementos" description="Radio de bordes en tarjetas y botones.">
        <Field label="Radio de bordes">
          <div className="flex gap-3 flex-wrap">
            {RADIUS_OPTIONS.map((r) => (
              <button
                key={r.value}
                onClick={() => patch({ borderRadius: r.value })}
                className={`flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-3 transition-all ${
                  theme.borderRadius === r.value
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-warm-200 hover:border-warm-300'
                }`}
              >
                <div
                  className="h-8 w-8 border-2 border-night-800 bg-warm-100"
                  style={{ borderRadius: r.css }}
                />
                <span className="text-xs font-medium text-night-700">{r.label}</span>
              </button>
            ))}
          </div>
        </Field>
      </Section>

      {/* Branding */}
      <Section title="Marca" description="Logo e imagen de portada de tu tienda.">
        <Field label="URL del logo" hint="PNG o SVG con fondo transparente recomendado">
          <Input
            value={theme.logoUrl}
            onChange={(e) => patch({ logoUrl: e.target.value })}
            placeholder="https://tu-dominio.com/logo.png"
          />
          {theme.logoUrl && (
            <div className="mt-2 flex items-center gap-2">
              <img
                src={theme.logoUrl}
                alt="Logo preview"
                className="h-10 max-w-[120px] object-contain rounded border border-warm-200 bg-white p-1"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
              <span className="text-xs text-warm-400">Vista previa del logo</span>
            </div>
          )}
        </Field>
        <Field label="URL de imagen de portada" hint="Se usa como fondo del hero por defecto (1200×400px recomendado)">
          <Input
            value={theme.coverImageUrl}
            onChange={(e) => patch({ coverImageUrl: e.target.value })}
            placeholder="https://tu-dominio.com/cover.jpg"
          />
          {theme.coverImageUrl && (
            <div className="mt-2 overflow-hidden rounded-xl border border-warm-200" style={{ height: '80px' }}>
              <img
                src={theme.coverImageUrl}
                alt="Cover"
                className="h-full w-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            </div>
          )}
        </Field>
      </Section>

      {/* Domain */}
      <Section title="Dominio personalizado" description="Vincula tu propio dominio al storefront (requiere configuración DNS).">
        <Field label="Dominio" hint="Ejemplo: tienda.tudominio.com — la configuración DNS se activa en plan Pro">
          <Input
            value={theme.customDomain}
            onChange={(e) => patch({ customDomain: e.target.value })}
            placeholder="tienda.tudominio.com"
          />
        </Field>
        <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-700">
          El dominio personalizado está disponible en el plan Pro. Al guardarlo se registra para asignación futura.
        </div>
      </Section>
    </div>
  )
}
