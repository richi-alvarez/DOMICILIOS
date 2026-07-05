'use client'
import { useState, useTransition } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createProduct } from '@/lib/actions/products'
import { useI18n } from '@/lib/i18n/context'

interface Props {
  catalogId: string
  categories: { id: string; name: string }[]
  trigger?: React.ReactNode
}

export function NewProductDialog({ catalogId, categories, trigger }: Props) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      await createProduct(catalogId, fd)
      setOpen(false)
    })
  }

  return (
    <>
      <div onClick={() => setOpen(true)}>
        {trigger ?? (
          <Button>
            <Plus className="h-4 w-4" /> {t('products.dialog.addProduct')}
          </Button>
        )}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('products.dialog.newProduct')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">{t('products.form.nameLabel')}</Label>
              <Input id="name" name="name" placeholder={t('products.form.namePlaceholder')} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">{t('products.form.description')}</Label>
              <Textarea id="description" name="description" placeholder={t('products.form.descriptionPlaceholder')} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="price">{t('products.form.price')}</Label>
                <Input id="price" name="price" type="number" min="0" step="0.01" placeholder="0" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="compareAt">{t('products.form.compareAt')}</Label>
                <Input id="compareAt" name="compareAt" type="number" min="0" step="0.01" placeholder="0" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="stock">{t('products.form.stockUnlimited')}</Label>
                <Input id="stock" name="stock" type="number" min="0" placeholder="∞" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sku">{t('products.form.sku')}</Label>
                <Input id="sku" name="sku" placeholder="ABC-001" />
              </div>
            </div>
            {categories.length > 0 && (
              <div className="space-y-1.5">
                <Label htmlFor="categoryId">{t('products.form.category')}</Label>
                <select name="categoryId" className="w-full rounded-md border border-warm-200 bg-white py-2 pl-3 pr-8 text-sm text-night-800 focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="">{t('products.form.noCategory')}</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t('products.form.cancel')}</Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {t('products.dialog.createProduct')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
