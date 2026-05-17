'use server'

import { db, catalogs, qualityHistory } from '@/db'
import { eq, desc } from 'drizzle-orm'
import { auth } from '@/auth'

export interface CatalogComparison {
  id: string
  name: string
  slug: string
  latestScore: number | null
  completenessScore: number | null
  seoScore: number | null
  consistencyScore: number | null
  sellabilityScore: number | null
  trend: number | null
  rank: number
  percentile: number
  lastAnalyzedAt: Date | null
  productCount: number
  status: string
}

export interface ComparisonMetrics {
  averageScore: number
  highestScore: number
  lowestScore: number
  medianScore: number
  standardDeviation: number
  catalogsAnalyzed: number
  catalogsTotal: number
}

export interface BenchmarkInsights {
  topPerformers: CatalogComparison[]
  needsAttention: CatalogComparison[]
  averageByDimension: {
    completeness: number
    seo: number
    consistency: number
    sellability: number
  }
  recommendations: {
    focus: string
    reason: string
    potentialImprovement: string
  }[]
}

export async function getMultiCatalogComparison(orgId?: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: 'No autorizado' }
    }

    // Obtener todos los catálogos del usuario/org
    const allCatalogs = await db.query.catalogs.findMany({
      where: orgId ? eq(catalogs.id, orgId) : undefined,
      orderBy: (t) => t.name,
    })

    if (allCatalogs.length === 0) {
      return { comparisons: [], metrics: null, insights: null }
    }

    // Obtener el análisis más reciente para cada catálogo
    const comparisons: CatalogComparison[] = []

    for (const catalog of allCatalogs) {
      // Obtener últimos 2 análisis para calcular trend
      const recentAnalyses = await db.query.qualityHistory.findMany({
        where: eq(qualityHistory.catalogId, catalog.id),
        orderBy: (t) => desc(t.createdAt),
      })

      const latest = recentAnalyses[0]
      const previous = recentAnalyses[1]

      const trend = latest && previous ? latest.catalogScore - previous.catalogScore : null

      comparisons.push({
        id: catalog.id,
        name: catalog.name,
        slug: catalog.slug,
        latestScore: latest?.catalogScore ?? null,
        completenessScore: latest?.completenessScore ?? null,
        seoScore: latest?.seoScore ?? null,
        consistencyScore: latest?.consistencyScore ?? null,
        sellabilityScore: latest?.sellabilityScore ?? null,
        trend,
        rank: 0, // Se calcula después
        percentile: 0, // Se calcula después
        lastAnalyzedAt: latest?.createdAt ?? null,
        productCount: 0, // Se podría obtener si es necesario
        status: catalog.status,
      })
    }

    // Calcular rankings
    const withScores = comparisons.filter((c) => c.latestScore !== null)
    const sortedByScore = [...withScores].sort((a, b) => (b.latestScore ?? 0) - (a.latestScore ?? 0))

    sortedByScore.forEach((catalog, idx) => {
      catalog.rank = idx + 1
      catalog.percentile = Math.round(((sortedByScore.length - idx) / sortedByScore.length) * 100)
    })

    // Calcular métricas
    const scores = withScores.map((c) => c.latestScore ?? 0).filter((s) => s > 0)
    const metrics: ComparisonMetrics = {
      averageScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b) / scores.length) : 0,
      highestScore: scores.length > 0 ? Math.max(...scores) : 0,
      lowestScore: scores.length > 0 ? Math.min(...scores) : 0,
      medianScore:
        scores.length > 0
          ? scores.length % 2 === 0
            ? (scores[scores.length / 2 - 1] + scores[scores.length / 2]) / 2
            : scores[Math.floor(scores.length / 2)]
          : 0,
      standardDeviation:
        scores.length > 1
          ? Math.sqrt(
              scores.reduce((sq, n) => sq + Math.pow(n - (scores.reduce((a, b) => a + b) / scores.length), 2), 0) /
                scores.length,
            )
          : 0,
      catalogsAnalyzed: withScores.length,
      catalogsTotal: comparisons.length,
    }

    // Generar insights
    const topPerformers = sortedByScore.slice(0, 3)
    const needsAttention = sortedByScore.slice(-3).reverse()

    // Calcular promedios por dimensión
    const completenessScores = withScores.map((c) => c.completenessScore ?? 0).filter((s) => s > 0)
    const seoScores = withScores.map((c) => c.seoScore ?? 0).filter((s) => s > 0)
    const consistencyScores = withScores.map((c) => c.consistencyScore ?? 0).filter((s) => s > 0)
    const sellabilityScores = withScores.map((c) => c.sellabilityScore ?? 0).filter((s) => s > 0)

    const averageByDimension = {
      completeness: completenessScores.length > 0 ? Math.round(completenessScores.reduce((a, b) => a + b) / completenessScores.length) : 0,
      seo: seoScores.length > 0 ? Math.round(seoScores.reduce((a, b) => a + b) / seoScores.length) : 0,
      consistency: consistencyScores.length > 0 ? Math.round(consistencyScores.reduce((a, b) => a + b) / consistencyScores.length) : 0,
      sellability: sellabilityScores.length > 0 ? Math.round(sellabilityScores.reduce((a, b) => a + b) / sellabilityScores.length) : 0,
    }

    // Generar recomendaciones basadas en dimensiones débiles
    const dimensions = [
      { name: 'Completitud', key: 'completeness', score: averageByDimension.completeness },
      { name: 'SEO & Discoverabilidad', key: 'seo', score: averageByDimension.seo },
      { name: 'Consistencia', key: 'consistency', score: averageByDimension.consistency },
      { name: 'Vendibilidad', key: 'sellability', score: averageByDimension.sellability },
    ]

    const sortedDimensions = [...dimensions].sort((a, b) => a.score - b.score)

    const recommendations = [
      {
        focus: `Mejorar ${sortedDimensions[0].name}`,
        reason: `Es la dimensión más débil en promedio (${sortedDimensions[0].score}/100)`,
        potentialImprovement: `Enfocarse en esta área podría mejorar el score general entre 5-10 puntos`,
      },
      {
        focus: 'Aprender de los catálogos top',
        reason: `${topPerformers[0]?.name} tiene un score de ${topPerformers[0]?.latestScore}/100`,
        potentialImprovement: 'Analizar qué hace bien este catálogo e implementar en otros',
      },
      {
        focus: `Atender catálogos con bajo score`,
        reason: `${needsAttention[0]?.name} está en el bottom 3 (${needsAttention[0]?.latestScore}/100)`,
        potentialImprovement: 'Priorizar mejoras en catálogos de bajo rendimiento',
      },
    ]

    const insights: BenchmarkInsights = {
      topPerformers,
      needsAttention,
      averageByDimension,
      recommendations,
    }

    return {
      comparisons: sortedByScore,
      metrics,
      insights,
    }
  } catch (error) {
    console.error('[Quality Comparison] Error:', error)
    return { error: error instanceof Error ? error.message : 'Error al obtener comparación' }
  }
}

export async function getCatalogPerformanceRank(catalogId: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: 'No autorizado' }
    }

    const comparison = await getMultiCatalogComparison()

    if ('error' in comparison) {
      return { error: comparison.error }
    }

    const catalog = comparison.comparisons?.find((c) => c.id === catalogId)

    if (!catalog) {
      return { error: 'Catálogo no encontrado en comparación' }
    }

    const totalCatalogs = comparison.comparisons?.length ?? 0
    const betterThan = comparison.comparisons?.filter((c) => (c.latestScore ?? 0) > (catalog.latestScore ?? 0))?.length ?? 0

    return {
      catalogId,
      rank: catalog.rank,
      percentile: catalog.percentile,
      totalCatalogs,
      score: catalog.latestScore,
      betterThan,
      worseThan: totalCatalogs - betterThan - 1,
    }
  } catch (error) {
    console.error('[Catalog Performance Rank] Error:', error)
    return { error: error instanceof Error ? error.message : 'Error al obtener ranking' }
  }
}
