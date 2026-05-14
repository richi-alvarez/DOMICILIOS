'use client'
import { useState, useTransition } from 'react'
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, Check, X, Loader2, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createCategory, updateCategory, deleteCategory, moveCategoryUp, moveCategoryDown } from '@/lib/actions/categories'

interface Category { id: string; name: string; slug: string; active: boolean; position: number }

export function CategoryList({ catalogId, initialCategories }: { catalogId: string; initialCategories: Category[] }) {
  const [categories, setCategories] = useState(initialCategories)
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleAdd = () => {
    if (!newName.trim()) return
    const fd = new FormData()
    fd.append('name', newName.trim())
    startTransition(async () => {
      await createCategory(catalogId, fd)
      setNewName('')
      setAdding(false)
    })
  }

  const handleEdit = (id: string) => {
    if (!editName.trim()) return
    const fd = new FormData()
    fd.append('name', editName.trim())
    startTransition(async () => {
      await updateCategory(id, catalogId, fd)
      setEditingId(null)
    })
  }

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`¿Eliminar la categoría "${name}"?`)) return
    startTransition(async () => { await deleteCategory(id, catalogId) })
  }

  const handleMoveUp = (id: string) => startTransition(async () => { await moveCategoryUp(id, catalogId) })
  const handleMoveDown = (id: string) => startTransition(async () => { await moveCategoryDown(id, catalogId) })

  return (
    <div className="space-y-3">
      {categories.length === 0 && !adding && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-warm-200 bg-white py-12 text-center">
          <Tag className="mb-3 h-8 w-8 text-warm-300" />
          <p className="font-medium text-night-800">Sin categorías</p>
          <p className="mt-1 text-sm text-warm-500">Crea categorías para organizar tus productos.</p>
        </div>
      )}

      {categories.map((cat, idx) => (
        <div key={cat.id} className="flex items-center gap-3 rounded-xl border border-warm-200 bg-white p-4 shadow-card">
          {/* Reorder */}
          <div className="flex flex-col gap-0.5">
            <button onClick={() => handleMoveUp(cat.id)} disabled={idx === 0 || isPending} className="rounded p-0.5 text-warm-300 hover:text-night-700 disabled:opacity-30">
              <ChevronUp className="h-4 w-4" />
            </button>
            <button onClick={() => handleMoveDown(cat.id)} disabled={idx === categories.length - 1 || isPending} className="rounded p-0.5 text-warm-300 hover:text-night-700 disabled:opacity-30">
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>

          {/* Name */}
          <div className="flex-1">
            {editingId === cat.id ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleEdit(cat.id); if (e.key === 'Escape') setEditingId(null) }}
                  className="h-8"
                  autoFocus
                />
                <button onClick={() => handleEdit(cat.id)} className="rounded-lg p-1.5 text-lime-600 hover:bg-lime-50">
                  <Check className="h-4 w-4" />
                </button>
                <button onClick={() => setEditingId(null)} className="rounded-lg p-1.5 text-warm-400 hover:bg-warm-100">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div>
                <p className="font-medium text-night-800">{cat.name}</p>
                <p className="text-xs text-warm-400">/{cat.slug}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          {editingId !== cat.id && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => { setEditingId(cat.id); setEditName(cat.name) }}
                className="rounded-lg p-1.5 text-warm-400 hover:bg-warm-100 hover:text-night-700"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDelete(cat.id, cat.name)}
                disabled={isPending}
                className="rounded-lg p-1.5 text-warm-400 hover:bg-red-50 hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      ))}

      {/* Add new */}
      {adding ? (
        <div className="flex items-center gap-2 rounded-xl border-2 border-primary-300 bg-primary-50 p-4">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false) }}
            placeholder="Nombre de la categoría"
            className="flex-1"
            autoFocus
          />
          <Button size="sm" onClick={handleAdd} disabled={!newName.trim() || isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Guardar
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex w-full items-center gap-2 rounded-xl border-2 border-dashed border-warm-200 p-4 text-sm font-medium text-warm-400 transition-colors hover:border-primary-300 hover:text-primary-500"
        >
          <Plus className="h-4 w-4" />
          Agregar categoría
        </button>
      )}
    </div>
  )
}
