'use server'

import { db, catalogs, memberships, aiPromptGuides } from '@/db'
import { and, count, eq } from 'drizzle-orm'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'
import { DEFAULT_BOOKING } from '@/lib/booking/config'
import { getOrgPlan, PLAN_LIMITS } from '@/lib/billing/limits'

// Tipos de negocio orientados a servicios con agenda → catálogo en modo "citas".
// El resto (restaurante, cafetería, tienda) usa el modo "productos" (carrito).
const APPOINTMENT_BUSINESS_TYPES = new Set(['barbershop', 'salon', 'other'])

function catalogTypeFor(businessType: string): 'products' | 'appointments' {
  return APPOINTMENT_BUSINESS_TYPES.has(businessType) ? 'appointments' : 'products'
}

// Etiqueta legible que se pasa a la IA como tipo de negocio.
const BUSINESS_TYPE_LABELS: Record<string, string> = {
  restaurant: 'Restaurante (menú de comida y bebidas)',
  cafe: 'Cafetería (café y postres)',
  store: 'Tienda (catálogo de productos)',
  barbershop: 'Barbería (servicios de corte y afeitado)',
  salon: 'Salón especializado y cuidado (servicios de belleza y cuidado personal)',
  other: 'Negocio',
}

const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/

/**
 * Devuelve el prompt de ejemplo (guía) para un tipo de negocio, o null si no hay.
 * Usado por el botón de ayuda del modal "Crear con IA".
 */
export async function getPromptGuide(businessType: string): Promise<string | null> {
  const guide = await db.query.aiPromptGuides.findFirst({
    where: and(eq(aiPromptGuides.businessType, businessType), eq(aiPromptGuides.active, true)),
  })
  return guide?.prompt ?? null
}

/** ¿Está libre este enlace único? (mismo chequeo que el wizard "Nuevo catálogo"). */
export async function isSlugAvailable(slug: string): Promise<boolean> {
  const existing = await db.query.catalogs.findFirst({ where: eq(catalogs.slug, slug) })
  return !existing
}

/**
 * Crea un catálogo desde el modal "Crear con IA".
 *
 * Recoge los mismos datos que el wizard "Nuevo catálogo" (nombre, tipo, enlace
 * único y moneda) más la descripción, y reusa la MISMA lógica inteligente:
 * crea el catálogo y delega la generación (tema, banner, categoría, productos,
 * bloques de diseño) en `generateAICatalogWithDesign` (multi-proveedor).
 *
 * El modo del catálogo se decide por el tipo de negocio: barbería, salón y otros
 * (servicios con agenda) → modo "citas"; restaurante, cafetería y tienda →
 * modo "productos" (carrito).
 */
export async function createCatalogFromAI(input: {
  businessType: string
  businessName: string
  slug: string
  currency?: string
  description?: string
}) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error('No autorizado')
    }

    const membership = await db.query.memberships.findFirst({
      where: eq(memberships.userId, session.user.id),
    })
    if (!membership) {
      throw new Error('Usuario sin organización')
    }
    const orgId = membership.organizationId

    // Validaciones (mismas reglas que el wizard).
    const businessName = input.businessName.trim()
    if (businessName.length < 2) throw new Error('El nombre del negocio es muy corto')
    const slug = input.slug.trim().toLowerCase()
    if (!SLUG_REGEX.test(slug)) {
      throw new Error('Enlace inválido (3-30 caracteres: letras, números y guiones)')
    }

    // Límite de catálogos del plan.
    const plan = await getOrgPlan(orgId)
    const limits = PLAN_LIMITS[plan]
    const catalogCount = await db
      .select({ count: count() })
      .from(catalogs)
      .where(eq(catalogs.orgId, orgId))
      .then((r) => r[0]?.count ?? 0)
    if (limits.catalogs !== -1 && catalogCount >= limits.catalogs) {
      throw new Error(`Límite de ${limits.catalogs} catálogo(s) alcanzado en tu plan ${plan}`)
    }

    // Enlace único disponible.
    if (!(await isSlugAvailable(slug))) {
      throw new Error('Ese enlace ya está en uso. Elige otro.')
    }

    const catalogType = catalogTypeFor(input.businessType)
    const businessLabel = BUSINESS_TYPE_LABELS[input.businessType] || input.businessType
    const businessDescription = input.description?.trim() || businessLabel
    const currency = input.currency || 'COP'

    // En modo citas: CTA "Agendar" + configuración de agenda por defecto.
    const settingsJson: Record<string, unknown> =
      catalogType === 'appointments'
        ? { ctaLabel: 'Agendar', booking: DEFAULT_BOOKING }
        : { ctaLabel: 'Agregar al carrito' }

    const [catalog] = await db
      .insert(catalogs)
      .values({
        orgId,
        name: businessName,
        slug,
        description: input.description?.trim() || null,
        status: 'draft',
        type: catalogType,
        language: 'es',
        currency,
        orderChannel: 'whatsapp',
        settingsJson,
      })
      .returning({ id: catalogs.id })

    if (!catalog) {
      throw new Error('Error al crear el catálogo')
    }

    // Generación inteligente (misma lógica que el wizard). Best-effort: si la IA
    // falla, se devuelve el catálogo igualmente para que el usuario continúe.
    const { generateAICatalogWithDesign } = await import('./catalogs/generate-ai-catalog-design')
    const aiResult = await generateAICatalogWithDesign(catalog.id, {
      businessName,
      businessType: businessLabel,
      businessDescription,
      currency,
    })

    if ('error' in aiResult) {
      console.error('[createCatalogFromAI] Generación IA falló:', aiResult.error)
    }

    revalidatePath('/app')

    return {
      success: true,
      catalogId: catalog.id,
      catalogName: businessName,
      type: catalogType,
    }
  } catch (error) {
    console.error('Error creating catalog with AI:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}
