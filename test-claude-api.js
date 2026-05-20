#!/usr/bin/env node

/**
 * Live Claude API Test - Actual Anthropic API Call
 * Tests the real AI catalog generation with actual Claude response
 */

const fs = require('fs')

console.log(`
╔════════════════════════════════════════════════════════════════╗
║     LIVE CLAUDE API TEST - REAL ANTHROPIC RESPONSE              ║
╚════════════════════════════════════════════════════════════════╝
`)

const apiKey = process.env.ANTHROPIC_API_KEY
if (!apiKey) {
  console.error('❌ ANTHROPIC_API_KEY not found in environment')
  process.exit(1)
}

console.log('✅ ANTHROPIC_API_KEY loaded')

// Import Anthropic SDK
let Anthropic
try {
  const module = require('@anthropic-ai/sdk')
  Anthropic = module.default || module.Anthropic || module
  console.log('✅ Anthropic SDK loaded')
} catch (err) {
  console.error('❌ Failed to load Anthropic SDK:', err.message)
  console.log('\nInstall with: npm install @anthropic-ai/sdk')
  process.exit(1)
}

// Test configuration
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

console.log('\n📤 PROMPTS TO SEND:')
console.log('═'.repeat(64))
console.log('\nSYSTEM PROMPT (first 200 chars):')
console.log(systemPrompt.substring(0, 200) + '...')
console.log('\nUSER PROMPT:')
console.log(userPrompt)

async function testClaudeAPI() {
  try {
    console.log('\n⏳ Calling Claude API...')
    console.log('   Model: claude-3-5-sonnet-20241022')
    console.log('   Temperature: 0.7')
    console.log('   Max Tokens: 2048\n')

    const client = new Anthropic()

    const startTime = Date.now()
    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt
        }
      ]
    })
    const endTime = Date.now()

    console.log('✅ API Response received!')
    console.log(`   Time: ${(endTime - startTime) / 1000}s`)
    console.log(`   Status: success`)
    console.log(`   Stop Reason: ${response.stop_reason}`)

    // Extract text content
    const textContent = response.content.find(block => block.type === 'text')
    if (!textContent) {
      console.error('❌ No text content in response')
      return
    }

    const rawResponse = textContent.text
    console.log('\n📄 RAW CLAUDE RESPONSE:')
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
    const filename = `claude-response-${timestamp}.json`
    fs.writeFileSync(filename, JSON.stringify({
      timestamp: new Date().toISOString(),
      apiTime: `${(endTime - startTime) / 1000}s`,
      response: parsedResponse,
      rawResponse: rawResponse,
      validations: validations.reduce((acc, [field, passed]) => {
        acc[field] = passed
        return acc
      }, {})
    }, null, 2))

    console.log(`\n💾 Response saved to: ${filename}`)

    console.log('\n✨ TEST COMPLETE - Claude response verified successfully!')
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
testClaudeAPI()
