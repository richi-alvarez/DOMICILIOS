'use server'

import { auth } from '@/auth'
import { db, catalogs, products } from '@/db'
import { eq } from 'drizzle-orm'
import { CatalogGenerationService } from '@/lib/ai/catalog-generation-service'
import type { SupportedProvider } from '@/lib/ai/types/ai-provider'

export interface GeneratedCatalogStructure {
  businessType: string
  title: string
  subtitle: string
  theme: {
    primaryColor: string
    secondaryColor: string
    style: string
    iconStyle: string
  }
  sections: Array<{
    id: string
    name: string
    description: string
    type: string
    productIds: string[]
    order: number
  }>
  featuredProducts: string[]
  recommendations: string[]
  layout: {
    grid_columns: number
    card_style: string
    show_images: boolean
    emphasis: string
  }
}

export async function generateCatalogWithAI(
  businessName: string,
  businessDescription: string,
  businessType?: string,
  aiProvider?: SupportedProvider,
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: 'No autorizado' }
    }

    // Validar inputs
    if (!businessName || !businessDescription) {
      return { error: 'Se requieren nombre y descripción del negocio' }
    }

    // Generar usando el servicio centralizado
    const response = await CatalogGenerationService.generateCatalog({
      businessName,
      businessDescription,
      businessType,
      provider: aiProvider,
    })

    if (!response.success || !response.content) {
      return { error: response.error || 'Error generando catálogo' }
    }

    // Parsear JSON
    let generated: GeneratedCatalogStructure
    try {
      generated = JSON.parse(response.content)
    } catch (e) {
      console.error('[Catalog Generator] JSON Parse Error:', e)
      return { error: 'Error al procesar respuesta de la IA' }
    }

    // Validar estructura
    if (!generated.title || !generated.theme || !generated.sections) {
      return { error: 'Estructura incompleta generada por la IA' }
    }

    return {
      success: true,
      catalog: generated,
      provider: aiProvider,
      usage: response.usage,
    }
  } catch (error) {
    console.error('[Catalog Generator] Error:', error)
    return { error: error instanceof Error ? error.message : 'Error generando catálogo' }
  }
}

export async function getCatalogAISuggestions(catalogId: string, aiProvider?: SupportedProvider) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: 'No autorizado' }
    }

    // Obtener catálogo y productos
    const catalog = await db.query.catalogs.findFirst({
      where: eq(catalogs.id, catalogId),
    })

    if (!catalog) {
      return { error: 'Catálogo no encontrado' }
    }

    const catalogProducts = await db.query.products.findMany({
      where: eq(products.catalogId, catalogId),
    })

    if (catalogProducts.length === 0) {
      return { error: 'No hay productos para analizar' }
    }

    // Generar sugerencias basadas en productos
    const productSummary = catalogProducts
      .slice(0, 20)
      .map((p) => `${p.name} ($${p.price})`)
      .join(', ')

    const suggestionPrompt = `
Analiza estos productos y sugiere la mejor estructura de catálogo:

CATÁLOGO: ${catalog.name}
DESCRIPCIÓN: ${catalog.description || 'Sin descripción'}

PRODUCTOS:
${productSummary}

Genera recomendaciones para:
1. Mejor grouping de categorías
2. Productos a destacar
3. Flujo de navegación óptimo
4. Colores y estilo recomendado

Responde SOLO con JSON válido.
`

    const response = await CatalogGenerationService.generateCatalog({
      businessName: catalog.name,
      businessDescription: productSummary,
      provider: aiProvider,
      maxTokens: 1500,
    })

    if (!response.success || !response.content) {
      return { error: response.error || 'Error generando sugerencias' }
    }

    let suggestions
    try {
      suggestions = JSON.parse(response.content)
    } catch (e) {
      return { error: 'Error procesando sugerencias' }
    }

    return {
      success: true,
      suggestions,
      productCount: catalogProducts.length,
      provider: aiProvider,
    }
  } catch (error) {
    console.error('[Catalog AI Suggestions] Error:', error)
    return { error: error instanceof Error ? error.message : 'Error obteniendo sugerencias' }
  }
}
