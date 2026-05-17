'use server'

import { db, qualityHistory, qualityAlerts, catalogs, users, organizations, memberships } from '@/db'
import { eq, and, desc } from 'drizzle-orm'
import { auth } from '@/auth'

export interface QualityAlert {
  id: string
  catalogId: string
  type: 'score_drop' | 'low_score' | 'dimension_drop' | 'critical_issue'
  severity: string
  previousScore: number | null
  currentScore: number | null
  scoreDrop: number | null
  affectedDimension: string | null
  message: string
  emailSent: boolean
  dismissed: boolean
  createdAt: Date
}

export async function detectQualityAlerts(catalogId: string): Promise<{ success: boolean; alertsCreated: number }> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, alertsCreated: 0 }
    }

    // Obtener los últimos dos análisis
    const history = await db.query.qualityHistory.findMany({
      where: eq(qualityHistory.catalogId, catalogId),
      orderBy: (t) => desc(t.createdAt),
    })

    const latestTwo = history.slice(0, 2)

    if (latestTwo.length < 2) {
      return { success: true, alertsCreated: 0 } // No hay comparación posible
    }

    const [latest, previous] = latestTwo
    let alertsCreated = 0

    // 1. Detectar caída de score general
    if (latest.catalogScore < previous.catalogScore) {
      const drop = previous.catalogScore - latest.catalogScore
      const severity = drop >= 20 ? 'critical' : drop >= 10 ? 'high' : 'medium'

      await db.insert(qualityAlerts).values({
        catalogId,
        type: 'score_drop',
        severity,
        previousScore: previous.catalogScore,
        currentScore: latest.catalogScore,
        scoreDrop: drop,
        message: `La puntuación general del catálogo disminuyó de ${previous.catalogScore} a ${latest.catalogScore} (${drop} puntos).`,
        emailSent: false,
        dismissed: false,
      })

      alertsCreated++
    }

    // 2. Detectar puntuación baja en general
    if (latest.catalogScore < 50) {
      const existingAlert = await db.query.qualityAlerts.findFirst({
        where: and(
          eq(qualityAlerts.catalogId, catalogId),
          eq(qualityAlerts.type, 'low_score'),
          eq(qualityAlerts.dismissed, false),
        ),
      })

      if (!existingAlert) {
        await db.insert(qualityAlerts).values({
          catalogId,
          type: 'low_score',
          severity: 'critical',
          currentScore: latest.catalogScore,
          message: `⚠️ CRÍTICO: La puntuación de calidad es baja (${latest.catalogScore}/100). Se recomienda revisar el catálogo inmediatamente.`,
          emailSent: false,
          dismissed: false,
        })

        alertsCreated++
      }
    }

    // 3. Detectar caídas en dimensiones individuales
    const dimensions = [
      { key: 'completenessScore', name: 'Completitud' },
      { key: 'seoScore', name: 'SEO & Discoverabilidad' },
      { key: 'consistencyScore', name: 'Consistencia' },
      { key: 'sellabilityScore', name: 'Vendibilidad' },
    ] as const

    for (const dim of dimensions) {
      const latestDimScore = latest[dim.key]
      const prevDimScore = previous[dim.key]

      if (latestDimScore < prevDimScore && prevDimScore - latestDimScore >= 10) {
        const drop = prevDimScore - latestDimScore

        await db.insert(qualityAlerts).values({
          catalogId,
          type: 'dimension_drop',
          severity: drop >= 20 ? 'high' : 'medium',
          previousScore: prevDimScore,
          currentScore: latestDimScore,
          scoreDrop: drop,
          affectedDimension: dim.key,
          message: `La puntuación de ${dim.name} disminuyó de ${prevDimScore} a ${latestDimScore}.`,
          emailSent: false,
          dismissed: false,
        })

        alertsCreated++
      }
    }

    return { success: true, alertsCreated }
  } catch (error) {
    console.error('[Quality Alerts Detection] Error:', error)
    return { success: false, alertsCreated: 0 }
  }
}

export async function getQualityAlerts(catalogId: string, onlyUndismissed = true) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: 'No autorizado' }
    }

    const whereConditions = [eq(qualityAlerts.catalogId, catalogId)]
    if (onlyUndismissed) {
      whereConditions.push(eq(qualityAlerts.dismissed, false))
    }

    const alerts = await db.query.qualityAlerts.findMany({
      where: and(...whereConditions),
      orderBy: (t) => desc(t.createdAt),
    })

    return { alerts }
  } catch (error) {
    console.error('[Get Quality Alerts] Error:', error)
    return { error: error instanceof Error ? error.message : 'Error al obtener alertas' }
  }
}

export async function dismissAlert(alertId: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: 'No autorizado' }
    }

    await db
      .update(qualityAlerts)
      .set({
        dismissed: true,
        dismissedAt: new Date(),
      })
      .where(eq(qualityAlerts.id, alertId))

    return { success: true }
  } catch (error) {
    console.error('[Dismiss Alert] Error:', error)
    return { error: error instanceof Error ? error.message : 'Error al descartar alerta' }
  }
}

export async function dismissAllAlerts(catalogId: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: 'No autorizado' }
    }

    await db
      .update(qualityAlerts)
      .set({
        dismissed: true,
        dismissedAt: new Date(),
      })
      .where(and(eq(qualityAlerts.catalogId, catalogId), eq(qualityAlerts.dismissed, false)))

    return { success: true }
  } catch (error) {
    console.error('[Dismiss All Alerts] Error:', error)
    return { error: error instanceof Error ? error.message : 'Error al descartar alertas' }
  }
}

export async function getCatalogAlertsSummary(catalogId: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: 'No autorizado' }
    }

    const alerts = await db.query.qualityAlerts.findMany({
      where: and(eq(qualityAlerts.catalogId, catalogId), eq(qualityAlerts.dismissed, false)),
    })

    const bySeverity = {
      critical: alerts.filter((a) => a.severity === 'critical').length,
      high: alerts.filter((a) => a.severity === 'high').length,
      medium: alerts.filter((a) => a.severity === 'medium').length,
      low: alerts.filter((a) => a.severity === 'low').length,
    }

    const byType = {
      score_drop: alerts.filter((a) => a.type === 'score_drop').length,
      low_score: alerts.filter((a) => a.type === 'low_score').length,
      dimension_drop: alerts.filter((a) => a.type === 'dimension_drop').length,
      critical_issue: alerts.filter((a) => a.type === 'critical_issue').length,
    }

    return {
      total: alerts.length,
      bySeverity,
      byType,
      hasCriticalAlerts: bySeverity.critical > 0,
      hasHighAlerts: bySeverity.high > 0,
    }
  } catch (error) {
    console.error('[Quality Alerts Summary] Error:', error)
    return { error: error instanceof Error ? error.message : 'Error al obtener resumen' }
  }
}
