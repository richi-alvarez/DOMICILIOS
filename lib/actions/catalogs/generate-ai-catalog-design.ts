'use server'

import { auth } from '@/auth'
import { db, catalogs, categories, products, blocks } from '@/db'
import { eq } from 'drizzle-orm'
import { downloadAndSaveImage } from '@/lib/utils/image-downloader'
import { retryStrategy } from '@/lib/ai/retry-strategy'
import { buildDesignPromptMessage, AI_DESIGN_CATALOG_PROMPT } from '@/lib/prompts/catalog-generation'
import { parseAIJson } from '@/lib/ai/parse-json'
import { revalidatePath } from 'next/cache'

// Imagen usada cuando la descarga desde Unsplash falla. La descarga de
// imágenes es opcional: nunca debe impedir la creación del catálogo.
const PLACEHOLDER_IMAGE = '/placeholder-product.svg'

interface AIGeneratedCatalogDesign {
  catalogName: string
  description: string
  theme: {
    primaryColor: string
    secondaryColor: string
    buttonPrimaryColor: string
    buttonSecondaryColor: string
    font: string
    borderRadius: string
  }
  banner: {
    title: string
    subtitle: string
    imageQuery: string
    ctaText: string
    overlayOpacity: number
    overlayType: string
  }
  category: {
    name: string
    slug: string
  }
  products: Array<{
    name: string
    description: string
    price: number
    bodyImageQuery: string
    carouselImageQuery: string
  }>
}

export async function generateAICatalogWithDesign(
  catalogId: string,
  businessData: {
    businessName: string
    businessType: string
    businessDescription: string
    currency: string
  }
): Promise<{ success: true } | { error: string }> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: 'No autorizado' }
    }

    // Verify catalog exists and belongs to user
    const catalog = await db.query.catalogs.findFirst({
      where: eq(catalogs.id, catalogId),
    })

    if (!catalog) {
      return { error: 'Catálogo no encontrado' }
    }

    // Call AI to generate catalog structure with design using new prompt
    const userMessage = buildDesignPromptMessage(
      businessData.businessName,
      businessData.businessType,
      businessData.businessDescription,
      businessData.currency
    )

    const response = await retryStrategy.executeWithRetry(
      'catalog-generation',
      {
        systemPrompt: AI_DESIGN_CATALOG_PROMPT,
        userMessage,
        maxTokens: 2000,
        temperature: 0.7,
      },
      {
        maxAttempts: 3,
        verbose: true,
      }
    )

    if (!response.success || !response.content) {
      return { error: response.error || 'Error generando catálogo con IA' }
    }

    // Parse JSON response
    let generated: AIGeneratedCatalogDesign
    try {
      generated = parseAIJson<AIGeneratedCatalogDesign>(response.content)
    } catch (e) {
      console.error('[generateAICatalogWithDesign] JSON Parse Error:', e)
      return { error: 'Error al procesar respuesta de la IA' }
    }

    // Validate structure
    if (!generated.theme || !generated.banner || !generated.category || !generated.products) {
      return { error: 'Estructura incompleta generada por la IA' }
    }

    if (generated.products.length === 0 || generated.products.length > 3) {
      return { error: 'La IA debe generar entre 1 y 3 productos' }
    }

    // Descarga de imágenes: best-effort. Si Unsplash falla (clave ausente,
    // 503, timeout…) usamos un placeholder y continuamos creando el catálogo.
    // Las imágenes son opcionales y no deben bloquear la generación.
    const safeDownload = async (query: string, filename: string): Promise<string> => {
      try {
        return await downloadAndSaveImage(query, catalogId, filename)
      } catch (error) {
        console.warn(
          `[generateAICatalogWithDesign] Imagen "${filename}" no descargada, usando placeholder:`,
          error instanceof Error ? error.message : error,
        )
        return PLACEHOLDER_IMAGE
      }
    }

    const bannerUrl = await safeDownload(generated.banner.imageQuery, 'banner')

    const productImages: Array<{ bodyUrl: string; carouselUrl: string }> = await Promise.all(
      generated.products.map(async (product) => {
        const baseName = product.name.toLowerCase().replace(/\s+/g, '-')
        const bodyUrl = await safeDownload(product.bodyImageQuery, `producto_body_${baseName}`)
        const carouselUrl = await safeDownload(product.carouselImageQuery, `producto_carrusel_${baseName}`)
        return { bodyUrl, carouselUrl }
      }),
    )

    // Create category
    const categoryId = crypto.randomUUID?.() || Date.now().toString()
    const categorySlug = generated.category.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')

    const createdCategory = await db.insert(categories).values({
      id: categoryId,
      catalogId,
      name: generated.category.name,
      slug: categorySlug,
      position: 0,
      active: true,
    })

    // Create products with images
    const productIds: string[] = []
    for (let i = 0; i < generated.products.length; i++) {
      const product = generated.products[i]
      const images = productImages[i]

      if (!images) continue

      const productSlug = product.name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')

      const productId = crypto.randomUUID?.() || `prod-${Date.now()}-${i}`

      await db.insert(products).values({
        id: productId,
        catalogId,
        categoryId,
        name: product.name,
        slug: productSlug,
        description: product.description,
        price: Math.round(product.price * 100), // Convert to cents
        imagesJson: [
          { url: images.bodyUrl, alt: product.name },
          { url: images.carouselUrl, alt: product.name },
        ],
        position: i,
        active: true,
      })

      productIds.push(productId)
    }

    // Create design blocks (presentation, catalog, cart)
    const designBlocks = [
      {
        catalogId,
        type: 'presentation',
        position: 0,
        active: true,
        configJson: {
          bgType: 'image',
          bgImage: bannerUrl,
          bgColor: '#ffffff',
          overlayOpacity: generated.banner.overlayOpacity || 40,
          overlayType: generated.banner.overlayType || 'dark',
          title: generated.banner.title,
          subtitle: generated.banner.subtitle,
          textColor: '#ffffff',
          textAlign: 'center',
          showCta: true,
          ctaText: generated.banner.ctaText,
          ctaActionType: 'scroll',
          sectionSize: 'md',
          fullHeight: false,
          presentationImage: null,
          bgVideoUrl: '',
          ctaUrl: '#',
        },
      },
      {
        catalogId,
        type: 'catalog',
        position: 1,
        active: true,
        configJson: {
          template: 'grid',
          showCategoryFilter: true,
          showSearch: false,
          showSortFilter: false,
          showPriceFilter: false,
          showAvailabilityFilter: false,
          showRatingFilter: false,
          showBrandFilter: false,
          showDiscountFilter: false,
          showTitle: true,
          showPrice: true,
          showDescription: false,
          showExternalLink: false,
          enableCart: true,
        },
      },
      {
        catalogId,
        type: 'cart',
        position: 2,
        active: true,
        configJson: {
          position: 'bottom-right',
          size: 'md',
          animation: 'none',
          showItemCount: true,
          showTotalPrice: true,
          showPreviewFirst: false,
          useCustomColors: true,
          bgColor: generated.theme.buttonPrimaryColor,
          iconColor: '#ffffff',
        },
      },
    ]

    await db.insert(blocks).values(designBlocks)

    // Save theme to catalog
    const themeJson = {
      selectedPalette: null,
      primaryColor: generated.theme.primaryColor,
      secondaryColor: generated.theme.secondaryColor,
      tertiaryColor: generated.theme.buttonSecondaryColor,
      font: generated.theme.font,
      borderRadius: generated.theme.borderRadius,
      bgType: 'color',
      bgColor: '#ffffff',
      bgImage: null,
      bgVideoUrl: '',
      buttonPrimaryColor: generated.theme.buttonPrimaryColor,
      buttonSecondaryColor: generated.theme.buttonSecondaryColor,
      buttonTertiaryColor: '#212529',
      categoryPrimaryColor: generated.theme.primaryColor,
      categorySecondaryColor: generated.theme.secondaryColor,
      categoryTertiaryColor: generated.theme.buttonSecondaryColor,
      cartPrimaryColor: generated.theme.buttonPrimaryColor,
      cartSecondaryColor: generated.theme.buttonSecondaryColor,
      cartTertiaryColor: '#212529',
    }

    await db
      .update(catalogs)
      .set({
        themeJson,
        updatedAt: new Date(),
      })
      .where(eq(catalogs.id, catalogId))

    // Revalidate paths
    revalidatePath(`/app/catalogs/${catalogId}/design`)
    revalidatePath(`/s/${catalog.slug}`)

    return { success: true }
  } catch (error) {
    console.error('[generateAICatalogWithDesign] Error:', error)
    return { error: error instanceof Error ? error.message : 'Error generando catálogo con diseño' }
  }
}
