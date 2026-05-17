'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Plus, Download, Upload, ChevronDown, ChevronUp, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatMoney } from '@/lib/utils'
import Link from 'next/link'
import { deleteProduct, exportProductsToCSV } from '@/lib/actions/products'
import { ScanMenuModal } from './scan-menu-modal'

interface Product {
  id: string
  name: string
  description?: string
  price: number
  compareAt?: number
  stock?: number
  sku?: string
  categoryId?: string
  image?: string
  active: boolean
  tags?: string[]
}

interface Category {
  id: string
  name: string
}

interface ProductsListProps {
  products: Product[]
  categories: Category[]
  catalogId: string
  currency: string
}

export function ProductsList({ products, categories, catalogId, currency }: ProductsListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [expandedCategories, setExpandedCategories] = useState(true)
  const [sortBy, setSortBy] = useState('name')
  const [currentPage, setCurrentPage] = useState(1)
  const [isExporting, setIsExporting] = useState(false)
  const [isScanModalOpen, setIsScanModalOpen] = useState(false)
  const [isActionsOpen, setIsActionsOpen] = useState(false)
  const actionsRef = useRef<HTMLDivElement>(null)
  const itemsPerPage = 15

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsRef.current && !actionsRef.current.contains(event.target as Node)) {
        setIsActionsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleExportCSV = async () => {
    setIsExporting(true)
    try {
      const result = await exportProductsToCSV(catalogId)
      if ('csv' in result && result.csv) {
        const blob = new Blob([result.csv], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `productos-${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Error exporting:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !selectedCategory || product.categoryId === selectedCategory
    return matchesSearch && matchesCategory
  })

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return a.price - b.price
      case 'name':
      default:
        return a.name.localeCompare(b.name)
    }
  })

  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage)
  const startIdx = (currentPage - 1) * itemsPerPage
  const paginatedProducts = sortedProducts.slice(startIdx, startIdx + itemsPerPage)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            onClick={() => setIsScanModalOpen(true)}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Zap className="h-4 w-4" />
            Escanear menú
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Importar CSV
          </Button>
        </div>
        <Link href={`/app/catalogs/${catalogId}/products/new`}>
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Crear nuevo
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-warm-400" />
          <input
            type="text"
            placeholder="Buscar por título, categoría o precio"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-warm-200 pl-10 pr-4 py-2 text-sm focus:border-primary-500 focus:outline-none"
          />
        </div>
        <div className="relative" ref={actionsRef}>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setIsActionsOpen(!isActionsOpen)}
          >
            Acciones
            <ChevronDown className={`h-4 w-4 transition-transform ${isActionsOpen ? 'rotate-180' : ''}`} />
          </Button>
          {isActionsOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-lg border border-warm-200 bg-white shadow-lg z-10">
              <button type="button" className="w-full text-left px-4 py-2 text-sm hover:bg-warm-50" disabled>
                Actualización masiva
              </button>
              <button type="button" className="w-full text-left px-4 py-2 text-sm hover:bg-warm-50" disabled>
                Duplicar
              </button>
              <button type="button" className="w-full text-left px-4 py-2 text-sm hover:bg-warm-50" disabled>
                Importar CSV
              </button>
              <button
                type="button"
                onClick={() => {
                  handleExportCSV()
                  setIsActionsOpen(false)
                }}
                disabled={isExporting}
                className="w-full text-left px-4 py-2 text-sm hover:bg-warm-50 disabled:opacity-50"
              >
                {isExporting ? 'Exportando...' : 'Exportar a CSV'}
              </button>
              <button type="button" className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50" disabled>
                Eliminar
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-warm-200 bg-white p-4">
        <button
          onClick={() => setExpandedCategories(!expandedCategories)}
          className="flex w-full items-center justify-between font-medium text-night-800"
        >
          <span>Administrar Categorías ({categories.length})</span>
          {expandedCategories ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {expandedCategories && (
          <div className="mt-4 space-y-2">
            <button
              onClick={() => setSelectedCategory('')}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                !selectedCategory ? 'bg-primary-50 text-primary-600' : 'hover:bg-warm-50'
              }`}
            >
              Todas
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedCategory === cat.id ? 'bg-primary-50 text-primary-600' : 'hover:bg-warm-50'
                }`}
              >
                {cat.name}
              </button>
            ))}
            <Button variant="outline" size="sm" className="w-full gap-2 mt-2">
              <Plus className="h-4 w-4" />
              Nueva categoría
            </Button>
          </div>
        )}
      </div>

      {paginatedProducts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-warm-200 bg-white py-12 text-center">
          <p className="text-warm-500">No hay productos que coincidan con tu búsqueda</p>
        </div>
      ) : (
        <div className="rounded-lg border border-warm-200 bg-white overflow-hidden shadow-card">
          <table className="w-full text-sm">
            <thead className="border-b border-warm-100 bg-warm-50">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input type="checkbox" className="rounded" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-warm-400">
                  Producto
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-warm-400 hidden sm:table-cell">
                  Categoría
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-warm-400 hidden md:table-cell">
                  Etiquetas
                </th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-warm-400">
                  Precio
                </th>
                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-warm-400">
                  Stock
                </th>
                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-warm-400">
                  Estado
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-100">
              {paginatedProducts.map((product) => {
                const cat = categories.find((c) => c.id === product.categoryId)
                return (
                  <tr key={product.id} className="hover:bg-warm-50 transition-colors group">
                    <td className="px-4 py-3">
                      <input type="checkbox" className="rounded" />
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-night-800">{product.name}</p>
                        {product.sku && <p className="text-xs text-warm-400">ID: {product.sku}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-warm-500">{cat?.name ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {product.tags && product.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {product.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {product.tags.length > 2 && <span className="text-xs text-warm-400">+{product.tags.length - 2}</span>}
                        </div>
                      ) : (
                        <span className="text-warm-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-night-800">
                      {formatMoney(product.price, currency)}
                      {product.compareAt && (
                        <span className="ml-1 text-xs text-warm-400 line-through">
                          {formatMoney(product.compareAt, currency)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {product.stock !== undefined ? (
                        <span className={product.stock === 0 ? 'text-red-500 font-medium' : 'text-night-700'}>
                          {product.stock}
                        </span>
                      ) : (
                        <span className="text-warm-400">∞</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={product.active ? 'lime' : 'muted'}>
                        {product.active ? 'Activo' : 'Oculto'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/app/catalogs/${catalogId}/products/${product.id}`}>
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                          Editar
                        </Button>
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <div className="flex items-center justify-between border-t border-warm-100 px-4 py-3 bg-warm-50">
            <span className="text-sm text-warm-500">{sortedProducts.length} Productos</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <span className="text-sm text-warm-600">
                Página {currentPage} de {totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </div>
      )}

      <ScanMenuModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        catalogId={catalogId}
        categories={categories}
      />
    </div>
  )
}
