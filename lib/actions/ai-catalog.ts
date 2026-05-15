'use server'

import { db, catalogs, products, categories, memberships } from '@/db'
import { eq } from 'drizzle-orm'
import { auth } from '@/auth'

interface GeneratedCatalogData {
  catalogName: string
  description: string
  category: string
  products: Array<{
    name: string
    description: string
    price: number
  }>
}

export async function generateCatalogWithAI(businessType: string): Promise<GeneratedCatalogData> {
  // Simulación de generación con IA (reemplazar con OpenAI si disponible)
  const catalogs: Record<string, GeneratedCatalogData> = {
    'restaurant': {
      catalogName: 'Menú Restaurante',
      description: 'Catálogo digital de nuestro menú completo con platos deliciosos',
      category: 'Comidas',
      products: [
        {
          name: 'Hamburguesa Clásica',
          description: 'Pan tostado, carne de res 200g, lechuga, tomate y salsa especial',
          price: 25000,
        },
        {
          name: 'Pizza Margherita',
          description: 'Pizza de masa delgada con tomate, mozzarella y albahaca fresca',
          price: 32000,
        },
      ],
    },
    'store': {
      catalogName: 'Tienda de Ropa',
      description: 'Colección exclusiva de ropa casual y deportiva',
      category: 'Vestuario',
      products: [
        {
          name: 'Camiseta Premium',
          description: 'Camiseta 100% algodón, disponible en varios colores',
          price: 45000,
        },
        {
          name: 'Pantalón Deportivo',
          description: 'Pantalón cómodo para entrenamientos y uso casual',
          price: 65000,
        },
      ],
    },
    'cafe': {
      catalogName: 'Cafetería Artesanal',
      description: 'Nuestro menú de bebidas y postres artesanales',
      category: 'Bebidas',
      products: [
        {
          name: 'Café Espresso',
          description: 'Espresso preparado con granos seleccionados',
          price: 8000,
        },
        {
          name: 'Cappuccino',
          description: 'Cappuccino cremoso con arte latte personalizado',
          price: 12000,
        },
      ],
    },
  }

  return catalogs[businessType] || catalogs['store']
}

export async function createCatalogFromAI(businessType: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error('No autorizado')
    }

    // Obtener organización del usuario
    const membership = await db.query.memberships.findFirst({
      where: eq(memberships.userId, session.user.id),
    })

    if (!membership) {
      throw new Error('Usuario sin organización')
    }

    // Generar datos con "IA"
    const generatedData = await generateCatalogWithAI(businessType)

    // Crear catálogo
    const slug = generatedData.catalogName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')

    const catalogResult = await db.insert(catalogs).values({
      orgId: membership.organizationId,
      name: generatedData.catalogName,
      slug,
      status: 'draft',
      language: 'es',
      currency: 'COP',
      orderChannel: 'whatsapp',
      metadata: {
        coverTitle: generatedData.catalogName,
        coverDescription: generatedData.description,
        theme: 'primary',
        blocks: ['catalog'],
      },
    }).returning()

    const catalogId = catalogResult[0]?.id

    if (!catalogId) {
      throw new Error('Error al crear el catálogo')
    }

    // Crear categoría
    const categoryResult = await db.insert(categories).values({
      catalogId,
      name: generatedData.category,
      slug: generatedData.category.toLowerCase().replace(/\s+/g, '-'),
      description: `Categoría: ${generatedData.category}`,
    }).returning()

    const categoryId = categoryResult[0]?.id

    // Crear productos
    if (categoryId) {
      for (const product of generatedData.products) {
        await db.insert(products).values({
          catalogId,
          categoryId,
          name: product.name,
          description: product.description,
          price: product.price,
          currency: 'COP',
          status: 'active',
          metadata: {
            image: null,
            sku: null,
          },
        })
      }
    }

    return {
      success: true,
      catalogId,
      catalogName: generatedData.catalogName,
    }
  } catch (error) {
    console.error('Error creating catalog with AI:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}
