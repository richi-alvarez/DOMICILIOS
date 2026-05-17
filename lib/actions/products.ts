'use server'

import { db, products, catalogs } from '@/db'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { z } from 'zod'
import { slugify } from '@/lib/utils'

const createProductSchema = z.object({
  catalogId: z.string().uuid(),
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  price: z.number().min(0),
  compareAt: z.number().optional(),
  stock: z.number().int().optional(),
  categoryId: z.string().uuid().optional(),
  sku: z.string().optional(),
  active: z.boolean().default(true),
  tags: z.array(z.string()).optional(),
  image: z.string().optional(),
  isCartProduct: z.boolean().default(true),
})

const updateProductSchema = createProductSchema.extend({
  id: z.string().uuid(),
})

export type CreateProductPayload = z.infer<typeof createProductSchema>
export type UpdateProductPayload = z.infer<typeof updateProductSchema>

export async function createProduct(payload: CreateProductPayload) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: 'No autenticado' }
  }

  const parsed = createProductSchema.safeParse(payload)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const { catalogId, name, description, price, compareAt, stock, categoryId, sku, active, image } = parsed.data

  const catalog = await db.query.catalogs.findFirst({
    where: eq(catalogs.id, catalogId),
  })

  if (!catalog) {
    return { error: 'Catálogo no encontrado' }
  }

  const slug = slugify(name)

  let imageUrl: string | null = null
  if (image) {
    imageUrl = image
  }

  try {
    const [product] = await db
      .insert(products)
      .values({
        catalogId,
        name,
        slug,
        description: description || null,
        price: Math.round(price * 100),
        compareAt: compareAt ? Math.round(compareAt * 100) : null,
        stock: stock ?? null,
        categoryId: categoryId || null,
        sku: sku || null,
        imagesJson: imageUrl ? [{ url: imageUrl, alt: name }] : [],
        active,
        position: 0,
      })
      .returning()

    revalidatePath(`/app/catalogs/${catalogId}/products`)
    return { product: { id: product.id, name: product.name } }
  } catch (error) {
    console.error('Error creating product:', error)
    return { error: 'Error al crear el producto' }
  }
}

export async function updateProduct(payload: UpdateProductPayload) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: 'No autenticado' }
  }

  const parsed = updateProductSchema.safeParse(payload)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const { id, catalogId, name, description, price, compareAt, stock, categoryId, sku, active, image } = parsed.data

  const existingProduct = await db.query.products.findFirst({
    where: eq(products.id, id),
  })

  if (!existingProduct) {
    return { error: 'Producto no encontrado' }
  }

  const slug = name !== existingProduct.name ? slugify(name) : existingProduct.slug

  let imagesJson = existingProduct.imagesJson as Array<{ url: string; alt: string }>
  if (image) {
    imagesJson = [{ url: image, alt: name }]
  }

  try {
    await db
      .update(products)
      .set({
        name,
        slug,
        description: description || null,
        price: Math.round(price * 100),
        compareAt: compareAt ? Math.round(compareAt * 100) : null,
        stock: stock ?? null,
        categoryId: categoryId || null,
        sku: sku || null,
        imagesJson,
        active,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))

    revalidatePath(`/app/catalogs/${catalogId}/products`)
    revalidatePath(`/app/catalogs/${catalogId}/products/${id}`)
    return { product: { id, name } }
  } catch (error) {
    console.error('Error updating product:', error)
    return { error: 'Error al actualizar el producto' }
  }
}

export async function deleteProduct(productId: string, catalogId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: 'No autenticado' }
  }

  const product = await db.query.products.findFirst({
    where: eq(products.id, productId),
  })

  if (!product) {
    return { error: 'Producto no encontrado' }
  }

  try {
    await db.delete(products).where(eq(products.id, productId))
    revalidatePath(`/app/catalogs/${catalogId}/products`)
    return { ok: true }
  } catch (error) {
    console.error('Error deleting product:', error)
    return { error: 'Error al eliminar el producto' }
  }
}

export async function reorderProducts(
  catalogId: string,
  productIds: string[],
): Promise<{ ok: boolean } | { error: string }> {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: 'No autenticado' }
  }

  try {
    for (let i = 0; i < productIds.length; i++) {
      await db
        .update(products)
        .set({ position: i })
        .where(eq(products.id, productIds[i]))
    }

    revalidatePath(`/app/catalogs/${catalogId}/products`)
    return { ok: true }
  } catch (error) {
    console.error('Error reordering products:', error)
    return { error: 'Error al reordenar productos' }
  }
}

export async function bulkUpdateProducts(
  catalogId: string,
  productIds: string[],
  updates: Partial<CreateProductPayload>,
): Promise<{ ok: boolean } | { error: string }> {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: 'No autenticado' }
  }

  try {
    for (const id of productIds) {
      const product = await db.query.products.findFirst({
        where: eq(products.id, id),
      })

      if (!product) continue

      const updateData: any = {}
      if (updates.price !== undefined) updateData.price = Math.round(updates.price * 100)
      if (updates.compareAt !== undefined) updateData.compareAt = Math.round(updates.compareAt * 100)
      if (updates.stock !== undefined) updateData.stock = updates.stock
      if (updates.active !== undefined) updateData.active = updates.active
      if (updates.categoryId !== undefined) updateData.categoryId = updates.categoryId

      if (Object.keys(updateData).length > 0) {
        await db
          .update(products)
          .set({
            ...updateData,
            updatedAt: new Date(),
          })
          .where(eq(products.id, id))
      }
    }

    revalidatePath(`/app/catalogs/${catalogId}/products`)
    return { ok: true }
  } catch (error) {
    console.error('Error bulk updating products:', error)
    return { error: 'Error al actualizar productos' }
  }
}

export async function exportProductsToCSV(
  catalogId: string,
): Promise<{ csv: string } | { error: string }> {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: 'No autenticado' }
  }

  try {
    const productList = await db.query.products.findMany({
      where: eq(products.catalogId, catalogId),
    })

    if (productList.length === 0) {
      return { csv: '' }
    }

    const headers = ['ID', 'Nombre', 'Descripción', 'Precio', 'Precio Oferta', 'Stock', 'SKU', 'Activo']
    const rows = productList.map((p) => [
      p.id,
      p.name,
      p.description || '',
      (p.price / 100).toString(),
      p.compareAt ? (p.compareAt / 100).toString() : '',
      p.stock?.toString() || '',
      p.sku || '',
      p.active ? 'Sí' : 'No',
    ])

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')

    return { csv }
  } catch (error) {
    console.error('Error exporting products:', error)
    return { error: 'Error al exportar productos' }
  }
}
