'use client'

import { useState, useTransition } from 'react'
import { AlertCircle, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { deleteCatalog } from '@/lib/actions/catalogs'
import { useI18n } from '@/lib/i18n/context'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface DeleteCatalogModalProps {
  catalogId: string
  catalogName: string
}

export function DeleteCatalogModal({ catalogId, catalogName }: DeleteCatalogModalProps) {
  const { t } = useI18n()
  const [isPending, startTransition] = useTransition()
  const [confirmText, setConfirmText] = useState('')
  const [error, setError] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const handleDelete = async () => {
    if (confirmText !== catalogName) {
      setError(`${t('settings.deleteModal.mustTypePre')}${catalogName}${t('settings.deleteModal.mustTypePost')}`)
      return
    }

    setError('')
    startTransition(async () => {
      try {
        await deleteCatalog(catalogId)
      } catch (err) {
        setError(t('settings.deleteModal.genericError'))
      }
    })
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          size="sm"
          className="gap-2"
        >
          <Trash2 className="h-4 w-4" />
          {t('settings.deleteModal.trigger')}
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <AlertDialogTitle>{t('settings.deleteModal.title')}</AlertDialogTitle>
          </div>
        </AlertDialogHeader>

        <AlertDialogDescription className="space-y-4">
          <div>
            <p className="font-semibold text-night-900 mb-2">
              {t('settings.deleteModal.surePre')}{catalogName}{t('settings.deleteModal.surePost')}
            </p>
            <p className="text-sm text-night-600">
              {t('settings.deleteModal.desc')}
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-900">
              {t('settings.deleteModal.warn')}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-night-700">
              {t('settings.deleteModal.nameLabel')}
            </label>
            <Input
              type="text"
              placeholder={`${t('settings.deleteModal.placeholderPre')}${catalogName}`}
              value={confirmText}
              onChange={(e) => {
                setConfirmText(e.target.value)
                setError('')
              }}
              className={error ? 'border-red-500' : ''}
              disabled={isPending}
            />
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>
        </AlertDialogDescription>

        <div className="flex gap-3 justify-end pt-4">
          <AlertDialogCancel disabled={isPending}>
            {t('settings.deleteModal.cancel')}
          </AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending || confirmText !== catalogName}
            className="gap-2"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('settings.deleteModal.deleting')}
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                {t('settings.deleteModal.deleteForever')}
              </>
            )}
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
