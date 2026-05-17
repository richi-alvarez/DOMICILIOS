'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Upload, Wand2, Plus, X, Zap, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createProduct, updateProduct } from '@/lib/actions/products'
import type { CreateProductPayload } from '@/lib/actions/products'

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
  }
}

export function ProductForm({
  catalogId,
  businessName,
  categories,
  currency,
  product,
}: ProductFormProps) {
  const router = useRouter()
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
  const [optionGroups, setOptionGroups] = useState<Array<{ id: string; name: string; options: Array<{ name: string; price: number }> }>>([])
  const [showAIMenu, setShowAIMenu] = useState(false)
  const [dragActive, setDragActive] = useState(false)

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
      const payload: CreateProductPayload = {
        catalogId,
        name: formData.name,
        description: formData.description,
        price: formData.price,
        compareAt: formData.compareAt ? parseFloat(formData.compareAt as string) : undefined,
        stock: formData.stock,
        categoryId: formData.categoryId,
        active: formData.isActive,
        image: formData.image as string | undefined,
        isCartProduct: formData.isCartProduct,
        tags: formData.tags,
      }

      const result = isEditing
        ? await updateProduct({ ...payload, id: product!.id } as any)
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
      setError(err instanceof Error ? err.message : 'Error al guardar el producto')
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
        <span className="text-2xl font-extrabold text-night-800">Productos</span>
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
                <button
                  type="button"
                  onClick={() => document.getElementById('file-input')?.click()}
                  className="font-medium text-primary-600 hover:underline"
                >
                  Subir archivo
                </button>
                {' '}o arrastra y suelta
              </p>
              <p className="mt-1 text-xs text-warm-400">PNG, JPG, GIF hasta 8MB</p>
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
            Funciones IA
          </Button>
          {showAIMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-lg border border-warm-200 bg-white shadow-lg z-10">
              <button className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-warm-50">
                Generar a partir de texto →
              </button>
              <button className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-warm-50 opacity-50 cursor-not-allowed">
                <Zap className="h-4 w-4" /> Generar a partir de imagen
              </button>
              <button className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-warm-50 opacity-50 cursor-not-allowed">
                <Zap className="h-4 w-4" /> Mejorar redacción
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
            Producto de carrito
            <span className="ml-2 text-xs text-warm-400">ℹ️</span>
          </label>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-night-800 mb-2">Título</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            className="w-full rounded-lg border border-warm-200 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none"
            placeholder="Nombre del producto"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-night-800 mb-2">Descripción</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            className="w-full rounded-lg border border-warm-200 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none resize-none"
            rows={5}
            placeholder="Describe tu producto"
          />
        </div>

        {/* Price Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-night-800 mb-2">Precio</label>
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
            <label className="block text-sm font-medium text-night-800 mb-2">Precio oferta</label>
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
          <label className="block text-sm font-medium text-night-800 mb-2">Categoría</label>
          <select
            value={formData.categoryId}
            onChange={(e) => setFormData((prev) => ({ ...prev, categoryId: e.target.value }))}
            className="w-full rounded-lg border border-warm-200 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none"
          >
            <option value="">Selecciona una categoría</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-night-800 mb-2">Etiquetas</label>
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
              placeholder="Agrega etiquetas (ej: marca, tipo, beneficio)"
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
              Agrega etiquetas como marca, tipo o beneficio para que tus clientes filtren mejor.
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
              Esconder
            </label>
            <p className="text-xs text-warm-400">Oculta este producto si no quieres mostrarlo.</p>
          </div>
        </div>

        {/* Stock */}
        <div>
          <label className="block text-sm font-medium text-night-800 mb-2">Inventario</label>
          <input
            type="number"
            value={formData.stock}
            onChange={(e) => setFormData((prev) => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
            className="w-full rounded-lg border border-warm-200 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none"
            placeholder="100"
          />
        </div>

        {/* Additional Options */}
        <div className="space-y-3 border-t border-warm-200 pt-6">
          <h3 className="font-bold text-night-800">Opciones adicionales del producto</h3>
          <Button variant="outline" size="sm" className="gap-2 w-full md:w-auto">
            <Plus className="h-4 w-4" />
            Agregar categoría de opciones
          </Button>
          {optionGroups.length > 0 && (
            <div className="space-y-4">
              {optionGroups.map((group) => (
                <div key={group.id} className="rounded-lg border border-warm-200 p-4">
                  <h4 className="font-medium text-night-800 mb-3">{group.name}</h4>
                  {/* Options would go here */}
                </div>
              ))}
            </div>
          )}
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
          ¡Producto guardado exitosamente! Redirigiendo...
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
              Guardando...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4" />
              {isEditing ? 'Actualizar' : 'Publicar'}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
