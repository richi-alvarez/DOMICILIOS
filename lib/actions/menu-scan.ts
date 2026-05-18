'use server'

import { db, products, catalogs, organizations, subscriptions, plans, categories } from '@/db'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { z } from 'zod'
import { slugify } from '@/lib/utils'
import { MENU_SCAN_SYSTEM_PROMPT } from '@/lib/prompts/menu-scan'
import { convertPDFToImagesServer } from '@/lib/pdf'

// Extrae OCR de imagen usando Tesseract
async function extractTextFromImage(base64Image: string, mediaType: string): Promise<string> {
  try {
    const { createWorker } = await import('tesseract.js')
    const worker = await createWorker('spa') // Spanish language support

    try {
      // Convert base64 to Data URL for Tesseract
      const dataUrl = `data:${mediaType};base64,${base64Image}`
      const result = await worker.recognize(dataUrl)
      const extractedText = result.data.text.substring(0, 3000)
      return extractedText
    } finally {
      await worker.terminate()
    }
  } catch (err) {
    console.error('[OCR] extraction failed:', err)
    return '' // Return empty string if OCR fails, continue with image-only analysis
  }
}

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

    // Import Anthropic dynamically to avoid client-side bundling issues
    const { default: Anthropic } = await import('@anthropic-ai/sdk')
    const client = new Anthropic()
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

    // Procesa cada imagen con Claude Vision
    for (const image of imagesToProcess) {
      try {
        // Extract text using OCR preprocessing
        console.log(`[OCR] Extracting text from ${image.fileName}...`)
        const extractedText = await extractTextFromImage(image.base64, `image/${image.mediaType.split('/')[1]}`)
        console.log(`[OCR] Extracted ${extractedText.length} characters of text`)

        // Build user message with both image and OCR text
        const userContent: Array<any> = [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: image.mediaType,
              data: image.base64,
            },
          },
        ]

        // Add OCR text if extraction was successful
        let userPrompt = 'Extrae todos los productos visibles en esta imagen. Retorna un JSON array válido.'
        if (extractedText.trim().length > 0) {
          userPrompt = `OCR extracted text:\n${extractedText}\n\nUsa el texto extraído por OCR y la imagen para extraer TODOS los productos. Estructura: JSON array con name, description, price (número), category.`
        }

        userContent.push({
          type: 'text',
          text: userPrompt,
        })

        // Call Claude Vision API with OCR-enhanced context
        const response = await client.messages.create({
          model: 'claude-opus-4-7',
          max_tokens: 4096,
          system: MENU_SCAN_SYSTEM_PROMPT,
          messages: [
            {
              role: 'user',
              content: userContent,
            },
          ],
        })

        // Extract text response
        const textContent = response.content.find((block) => block.type === 'text')
        if (!textContent || textContent.type !== 'text') {
          console.error('No text content in response from Claude')
          continue
        }

        // Parse JSON response
        const jsonText = textContent.text.trim()
        let fileProducts: DetectedProduct[]

        try {
          // Try to extract JSON if Claude wrapped it in markdown
          let cleanedText = jsonText
          if (jsonText.includes('```json')) {
            cleanedText = jsonText.split('```json')[1].split('```')[0].trim()
          } else if (jsonText.includes('```')) {
            cleanedText = jsonText.split('```')[1].split('```')[0].trim()
          }

          fileProducts = JSON.parse(cleanedText)
        } catch (parseError) {
          console.error('Failed to parse Claude response as JSON:', jsonText.substring(0, 300))
          console.error('Parse error:', parseError)
          continue
        }

        // Validate each product - VERY lenient, accept almost anything
        if (Array.isArray(fileProducts)) {
          for (const product of fileProducts) {
            try {
              // Extract and clean name
              const name = product.name ? String(product.name).trim() : 'Producto'
              if (name.length === 0 || name === 'Producto') {
                continue // Skip if no valid name
              }

              // Parse price - very lenient
              let price = 0
              if (product.price !== undefined && product.price !== null) {
                if (typeof product.price === 'number') {
                  price = product.price
                } else {
                  const priceStr = String(product.price)
                  const match = priceStr.match(/\d+\.?\d*/)
                  if (match) {
                    price = parseFloat(match[0])
                  }
                }
              }
              // Accept price even if 0

              allProducts.push({
                name: name,
                description: product.description ? String(product.description).trim() : '',
                price: isNaN(price) ? 0 : price,
                category: product.category ? String(product.category).trim() : 'General',
              })
            } catch (err) {
              // Skip malformed products
              continue
            }
          }
        }
      } catch (imageError) {
        console.error(`[Scanner] Error processing image ${image.fileName}:`, imageError)
        // Continue with next image
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

        await db.insert(products).values({
          catalogId,
          name: product.name,
          slug,
          description: product.description || null,
          price: Math.round(product.price * 100),
          categoryId,
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
