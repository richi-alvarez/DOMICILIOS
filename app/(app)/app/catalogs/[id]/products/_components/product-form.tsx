'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Upload, Wand2, Plus, X, Zap, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createProduct, updateProduct } from '@/lib/actions/products'
import type { CreateProductPayload, UpdateProductPayload } from '@/lib/actions/products'
import { useI18n } from '@/lib/i18n/context'

interface ProductFormProps {
  catalogId: string
  businessName: string
  categories: { id: string; name: string }[]
  currency: string
  product?: {
    id: string
    name: string
    description?: string
    price: number
    compareAt?: number
    stock?: number
    sku?: string
    categoryId?: string
    tags?: string[]
    active: boolean
    image?: string
    variants?: {
      colors?: { name: string; hex: string; image?: string }[]
      // Compat: las tallas pueden venir como strings (antiguas) u objetos.
      sizes?: (string | { name: string; image?: string })[]
    }
  }
}

type ColorVariant = { name: string; hex: string; image?: string }
type SizeVariant = { name: string; image?: string }

// Normaliza tallas que pueden venir como string[] (datos viejos/escáner) u objetos.
function normalizeSizes(raw?: (string | { name: string; image?: string })[]): SizeVariant[] {
  return (raw ?? []).map((s) => (typeof s === 'string' ? { name: s } : { name: s.name, image: s.image }))
}

export function ProductForm({
  catalogId,
  businessName,
  categories,
  currency,
  product,
}: ProductFormProps) {
  const router = useRouter()
  const { t } = useI18n()
  const isEditing = !!product

  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || 0,
    compareAt: product?.compareAt || '',
    stock: product?.stock ?? 100,
    categoryId: product?.categoryId || '',
    tags: product?.tags || [],
    isActive: product?.active ?? true,
    isCartProduct: true,
    image: product?.image || null,
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [tagInput, setTagInput] = useState('')
  const [showAIMenu, setShowAIMenu] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  // ── Variantes (color / talla) ──────────────────────────────────────────
  const MAX_IMAGES = 5
  const [colorsEnabled, setColorsEnabled] = useState(!!product?.variants?.colors?.length)
  const [colors, setColors] = useState<ColorVariant[]>(product?.variants?.colors ?? [])
  const [sizesEnabled, setSizesEnabled] = useState(!!product?.variants?.sizes?.length)
  const [sizes, setSizes] = useState<SizeVariant[]>(normalizeSizes(product?.variants?.sizes))

  const addColor = () =>
    setColors((prev) => [...prev, { name: '', hex: '#3b82f6' }])
  const removeColor = (idx: number) =>
    setColors((prev) => prev.filter((_, i) => i !== idx))
  const updateColor = (idx: number, field: keyof ColorVariant, value: string) =>
    setColors((prev) => prev.map((c, i) => (i === idx ? { ...c, [field]: value } : c)))
  const removeColorImage = (idx: number) =>
    setColors((prev) => prev.map((c, i) => (i === idx ? { ...c, image: undefined } : c)))

  const handleColorImage = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0]
    e.currentTarget.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) =>
      setColors((prev) => prev.map((c, i) => (i === idx ? { ...c, image: ev.target?.result as string } : c)))
    reader.readAsDataURL(file)
  }

  const addSize = () => setSizes((prev) => [...prev, { name: '' }])
  const removeSize = (idx: number) => setSizes((prev) => prev.filter((_, i) => i !== idx))
  const updateSizeName = (idx: number, value: string) =>
    setSizes((prev) => prev.map((s, i) => (i === idx ? { ...s, name: value } : s)))
  const removeSizeImage = (idx: number) =>
    setSizes((prev) => prev.map((s, i) => (i === idx ? { ...s, image: undefined } : s)))
  const handleSizeImage = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0]
    e.currentTarget.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) =>
      setSizes((prev) => prev.map((s, i) => (i === idx ? { ...s, image: ev.target?.result as string } : s)))
    reader.readAsDataURL(file)
  }

  // Tag handling
  const addTag = (tag: string) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tag],
      }))
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }))
  }

  // File handling
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const files = e.dataTransfer.files
    if (files && files[0]) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setFormData((prev) => ({
          ...prev,
          image: event.target?.result as string,
        }))
      }
      reader.readAsDataURL(files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Helper to handle optional string fields
      const stringOrNull = (value: string | null | undefined) =>
        value && typeof value === 'string' && value.trim() ? value.trim() : null

      // Helper to handle optional numeric fields
      const numberOrNull = (value: any) => {
        if (value === null || value === undefined || value === '') return null
        const num = typeof value === 'string' ? parseFloat(value) : value
        return isNaN(num) ? null : num
      }

      // Variantes: solo se envían las habilitadas y con contenido.
      const cleanColors = colors.filter((c) => c.name.trim())
      const cleanSizes = sizes.filter((s) => s.name.trim())
      const variants =
        (colorsEnabled && cleanColors.length) || (sizesEnabled && cleanSizes.length)
          ? {
              ...(colorsEnabled && cleanColors.length ? { colors: cleanColors } : {}),
              ...(sizesEnabled && cleanSizes.length ? { sizes: cleanSizes } : {}),
            }
          : null

      const payload: CreateProductPayload = {
        catalogId,
        name: formData.name,
        description: stringOrNull(formData.description),
        price: formData.price,
        compareAt: numberOrNull(formData.compareAt),
        stock: numberOrNull(formData.stock),
        categoryId: stringOrNull(formData.categoryId),
        active: formData.isActive,
        image: formData.image as string | undefined,
        isCartProduct: formData.isCartProduct,
        tags: formData.tags && formData.tags.length > 0 ? formData.tags : null,
        variants,
      }

      const result = isEditing
        ? await updateProduct({ ...payload, id: product!.id } as UpdateProductPayload)
        : await createProduct(payload)

      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setTimeout(() => {
          router.push(`/app/catalogs/${catalogId}/products`)
        }, 1000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('products.editor.saveError'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files
    if (files && files[0]) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setFormData((prev) => ({
          ...prev,
          image: event.target?.result as string,
        }))
      }
      reader.readAsDataURL(files[0])
    }
  }

  // Total de imágenes (principal + por color + por talla) para el tope de MAX_IMAGES.
  const imageCount =
    (formData.image ? 1 : 0) +
    colors.filter((c) => c.image).length +
    sizes.filter((s) => s.image).length

  return (
    <form onSubmit={handleSubmit} className="space-y-8 px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/app/catalogs/${catalogId}/products`}>
          <Button variant="ghost" size="sm">
            <ChevronLeft className="h-4 w-4" />
            {businessName}
          </Button>
        </Link>
        <span className="text-2xl font-extrabold text-night-800">{t('products.editor.title')}</span>
      </div>

      {/* Image Upload Section */}
      <input
        type="file"
        id="file-input"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <div className="rounded-lg border-2 border-dashed border-warm-200 bg-gradient-to-b from-warm-50 to-white p-12">
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center text-center transition-colors ${
            dragActive ? 'bg-blue-50 border-primary-300' : ''
          }`}
        >
          {formData.image ? (
            <div className="relative">
              <img src={formData.image} alt="Product" className="h-32 w-32 rounded-lg object-cover" />
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, image: null }))}
                className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              <Upload className="mb-3 h-8 w-8 text-warm-300" />
              <p className="text-sm">
                <label
                  htmlFor="file-input"
                  className="cursor-pointer font-medium text-primary-600 hover:underline"
                >
                  {t('products.editor.uploadFile')}
                </label>
                {t('products.editor.orDragDrop')}
              </p>
              <p className="mt-1 text-xs text-warm-400">{t('products.editor.fileHint')}</p>
            </>
          )}
        </div>
      </div>

      {/* AI Functions Button */}
      <div className="flex justify-end">
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAIMenu(!showAIMenu)}
            className="gap-2"
          >
            <Wand2 className="h-4 w-4" />
            {t('products.editor.aiFunctions')}
          </Button>
          {showAIMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-lg border border-warm-200 bg-white shadow-lg z-10">
              <button className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-warm-50">
                {t('products.editor.aiFromText')}
              </button>
              <button className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-warm-50 opacity-50 cursor-not-allowed">
                <Zap className="h-4 w-4" /> {t('products.editor.aiFromImage')}
              </button>
              <button className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-warm-50 opacity-50 cursor-not-allowed">
                <Zap className="h-4 w-4" /> {t('products.editor.aiImprove')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Form Fields */}
      <div className="space-y-6">
        {/* Is Cart Product */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isCart"
            checked={formData.isCartProduct}
            onChange={(e) => setFormData((prev) => ({ ...prev, isCartProduct: e.target.checked }))}
            className="rounded"
          />
          <label htmlFor="isCart" className="text-sm font-medium text-night-800">
            {t('products.editor.cartProduct')}
            <span className="ml-2 text-xs text-warm-400">ℹ️</span>
          </label>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-night-800 mb-2">{t('products.editor.titleLabel')}</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            className="w-full rounded-lg border border-warm-200 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none"
            placeholder={t('products.editor.namePlaceholder')}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-night-800 mb-2">{t('products.editor.description')}</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            className="w-full rounded-lg border border-warm-200 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none resize-none"
            rows={5}
            placeholder={t('products.editor.descPlaceholder')}
          />
        </div>

        {/* Price Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-night-800 mb-2">{t('products.editor.price')}</label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-warm-400">$</span>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData((prev) => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                className="w-full rounded-lg border border-warm-200 pl-8 pr-12 py-2 text-sm focus:border-primary-500 focus:outline-none"
                placeholder="0"
              />
              <span className="absolute right-4 text-warm-400 text-sm">{currency}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-night-800 mb-2">{t('products.editor.salePrice')}</label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-warm-400">$</span>
              <input
                type="number"
                value={formData.compareAt}
                onChange={(e) => setFormData((prev) => ({ ...prev, compareAt: e.target.value }))}
                className="w-full rounded-lg border border-warm-200 pl-8 pr-12 py-2 text-sm focus:border-primary-500 focus:outline-none"
                placeholder="0"
              />
              <span className="absolute right-4 text-warm-400 text-sm">{currency}</span>
            </div>
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-night-800 mb-2">{t('products.editor.category')}</label>
          <select
            value={formData.categoryId}
            onChange={(e) => setFormData((prev) => ({ ...prev, categoryId: e.target.value }))}
            className="w-full rounded-lg border border-warm-200 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none"
          >
            <option value="">{t('products.editor.selectCategory')}</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-night-800 mb-2">{t('products.editor.tags')}</label>
          <div className="space-y-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addTag(tagInput)
                }
              }}
              className="w-full rounded-lg border border-warm-200 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none"
              placeholder={t('products.editor.tagsPlaceholder')}
            />
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button onClick={() => removeTag(tag)} className="ml-1">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <p className="text-xs text-warm-400">
              {t('products.editor.tagsHint')}
            </p>
          </div>
        </div>

        {/* Hide Product */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
            className="rounded"
          />
          <div>
            <label htmlFor="isActive" className="text-sm font-medium text-night-800">
              {t('products.editor.hide')}
            </label>
            <p className="text-xs text-warm-400">{t('products.editor.hideHint')}</p>
          </div>
        </div>

        {/* Stock */}
        <div>
          <label className="block text-sm font-medium text-night-800 mb-2">{t('products.editor.inventory')}</label>
          <input
            type="number"
            value={formData.stock}
            onChange={(e) => setFormData((prev) => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
            className="w-full rounded-lg border border-warm-200 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none"
            placeholder="100"
          />
        </div>

        {/* Variantes (color / talla) */}
        <div className="space-y-4 border-t border-warm-200 pt-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-night-800">{t('products.editor.variants')}</h3>
            <span className="text-xs text-warm-400">
              {t('products.editor.imagesLabel')} {imageCount}/{MAX_IMAGES}
            </span>
          </div>

          {/* Colores */}
          <div className="space-y-3 rounded-lg border border-warm-200 p-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={colorsEnabled}
                onChange={(e) => setColorsEnabled(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-medium text-night-800">{t('products.editor.enableColors')}</span>
            </label>
            {colorsEnabled && (
              <div className="space-y-3">
                {colors.map((c, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="color"
                      value={c.hex}
                      onChange={(e) => updateColor(idx, 'hex', e.target.value)}
                      className="h-9 w-10 shrink-0 cursor-pointer rounded border border-warm-200"
                      title={t('products.editor.pickColor')}
                    />
                    <input
                      type="text"
                      value={c.name}
                      onChange={(e) => updateColor(idx, 'name', e.target.value)}
                      placeholder={t('products.editor.colorNamePlaceholder')}
                      className="min-w-0 flex-1 rounded-lg border border-warm-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                    />
                    {c.image ? (
                      <div className="relative shrink-0">
                        <img src={c.image} alt={c.name} className="h-9 w-9 rounded border border-warm-200 object-cover" />
                        <button
                          type="button"
                          onClick={() => removeColorImage(idx)}
                          className="absolute -right-1.5 -top-1.5 rounded-full bg-red-500 p-0.5 text-white"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <label
                        title={imageCount >= MAX_IMAGES ? `${t('products.editor.maxImagesPre')}${MAX_IMAGES}${t('products.editor.maxImagesPost')}` : t('products.editor.uploadColorImg')}
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded border border-dashed border-warm-300 ${
                          imageCount >= MAX_IMAGES ? 'cursor-not-allowed opacity-40' : 'cursor-pointer hover:border-primary-400'
                        }`}
                      >
                        <Upload className="h-4 w-4 text-warm-400" />
                        <input
                          type="file"
                          accept="image/*"
                          disabled={imageCount >= MAX_IMAGES}
                          onChange={(e) => handleColorImage(idx, e)}
                          className="hidden"
                        />
                      </label>
                    )}
                    <button
                      type="button"
                      onClick={() => removeColor(idx)}
                      className="shrink-0 text-night-300 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" className="gap-2" onClick={addColor}>
                  <Plus className="h-4 w-4" />
                  {t('products.editor.addColor')}
                </Button>
              </div>
            )}
          </div>

          {/* Tallas */}
          <div className="space-y-3 rounded-lg border border-warm-200 p-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={sizesEnabled}
                onChange={(e) => setSizesEnabled(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-medium text-night-800">{t('products.editor.enableSizes')}</span>
            </label>
            {sizesEnabled && (
              <div className="space-y-3">
                {sizes.map((s, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={s.name}
                      onChange={(e) => updateSizeName(idx, e.target.value)}
                      placeholder={t('products.editor.sizePlaceholder')}
                      className="min-w-0 flex-1 rounded-lg border border-warm-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                    />
                    {s.image ? (
                      <div className="relative shrink-0">
                        <img src={s.image} alt={s.name} className="h-9 w-9 rounded border border-warm-200 object-cover" />
                        <button
                          type="button"
                          onClick={() => removeSizeImage(idx)}
                          className="absolute -right-1.5 -top-1.5 rounded-full bg-red-500 p-0.5 text-white"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <label
                        title={imageCount >= MAX_IMAGES ? `${t('products.editor.maxImagesPre')}${MAX_IMAGES}${t('products.editor.maxImagesPost')}` : t('products.editor.uploadSizeImg')}
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded border border-dashed border-warm-300 ${
                          imageCount >= MAX_IMAGES ? 'cursor-not-allowed opacity-40' : 'cursor-pointer hover:border-primary-400'
                        }`}
                      >
                        <Upload className="h-4 w-4 text-warm-400" />
                        <input
                          type="file"
                          accept="image/*"
                          disabled={imageCount >= MAX_IMAGES}
                          onChange={(e) => handleSizeImage(idx, e)}
                          className="hidden"
                        />
                      </label>
                    )}
                    <button
                      type="button"
                      onClick={() => removeSize(idx)}
                      className="shrink-0 text-night-300 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" className="gap-2" onClick={addSize}>
                  <Plus className="h-4 w-4" />
                  {t('products.editor.addSize')}
                </Button>
              </div>
            )}
          </div>

          <p className="text-xs text-warm-400">
            {t('products.editor.variantsHintPre')}{MAX_IMAGES}{t('products.editor.variantsHintPost')}
          </p>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-lime-200 bg-lime-50 p-4 text-sm text-lime-700">
          {t('products.editor.savedSuccess')}
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end border-t border-warm-200 pt-6">
        <Button
          type="submit"
          size="lg"
          className="gap-2 px-8"
          disabled={isLoading || success}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('products.editor.saving')}
            </>
          ) : (
            <>
              <Zap className="h-4 w-4" />
              {isEditing ? t('products.editor.update') : t('products.editor.publish')}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
