'use server'

import { db, products, catalogs, memberships, subscriptions, plans } from '@/db'
import { eq, and, inArray } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { z } from 'zod'
import { slugify } from '@/lib/utils'

const createProductSchema = z.object({
  catalogId: z.string().uuid(),
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.union([
    z.string().transform(v => v && v.trim() ? v : undefined),
    z.null().transform(() => undefined),
    z.undefined(),
  ]).optional(),
  price: z.number().min(0),
  compareAt: z.union([
    z.number().min(0),
    z.literal('').transform(() => undefined),
    z.null().transform(() => undefined),
    z.undefined(),
  ]).optional(),
  stock: z.union([
    z.number().int().min(0),
    z.null().transform(() => undefined),
    z.undefined(),
  ]).optional(),
  categoryId: z.union([
    z.string().uuid(),
    z.literal('').transform(() => undefined),
    z.null().transform(() => undefined),
    z.undefined(),
  ]).optional(),
  sku: z.union([
    z.string().transform(v => v && v.trim() ? v : undefined),
    z.null().transform(() => undefined),
    z.undefined(),
  ]).optional(),
  active: z.boolean().default(true),
  tags: z.union([
    z.array(z.string()),
    z.null().transform(() => undefined),
    z.undefined(),
  ]).optional(),
  image: z.union([
    z.string(),
    z.null().transform(() => undefined),
    z.undefined(),
  ]).optional(),
  isCartProduct: z.boolean().default(true),
  // Variantes manuales: colores (con imagen opcional) y/o tallas.
  variants: z
    .object({
      colors: z
        .array(
          z.object({
            name: z.string().min(1),
            hex: z.string().min(1),
            image: z.string().optional(),
          }),
        )
        .optional(),
      sizes: z
        .array(
          z.object({
            name: z.string().min(1),
            image: z.string().optional(),
          }),
        )
        .optional(),
    })
    .nullable()
    .optional(),
})

const updateProductSchema = createProductSchema.extend({
  id: z.string().uuid(),
})

export type CreateProductPayload = z.infer<typeof createProductSchema>
export type UpdateProductPayload = z.infer<typeof updateProductSchema>

type VariantsInput =
  | {
      colors?: { name: string; hex: string; image?: string }[]
      sizes?: { name: string; image?: string }[]
    }
  | null
  | undefined

/**
 * Construye el variantsJson a guardar a partir del payload del formulario.
 * Filtra colores/tallas vacíos y respeta un máximo de 5 imágenes en total
 * (imagen principal + imágenes por color + por talla). Devuelve [] si no hay.
 */
function buildVariantsJson(variants: VariantsInput, mainImage: string | null) {
  if (!variants) return []
  const colors = (variants.colors ?? []).filter((c) => c.name?.trim())
  const sizes = (variants.sizes ?? []).filter((s) => s.name?.trim())

  let imageBudget = 5 - (mainImage ? 1 : 0)
  const takeImage = (img?: string) => {
    if (img && imageBudget > 0) {
      imageBudget--
      return img
    }
    return undefined
  }

  const cappedColors = colors.map((c) => {
    const image = takeImage(c.image)
    return image ? { name: c.name.trim(), hex: c.hex, image } : { name: c.name.trim(), hex: c.hex }
  })
  const cappedSizes = sizes.map((s) => {
    const image = takeImage(s.image)
    return image ? { name: s.name.trim(), image } : { name: s.name.trim() }
  })

  const out: { colors?: typeof cappedColors; sizes?: typeof cappedSizes } = {}
  if (cappedColors.length) out.colors = cappedColors
  if (cappedSizes.length) out.sizes = cappedSizes
  return Object.keys(out).length ? out : []
}

export async function createProduct(payload: CreateProductPayload) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: 'No autenticado' }
  }

  const parsed = createProductSchema.safeParse(payload)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const { catalogId, name, description, price, compareAt, stock, categoryId, sku, active, image, variants } = parsed.data

  const catalog = await db.query.catalogs.findFirst({
    where: eq(catalogs.id, catalogId),
  })

  if (!catalog) {
    return { error: 'Catálogo no encontrado' }
  }

  // Check product limit for free users
  const membership = await db.query.memberships.findFirst({
    where: eq(memberships.userId, session.user.id),
    columns: { organizationId: true },
  })

  if (membership) {
    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.organizationId, membership.organizationId),
      columns: { planId: true },
    })

    if (subscription) {
      const plan = await db.query.plans.findFirst({
        where: eq(plans.id, subscription.planId),
        columns: { code: true },
      })

      if (plan?.code === 'free') {
        const productCount = await db.query.products.findMany({
          where: eq(products.catalogId, catalogId),
          columns: { id: true },
        })

        if (productCount.length >= 30) {
          return { error: 'Límite de 30 productos alcanzado en el plan gratis. Mejora tu plan para agregar más productos.' }
        }
      }
    }
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
        variantsJson: buildVariantsJson(variants, imageUrl),
        active,
        position: 0,
      })
      .returning()

    revalidatePath(`/app/catalogs/${catalogId}/products`)
    return {
      product: {
        id: product.id,
        name: product.name,
        description: product.description ?? undefined,
        price: product.price / 100,
        compareAt: product.compareAt ? product.compareAt / 100 : undefined,
        stock: product.stock ?? undefined,
        sku: product.sku ?? undefined,
        categoryId: product.categoryId ?? undefined,
        active: product.active,
        tags: [],
      }
    }
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

  const { id, catalogId, name, description, price, compareAt, stock, categoryId, sku, active, image, variants } = parsed.data

  const existingProduct = await db.query.products.findFirst({
    where: eq(products.id, id),
  })

  if (!existingProduct) {
    return { error: 'Producto no encontrado' }
  }

  const slug = slugify(name)

  let imageUrl: string | null = null
  if (image) {
    imageUrl = image
  }

  try {
    const [updatedProduct] = await db
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
        imagesJson: imageUrl ? [{ url: imageUrl, alt: name }] : [],
        variantsJson: buildVariantsJson(variants, imageUrl),
        active,
      })
      .where(eq(products.id, id))
      .returning()

    revalidatePath(`/app/catalogs/${catalogId}/products`)
    return {
      product: {
        id: updatedProduct.id,
        name: updatedProduct.name,
        description: updatedProduct.description ?? undefined,
        price: updatedProduct.price / 100,
        compareAt: updatedProduct.compareAt ? updatedProduct.compareAt / 100 : undefined,
        stock: updatedProduct.stock ?? undefined,
        sku: updatedProduct.sku ?? undefined,
        categoryId: updatedProduct.categoryId ?? undefined,
        active: updatedProduct.active,
        tags: [],
      }
    }
  } catch (error) {
    console.error('Error updating product:', error)
    return { error: 'Error al actualizar el producto' }
  }
}

export async function deleteProduct(id: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: 'No autenticado' }
  }

  try {
    await db.delete(products).where(eq(products.id, id))
    return { success: true }
  } catch (error) {
    console.error('Error deleting product:', error)
    return { error: 'Error al eliminar el producto' }
  }
}

/**
 * Elimina varios productos a la vez (borrado en bloque). Verifica que todos
 * pertenezcan al catálogo indicado antes de borrar, en una sola query.
 */
export async function deleteProducts(catalogId: string, ids: string[]) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: 'No autenticado' }
  }
  if (!Array.isArray(ids) || ids.length === 0) {
    return { error: 'No hay productos seleccionados' }
  }

  try {
    const deleted = await db
      .delete(products)
      .where(and(eq(products.catalogId, catalogId), inArray(products.id, ids)))
      .returning({ id: products.id })

    revalidatePath(`/app/catalogs/${catalogId}/products`)
    return { success: true, count: deleted.length }
  } catch (error) {
    console.error('Error deleting products:', error)
    return { error: 'Error al eliminar los productos' }
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
