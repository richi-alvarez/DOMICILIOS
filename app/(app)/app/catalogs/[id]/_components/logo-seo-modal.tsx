'use client'

import { useState } from 'react'
import { ImageIcon, Loader2, Trash2, Upload, X } from 'lucide-react'
import { saveTheme } from '@/lib/actions/design'

interface Props {
  catalogId: string
  catalogName: string
  initialTheme: Record<string, unknown>
  onClose: () => void
  onSaved?: () => void
}

const MAX_LOGO_BYTES = 600 * 1024 // 600 KB (se guarda como data URL en el tema)
const SEO_TITLE_MAX = 60
const SEO_DESC_MAX = 160

export function LogoSeoModal({ catalogId, catalogName, initialTheme, onClose, onSaved }: Props) {
  const [logoUrl, setLogoUrl] = useState<string>((initialTheme.logoUrl as string) || '')
  const [seoTitle, setSeoTitle] = useState<string>((initialTheme.seoTitle as string) || '')
  const [seoDescription, setSeoDescription] = useState<string>(
    (initialTheme.seoDescription as string) || '',
  )
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    if (!file.type.startsWith('image/')) {
      setError('El archivo debe ser una imagen (PNG, JPG, SVG, WebP).')
      return
    }
    if (file.size > MAX_LOGO_BYTES) {
      setError('La imagen supera 600 KB. Usa una más liviana.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setLogoUrl(reader.result as string)
    reader.onerror = () => setError('No se pudo leer la imagen.')
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError('')
    try {
      // Mezclar con el tema existente para no perder colores/fuentes/etc.
      const merged: Record<string, unknown> = {
        ...initialTheme,
        seoTitle: seoTitle.trim(),
        seoDescription: seoDescription.trim(),
      }
      // logoUrl usa validación .url() en el tema: '' la rompe. Si no hay logo,
      // omitimos la clave (se aplica el default '' al leer); si hay, la guardamos.
      if (logoUrl) merged.logoUrl = logoUrl
      else delete merged.logoUrl
      const result = await saveTheme(catalogId, merged)
      if (result && 'error' in result) {
        setError(result.error || 'Error al guardar')
        return
      }
      onSaved?.()
      onClose()
    } catch (err) {
      console.error(err)
      setError('Error inesperado al guardar')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Logo y SEO</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Logo */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-900">Logo del catálogo</label>
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-gray-50">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" />
              ) : (
                <ImageIcon className="h-7 w-7 text-gray-300" />
              )}
            </div>
            <div className="flex-1 space-y-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50 transition">
                <Upload className="h-4 w-4" />
                {logoUrl ? 'Cambiar logo' : 'Subir logo'}
                <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
              </label>
              {logoUrl && (
                <button
                  type="button"
                  onClick={() => setLogoUrl('')}
                  className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-red-600 transition"
                >
                  <Trash2 className="h-4 w-4" />
                  Quitar logo
                </button>
              )}
              <p className="text-xs text-gray-400">PNG, JPG, SVG o WebP. Máx 600 KB.</p>
            </div>
          </div>
        </div>

        {/* SEO Title */}
        <div className="space-y-1.5">
          <label htmlFor="seo-title" className="block text-sm font-medium text-gray-900">
            Título SEO
          </label>
          <input
            id="seo-title"
            type="text"
            value={seoTitle}
            onChange={(e) => setSeoTitle(e.target.value.slice(0, SEO_TITLE_MAX))}
            placeholder={catalogName}
            className="w-full rounded-lg border-2 border-gray-200 p-2.5 text-sm focus:border-blue-400 focus:outline-none"
          />
          <p className="text-right text-xs text-gray-400">
            {seoTitle.length}/{SEO_TITLE_MAX}
          </p>
        </div>

        {/* SEO Description */}
        <div className="space-y-1.5">
          <label htmlFor="seo-desc" className="block text-sm font-medium text-gray-900">
            Descripción SEO
          </label>
          <textarea
            id="seo-desc"
            value={seoDescription}
            onChange={(e) => setSeoDescription(e.target.value.slice(0, SEO_DESC_MAX))}
            rows={3}
            placeholder="Breve descripción que aparece en buscadores y al compartir el enlace."
            className="w-full resize-none rounded-lg border-2 border-gray-200 p-2.5 text-sm focus:border-blue-400 focus:outline-none"
          />
          <p className="text-right text-xs text-gray-400">
            {seoDescription.length}/{SEO_DESC_MAX}
          </p>
        </div>

        {/* Google-style preview */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <p className="mb-1 text-xs font-medium text-gray-500">Vista previa en buscadores</p>
          <p className="text-sm font-medium text-blue-700 truncate">
            {seoTitle.trim() || catalogName}
          </p>
          <p className="text-xs text-gray-600 line-clamp-2">
            {seoDescription.trim() || 'Sin descripción.'}
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 transition hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              'Guardar'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
