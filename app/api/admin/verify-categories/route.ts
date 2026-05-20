import { NextResponse } from 'next/server'
import { db, categories, products, catalogs } from '@/db'
import { eq } from 'drizzle-orm'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  try {
    const catalogId = 'c523cafb-9d0c-4413-a333-0bdf94cf190e'

    // Get catalog
    const catalog = await db.query.catalogs.findFirst({
      where: eq(catalogs.id, catalogId),
    })

    if (!catalog) {
      return NextResponse.json(
        { error: 'Catalog not found', success: false },
        { status: 404 }
      )
    }

    // Get categories
    const catalogCategories = await db.query.categories.findMany({
      where: eq(categories.catalogId, catalogId),
    })

    // Get products
    const catalogProducts = await db.query.products.findMany({
      where: eq(products.catalogId, catalogId),
    })

    // Verify each product has a category
    const productsCategoryStatus = catalogProducts.map((p) => {
      const category = catalogCategories.find((c) => c.id === p.categoryId)
      return {
        id: p.id,
        name: p.name,
        price: p.price,
        categoryId: p.categoryId,
        categoryName: category?.name || null,
        hasCategoryAssigned: !!p.categoryId,
      }
    })

    const allProductsHaveCategories = productsCategoryStatus.every((p) => p.hasCategoryAssigned)

    return NextResponse.json({
      success: true,
      catalog: {
        id: catalog.id,
        name: catalog.name,
        slug: catalog.slug,
      },
      categories: catalogCategories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        productCount: catalogProducts.filter((p) => p.categoryId === c.id).length,
      })),
      products: productsCategoryStatus,
      summary: {
        totalProducts: catalogProducts.length,
        totalCategories: catalogCategories.length,
        productsWithCategories: productsCategoryStatus.filter((p) => p.hasCategoryAssigned).length,
        allProductsHaveCategories,
        testStatus: allProductsHaveCategories ? 'PASS' : 'FAIL',
      },
      tests: {
        categoriesExist: catalogCategories.length > 0 ? 'PASS' : 'FAIL',
        productsExist: catalogProducts.length > 0 ? 'PASS' : 'FAIL',
        allProductsAssigned: allProductsHaveCategories ? 'PASS' : 'FAIL',
        correctCategoryCount: catalogCategories.length === 2 ? 'PASS' : 'FAIL',
        correctProductCount: catalogProducts.length === 2 ? 'PASS' : 'FAIL',
      },
    })
  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error), success: false },
      { status: 500 }
    )
  }
}
