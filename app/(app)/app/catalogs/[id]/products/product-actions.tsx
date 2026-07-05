'use client'
import { useState, useTransition } from 'react'
import { MoreHorizontal, Pencil, Trash2, Eye, EyeOff, Loader2 } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { updateProduct, deleteProduct, toggleProductActive } from '@/lib/actions/products'
import { useI18n } from '@/lib/i18n/context'

interface Product {
  id: string; name: string; description: string; price: number; compareAt?: number
  stock?: number; sku: string; categoryId: string; active: boolean
}

interface Props {
  product: Product
  catalogId: string
  categories: { id: string; name: string }[]
}

export function ProductActions({ product, catalogId, categories }: Props) {
  const { t } = useI18n()
  const [editOpen, setEditOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const onEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.append('active', product.active.toString())
    startTransition(async () => {
      await updateProduct(product.id, catalogId, fd)
      setEditOpen(false)
    })
  }

  const onToggle = () => startTransition(async () => {
    await toggleProductActive(product.id, catalogId, !product.active)
  })

  const onDelete = () => {
    if (!confirm(`${t('products.actions.confirmDeletePre')}${product.name}${t('products.actions.confirmDeletePost')}`)) return
    startTransition(async () => { await deleteProduct(product.id, catalogId) })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="rounded-lg p-1.5 text-warm-400 hover:bg-warm-100 hover:text-night-700">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4" /> {t('products.actions.edit')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onToggle}>
            {product.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {product.active ? t('products.actions.hide') : t('products.actions.show')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem destructive onClick={onDelete}>
            <Trash2 className="h-4 w-4" /> {t('products.actions.delete')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('products.dialog.editProduct')}</DialogTitle></DialogHeader>
          <form onSubmit={onEdit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t('products.form.nameLabel')}</Label>
              <Input name="name" defaultValue={product.name} required />
            </div>
            <div className="space-y-1.5">
              <Label>{t('products.form.description')}</Label>
              <Textarea name="description" defaultValue={product.description} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t('products.form.price')}</Label>
                <Input name="price" type="number" min="0" step="0.01" defaultValue={product.price} required />
              </div>
              <div className="space-y-1.5">
                <Label>{t('products.form.compareAt')}</Label>
                <Input name="compareAt" type="number" min="0" step="0.01" defaultValue={product.compareAt ?? ''} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t('products.form.stock')}</Label>
                <Input name="stock" type="number" min="0" defaultValue={product.stock ?? ''} />
              </div>
              <div className="space-y-1.5">
                <Label>{t('products.form.sku')}</Label>
                <Input name="sku" defaultValue={product.sku} />
              </div>
            </div>
            {categories.length > 0 && (
              <div className="space-y-1.5">
                <Label>{t('products.form.category')}</Label>
                <select name="categoryId" defaultValue={product.categoryId} className="w-full rounded-md border border-warm-200 bg-white py-2 pl-3 pr-8 text-sm text-night-800 focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="">{t('products.form.noCategory')}</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>{t('products.form.cancel')}</Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {t('products.dialog.saveChanges')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
