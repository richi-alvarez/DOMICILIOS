import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { db, catalogs, products, categories, memberships } from '@/db'
import { auth } from '@/auth'
import { getClientIP } from '@/lib/api/get-client-ip'
import { checkRateLimit } from '@/lib/api/rate-limit'
import { sanitizeForPrompt, sanitizeInput } from '@/lib/validators/sanitizer'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { CATALOG_GENERATION_SYSTEM_PROMPT } from '@/lib/prompts/catalog-generation'

const GenerateRequestSchema = z.object({
  businessType: z.enum([
    'restaurant',
    'cafe',
    'bakery',
    'pizzeria',
    'pharmacy',
    'store',
    'beauty',
    'gym',
    'florist',
    'jewelry',
  ]),
  prompt: z.string().min(10).max(500),
  catalogName: z.string().min(3).max(100).optional(),
  catalogSlug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/),
  language: z.enum(['es', 'en']).default('es'),
  currency: z.enum(['COP', 'USD', 'EUR']).default('COP'),
})

interface CatalogGenerationResponse {
  catalogName: string
  description: string
  categories: Array<{
    name: string
    description: string
  }>
  products: Array<{
    name: string
    description: string
    price: number
    category: string
  }>
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication check
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Get client IP and check rate limit
    const ip = getClientIP(request)
    const rateLimitCheck = await checkRateLimit(ip, 'ai', 10) // 10 per minute for AI endpoints
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Too many requests. Please try again later.',
          retryAfter: rateLimitCheck.retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimitCheck.retryAfter),
          },
        }
      )
    }

    // 3. Validate request body
    const body = await request.json()
    const validated = GenerateRequestSchema.parse(body)

    // 4. Verify org membership
    const membership = await db.query.memberships.findFirst({
      where: eq(memberships.userId, session.user.id),
    })
    if (!membership) {
      return NextResponse.json({ error: 'Not member of any organization' }, { status: 403 })
    }

    // 5. Check if slug already exists
    const existingCatalog = await db.query.catalogs.findFirst({
      where: eq(catalogs.slug, validated.catalogSlug),
    })
    if (existingCatalog) {
      return NextResponse.json(
        { error: 'Catalog slug already exists' },
        { status: 400 }
      )
    }

    // 6. Sanitize prompt for AI
    const sanitizedPrompt = sanitizeForPrompt(validated.prompt)
    const userPrompt = `
Tipo de negocio: ${validated.businessType}
${validated.catalogName ? `Nombre del catálogo (sugerido): ${sanitizeInput(validated.catalogName)}` : ''}
Descripción: ${sanitizedPrompt}
    `.trim()

    // 7. Call Anthropic API
    const client = new Anthropic()
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      system: CATALOG_GENERATION_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    })

    // 8. Extract and parse AI response
    const content = response.content[0]
    if (content.type !== 'text') {
      return NextResponse.json(
        { error: 'Invalid response from AI' },
        { status: 500 }
      )
    }

    let generatedData: CatalogGenerationResponse
    try {
      // Try to extract JSON from response (in case AI adds extra text)
      const jsonMatch = content.text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        return NextResponse.json(
          { error: 'Invalid AI response format' },
          { status: 500 }
        )
      }
      generatedData = JSON.parse(jsonMatch[0])
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      )
    }

    // 9. Create catalog in database
    const catalogName = validated.catalogName || generatedData.catalogName
    const createdCatalog = await db.insert(catalogs).values({
      slug: validated.catalogSlug,
      name: sanitizeInput(catalogName),
      description: sanitizeInput(generatedData.description),
      orgId: membership.organizationId,
      language: validated.language,
      currency: validated.currency,
    })

    const catalogId = createdCatalog[0]?.id
    if (!catalogId) {
      return NextResponse.json(
        { error: 'Failed to create catalog' },
        { status: 500 }
      )
    }

    // 10. Create categories
    const categoryMap = new Map<string, string>()
    for (const cat of generatedData.categories) {
      const createdCat = await db.insert(categories).values({
        catalogId,
        name: sanitizeInput(cat.name),
        description: sanitizeInput(cat.description),
      })
      if (createdCat[0]?.id) {
        categoryMap.set(cat.name, createdCat[0].id)
      }
    }

    // 11. Create products
    const createdProducts = []
    for (const product of generatedData.products) {
      const categoryId = categoryMap.get(product.category) || null
      const price = Math.round(product.price) // Ensure integer

      const created = await db.insert(products).values({
        catalogId,
        name: sanitizeInput(product.name),
        slug: product.name
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, ''),
        description: sanitizeInput(product.description),
        price: Math.max(100, price), // Minimum 100 (1 COP or cent)
        categoryId,
        imagesJson: [],
        active: true,
      })

      if (created[0]) {
        createdProducts.push(created[0])
      }
    }

    // 12. Return success response
    return NextResponse.json(
      {
        catalogId,
        catalogName: sanitizeInput(catalogName),
        slug: validated.catalogSlug,
        productCount: createdProducts.length,
        products: createdProducts.map(p => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          description: p.description,
          price: p.price,
        })),
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    console.error('AI Generate endpoint error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
