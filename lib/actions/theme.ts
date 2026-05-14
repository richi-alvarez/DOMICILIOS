'use server'

import { eq } from 'drizzle-orm'
import { db, catalogs } from '@/db'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'
import { themeSchema, type ThemeConfig } from '@/lib/design/theme'

export async function saveTheme(catalogId: string, data: ThemeConfig) {
  const parsed = themeSchema.safeParse(data)
  if (!parsed.success) return { error: 'Datos inválidos' }

  const session = await auth()
  if (!session?.user?.id) return { error: 'No autenticado' }

  if (!process.env.DATABASE_URL) return { error: 'Sin base de datos' }

  try {
    const catalog = await db.query.catalogs.findFirst({ where: eq(catalogs.id, catalogId) })
    if (!catalog) return { error: 'Catálogo no encontrado' }

    const { customDomain, ...themeData } = parsed.data

    await db.update(catalogs).set({
      themeJson: themeData,
      domain: customDomain || null,
      updatedAt: new Date(),
    }).where(eq(catalogs.id, catalogId))

    revalidatePath(`/app/catalogs/${catalogId}/settings/theme`)
    revalidatePath(`/s/${catalog.slug}`)
    return { ok: true }
  } catch (err) {
    console.error('[saveTheme]', err)
    return { error: 'Error al guardar' }
  }
}
