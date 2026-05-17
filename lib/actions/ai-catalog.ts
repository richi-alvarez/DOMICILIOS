'use server'

import { db, catalogs, products, categories, memberships } from '@/db'
import { eq } from 'drizzle-orm'
import { auth } from '@/auth'
import { CATALOG_GENERATION_SYSTEM_PROMPT } from '@/lib/prompts/catalog-generation'

interface GeneratedProduct {
  name: string
  description: string
  price: number
  category: string
}

interface GeneratedCatalogData {
  catalogName: string
  description: string
  categories: Array<{
    name: string
    description: string
  }>
  products: GeneratedProduct[]
}

export async function generateCatalogWithAI(businessType: string): Promise<GeneratedCatalogData> {
  try {
    // Importación dinámica para evitar problemas de bundling
    const { default: Anthropic } = await import('@anthropic-ai/sdk')
    const client = new Anthropic()

    // Crear prompt específico para el tipo de negocio
    const userPrompt = `Genera un catálogo profesional para un negocio de tipo: "${businessType}"

Características requeridas:
- Nombre atractivo y profesional
- Descripción breve (máx 150 caracteres)
- 1-2 categorías principales relevantes
- 8-12 productos variados con precios realistas
- Descripciones vendedoras y concisas

Responde SOLO con JSON válido.`

    const response = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 2048,
      system: CATALOG_GENERATION_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    })

    // Extraer respuesta de texto
    const textContent = response.content.find((block) => block.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in response from Claude')
    }

    // Parsear JSON respuesta
    const jsonText = textContent.text.trim()
    let generatedData: GeneratedCatalogData

    try {
      // Intentar extraer JSON si Claude lo envolvió en markdown
      let cleanedText = jsonText
      if (jsonText.includes('```json')) {
        cleanedText = jsonText.split('```json')[1].split('```')[0].trim()
      } else if (jsonText.includes('```')) {
        cleanedText = jsonText.split('```')[1].split('```')[0].trim()
      }

      generatedData = JSON.parse(cleanedText)
    } catch (parseError) {
      console.error('Failed to parse Claude response:', jsonText.substring(0, 300))
      throw new Error('Invalid JSON response from Claude')
    }

    // Validar estructura mínima
    if (!generatedData.catalogName || !generatedData.description || !generatedData.products) {
      throw new Error('Generated data missing required fields')
    }

    // Asegurar que todos los productos tengan categoría
    if (generatedData.products.length > 0 && !generatedData.products[0].category) {
      // Si no hay categoría, asignar la primera categoría disponible
      const firstCategory = generatedData.categories?.[0]?.name || businessType
      generatedData.products = generatedData.products.map((p) => ({
        ...p,
        category: p.category || firstCategory,
      }))
    }

    return generatedData
  } catch (error) {
    console.error('[Catalog Generation] Error:', error)
    // Fallback a datos por defecto si Claude falla
    return generateCatalogFallback(businessType)
  }
}

// Fallback con datos por defecto cuando falla la API
function generateCatalogFallback(businessType: string): GeneratedCatalogData {
  const fallbacks: Record<string, GeneratedCatalogData> = {
    restaurant: {
      catalogName: 'Menú Restaurante',
      description: 'Catálogo digital de nuestro menú completo con platos deliciosos',
      categories: [{ name: 'Comidas', description: 'Platos principales' }],
      products: [
        {
          name: 'Hamburguesa Clásica',
          description: 'Pan tostado, carne de res 200g, lechuga, tomate y salsa especial',
          price: 25000,
          category: 'Comidas',
        },
        {
          name: 'Pizza Margherita',
          description: 'Pizza de masa delgada con tomate, mozzarella y albahaca fresca',
          price: 32000,
          category: 'Comidas',
        },
      ],
    },
    cafe: {
      catalogName: 'Cafetería Artesanal',
      description: 'Nuestro menú de bebidas y postres artesanales',
      categories: [{ name: 'Bebidas', description: 'Bebidas variadas' }],
      products: [
        {
          name: 'Café Espresso',
          description: 'Espresso preparado con granos seleccionados',
          price: 8000,
          category: 'Bebidas',
        },
        {
          name: 'Cappuccino',
          description: 'Cappuccino cremoso con arte latte personalizado',
          price: 12000,
          category: 'Bebidas',
        },
      ],
    },
    store: {
      catalogName: 'Tienda de Ropa',
      description: 'Colección exclusiva de ropa casual y deportiva',
      categories: [{ name: 'Vestuario', description: 'Prendas de vestir' }],
      products: [
        {
          name: 'Camiseta Premium',
          description: 'Camiseta 100% algodón, disponible en varios colores',
          price: 45000,
          category: 'Vestuario',
        },
        {
          name: 'Pantalón Deportivo',
          description: 'Pantalón cómodo para entrenamientos y uso casual',
          price: 65000,
          category: 'Vestuario',
        },
      ],
    },
  }

  return fallbacks[businessType] || fallbacks.store
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

    // Generar datos con IA real
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

    // Crear categorías y mapear productos
    const categoryMap = new Map<string, string>()

    for (const categoryData of generatedData.categories) {
      const categoryResult = await db.insert(categories).values({
        catalogId,
        name: categoryData.name,
        slug: categoryData.name.toLowerCase().replace(/\s+/g, '-'),
        description: categoryData.description,
      }).returning()

      const categoryId = categoryResult[0]?.id
      if (categoryId) {
        categoryMap.set(categoryData.name, categoryId)
      }
    }

    // Crear productos
    for (const product of generatedData.products) {
      const categoryId = categoryMap.get(product.category) ||
                         Array.from(categoryMap.values())[0]

      if (categoryId) {
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
