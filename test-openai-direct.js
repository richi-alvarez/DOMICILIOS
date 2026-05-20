#!/usr/bin/env node

/**
 * Direct OpenAI Test - Test AI Catalog Generation with OpenAI
 * Mimics the actual catalog generation flow
 */

const fs = require('fs')

console.log(`
╔════════════════════════════════════════════════════════════════╗
║     OPENAI CATALOG GENERATION TEST                             ║
║                                                                ║
║  This script tests the AI catalog generation using OpenAI      ║
╚════════════════════════════════════════════════════════════════╝
`)

const apiKey = process.env.OPENAI_API_KEY
if (!apiKey) {
  console.error('❌ OPENAI_API_KEY not found in environment')
  process.exit(1)
}

console.log('✅ OPENAI_API_KEY loaded')

// Try to load OpenAI SDK
let OpenAI
try {
  const module = require('openai')
  OpenAI = module.default || module.OpenAI
  console.log('✅ OpenAI SDK loaded')
} catch (err) {
  console.error('❌ Failed to load OpenAI SDK:', err.message)
  console.log('\nInstall with: npm install openai')
  process.exit(1)
}

// Test prompts
const systemPrompt = `Eres un experto en diseño visual y generación de catálogos inteligentes para pequeños negocios. Tu objetivo es crear un catálogo atractivo y profesional basado en la descripción del negocio, incluyendo tema de color, banner y productos de ejemplo.

RESPONDE SIEMPRE CON JSON VÁLIDO, NADA MÁS. No incluyas explicaciones, markdown, o texto adicional.

Estructura esperada:
{
  "catalogName": "string - nombre del catálogo (máx 50 chars)",
  "description": "string - descripción breve (máx 200 chars)",
  "theme": {
    "primaryColor": "#hexcode",
    "secondaryColor": "#hexcode",
    "buttonPrimaryColor": "#hexcode",
    "buttonSecondaryColor": "#hexcode",
    "font": "poppins|inter|lato|raleway|nunito",
    "borderRadius": "none|sm|full"
  },
  "banner": {
    "title": "string",
    "subtitle": "string",
    "imageQuery": "professional image search query in english",
    "ctaText": "string",
    "overlayOpacity": 40,
    "overlayType": "dark|light"
  },
  "category": {
    "name": "string",
    "slug": "string - lowercase, hyphenated"
  },
  "products": [
    {
      "name": "string",
      "description": "string",
      "price": number,
      "bodyImageQuery": "professional product query in english",
      "carouselImageQuery": "professional product query in english"
    }
  ]
}

RESTRICCIONES:
- Máximo 3 productos
- 1 categoría
- Los colores deben extraerse de la descripción del negocio
- Las queries de imágenes deben ser en inglés
- El JSON debe ser válido y completo`

const userPrompt = `
Negocio: La Pastelería del Barrio
Tipo: bakery
Descripción: Somos una pastelería artesanal especializada en tortas personalizadas, cupcakes gourmet y postres para eventos. Nuestro estilo es elegante y femenino, usamos colores rosados, dorados y blancos. Todos nuestros productos son hechos a mano con ingredientes premium. Ubicados en el centro, atendemos bodas, cumpleaños y eventos corporativos.
Moneda: COP

Genera un catálogo profesional basado en estos datos.`

console.log('\n📤 PROMPTS:')
console.log('═'.repeat(64))
console.log('\nSystem Prompt (first 200 chars):')
console.log(systemPrompt.substring(0, 200) + '...')
console.log('\nUser Prompt:')
console.log(userPrompt)

async function testOpenAI() {
  try {
    console.log('\n⏳ Calling OpenAI API...')
    console.log('   Model: gpt-4o')
    console.log('   Temperature: 0.7')
    console.log('   Max Tokens: 2000\n')

    const client = new OpenAI({ apiKey })

    const startTime = Date.now()
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })
    const endTime = Date.now()

    console.log('✅ API Response received!')
    console.log(`   Time: ${(endTime - startTime) / 1000}s`)
    console.log(`   Stop Reason: ${response.choices[0].finish_reason}`)
    console.log(`   Input Tokens: ${response.usage.prompt_tokens}`)
    console.log(`   Output Tokens: ${response.usage.completion_tokens}`)
    console.log(`   Total Tokens: ${response.usage.total_tokens}`)

    const rawResponse = response.choices[0].message.content
    console.log('\n📄 RAW OPENAI RESPONSE:')
    console.log('═'.repeat(64))
    console.log(rawResponse)

    // Try to parse as JSON
    console.log('\n🔍 PARSING RESPONSE:')
    console.log('═'.repeat(64))

    let parsedResponse
    try {
      parsedResponse = JSON.parse(rawResponse)
      console.log('✅ Valid JSON parsed successfully!')
    } catch (err) {
      console.error('❌ Failed to parse JSON:', err.message)
      console.log('\nAttempting to extract JSON from response...')

      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          parsedResponse = JSON.parse(jsonMatch[0])
          console.log('✅ JSON extracted and parsed!')
        } catch (err2) {
          console.error('❌ Still failed to parse:', err2.message)
          return
        }
      } else {
        console.error('❌ No JSON found in response')
        return
      }
    }

    // Validate structure
    console.log('\n✅ RESPONSE VALIDATION:')
    console.log('═'.repeat(64))

    const validations = [
      ['catalogName', typeof parsedResponse.catalogName === 'string'],
      ['description', typeof parsedResponse.description === 'string'],
      ['theme.primaryColor', typeof parsedResponse.theme?.primaryColor === 'string'],
      ['theme.secondaryColor', typeof parsedResponse.theme?.secondaryColor === 'string'],
      ['theme.buttonPrimaryColor', typeof parsedResponse.theme?.buttonPrimaryColor === 'string'],
      ['theme.buttonSecondaryColor', typeof parsedResponse.theme?.buttonSecondaryColor === 'string'],
      ['theme.font', ['poppins','inter','lato','raleway','nunito'].includes(parsedResponse.theme?.font)],
      ['theme.borderRadius', ['none','sm','full'].includes(parsedResponse.theme?.borderRadius)],
      ['banner.title', typeof parsedResponse.banner?.title === 'string'],
      ['banner.subtitle', typeof parsedResponse.banner?.subtitle === 'string'],
      ['banner.imageQuery', typeof parsedResponse.banner?.imageQuery === 'string'],
      ['banner.ctaText', typeof parsedResponse.banner?.ctaText === 'string'],
      ['banner.overlayOpacity', typeof parsedResponse.banner?.overlayOpacity === 'number'],
      ['banner.overlayType', ['dark','light'].includes(parsedResponse.banner?.overlayType)],
      ['category.name', typeof parsedResponse.category?.name === 'string'],
      ['category.slug', typeof parsedResponse.category?.slug === 'string'],
      ['products array', Array.isArray(parsedResponse.products)],
      ['products length (1-3)', Array.isArray(parsedResponse.products) && parsedResponse.products.length >= 1 && parsedResponse.products.length <= 3],
    ]

    let passedCount = 0
    validations.forEach(([field, passed]) => {
      console.log(`${passed ? '✅' : '❌'} ${field}`)
      if (passed) passedCount++
    })

    // Validate each product
    if (Array.isArray(parsedResponse.products)) {
      console.log('\n📦 PRODUCT VALIDATION:')
      console.log('─'.repeat(64))
      parsedResponse.products.forEach((product, idx) => {
        console.log(`\nProduct ${idx + 1}: "${product.name}"`)
        console.log(`  ✅ name: ${typeof product.name === 'string' ? 'OK' : 'MISSING'}`)
        console.log(`  ✅ description: ${typeof product.description === 'string' ? 'OK' : 'MISSING'}`)
        console.log(`  ✅ price: ${typeof product.price === 'number' && product.price > 0 ? `OK (${product.price})` : 'MISSING/INVALID'}`)
        console.log(`  ✅ bodyImageQuery: ${typeof product.bodyImageQuery === 'string' ? 'OK' : 'MISSING'}`)
        console.log(`  ✅ carouselImageQuery: ${typeof product.carouselImageQuery === 'string' ? 'OK' : 'MISSING'}`)
      })
    }

    // Display full parsed response
    console.log('\n📊 FULL PARSED RESPONSE:')
    console.log('═'.repeat(64))
    console.log(JSON.stringify(parsedResponse, null, 2))

    // Save to file for reference
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `openai-response-${timestamp}.json`
    fs.writeFileSync(filename, JSON.stringify({
      timestamp: new Date().toISOString(),
      apiTime: `${(endTime - startTime) / 1000}s`,
      response: parsedResponse,
      rawResponse: rawResponse,
      validations: validations.reduce((acc, [field, passed]) => {
        acc[field] = passed
        return acc
      }, {}),
      tokensUsed: {
        prompt: response.usage.prompt_tokens,
        completion: response.usage.completion_tokens,
        total: response.usage.total_tokens
      }
    }, null, 2))

    console.log(`\n💾 Response saved to: ${filename}`)

    // Calculate cost
    const inputCost = (response.usage.prompt_tokens / 1000000) * 2.50 // GPT-4o: $2.50 per million input tokens
    const outputCost = (response.usage.completion_tokens / 1000000) * 10.00 // GPT-4o: $10.00 per million output tokens
    const totalCost = inputCost + outputCost

    console.log('\n💰 Cost Analysis:')
    console.log('═'.repeat(64))
    console.log(`Input tokens: ${response.usage.prompt_tokens} tokens = $${inputCost.toFixed(6)}`)
    console.log(`Output tokens: ${response.usage.completion_tokens} tokens = $${outputCost.toFixed(6)}`)
    console.log(`Total cost: $${totalCost.toFixed(6)} per generation`)

    console.log('\n✨ TEST COMPLETE - OpenAI response verified successfully!')
    return parsedResponse

  } catch (error) {
    console.error('\n❌ API Error:', error.message)
    if (error.status) {
      console.error(`   Status: ${error.status}`)
    }
    if (error.error?.message) {
      console.error(`   Details: ${error.error.message}`)
    }
    process.exit(1)
  }
}

// Run test
testOpenAI()
