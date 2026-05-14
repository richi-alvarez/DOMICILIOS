'use server'

import { eq, asc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { db, categories } from '@/db'
import { slugify } from '@/lib/utils'

export async function createCategory(catalogId: string, formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autenticado')

  const name = formData.get('name') as string
  const existing = await db.query.categories.findMany({ where: eq(categories.catalogId, catalogId) })

  await db.insert(categories).values({
    catalogId,
    name,
    slug: slugify(name),
    position: existing.length,
    active: true,
  })

  revalidatePath(`/app/catalogs/${catalogId}/categories`)
}

export async function updateCategory(categoryId: string, catalogId: string, formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autenticado')

  await db
    .update(categories)
    .set({ name: formData.get('name') as string })
    .where(eq(categories.id, categoryId))

  revalidatePath(`/app/catalogs/${catalogId}/categories`)
}

export async function deleteCategory(categoryId: string, catalogId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autenticado')

  await db.delete(categories).where(eq(categories.id, categoryId))
  revalidatePath(`/app/catalogs/${catalogId}/categories`)
}

export async function moveCategoryUp(categoryId: string, catalogId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autenticado')

  const all = await db.query.categories.findMany({
    where: eq(categories.catalogId, catalogId),
    orderBy: asc(categories.position),
  })

  const idx = all.findIndex((c) => c.id === categoryId)
  if (idx <= 0) return

  await db.update(categories).set({ position: all[idx - 1].position }).where(eq(categories.id, categoryId))
  await db.update(categories).set({ position: all[idx].position }).where(eq(categories.id, all[idx - 1].id))

  revalidatePath(`/app/catalogs/${catalogId}/categories`)
}

export async function moveCategoryDown(categoryId: string, catalogId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autenticado')

  const all = await db.query.categories.findMany({
    where: eq(categories.catalogId, catalogId),
    orderBy: asc(categories.position),
  })

  const idx = all.findIndex((c) => c.id === categoryId)
  if (idx >= all.length - 1) return

  await db.update(categories).set({ position: all[idx + 1].position }).where(eq(categories.id, categoryId))
  await db.update(categories).set({ position: all[idx].position }).where(eq(categories.id, all[idx + 1].id))

  revalidatePath(`/app/catalogs/${catalogId}/categories`)
}
