import { NextResponse } from 'next/server'
import { db, categories, products, catalogs } from '@/db'
import { eq } from 'drizzle-orm'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const catalogId = 'c523cafb-9d0c-4413-a333-0bdf94cf190e'

    // Verify catalog exists
    const catalog = await db.query.catalogs.findFirst({
      where: eq(catalogs.id, catalogId),
    })

    if (!catalog) {
      return NextResponse.json({ error: 'Catalog not found' }, { status: 404 })
    }

    // Create categories
    const electronicsCategory = await db
      .insert(categories)
      .values({
        catalogId,
        name: 'Electronics',
        slug: 'electronics',
        position: 0,
        active: true,
      })
      .returning()

    const accessoriesCategory = await db
      .insert(categories)
      .values({
        catalogId,
        name: 'Accessories',
        slug: 'accessories',
        position: 1,
        active: true,
      })
      .returning()

    // Update products with category IDs
    const laptopUpdate = await db
      .update(products)
      .set({ categoryId: electronicsCategory[0].id })
      .where(eq(products.name, 'Laptop Gaming Pro'))
      .returning()

    const mouseUpdate = await db
      .update(products)
      .set({ categoryId: accessoriesCategory[0].id })
      .where(eq(products.name, 'Wireless Mouse Ultra'))
      .returning()

    return NextResponse.json({
      success: true,
      categories: {
        electronics: electronicsCategory[0],
        accessories: accessoriesCategory[0],
      },
      updatedProducts: {
        laptop: laptopUpdate,
        mouse: mouseUpdate,
      },
    })
  } catch (error) {
    console.error('Error fixing categories:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}
