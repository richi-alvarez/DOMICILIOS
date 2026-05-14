'use server'

import { db } from '@/db'
import { catalogs, memberships } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'
import { isValidCustomDomain, getDNSRecordForDomain } from '@/lib/domain/handler'

export async function updateCatalogDomain(catalogId: string, domain: string | null) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'No autenticado' }

  // Validar que el usuario sea owner/admin del catálogo
  const membership = await db.query.memberships.findFirst({
    where: eq(memberships.userId, session.user.id as string),
  })

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return { error: 'No tienes permisos' }
  }

  const catalog = await db.query.catalogs.findFirst({
    where: eq(catalogs.id, catalogId),
  })

  if (!catalog || catalog.orgId !== membership.organizationId) {
    return { error: 'Catálogo no encontrado' }
  }

  if (domain && domain.trim()) {
    // Validar dominio
    if (!(await isValidCustomDomain(domain))) {
      return { error: 'Dominio personalizado inválido' }
    }

    // Verificar que no esté en uso por otro catálogo
    const existing = await db.query.catalogs.findFirst({
      where: and(eq(catalogs.domain, domain), eq(catalogs.id, catalogId) as any),
    })

    // Si existe y es otro catálogo
    if (existing && existing.id !== catalogId) {
      return { error: 'Este dominio ya está registrado' }
    }
  }

  await db
    .update(catalogs)
    .set({ domain: domain || null })
    .where(eq(catalogs.id, catalogId))

  revalidatePath(`/app/catalogs/${catalogId}`)
  revalidatePath(`/app/catalogs/${catalogId}/settings`)

  return { success: true }
}

export async function getDNSRecord(domain: string) {
  if (!(await isValidCustomDomain(domain))) {
    return { error: 'Dominio inválido' }
  }

  return getDNSRecordForDomain(domain)
}

export async function getCatalogDomain(catalogId: string): Promise<{ domain: string | null; dnsRecord?: any } | { error: string }> {
  const session = await auth()
  if (!session?.user?.id) return { error: 'No autenticado' }

  const membership = await db.query.memberships.findFirst({
    where: eq(memberships.userId, session.user.id as string),
  })

  if (!membership) return { error: 'Sin organización' }

  const catalog = await db.query.catalogs.findFirst({
    where: and(eq(catalogs.id, catalogId), eq(catalogs.orgId, membership.organizationId)),
  })

  if (!catalog) return { error: 'Catálogo no encontrado' }

  const dnsRecord = catalog.domain ? await getDNSRecordForDomain(catalog.domain) : null

  return {
    domain: catalog.domain || null,
    dnsRecord,
  }
}
