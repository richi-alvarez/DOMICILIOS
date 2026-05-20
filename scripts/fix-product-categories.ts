import { db, categories, products, catalogs } from '@/db'
import { eq } from 'drizzle-orm'

async function fixProductCategories() {
  try {
    const catalogId = 'c523cafb-9d0c-4413-a333-0bdf94cf190e'

    // Verify catalog exists
    const catalog = await db.query.catalogs.findFirst({
      where: eq(catalogs.id, catalogId),
    })

    if (!catalog) {
      console.error('Catalog not found')
      return
    }

    console.log('Found catalog:', catalog.name)

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

    console.log('Created categories:', {
      electronics: electronicsCategory[0].id,
      accessories: accessoriesCategory[0].id,
    })

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

    console.log('Updated products:')
    console.log('- Laptop Gaming Pro -> Electronics')
    console.log('- Wireless Mouse Ultra -> Accessories')

    console.log('✅ Categories and products updated successfully!')
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

fixProductCategories()
