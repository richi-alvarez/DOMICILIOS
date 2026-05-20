'use server'

import { eq, count } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { db, catalogs, memberships } from '@/db'
import { z } from 'zod'
import { getOrgPlan, PLAN_LIMITS } from '@/lib/billing/limits'

const catalogSchema = z.object({
  name: z.string().min(2).max(64),
  slug: z.string().regex(/^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/, 'Slug inválido (3-30 chars, solo letras, números y guiones)'),
  language: z.string().default('es'),
  currency: z.string().default('COP'),
  orderChannel: z.enum(['whatsapp', 'email']).default('whatsapp'),
  contactPhone: z.string().optional(),
  contactCountryCode: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  description: z.string().max(500).optional(),
  aiPrompt: z.string().max(500).optional(),
})

async function getOrgId(userId: string) {
  const membership = await db.query.memberships.findFirst({
    where: eq(memberships.userId, userId),
    columns: { organizationId: true },
  })
  return membership?.organizationId ?? null
}

export async function checkSlugAvailable(slug: string): Promise<boolean> {
  const existing = await db.query.catalogs.findFirst({ where: eq(catalogs.slug, slug) })
  return !existing
}

export async function createCatalog(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autenticado')

  const orgId = await getOrgId(session.user.id)
  if (!orgId) throw new Error('No se encontró organización')

  const plan = await getOrgPlan(orgId)
  const limits = PLAN_LIMITS[plan]
  const catalogCount = await db
    .select({ count: count() })
    .from(catalogs)
    .where(eq(catalogs.orgId, orgId))
    .then(result => result[0]?.count ?? 0)

  if (limits.catalogs !== -1 && catalogCount >= limits.catalogs) {
    throw new Error(`Límite de ${limits.catalogs} catálogo${limits.catalogs > 1 ? 's' : ''} alcanzado en tu plan ${plan}`)
  }

  const raw = {
    name: formData.get('name') as string,
    slug: formData.get('slug') as string,
    language: (formData.get('language') as string) || 'es',
    currency: (formData.get('currency') as string) || 'COP',
    orderChannel: (formData.get('orderChannel') as 'whatsapp' | 'email') || 'whatsapp',
    contactPhone: formData.get('contactPhone') as string || undefined,
    contactCountryCode: formData.get('contactCountryCode') as string || undefined,
    contactEmail: formData.get('contactEmail') as string || undefined,
    description: formData.get('description') as string || undefined,
    aiPrompt: formData.get('aiPrompt') as string || undefined,
  }

  const parsed = catalogSchema.safeParse(raw)
  if (!parsed.success) throw new Error(parsed.error.errors[0].message)

  const [catalog] = await db
    .insert(catalogs)
    .values({ ...parsed.data, orgId, status: 'draft' })
    .returning({ id: catalogs.id })

  if (!catalog) throw new Error('Error al crear catálogo')

  revalidatePath('/app')
  redirect(`/app/catalogs/${catalog.id}`)
}

export async function updateCatalog(id: string, formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autenticado')

  const raw = {
    name: formData.get('name') as string,
    description: formData.get('description') as string || undefined,
    language: (formData.get('language') as string) || 'es',
    currency: (formData.get('currency') as string) || 'COP',
    orderChannel: (formData.get('orderChannel') as 'whatsapp' | 'email') || 'whatsapp',
    contactPhone: formData.get('contactPhone') as string || undefined,
    contactCountryCode: formData.get('contactCountryCode') as string || undefined,
    contactEmail: formData.get('contactEmail') as string || undefined,
  }

  await db
    .update(catalogs)
    .set({ ...raw, updatedAt: new Date() })
    .where(eq(catalogs.id, id))

  revalidatePath(`/app/catalogs/${id}`)
  revalidatePath('/app')
}

export async function publishCatalog(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autenticado')

  await db
    .update(catalogs)
    .set({ status: 'published', publishedAt: new Date(), updatedAt: new Date() })
    .where(eq(catalogs.id, id))

  revalidatePath(`/app/catalogs/${id}`)
  revalidatePath(`/s/`)
}

export async function unpublishCatalog(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autenticado')

  await db
    .update(catalogs)
    .set({ status: 'draft', publishedAt: null, updatedAt: new Date() })
    .where(eq(catalogs.id, id))

  revalidatePath(`/app/catalogs/${id}`)
}

export async function createCatalogReturn(data: {
  name: string
  slug: string
  description?: string
  orderChannel: 'whatsapp' | 'email'
  contactPhone?: string
  contactCountryCode?: string
  currency?: string
  language?: string
  useAI?: boolean
  businessType?: string
  businessDescription?: string
}): Promise<{ id: string; aiGenerated?: boolean } | { error: string }> {
  const session = await auth()
  if (!session?.user?.id) return { error: 'No autenticado' }
  if (!process.env.DATABASE_URL) return { error: 'Sin base de datos' }

  try {
    const orgId = await getOrgId(session.user.id)
    if (!orgId) return { error: 'Sin organización' }

    const plan = await getOrgPlan(orgId)
    const limits = PLAN_LIMITS[plan]
    const catalogCount = await db
      .select({ count: count() })
      .from(catalogs)
      .where(eq(catalogs.orgId, orgId))
      .then(result => result[0]?.count ?? 0)

    if (limits.catalogs !== -1 && catalogCount >= limits.catalogs) {
      return { error: `Límite de ${limits.catalogs} catálogo${limits.catalogs > 1 ? 's' : ''} alcanzado en tu plan ${plan}` }
    }

    const parsed = catalogSchema.safeParse({
      ...data,
      language: data.language ?? 'es',
      currency: data.currency ?? 'COP',
    })
    if (!parsed.success) return { error: parsed.error.errors[0].message }

    const [catalog] = await db
      .insert(catalogs)
      .values({ ...parsed.data, orgId, status: 'draft' })
      .returning({ id: catalogs.id })

    if (!catalog) return { error: 'Error al crear catálogo' }

    // Generate with AI if requested
    if (data.useAI && data.businessType && data.businessDescription) {
      const { generateAICatalogWithDesign } = await import('./catalogs/generate-ai-catalog-design')
      const aiResult = await generateAICatalogWithDesign(catalog.id, {
        businessName: data.name,
        businessType: data.businessType,
        businessDescription: data.businessDescription,
        currency: data.currency || 'COP',
      })

      if (!aiResult.success) {
        console.error('[createCatalogReturn] AI generation failed:', aiResult.error)
        // Don't fail - return the catalog even if AI generation fails
        // User can retry or continue manually
      }
    }

    revalidatePath('/app')
    return { id: catalog.id, aiGenerated: data.useAI }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error'
    if (msg.includes('unique') || msg.includes('duplicate')) return { error: 'Ese enlace ya está en uso' }
    return { error: msg }
  }
}

export async function deleteCatalog(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autenticado')

  const orgId = await getOrgId(session.user.id)
  if (!orgId) throw new Error('No se encontró organización')

  const plan = await getOrgPlan(orgId)
  const limits = PLAN_LIMITS[plan]

  // Solo Pro/Premium pueden eliminar catálogos
  if (!limits.canDeleteCatalogs) {
    throw new Error('Solo usuarios con plan Pro o Premium pueden eliminar catálogos')
  }

  // Verificar que el catálogo pertenece a la organización
  const catalog = await db.query.catalogs.findFirst({ where: eq(catalogs.id, id) })
  if (!catalog || catalog.orgId !== orgId) {
    throw new Error('Catálogo no encontrado')
  }

  await db.delete(catalogs).where(eq(catalogs.id, id))
  revalidatePath('/app')
  redirect('/app')
}

export async function canAccessAIFeatures(): Promise<boolean> {
  try {
    const session = await auth()
    if (!session?.user?.id) return false

    const orgId = await getOrgId(session.user.id)
    if (!orgId) return false

    const plan = await getOrgPlan(orgId)
    const limits = PLAN_LIMITS[plan]
    return limits.aiFeatures
  } catch {
    return false
  }
}
