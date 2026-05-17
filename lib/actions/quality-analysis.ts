'use server'

import { db, catalogs, products, categories, qualityHistory } from '@/db'
import { eq } from 'drizzle-orm'
import { auth } from '@/auth'
import { QUALITY_ANALYSIS_SYSTEM_PROMPT } from '@/lib/prompts/quality-analysis'

export interface QualityScore {
  catalogScore: number
  completenessScore: number
  seoScore: number
  consistencyScore: number
  sellabilityScore: number
  strengths: string[]
  improvements: string[]
  productAnalysis: Array<{
    productName: string
    score: number
    issues: string[]
    recommendations: string[]
  }>
  actionableRecommendations: Array<{
    priority: 'high' | 'medium' | 'low'
    action: string
    impact: 'high' | 'medium' | 'low'
    estimatedImpact: string
  }>
  summary: string
}

export async function analyzeeCatalogQuality(catalogId: string): Promise<QualityScore | { error: string }> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: 'No autorizado' }
    }

    // Obtener datos del catálogo
    const catalog = await db.query.catalogs.findFirst({
      where: eq(catalogs.id, catalogId),
    })

    if (!catalog) {
      return { error: 'Catálogo no encontrado' }
    }

    // Obtener productos del catálogo
    const catalogProducts = await db.query.products.findMany({
      where: eq(products.catalogId, catalogId),
    })

    if (catalogProducts.length === 0) {
      return { error: 'El catálogo no tiene productos para analizar' }
    }

    // Obtener categorías
    const catalogCategories = await db.query.categories.findMany({
      where: eq(categories.catalogId, catalogId),
    })

    // Preparar datos para análisis
    const catalogData = {
      name: catalog.name,
      slug: catalog.slug,
      description: (catalog.metadata as any)?.coverDescription || '',
      productCount: catalogProducts.length,
      categoryCount: catalogCategories.length,
      products: catalogProducts.map((p) => ({
        name: p.name,
        description: p.description || '',
        price: p.price,
        category: p.categoryId ? catalogCategories.find((c) => c.id === p.categoryId)?.name : 'Sin categoría',
      })),
      categories: catalogCategories.map((c) => ({
        name: c.name,
        description: c.description || '',
        productCount: catalogProducts.filter((p) => p.categoryId === c.id).length,
      })),
    }

    // Llamar Claude API para análisis
    const { default: Anthropic } = await import('@anthropic-ai/sdk')
    const client = new Anthropic()

    const userPrompt = `Analiza este catálogo digital para e-commerce:

Nombre: ${catalogData.name}
Descripción: ${catalogData.description}
Total de productos: ${catalogData.productCount}
Total de categorías: ${catalogData.categoryCount}

PRODUCTOS:
${catalogData.products.map((p, i) => `${i + 1}. ${p.name} ($${p.price}) - ${p.description.substring(0, 100)}... [${p.category}]`).join('\n')}

CATEGORÍAS:
${catalogData.categories.map((c) => `- ${c.name} (${c.productCount} productos): ${c.description}`).join('\n')}

Proporciona un análisis completo con puntuaciones y recomendaciones accionables.`

    const response = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 3000,
      system: QUALITY_ANALYSIS_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    })

    // Extraer y parsear respuesta
    const textContent = response.content.find((block) => block.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in response')
    }

    const jsonText = textContent.text.trim()
    let analysisResult: QualityScore

    try {
      let cleanedText = jsonText
      if (jsonText.includes('```json')) {
        cleanedText = jsonText.split('```json')[1].split('```')[0].trim()
      } else if (jsonText.includes('```')) {
        cleanedText = jsonText.split('```')[1].split('```')[0].trim()
      }

      analysisResult = JSON.parse(cleanedText)
    } catch (parseError) {
      console.error('Failed to parse quality analysis response:', jsonText.substring(0, 300))
      throw new Error('Invalid analysis response format')
    }

    // Guardar análisis en historial
    try {
      await db.insert(qualityHistory).values({
        catalogId,
        catalogScore: analysisResult.catalogScore,
        completenessScore: analysisResult.completenessScore,
        seoScore: analysisResult.seoScore,
        consistencyScore: analysisResult.consistencyScore,
        sellabilityScore: analysisResult.sellabilityScore,
        strengths: analysisResult.strengths,
        improvements: analysisResult.improvements,
        productAnalysis: analysisResult.productAnalysis,
        actionableRecommendations: analysisResult.actionableRecommendations,
        summary: analysisResult.summary,
      })

      // Detectar alertas automáticamente
      try {
        const { detectQualityAlerts } = await import('@/lib/actions/quality-alerts')
        await detectQualityAlerts(catalogId)
      } catch (alertError) {
        console.error('[Quality Alerts Detection] Warning:', alertError)
        // No es un error crítico, continuamos de todas formas
      }
    } catch (historyError) {
      console.error('[Quality History Save] Warning:', historyError)
      // No es un error crítico, continuamos de todas formas
    }

    return analysisResult
  } catch (error) {
    console.error('[Quality Analysis] Error:', error)
    return {
      error: error instanceof Error ? error.message : 'Error al analizar el catálogo',
    }
  }
}

export async function analyzeScanQuality(products: Array<{ name: string; description: string; price: number }>): Promise<QualityScore | { error: string }> {
  try {
    if (products.length === 0) {
      return { error: 'No hay productos para analizar' }
    }

    // Llamar Claude API para análisis de escaneo
    const { default: Anthropic } = await import('@anthropic-ai/sdk')
    const client = new Anthropic()

    const userPrompt = `Analiza la calidad de estos productos extraídos de un menú escaneado:

PRODUCTOS DETECTADOS:
${products.map((p, i) => `${i + 1}. ${p.name} - $${p.price} - "${p.description}"`).join('\n')}

Evalúa la precisión de la extracción OCR/Vision, completitud de datos y calidad para un catálogo digital.`

    const response = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 2000,
      system: QUALITY_ANALYSIS_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    })

    // Extraer y parsear respuesta
    const textContent = response.content.find((block) => block.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in response')
    }

    const jsonText = textContent.text.trim()
    let analysisResult: QualityScore

    try {
      let cleanedText = jsonText
      if (jsonText.includes('```json')) {
        cleanedText = jsonText.split('```json')[1].split('```')[0].trim()
      } else if (jsonText.includes('```')) {
        cleanedText = jsonText.split('```')[1].split('```')[0].trim()
      }

      analysisResult = JSON.parse(cleanedText)
    } catch (parseError) {
      console.error('Failed to parse scan quality analysis:', jsonText.substring(0, 300))
      throw new Error('Invalid analysis response format')
    }

    return analysisResult
  } catch (error) {
    console.error('[Scan Quality Analysis] Error:', error)
    return {
      error: error instanceof Error ? error.message : 'Error al analizar los productos',
    }
  }
}

export async function getQualityInsights(catalogId: string): Promise<{
  score: number
  status: 'excellent' | 'good' | 'fair' | 'poor'
  nextSteps: string[]
}> {
  try {
    const analysis = await analyzeeCatalogQuality(catalogId)

    if ('error' in analysis) {
      throw new Error(analysis.error)
    }

    const score = analysis.catalogScore
    let status: 'excellent' | 'good' | 'fair' | 'poor'

    if (score >= 85) status = 'excellent'
    else if (score >= 70) status = 'good'
    else if (score >= 50) status = 'fair'
    else status = 'poor'

    const nextSteps = analysis.actionableRecommendations
      .filter((r) => r.priority === 'high')
      .slice(0, 3)
      .map((r) => r.action)

    return { score, status, nextSteps }
  } catch (error) {
    console.error('[Quality Insights] Error:', error)
    return {
      score: 0,
      status: 'poor',
      nextSteps: ['Error al obtener recomendaciones'],
    }
  }
}

export async function getQualityHistory(catalogId: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: 'No autorizado' }
    }

    const history = await db.query.qualityHistory.findMany({
      where: eq(qualityHistory.catalogId, catalogId),
      orderBy: (t) => t.createdAt,
    })

    if (history.length === 0) {
      return { history: [], trend: null, improvement: null }
    }

    // Calcular trend (comparación primero vs último)
    const first = history[0]
    const latest = history[history.length - 1]
    const trend = latest.catalogScore - first.catalogScore
    const improvement = trend > 0 ? 'positive' : trend < 0 ? 'negative' : 'stable'

    return {
      history,
      trend,
      improvement,
    }
  } catch (error) {
    console.error('[Quality History] Error:', error)
    return { error: error instanceof Error ? error.message : 'Error al obtener historial' }
  }
}
