'use client'

import { useState } from 'react'
import React from 'react'
import { X, Camera, FileText, Zap, Check, AlertCircle, Loader2, Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { scanMenuImages, addProductsFromScan } from '@/lib/actions/menu-scan'
import { useI18n } from '@/lib/i18n/context'

interface DetectedProduct {
  name: string
  description: string
  price: number
  category: string
  image?: string
  colors?: { name: string; hex: string }[]
  sizes?: string[]
  selected: boolean
}

interface ScanMenuModalProps {
  isOpen: boolean
  onClose: () => void
  catalogId: string
  categories: { id: string; name: string }[]
}

type ModalState = 'initial' | 'loaded' | 'processing' | 'success' | 'results' | 'error'

export function ScanMenuModal({
  isOpen,
  onClose,
  catalogId,
  categories,
}: ScanMenuModalProps) {
  const { t } = useI18n()
  const [state, setState] = useState<ModalState>('initial')
  const [files, setFiles] = useState<File[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [processingProgress, setProcessingProgress] = useState<Record<string, 'processing' | 'done' | 'error'>>({})
  const [detectedProducts, setDetectedProducts] = useState<DetectedProduct[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      (file) => ['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)
    )
    if (droppedFiles.length > 0) {
      setFiles((prev) => [...prev, ...droppedFiles])
      setState('loaded')
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.currentTarget.files
    if (selectedFiles && selectedFiles.length > 0) {
      const newFiles = Array.from(selectedFiles)
      setFiles((prev) => [...prev, ...newFiles])
      setState('loaded')
    }
    // Limpia el input para permitir volver a elegir el MISMO archivo.
    e.currentTarget.value = ''
  }

  // Cierra el modal reseteando todo el estado (evita reabrir en un estado viejo).
  const handleClose = () => {
    setState('initial')
    setFiles([])
    setDetectedProducts([])
    setError(null)
    setProcessingProgress({})
    setIsLoading(false)
    onClose()
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
    if (files.length === 1) {
      setState('initial')
    }
  }

  const handleScanMenu = async () => {
    setIsLoading(true)
    setState('processing')
    setError(null)

    try {
      const progress: Record<string, 'processing' | 'done' | 'error'> = {}
      files.forEach((file) => {
        progress[file.name] = 'processing'
      })
      setProcessingProgress(progress)

      const formData = new FormData()
      files.forEach((file) => {
        formData.append('files', file)
      })
      // Necesario para recortar y guardar las fotos de los productos.
      formData.append('catalogId', catalogId)

      const result = await scanMenuImages(formData)

      if ('error' in result) {
        setError(result.error)
        setState('error')
        setIsLoading(false)
        return
      }

      files.forEach((file) => {
        progress[file.name] = 'done'
      })
      setProcessingProgress(progress)

      if (result.products && result.products.length > 0) {
        setDetectedProducts(
          result.products.map((p: any) => ({
            ...p,
            selected: true,
          }))
        )
        setState('success')
      } else {
        setError(t('products.scan.noProductsFound'))
        setState('error')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('products.scan.scanError'))
      setState('error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectAll = (select: boolean) => {
    setDetectedProducts((prev) =>
      prev.map((p) => ({
        ...p,
        selected: select,
      }))
    )
  }

  const handleToggleProduct = (index: number) => {
    setDetectedProducts((prev) =>
      prev.map((p, i) =>
        i === index
          ? { ...p, selected: !p.selected }
          : p
      )
    )
  }

  const handleUpdateProduct = (index: number, field: keyof DetectedProduct, value: any) => {
    setDetectedProducts((prev) =>
      prev.map((p, i) =>
        i === index
          ? { ...p, [field]: value }
          : p
      )
    )
  }

  const handleDeleteProduct = (index: number) => {
    setDetectedProducts((prev) => prev.filter((_, i) => i !== index))
  }

  // ── Edición de variantes (colores / tallas) por producto ──────────────
  const updateColor = (pi: number, ci: number, field: 'name' | 'hex', value: string) =>
    setDetectedProducts((prev) =>
      prev.map((p, i) =>
        i === pi
          ? { ...p, colors: (p.colors ?? []).map((c, j) => (j === ci ? { ...c, [field]: value } : c)) }
          : p,
      ),
    )
  const addColor = (pi: number) =>
    setDetectedProducts((prev) =>
      prev.map((p, i) => (i === pi ? { ...p, colors: [...(p.colors ?? []), { name: 'Color', hex: '#cccccc' }] } : p)),
    )
  const removeColor = (pi: number, ci: number) =>
    setDetectedProducts((prev) =>
      prev.map((p, i) => (i === pi ? { ...p, colors: (p.colors ?? []).filter((_, j) => j !== ci) } : p)),
    )
  const addSize = (pi: number, value: string) => {
    const v = value.trim()
    if (!v) return
    setDetectedProducts((prev) =>
      prev.map((p, i) =>
        i === pi ? { ...p, sizes: (p.sizes ?? []).includes(v) ? p.sizes : [...(p.sizes ?? []), v] } : p,
      ),
    )
  }
  const removeSize = (pi: number, size: string) =>
    setDetectedProducts((prev) =>
      prev.map((p, i) => (i === pi ? { ...p, sizes: (p.sizes ?? []).filter((s) => s !== size) } : p)),
    )

  const handleAddProduct = () => {
    setDetectedProducts((prev) => [
      ...prev,
      {
        name: '',
        description: '',
        price: 0,
        category: 'General',
        selected: true,
      },
    ])
  }

  const handleAddProducts = async () => {
    setIsLoading(true)
    try {
      const selectedProducts = detectedProducts.filter((p) => p.selected)
      const result = await addProductsFromScan(catalogId, selectedProducts)

      if ('error' in result) {
        setError(result.error)
      } else {
        setFiles([])
        setState('initial')
        setDetectedProducts([])
        onClose()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('products.scan.addError'))
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  const selectedCount = detectedProducts.filter((p) => p.selected).length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-lg p-1 hover:bg-warm-100"
        >
          <X className="h-5 w-5 text-warm-400" />
        </button>

        {state === 'initial' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary-500" />
              <h2 className="text-xl font-bold text-night-800">{t('products.scan.uploadTitle')}</h2>
            </div>
            <p className="text-sm text-warm-500">
              {t('products.scan.uploadSubtitle')}
            </p>

            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                dragActive ? 'border-primary-400 bg-primary-50' : 'border-warm-200 bg-white'
              }`}
            >
              <Camera className="mx-auto h-8 w-8 text-primary-300 mb-3" />
              <p className="text-sm font-medium text-night-800">
                {t('products.scan.dragHere')}
              </p>
              <p className="mt-1 text-xs text-warm-400">
                {t('products.scan.fileTypes')}
              </p>

              <div className="mt-4 flex gap-2 justify-center">
                <Button asChild size="sm" className="gap-2 cursor-pointer">
                  <label>
                    <Camera className="h-4 w-4" />
                    {t('products.scan.takePhoto')}
                    <input
                      type="file"
                      accept="image/jpeg,image/png"
                      capture="environment"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                </Button>

                <Button asChild variant="outline" size="sm" className="gap-2 cursor-pointer">
                  <label>
                    <FileText className="h-4 w-4" />
                    {t('products.scan.chooseFile')}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,application/pdf"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-lg bg-blue-50 p-3 text-xs text-blue-700">
              <span>🔒</span>
              <span>{t('products.scan.secure')}</span>
            </div>

            <Button variant="outline" onClick={handleClose} className="w-full">
              {t('products.scan.cancel')}
            </Button>
          </div>
        )}

        {state === 'loaded' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary-500" />
              <h2 className="text-xl font-bold text-night-800">{t('products.scan.uploadTitle')}</h2>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {files.map((file, index) => (
                <div key={index} className="relative">
                  <div className="aspect-square rounded-lg bg-warm-100 flex items-center justify-center overflow-hidden">
                    {file.type.startsWith('image/') ? (
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <FileText className="h-6 w-6 text-warm-400" />
                    )}
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}

              <label className="aspect-square rounded-lg border-2 border-dashed border-warm-200 flex items-center justify-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors">
                <span className="text-2xl text-warm-300">+</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>

            <p className="text-sm text-warm-500">
              {files.length} {files.length !== 1 ? t('products.scan.readyMany') : t('products.scan.readyOne')}
            </p>

            <Button
              onClick={handleScanMenu}
              disabled={isLoading}
              className="w-full gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('products.scan.scanning')}
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  {t('products.scan.scanMenu')}
                </>
              )}
            </Button>

            <Button variant="outline" onClick={handleClose} className="w-full">
              {t('products.scan.cancel')}
            </Button>
          </div>
        )}

        {state === 'processing' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary-500 animate-spin" />
              <h2 className="text-xl font-bold text-night-800">{t('products.scan.analyzingTitle')}</h2>
            </div>
            <p className="text-sm text-warm-500">
              {t('products.scan.analyzingSubtitle')}
            </p>

            <div className="space-y-3 max-h-64 overflow-y-auto">
              {files.map((file) => (
                <div key={file.name} className="flex items-center gap-3 rounded-lg bg-warm-50 p-3">
                  <div className="h-12 w-12 rounded bg-warm-200 flex items-center justify-center flex-shrink-0">
                    {file.type.startsWith('image/') ? (
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="h-full w-full object-cover rounded"
                      />
                    ) : (
                      <FileText className="h-5 w-5 text-warm-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-night-800 truncate">{file.name}</p>
                    <p className="text-xs text-warm-400">
                      {processingProgress[file.name] === 'done'
                        ? t('products.scan.foundStatus')
                        : t('products.scan.processing')}
                    </p>
                  </div>
                  {processingProgress[file.name] === 'done' ? (
                    <Check className="h-5 w-5 text-lime-500 flex-shrink-0" />
                  ) : (
                    <Loader2 className="h-5 w-5 text-primary-500 animate-spin flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {state === 'success' && (
          <div className="space-y-6 text-center py-8">
            <div className="flex justify-center">
              <div className="rounded-full bg-lime-100 p-4">
                <Check className="h-8 w-8 text-lime-600" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-night-800">
                {detectedProducts.length} {t('products.scan.foundTitleSuffix')}
              </h2>
              <p className="text-sm text-warm-500 mt-1">
                {t('products.scan.foundSubtitle')}
              </p>
            </div>
            <div className="space-y-3">
              <Button
                onClick={() => setState('results')}
                className="w-full gap-2"
              >
                {t('products.scan.reviewProducts')}
                <Zap className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={handleClose} className="w-full">
                {t('products.scan.cancel')}
              </Button>
            </div>
          </div>
        )}

        {state === 'results' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary-500" />
              <div>
                <h2 className="text-xl font-bold text-night-800">{t('products.scan.reviewTitle')}</h2>
                <p className="text-sm text-warm-500">{t('products.scan.reviewSubtitle')}</p>
              </div>
            </div>

            {detectedProducts.length > 0 && (
              <>
                <div className="flex items-center justify-between bg-warm-50 p-3 rounded-lg">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedCount === detectedProducts.length && detectedProducts.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm text-warm-600">
                      {selectedCount === detectedProducts.length && detectedProducts.length > 0
                        ? t('products.scan.deselectAll')
                        : t('products.scan.selectAll')}
                    </span>
                  </div>
                  <span className="text-sm text-warm-600">
                    {selectedCount}{t('products.scan.selectedOfMid')}{detectedProducts.length}{t('products.scan.selectedOfSuffix')}
                  </span>
                </div>

                <div className="border border-warm-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-warm-200 bg-warm-50">
                        <tr>
                          <th className="px-4 py-3 text-left w-10">
                            <input type="checkbox" className="rounded" disabled />
                          </th>
                          <th className="px-4 py-3 text-left font-semibold text-warm-600">{t('products.scan.thTitle')}</th>
                          <th className="px-4 py-3 text-left font-semibold text-warm-600">{t('products.scan.thDescription')}</th>
                          <th className="px-4 py-3 text-left font-semibold text-warm-600 w-24">{t('products.scan.thPrice')}</th>
                          <th className="px-4 py-3 text-left font-semibold text-warm-600 w-32">{t('products.scan.thCategory')}</th>
                          <th className="px-4 py-3 text-center w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-warm-100">
                        {detectedProducts.map((product, index) => (
                          <tr key={index} className="hover:bg-warm-50">
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={product.selected}
                                onChange={() => handleToggleProduct(index)}
                                className="rounded"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {product.image ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={product.image}
                                    alt={product.name}
                                    className="h-10 w-10 flex-shrink-0 rounded object-cover border border-warm-200"
                                  />
                                ) : (
                                  <div className="h-10 w-10 flex-shrink-0 rounded bg-warm-100 flex items-center justify-center text-warm-300">
                                    <Camera className="h-4 w-4" />
                                  </div>
                                )}
                                <div className="flex-1 space-y-1.5">
                                  <Input
                                    value={product.name}
                                    onChange={(e) => handleUpdateProduct(index, 'name', e.target.value)}
                                    placeholder={t('products.scan.namePlaceholder')}
                                    className="text-sm"
                                  />

                                  {/* Colores editables */}
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    {(product.colors ?? []).map((c, ci) => (
                                      <span
                                        key={ci}
                                        className="inline-flex items-center gap-1 rounded-full border border-warm-200 bg-white py-0.5 pl-0.5 pr-1.5"
                                      >
                                        <input
                                          type="color"
                                          value={/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(c.hex) ? c.hex : '#cccccc'}
                                          onChange={(e) => updateColor(index, ci, 'hex', e.target.value)}
                                          className="h-4 w-4 cursor-pointer rounded-full border-0 bg-transparent p-0"
                                          title="Color"
                                        />
                                        <input
                                          value={c.name}
                                          onChange={(e) => updateColor(index, ci, 'name', e.target.value)}
                                          className="w-14 bg-transparent text-[11px] text-warm-700 focus:outline-none"
                                          placeholder={t('products.scan.colorPlaceholder')}
                                        />
                                        <button
                                          type="button"
                                          onClick={() => removeColor(index, ci)}
                                          className="text-warm-300 hover:text-red-500"
                                        >
                                          <X className="h-3 w-3" />
                                        </button>
                                      </span>
                                    ))}
                                    <button
                                      type="button"
                                      onClick={() => addColor(index)}
                                      className="inline-flex items-center gap-0.5 rounded-full border border-dashed border-warm-300 px-1.5 py-0.5 text-[11px] text-warm-500 hover:border-primary-400 hover:text-primary-600"
                                    >
                                      <Plus className="h-3 w-3" /> {t('products.scan.colorChip')}
                                    </button>
                                  </div>

                                  {/* Tallas editables */}
                                  <div className="flex flex-wrap items-center gap-1">
                                    {(product.sizes ?? []).map((s) => (
                                      <span
                                        key={s}
                                        className="inline-flex items-center gap-0.5 rounded bg-warm-100 px-1.5 py-0.5 text-[10px] font-medium text-warm-600"
                                      >
                                        {s}
                                        <button
                                          type="button"
                                          onClick={() => removeSize(index, s)}
                                          className="text-warm-400 hover:text-red-500"
                                        >
                                          <X className="h-2.5 w-2.5" />
                                        </button>
                                      </span>
                                    ))}
                                    <input
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault()
                                          addSize(index, e.currentTarget.value)
                                          e.currentTarget.value = ''
                                        }
                                      }}
                                      className="w-16 rounded border border-dashed border-warm-300 px-1.5 py-0.5 text-[10px] focus:border-primary-400 focus:outline-none"
                                      placeholder={t('products.scan.sizePlaceholder')}
                                    />
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Input
                                value={product.description}
                                onChange={(e) => handleUpdateProduct(index, 'description', e.target.value)}
                                placeholder={t('products.scan.descPlaceholder')}
                                className="text-sm"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <Input
                                type="number"
                                step="0.01"
                                value={product.price}
                                onChange={(e) => handleUpdateProduct(index, 'price', parseFloat(e.target.value) || 0)}
                                placeholder={t('products.scan.pricePlaceholder')}
                                className="text-sm"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <Select
                                value={product.category}
                                onValueChange={(value) => handleUpdateProduct(index, 'category', value)}
                              >
                                <SelectTrigger className="text-sm h-9">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="General">{t('products.scan.general')}</SelectItem>
                                  {categories.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.name}>
                                      {cat.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => handleDeleteProduct(index)}
                                className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-red-50 text-red-500"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={handleAddProduct}
                  className="w-full gap-2"
                >
                  {t('products.scan.addProductBtn')}
                </Button>
              </>
            )}

            {detectedProducts.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-warm-500">{t('products.scan.noProducts')}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-warm-200">
              <Button
                variant="outline"
                onClick={() => setState('success')}
                className="flex-1"
              >
                {t('products.scan.back')}
              </Button>
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                {t('products.scan.cancel')}
              </Button>
              <Button
                onClick={handleAddProducts}
                disabled={isLoading || selectedCount === 0}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {t('products.scan.importing')}
                  </>
                ) : (
                  `${t('products.scan.importPre')}${selectedCount} ${selectedCount !== 1 ? t('products.countMany') : t('products.countOne')}`
                )}
              </Button>
            </div>
          </div>
        )}

        {state === 'error' && error && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <h2 className="text-xl font-bold text-night-800">{t('products.scan.errorScanTitle')}</h2>
            </div>
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
            {state === 'error' && processingProgress && Object.keys(processingProgress).length > 0 && (
              <Button
                onClick={() => setState('loaded')}
                className="w-full"
              >
                {t('products.scan.retry')}
              </Button>
            )}
            <Button variant="outline" onClick={handleClose} className="w-full">
              {t('products.scan.cancel')}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
