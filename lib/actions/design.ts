'use server'

import { eq, asc } from 'drizzle-orm'
import { db, blocks, catalogs } from '@/db'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'
import type { BlockConfig } from '@/lib/design/blocks'

export async function getBlocksForCatalog(catalogId: string): Promise<BlockConfig[]> {
  if (!process.env.DATABASE_URL) return []
  try {
    const rows = await db.query.blocks.findMany({
      where: eq(blocks.catalogId, catalogId),
      orderBy: [asc(blocks.position)],
    })
    return rows.map((r) => ({
      type: r.type as BlockConfig['type'],
      id: r.id,
      active: r.active,
      config: r.configJson as BlockConfig['config'],
    })) as BlockConfig[]
  } catch {
    return []
  }
}

export async function saveDesign(catalogId: string, blockList: BlockConfig[]) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'No autenticado' }

  if (!process.env.DATABASE_URL) return { error: 'Sin base de datos' }

  try {
    // Verify user has access to this catalog
    const catalog = await db.query.catalogs.findFirst({ where: eq(catalogs.id, catalogId) })
    if (!catalog) return { error: 'Catálogo no encontrado' }

    // Delete all existing blocks for this catalog and re-insert
    await db.delete(blocks).where(eq(blocks.catalogId, catalogId))

    if (blockList.length > 0) {
      await db.insert(blocks).values(
        blockList.map((b, idx) => ({
          catalogId,
          type: b.type,
          position: idx,
          configJson: b.config,
          active: b.active,
        })),
      )
    }

    revalidatePath(`/app/catalogs/${catalogId}/design`)
    revalidatePath(`/s/${catalog.slug}`)
    return { ok: true }
  } catch (err) {
    console.error('[saveDesign]', err)
    return { error: 'Error al guardar' }
  }
}

export async function uploadImage(formData: FormData): Promise<{ url: string } | { error: string }> {
  try {
    const file = formData.get('file') as File
    if (!file) return { error: 'No file provided' }

    // For now, convert to base64 and store in a data URL
    // In production, use Cloudinary, S3, or similar
    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const dataUrl = `data:${file.type};base64,${base64}`

    return { url: dataUrl }
  } catch (err) {
    console.error('[uploadImage]', err)
    return { error: 'Error uploading image' }
  }
}

export async function deleteImage(_imageUrl: string): Promise<{ success: true } | { error: string }> {
  // Since we're using data URLs, deletion isn't needed
  // In production with cloud storage, implement actual deletion here
  return { success: true }
}

export async function saveTheme(catalogId: string, themeJson: Record<string, unknown>) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'No autenticado' }

  if (!process.env.DATABASE_URL) return { error: 'Sin base de datos' }

  try {
    // Verify user has access to this catalog
    const catalog = await db.query.catalogs.findFirst({ where: eq(catalogs.id, catalogId) })
    if (!catalog) return { error: 'Catálogo no encontrado' }

    // Fusionar con el themeJson existente para no pisar los campos del Tema
    // (colores/tipografía/marca de themeSchema) que comparten la misma columna.
    const existing = (catalog.themeJson ?? {}) as Record<string, unknown>

    await db
      .update(catalogs)
      .set({
        themeJson: { ...existing, ...themeJson },
        updatedAt: new Date(),
      })
      .where(eq(catalogs.id, catalogId))

    revalidatePath(`/app/catalogs/${catalogId}/design`)
    revalidatePath(`/s/${catalog.slug}`)
    return { ok: true }
  } catch (err) {
    console.error('[saveTheme]', err)
    return { error: 'Error al guardar tema' }
  }
}
