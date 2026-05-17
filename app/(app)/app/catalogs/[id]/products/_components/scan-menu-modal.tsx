'use client'

import { useState } from 'react'
import React from 'react'
import { X, Camera, FileText, Zap, Check, AlertCircle, Loader2, Trash2 } from 'lucide-react'
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

interface DetectedProduct {
  name: string
  description: string
  price: number
  category: string
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
  const [state, setState] = useState<ModalState>('initial')
  const [files, setFiles] = useState<File[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [processingProgress, setProcessingProgress] = useState<Record<string, 'processing' | 'done' | 'error'>>({})
  const [detectedProducts, setDetectedProducts] = useState<DetectedProduct[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const cameraInputRef = React.useRef<HTMLInputElement>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const additionalInputRef = React.useRef<HTMLInputElement>(null)

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
    if (selectedFiles) {
      const newFiles = Array.from(selectedFiles)
      setFiles((prev) => [...prev, ...newFiles])
      setState('loaded')
    }
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
        setError('No se encontraron productos en el menú escaneado.')
        setState('error')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al escanear el menú')
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
      setError(err instanceof Error ? err.message : 'Error al agregar productos')
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
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 hover:bg-warm-100"
        >
          <X className="h-5 w-5 text-warm-400" />
        </button>

        {state === 'initial' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary-500" />
              <h2 className="text-xl font-bold text-night-800">Sube fotos de tu menú</h2>
            </div>
            <p className="text-sm text-warm-500">
              Sube fotos, PDFs o documentos de tu menú y la IA extraerá tus productos
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
                Arrastra fotos de tu menú aquí
              </p>
              <p className="mt-1 text-xs text-warm-400">
                Imágenes JPG, PNG o PDF (máx 10MB por archivo)
              </p>

              <div className="mt-4 flex gap-2 justify-center">
                <Button
                  type="button"
                  size="sm"
                  className="gap-2"
                  onClick={() => cameraInputRef.current?.click()}
                >
                  <Camera className="h-4 w-4" />
                  Tomar foto
                </Button>
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  capture="environment"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileText className="h-4 w-4" />
                  Elegir archivo
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-lg bg-blue-50 p-3 text-xs text-blue-700">
              <span>🔒</span>
              <span>Tus imágenes se procesan de forma segura y no se almacenan</span>
            </div>

            <Button variant="outline" onClick={onClose} className="w-full">
              Cancelar
            </Button>
          </div>
        )}

        {state === 'loaded' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary-500" />
              <h2 className="text-xl font-bold text-night-800">Sube fotos de tu menú</h2>
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

              <div
                onClick={() => additionalInputRef.current?.click()}
                className="aspect-square rounded-lg border-2 border-dashed border-warm-200 flex items-center justify-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors"
              >
                <span className="text-2xl text-warm-300">+</span>
              </div>
              <input
                ref={additionalInputRef}
                type="file"
                accept="image/jpeg,image/png,application/pdf"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            <p className="text-sm text-warm-500">
              {files.length} imagen{files.length !== 1 ? 'es' : ''} lista{files.length !== 1 ? 's' : ''} para escanear
            </p>

            <Button
              onClick={handleScanMenu}
              disabled={isLoading}
              className="w-full gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Escaneando...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  Escanear menú
                </>
              )}
            </Button>

            <Button variant="outline" onClick={onClose} className="w-full">
              Cancelar
            </Button>
          </div>
        )}

        {state === 'processing' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary-500 animate-spin" />
              <h2 className="text-xl font-bold text-night-800">Analizando tu menú</h2>
            </div>
            <p className="text-sm text-warm-500">
              La IA está leyendo tu menú y extrayendo productos
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
                        ? 'Productos encontrados ✓'
                        : 'Procesando...'}
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
                {detectedProducts.length} productos encontrados
              </h2>
              <p className="text-sm text-warm-500 mt-1">
                Revisa los productos extraídos y personaliza los detalles antes de importar
              </p>
            </div>
            <div className="space-y-3">
              <Button
                onClick={() => setState('results')}
                className="w-full gap-2"
              >
                Revisar productos
                <Zap className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={onClose} className="w-full">
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {state === 'results' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary-500" />
              <div>
                <h2 className="text-xl font-bold text-night-800">Revisa los productos extraídos</h2>
                <p className="text-sm text-warm-500">Edita, elimina o agrega productos antes de importar</p>
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
                        ? 'Deseleccionar todos'
                        : 'Seleccionar todos'}
                    </span>
                  </div>
                  <span className="text-sm text-warm-600">
                    {selectedCount} de {detectedProducts.length} seleccionados
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
                          <th className="px-4 py-3 text-left font-semibold text-warm-600">Título</th>
                          <th className="px-4 py-3 text-left font-semibold text-warm-600">Descripción</th>
                          <th className="px-4 py-3 text-left font-semibold text-warm-600 w-24">Precio</th>
                          <th className="px-4 py-3 text-left font-semibold text-warm-600 w-32">Categoría</th>
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
                              <Input
                                value={product.name}
                                onChange={(e) => handleUpdateProduct(index, 'name', e.target.value)}
                                placeholder="Nombre del producto"
                                className="text-sm"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <Input
                                value={product.description}
                                onChange={(e) => handleUpdateProduct(index, 'description', e.target.value)}
                                placeholder="Descripción"
                                className="text-sm"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <Input
                                type="number"
                                step="0.01"
                                value={product.price}
                                onChange={(e) => handleUpdateProduct(index, 'price', parseFloat(e.target.value) || 0)}
                                placeholder="Precio"
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
                                  <SelectItem value="General">General</SelectItem>
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
                  + Agregar producto
                </Button>
              </>
            )}

            {detectedProducts.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-warm-500">😕 No hay productos para mostrar</p>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-warm-200">
              <Button
                variant="outline"
                onClick={() => setState('success')}
                className="flex-1"
              >
                Atrás
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAddProducts}
                disabled={isLoading || selectedCount === 0}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Importando...
                  </>
                ) : (
                  `Importar ${selectedCount} producto${selectedCount !== 1 ? 's' : ''}`
                )}
              </Button>
            </div>
          </div>
        )}

        {state === 'error' && error && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <h2 className="text-xl font-bold text-night-800">Error al escanear</h2>
            </div>
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
            {state === 'error' && processingProgress && Object.keys(processingProgress).length > 0 && (
              <Button
                onClick={() => setState('loaded')}
                className="w-full"
              >
                Intentar de nuevo
              </Button>
            )}
            <Button variant="outline" onClick={onClose} className="w-full">
              Cancelar
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
