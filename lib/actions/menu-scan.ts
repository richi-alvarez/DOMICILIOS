'use server'

import { db, products, catalogs, organizations, subscriptions, plans, categories } from '@/db'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { z } from 'zod'
import { slugify } from '@/lib/utils'
import { convertPDFToImagesServer } from '@/lib/pdf'

// Procesa un PDF convirtiendo a imágenes
async function processPDFFile(pdfBuffer: Buffer): Promise<string[]> {
  try {
    console.log('[PDF] Converting PDF to images...')
    const result = await convertPDFToImagesServer(pdfBuffer, {
      maxPages: 10, // Limita a 10 páginas
    })

    console.log(`[PDF] Extracted ${result.pages.length} pages`)
    return result.pages.map((p) => p.imageBase64)
  } catch (error) {
    console.error('[PDF] Conversion failed:', error)
    throw new Error('No se pudo procesar el PDF. Intenta con imágenes JPG o PNG.')
  }
}

interface DetectedProduct {
  name: string
  description?: string
  price: number
  category: string
  /** URL pública de la imagen recortada del producto (si se detectó su foto). */
  image?: string
  /** Colores detectados (solo productos con opciones de color). */
  colors?: { name: string; hex: string }[]
  /** Tallas detectadas (solo productos con tallas). */
  sizes?: string[]
}

/**
 * Recorta la foto de un producto desde la imagen escaneada usando su bounding
 * box (fracciones 0..1) y la guarda en public/catalogs/{catalogId}. Devuelve la
 * URL pública o null si no se pudo recortar. Best-effort: nunca lanza.
 */
async function cropProductImage(
  imageBase64: string,
  box: [number, number, number, number],
  catalogId: string,
  filenameBase: string,
): Promise<string | null> {
  try {
    const sharp = (await import('sharp')).default
    const { mkdir, writeFile } = await import('fs/promises')
    const path = await import('path')

    const input = Buffer.from(imageBase64, 'base64')
    const meta = await sharp(input).metadata()
    const W = meta.width ?? 0
    const H = meta.height ?? 0
    if (!W || !H) return null

    // Tamaño fijo y uniforme para TODAS las imágenes recortadas.
    const OUT_SIZE = 600
    // Margen alrededor del producto (fracción de cada lado) para que no quede
    // pegado al borde y no se corte el envase.
    const PAD = 0.04

    let [x0, y0, x1, y1] = box
    // Aplica margen y recorta a [0,1].
    const bw = x1 - x0
    const bh = y1 - y0
    x0 = Math.max(0, x0 - bw * PAD)
    y0 = Math.max(0, y0 - bh * PAD)
    x1 = Math.min(1, x1 + bw * PAD)
    y1 = Math.min(1, y1 + bh * PAD)

    let left = Math.round(x0 * W)
    let top = Math.round(y0 * H)
    let width = Math.round((x1 - x0) * W)
    let height = Math.round((y1 - y0) * H)

    // Clamp dentro de los límites de la imagen.
    left = Math.max(0, Math.min(left, W - 1))
    top = Math.max(0, Math.min(top, H - 1))
    width = Math.max(1, Math.min(width, W - left))
    height = Math.max(1, Math.min(height, H - top))
    if (width < 8 || height < 8) return null

    // Recorta SOLO el producto y lo centra en un lienzo cuadrado blanco del mismo
    // tamaño (fit:'contain' = sin deformar). Así todas las imágenes quedan iguales.
    const out = await sharp(input)
      .extract({ left, top, width, height })
      .resize(OUT_SIZE, OUT_SIZE, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .flatten({ background: { r: 255, g: 255, b: 255 } })
      .jpeg({ quality: 85 })
      .toBuffer()

    const dir = path.join(process.cwd(), 'public', 'catalogs', catalogId)
    await mkdir(dir, { recursive: true })
    const filename = `scan_${filenameBase}.jpg`
    await writeFile(path.join(dir, filename), out)
    return `/catalogs/${catalogId}/${filename}`
  } catch (err) {
    console.error('[Scanner] crop failed:', err)
    return null
  }
}

export async function scanMenuImages(
  formData: FormData,
): Promise<{ products: DetectedProduct[] } | { error: string }> {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: 'No autenticado' }
  }

  try {
    const files = formData.getAll('files') as File[]
    // catalogId es opcional: si llega, se recortan y guardan las fotos de los
    // productos desde la imagen; si no, la extracción funciona igual sin imagen.
    const catalogId = (formData.get('catalogId') as string | null) || null

    if (files.length === 0) {
      return { error: 'No se subieron archivos' }
    }

    // Validate file types and sizes
    const supportedTypes = ['image/jpeg', 'image/png', 'application/pdf']
    for (const file of files) {
      if (!supportedTypes.includes(file.type)) {
        return {
          error: `Tipo de archivo no soportado: ${file.type}. Solo JPG, PNG y PDF.`,
        }
      }
      if (file.size > 10 * 1024 * 1024) {
        return { error: `Archivo demasiado grande: ${file.name}` }
      }
    }

    // Extracción multi-proveedor con fallback (OpenRouter → OpenAI → Gemini →
    // Anthropic), definido en task-recommendations.ts. El proveedor que primero
    // esté configurado y responda gana; si falla, pasa al siguiente.
    const { MenuExtractionService } = await import('@/lib/ai/menu-extraction-service')
    const allProducts: DetectedProduct[] = []

    // Recolecta todas las imágenes a procesar (incluyendo desde PDFs)
    const imagesToProcess: Array<{
      base64: string
      mediaType: 'image/jpeg' | 'image/png'
      fileName: string
    }> = []

    // Process each file (expand PDFs to images)
    for (const file of files) {
      try {
        if (file.type === 'application/pdf') {
          console.log(`[PDF] Processing ${file.name}...`)
          const pdfBuffer = Buffer.from(await file.arrayBuffer())
          const pdfImages = await processPDFFile(pdfBuffer)

          for (let i = 0; i < pdfImages.length; i++) {
            imagesToProcess.push({
              base64: pdfImages[i],
              mediaType: 'image/jpeg',
              fileName: `${file.name} - página ${i + 1}`,
            })
          }
        } else {
          // Imagen directa
          const buffer = await file.arrayBuffer()
          const base64 = Buffer.from(buffer).toString('base64')
          const mediaType: 'image/jpeg' | 'image/png' = file.type === 'image/png' ? 'image/png' : 'image/jpeg'

          imagesToProcess.push({
            base64,
            mediaType,
            fileName: file.name,
          })
        }
      } catch (fileError) {
        console.error(`[Scanner] Error processing file ${file.name}:`, fileError)
        continue
      }
    }

    // Procesa cada imagen con el servicio multi-proveedor (visión + fallback)
    let imgIdx = 0
    for (const image of imagesToProcess) {
      try {
        const result = await MenuExtractionService.extractFromImage(
          image.base64,
          image.mediaType,
          { verbose: true },
        )

        if (!result.success) {
          console.error(`[Scanner] ${image.fileName}: ${result.error}`)
          continue
        }

        for (const product of result.products) {
          const name = product.name ? String(product.name).trim() : ''
          if (name.length === 0) continue // sin nombre válido → saltar

          // Si hay catálogo y el modelo devolvió la caja, recorta la foto real.
          let imageUrl: string | undefined
          if (catalogId && product.box) {
            const url = await cropProductImage(
              image.base64,
              product.box,
              catalogId,
              `${Date.now()}_${imgIdx++}`,
            )
            if (url) imageUrl = url
          }

          allProducts.push({
            name,
            description: product.description ? String(product.description).trim() : '',
            price: isNaN(product.price) ? 0 : product.price,
            category: product.category ? String(product.category).trim() : 'General',
            image: imageUrl,
            colors: product.colors,
            sizes: product.sizes,
          })
        }
      } catch (imageError) {
        console.error(`[Scanner] Error processing image ${image.fileName}:`, imageError)
        // Continúa con la siguiente imagen
        continue
      }
    }

    return { products: allProducts }
  } catch (error) {
    console.error('Error scanning menu:', error)
    return { error: 'Error al procesar las imágenes' }
  }
}

export async function addProductsFromScan(
  catalogId: string,
  detectedProducts: DetectedProduct[],
): Promise<{ ok: boolean; count: number } | { error: string }> {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: 'No autenticado' }
  }

  try {
    const catalog = await db.query.catalogs.findFirst({
      where: eq(catalogs.id, catalogId),
    })

    if (!catalog) {
      return { error: 'Catálogo no encontrado' }
    }

    // Get organization to check plan limits
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, catalog.orgId),
    })

    if (!org) {
      return { error: 'Organización no encontrada' }
    }

    // Get active subscription with plan info
    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.organizationId, org.id),
    })

    // Get plan details
    let productLimit: number | 'unlimited' = 'unlimited'
    if (subscription) {
      const plan = await db.query.plans.findFirst({
        where: eq(plans.id, subscription.planId),
      })
      if (plan && plan.limitsJson) {
        const limits = plan.limitsJson as { products?: number | string }
        if (limits.products === 'unlimited') {
          productLimit = 'unlimited'
        } else if (typeof limits.products === 'number') {
          productLimit = limits.products
        }
      }
    }

    // Get current product count in catalog
    const currentProducts = await db.query.products.findMany({
      where: eq(products.catalogId, catalogId),
    })

    // Validate plan limits
    if (productLimit !== 'unlimited') {
      const newTotal = currentProducts.length + detectedProducts.length
      if (newTotal > Number(productLimit)) {
        const remaining = Math.max(0, Number(productLimit) - currentProducts.length)
        return {
          error: `No puedes agregar ${detectedProducts.length} productos. Tu plan permite ${productLimit} productos en total y ya tienes ${currentProducts.length}. Puedes agregar ${remaining} más.`,
        }
      }
    }

    // Get all existing categories to map detected categories to IDs
    const allCategories = await db.query.categories.findMany({
      where: eq(categories.catalogId, catalogId),
    })

    const categoryMap = new Map(allCategories.map((c) => [c.name.toLowerCase(), c.id]))

    let addedCount = 0

    for (const product of detectedProducts) {
      try {
        const slug = slugify(product.name)

        // Find matching category or use first one if no match
        let categoryId: string | null = null
        const detectedCategoryLower = product.category.toLowerCase()

        for (const [catName, catId] of categoryMap) {
          if (detectedCategoryLower.includes(catName) || catName.includes(detectedCategoryLower)) {
            categoryId = catId
            break
          }
        }

        // Variantes: solo se guardan si el escáner detectó colores y/o tallas.
        const hasColors = Array.isArray(product.colors) && product.colors.length > 0
        const hasSizes = Array.isArray(product.sizes) && product.sizes.length > 0
        const variantsJson =
          hasColors || hasSizes
            ? {
                ...(hasColors ? { colors: product.colors } : {}),
                // Tallas en formato canónico {name} (el escáner las detecta como strings).
                ...(hasSizes ? { sizes: product.sizes!.map((s) => ({ name: s })) } : {}),
              }
            : []

        await db.insert(products).values({
          catalogId,
          name: product.name,
          slug,
          description: product.description || null,
          price: Math.round(product.price * 100),
          categoryId,
          imagesJson: product.image ? [{ url: product.image, alt: product.name }] : [],
          variantsJson,
          active: true,
          position: 0,
        })

        addedCount++
      } catch (error) {
        console.error(`Error adding product ${product.name}:`, error)
        // Continue with next product
      }
    }

    revalidatePath(`/app/catalogs/${catalogId}/products`)
    return { ok: true, count: addedCount }
  } catch (error) {
    console.error('Error adding products from scan:', error)
    return { error: 'Error al agregar los productos' }
  }
}
