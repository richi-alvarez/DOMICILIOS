'use server'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { db, products } from '@/db'
import { slugify } from '@/lib/utils'

export async function createProduct(catalogId: string, formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autenticado')

  const name = formData.get('name') as string
  const slug = slugify(name) + '-' + Date.now().toString(36)

  await db.insert(products).values({
    catalogId,
    name,
    slug,
    description: (formData.get('description') as string) || null,
    price: Math.round(parseFloat((formData.get('price') as string) || '0') * 100),
    compareAt: formData.get('compareAt')
      ? Math.round(parseFloat(formData.get('compareAt') as string) * 100)
      : null,
    stock: formData.get('stock') ? parseInt(formData.get('stock') as string) : null,
    sku: (formData.get('sku') as string) || null,
    categoryId: (formData.get('categoryId') as string) || null,
    active: formData.get('active') !== 'false',
    imagesJson: [],
    variantsJson: [],
    position: 0,
  })

  revalidatePath(`/app/catalogs/${catalogId}/products`)
}

export async function updateProduct(productId: string, catalogId: string, formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autenticado')

  const name = formData.get('name') as string

  await db
    .update(products)
    .set({
      name,
      description: (formData.get('description') as string) || null,
      price: Math.round(parseFloat((formData.get('price') as string) || '0') * 100),
      compareAt: formData.get('compareAt')
        ? Math.round(parseFloat(formData.get('compareAt') as string) * 100)
        : null,
      stock: formData.get('stock') ? parseInt(formData.get('stock') as string) : null,
      sku: (formData.get('sku') as string) || null,
      categoryId: (formData.get('categoryId') as string) || null,
      active: formData.get('active') === 'true',
      updatedAt: new Date(),
    })
    .where(eq(products.id, productId))

  revalidatePath(`/app/catalogs/${catalogId}/products`)
}

export async function toggleProductActive(productId: string, catalogId: string, active: boolean) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autenticado')

  await db.update(products).set({ active, updatedAt: new Date() }).where(eq(products.id, productId))
  revalidatePath(`/app/catalogs/${catalogId}/products`)
}

export async function deleteProduct(productId: string, catalogId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autenticado')

  await db.delete(products).where(eq(products.id, productId))
  revalidatePath(`/app/catalogs/${catalogId}/products`)
}
