'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { Search, Plus, Download, Upload, ChevronDown, ChevronUp, Zap, Loader2, X, Check, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { formatMoney } from '@/lib/utils'
import Link from 'next/link'
import { deleteProduct, deleteProducts, exportProductsToCSV, createProduct } from '@/lib/actions/products'
import { ScanMenuModal } from './scan-menu-modal'
import { useI18n } from '@/lib/i18n/context'

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
  const { t } = useI18n()
  const [productList, setProductList] = useState(products)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [expandedCategories, setExpandedCategories] = useState(true)
  const [sortBy, setSortBy] = useState('name')
  const [currentPage, setCurrentPage] = useState(1)
  const [isExporting, setIsExporting] = useState(false)
  const [isScanModalOpen, setIsScanModalOpen] = useState(false)
  const [isActionsOpen, setIsActionsOpen] = useState(false)
  const [isAddingProduct, setIsAddingProduct] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [formData, setFormData] = useState({ name: '', description: '', price: '', compareAt: '', stock: '', sku: '', categoryId: '' })
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
        a.download = `${t('products.list.productsWord').toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Error exporting:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleCreateProduct = () => {
    if (!formData.name.trim() || !formData.price) return
    startTransition(async () => {
      const result = await createProduct({
        catalogId,
        name: formData.name,
        description: formData.description || undefined,
        price: parseFloat(formData.price),
        compareAt: formData.compareAt ? parseFloat(formData.compareAt) : undefined,
        stock: formData.stock ? parseInt(formData.stock) : undefined,
        categoryId: formData.categoryId || undefined,
        sku: formData.sku || undefined,
      })
      if ('product' in result && result.product) {
        setProductList([...productList, result.product])
        setFormData({ name: '', description: '', price: '', compareAt: '', stock: '', sku: '', categoryId: '' })
        setIsAddingProduct(false)
      }
    })
  }

  const filteredProducts = productList.filter((product) => {
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

  // Selección múltiple (sobre TODOS los productos filtrados, no solo la página).
  const allFilteredSelected =
    sortedProducts.length > 0 && sortedProducts.every((p) => selectedIds.has(p.id))
  const selectedCount = selectedIds.size

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (sortedProducts.length > 0 && sortedProducts.every((p) => next.has(p.id))) {
        sortedProducts.forEach((p) => next.delete(p.id)) // deseleccionar todos
      } else {
        sortedProducts.forEach((p) => next.add(p.id)) // seleccionar todos
      }
      return next
    })
  }

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return
    const count = selectedIds.size
    if (
      !confirm(
        `${t('products.list.confirmBulkPre')}${count} ${count !== 1 ? t('products.countMany') : t('products.countOne')}${t('products.list.confirmBulkPost')}`,
      )
    )
      return
    setIsDeleting(true)
    setIsActionsOpen(false)
    try {
      const result = await deleteProducts(catalogId, Array.from(selectedIds))
      if ('success' in result && result.success) {
        setProductList((prev) => prev.filter((p) => !selectedIds.has(p.id)))
        setSelectedIds(new Set())
      }
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="px-4 py-6 mx-0 space-y-2 mb-6">
        <h2 className="text-2xl font-bold text-night-800">{t('products.list.title')}</h2>
        <p className="text-warm-600 text-sm">{t('products.list.subtitle')}</p>
      </div>
      <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-3 px-4">
        <div className="flex gap-2 flex-wrap justify-center">
          <Button
            onClick={() => setIsScanModalOpen(true)}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Zap className="h-4 w-4" />
            {t('products.list.scanMenu')}
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            {t('products.list.importCsv')}
          </Button>
        </div>
        <div className="h-6 w-px bg-warm-200 hidden sm:block" />
        <Button size="sm" className="gap-2" onClick={() => setIsAddingProduct(true)}>
          <Plus className="h-4 w-4" />
          {t('products.list.createNew')}
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-warm-400" />
          <input
            type="text"
            placeholder={t('products.list.searchPlaceholder')}
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
            {t('products.list.actionsMenu')}
            <ChevronDown className={`h-4 w-4 transition-transform ${isActionsOpen ? 'rotate-180' : ''}`} />
          </Button>
          {isActionsOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-lg border border-warm-200 bg-white shadow-lg z-10">
              <button type="button" className="w-full text-left px-4 py-2 text-sm hover:bg-warm-50" disabled>
                {t('products.list.bulkUpdate')}
              </button>
              <button type="button" className="w-full text-left px-4 py-2 text-sm hover:bg-warm-50" disabled>
                {t('products.list.duplicate')}
              </button>
              <button type="button" className="w-full text-left px-4 py-2 text-sm hover:bg-warm-50" disabled>
                {t('products.list.importCsv')}
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
                {isExporting ? t('products.list.exporting') : t('products.list.exportCsv')}
              </button>
              <button
                type="button"
                onClick={handleDeleteSelected}
                disabled={selectedCount === 0 || isDeleting}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:hover:bg-transparent"
              >
                {isDeleting
                  ? t('products.list.deleting')
                  : selectedCount > 0
                    ? `${t('products.list.delete')} (${selectedCount})`
                    : t('products.list.delete')}
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
          <span>{t('products.list.manageCategories')} ({categories.length})</span>
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
              {t('products.list.all')}
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
              {t('products.list.newCategory')}
            </Button>
          </div>
        )}
      </div>

      {selectedCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-red-700">
              {selectedCount} {selectedCount !== 1 ? t('products.list.selectedSuffixMany') : t('products.list.selectedSuffixOne')}
            </span>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="text-xs text-warm-500 underline hover:text-warm-700"
            >
              {t('products.list.clearSelection')}
            </button>
          </div>
          <Button
            variant="destructive"
            size="sm"
            className="gap-2"
            onClick={handleDeleteSelected}
            disabled={isDeleting}
          >
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            {isDeleting ? t('products.list.deleting') : `${t('products.list.delete')} ${selectedCount}`}
          </Button>
        </div>
      )}

      {paginatedProducts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-warm-200 bg-white py-12 text-center">
          <p className="text-warm-500">{t('products.list.emptySearch')}</p>
        </div>
      ) : (
        <div className="rounded-lg border border-warm-200 bg-white overflow-hidden shadow-card">
          <table className="w-full text-sm">
            <thead className="border-b border-warm-100 bg-warm-50">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    className="rounded cursor-pointer"
                    checked={allFilteredSelected}
                    onChange={toggleSelectAll}
                    title={t('products.list.selectAll')}
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-warm-400">
                  {t('products.list.thProduct')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-warm-400 hidden sm:table-cell">
                  {t('products.list.thCategory')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-warm-400 hidden md:table-cell">
                  {t('products.list.thTags')}
                </th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-warm-400">
                  {t('products.list.thPrice')}
                </th>
                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-warm-400">
                  {t('products.list.thStock')}
                </th>
                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-warm-400">
                  {t('products.list.thStatus')}
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
                      <input
                        type="checkbox"
                        className="rounded cursor-pointer"
                        checked={selectedIds.has(product.id)}
                        onChange={() => toggleSelect(product.id)}
                      />
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
                        {product.active ? t('products.list.active') : t('products.list.hidden')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/app/catalogs/${catalogId}/products/${product.id}`}>
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                          {t('products.list.edit')}
                        </Button>
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <div className="flex items-center justify-between border-t border-warm-100 px-4 py-3 bg-warm-50">
            <span className="text-sm text-warm-500">{sortedProducts.length} {t('products.list.productsWord')}</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                {t('products.list.previous')}
              </Button>
              <span className="text-sm text-warm-600">
                {t('products.list.pagePrefix')}{currentPage}{t('products.list.pageMid')}{totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                {t('products.list.next')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {isAddingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white shadow-lg">
            <div className="border-b border-warm-200 px-6 py-4">
              <h2 className="text-lg font-bold text-night-800">{t('products.dialog.newProduct')}</h2>
            </div>
            <div className="space-y-4 px-6 py-4 max-h-[70vh] overflow-y-auto">
              <div>
                <Label htmlFor="name">{t('products.form.nameLabel')}</Label>
                <Input
                  id="name"
                  placeholder={t('products.form.namePlaceholder')}
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  autoFocus
                />
              </div>
              <div>
                <Label htmlFor="description">{t('products.form.description')}</Label>
                <Textarea
                  id="description"
                  placeholder={t('products.form.descriptionPlaceholder')}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="price">{t('products.form.price')}</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="compareAt">{t('products.form.compareAt')}</Label>
                  <Input
                    id="compareAt"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    value={formData.compareAt}
                    onChange={(e) => setFormData({...formData, compareAt: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="stock">{t('products.form.stockUnlimited')}</Label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    placeholder="∞"
                    value={formData.stock}
                    onChange={(e) => setFormData({...formData, stock: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="sku">{t('products.form.sku')}</Label>
                  <Input
                    id="sku"
                    placeholder="ABC-001"
                    value={formData.sku}
                    onChange={(e) => setFormData({...formData, sku: e.target.value})}
                  />
                </div>
              </div>
              {categories.length > 0 && (
                <div>
                  <Label htmlFor="categoryId">{t('products.form.category')}</Label>
                  <select
                    id="categoryId"
                    value={formData.categoryId}
                    onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                    className="w-full rounded-md border border-warm-200 bg-white py-2 pl-3 pr-8 text-sm text-night-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">{t('products.form.noCategory')}</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="border-t border-warm-200 flex justify-end gap-3 px-6 py-4">
              <Button variant="outline" onClick={() => setIsAddingProduct(false)}>{t('products.form.cancel')}</Button>
              <Button
                onClick={handleCreateProduct}
                disabled={!formData.name.trim() || !formData.price || isPending}
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {t('products.dialog.createProduct')}
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
