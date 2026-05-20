'use client'

import { useState, useTransition } from 'react'
import { AlertCircle, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { deleteCatalog } from '@/lib/actions/catalogs'
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
  const [isPending, startTransition] = useTransition()
  const [confirmText, setConfirmText] = useState('')
  const [error, setError] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const handleDelete = async () => {
    if (confirmText !== catalogName) {
      setError(`Debes escribir el nombre exacto: "${catalogName}"`)
      return
    }

    setError('')
    startTransition(async () => {
      try {
        await deleteCatalog(catalogId)
      } catch (err) {
        setError('Error al eliminar el catálogo. Intenta nuevamente.')
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
          Eliminar catálogo
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <AlertDialogTitle>Eliminar catálogo</AlertDialogTitle>
          </div>
        </AlertDialogHeader>

        <AlertDialogDescription className="space-y-4">
          <div>
            <p className="font-semibold text-night-900 mb-2">
              ¿Estás seguro de que deseas eliminar "{catalogName}"?
            </p>
            <p className="text-sm text-night-600">
              Esta acción es irreversible. Se eliminarán todos los productos, categorías, pedidos y configuraciones asociadas a este catálogo.
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-900">
              ⚠️ Para confirmar la eliminación, escribe el nombre exacto del catálogo a continuación
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-night-700">
              Nombre del catálogo:
            </label>
            <Input
              type="text"
              placeholder={`Escribe: ${catalogName}`}
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
            Cancelar
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
                Eliminando...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Eliminar permanentemente
              </>
            )}
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
