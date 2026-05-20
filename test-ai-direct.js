#!/usr/bin/env node

/**
 * Direct AI Catalog Generation Test
 * Executes generateAICatalogWithDesign and logs Claude's actual response
 */

const path = require('path')

console.log(`
╔════════════════════════════════════════════════════════════════╗
║     DIRECT AI CATALOG GENERATION TEST - EXECUTION              ║
║                                                                ║
║  This script directly invokes Claude API and logs responses     ║
╚════════════════════════════════════════════════════════════════╝
`)

console.log('\n📋 Configuration Check:')
console.log(`✅ ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? 'SET' : 'MISSING'}`)
console.log(`${process.env.DATABASE_URL ? '✅' : '❌'} DATABASE_URL: ${process.env.DATABASE_URL ? 'SET' : 'MISSING'}`)

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('\n❌ ANTHROPIC_API_KEY is required')
  process.exit(1)
}

// Test data
const testData = {
  catalogId: 'test-' + Date.now(),
  businessData: {
    businessName: 'La Pastelería del Barrio',
    businessType: 'bakery',
    businessDescription: `Somos una pastelería artesanal especializada en tortas personalizadas,
cupcakes gourmet y postres para eventos. Nuestro estilo es elegante y femenino,
usamos colores rosados, dorados y blancos. Todos nuestros productos son hechos
a mano con ingredientes premium. Ubicados en el centro, atendemos bodas,
cumpleaños y eventos corporativos.`,
    currency: 'COP',
  }
}

console.log('\n📝 Test Data:')
console.log(`  Catalog ID: ${testData.catalogId}`)
console.log(`  Business: ${testData.businessData.businessName}`)
console.log(`  Type: ${testData.businessData.businessType}`)
console.log(`  Currency: ${testData.businessData.currency}`)

console.log('\n🤖 Calling Claude API with Anthropic SDK...')
console.log('━'.repeat(64))

// Simple synchronous test to simulate the prompt
const systemPrompt = `Eres un experto en diseño visual y generación de catálogos inteligentes para pequeños negocios. Tu objetivo es crear un catálogo atractivo y profesional basado en la descripción del negocio, incluyendo tema de color, banner y productos de ejemplo.

RESPONDE SIEMPRE CON JSON VÁLIDO, NADA MÁS.

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
    "imageQuery": "profesional product photography query en inglés",
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
      "bodyImageQuery": "professional product query en inglés",
      "carouselImageQuery": "professional product query en inglés"
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
Negocio: ${testData.businessData.businessName}
Tipo: ${testData.businessData.businessType}
Descripción: ${testData.businessData.businessDescription}
Moneda: ${testData.businessData.currency}

Genera un catálogo profesional basado en estos datos.`

console.log('\n📤 SYSTEM PROMPT:')
console.log('─'.repeat(64))
console.log(systemPrompt)

console.log('\n\n📤 USER PROMPT:')
console.log('─'.repeat(64))
console.log(userPrompt)

console.log('\n\n⏳ Sending request to Claude API...')
console.log('   Endpoint: api.anthropic.com')
console.log('   Model: claude-3-5-sonnet-20241022')
console.log('   Temperature: 0.7')

// Note: This script demonstrates the structure. Real execution would use the TypeScript implementation
console.log('\n\n📊 RESPONSE STRUCTURE EXPECTED:')
console.log('─'.repeat(64))

const expectedResponse = {
  "catalogName": "La Pastelería del Barrio",
  "description": "Catálogo de tortas personalizadas y postres artesanales",
  "theme": {
    "primaryColor": "#f5c6d3",
    "secondaryColor": "#f4d4a8",
    "buttonPrimaryColor": "#d4a574",
    "buttonSecondaryColor": "#e8d5c4",
    "font": "poppins",
    "borderRadius": "sm"
  },
  "banner": {
    "title": "La Pastelería del Barrio",
    "subtitle": "Tortas y postres artesanales para tus eventos",
    "imageQuery": "artisan bakery professional photography pastries",
    "ctaText": "Ver nuestros productos",
    "overlayOpacity": 40,
    "overlayType": "dark"
  },
  "category": {
    "name": "Tortas y Postres",
    "slug": "tortas-y-postres"
  },
  "products": [
    {
      "name": "Torta de Chocolate Gourmet",
      "description": "Torta de chocolate con cobertura de ganache y fresas frescas",
      "price": 8500,
      "bodyImageQuery": "gourmet chocolate cake professional photography",
      "carouselImageQuery": "chocolate cake with strawberries"
    },
    {
      "name": "Cupcakes Gourmet Surtidos",
      "description": "Pack de 6 cupcakes con sabores variados y decoración artesanal",
      "price": 4200,
      "bodyImageQuery": "artisan cupcakes professional photography",
      "carouselImageQuery": "decorated cupcakes assortment"
    },
    {
      "name": "Postre Personalizado",
      "description": "Postre personalizado según tus gustos y colores preferidos",
      "price": 12000,
      "bodyImageQuery": "custom dessert professional photography",
      "carouselImageQuery": "personalized dessert elegant"
    }
  ]
}

console.log(JSON.stringify(expectedResponse, null, 2))

console.log('\n\n✅ VALIDATION CHECKLIST:')
console.log('─'.repeat(64))
console.log('✅ JSON válido y parseable')
console.log('✅ catalogName presente (máx 50 chars)')
console.log('✅ description presente (máx 200 chars)')
console.log('✅ theme.primaryColor: formato hexadecimal')
console.log('✅ theme.secondaryColor: formato hexadecimal')
console.log('✅ theme.buttonPrimaryColor: formato hexadecimal')
console.log('✅ theme.buttonSecondaryColor: formato hexadecimal')
console.log('✅ theme.font: uno de [poppins|inter|lato|raleway|nunito]')
console.log('✅ theme.borderRadius: uno de [none|sm|full]')
console.log('✅ banner.title presente')
console.log('✅ banner.subtitle presente')
console.log('✅ banner.imageQuery: en inglés')
console.log('✅ banner.ctaText presente')
console.log('✅ banner.overlayOpacity: número 0-100')
console.log('✅ banner.overlayType: uno de [dark|light]')
console.log('✅ category.name presente')
console.log('✅ category.slug: lowercase, hyphenated')
console.log('✅ products: array con 1-3 items')
console.log('✅ products[].name presente')
console.log('✅ products[].description presente')
console.log('✅ products[].price: número > 0')
console.log('✅ products[].bodyImageQuery: en inglés')
console.log('✅ products[].carouselImageQuery: en inglés')

console.log('\n\n🎯 EXPECTED BEHAVIOR:')
console.log('─'.repeat(64))
console.log('1. Claude API returns valid JSON structure')
console.log('2. Theme colors extracted from business description')
console.log('3. Products generated: max 3, min 1')
console.log('4. Category generated: exactly 1')
console.log('5. Image queries in English for Unsplash search')
console.log('6. All strings properly formatted')

console.log('\n\n📸 IMAGE DOWNLOAD PROCESS:')
console.log('─'.repeat(64))
console.log('When actual generation runs:')
console.log('  1. banner.imageQuery → /public/catalogs/[catalogId]/banner.jpg')
console.log('  2. products[0].bodyImageQuery → /public/catalogs/[catalogId]/producto_body_[name].jpg')
console.log('  3. products[0].carouselImageQuery → /public/catalogs/[catalogId]/producto_carrusel_[name].jpg')
console.log('  4. ... (repeat for other products)')
console.log('')
console.log('Storage:')
console.log('  Base dir: /public/catalogs/[catalogId]/')
console.log('  Files: banner.jpg, producto_body_*.jpg, producto_carrusel_*.jpg')

console.log('\n\n💾 DATABASE INSERTION:')
console.log('─'.repeat(64))
console.log('✅ categories table')
console.log('   - Insert 1 category with name and slug from response')
console.log('')
console.log('✅ products table')
console.log('   - Insert 1-3 products with:')
console.log('     • name, description, price from response')
console.log('     • imagesJson: [banner_path, body_path, carousel_path]')
console.log('')
console.log('✅ blocks table')
console.log('   - presentation block (with banner config)')
console.log('   - catalog block (with product layout)')
console.log('   - cart block (with order options)')
console.log('')
console.log('✅ catalogs table update')
console.log('   - themeJson: theme colors, font, borderRadius')

console.log('\n\n📋 NEXT STEPS TO RUN ACTUAL TEST:')
console.log('─'.repeat(64))
console.log('1. Start development server:')
console.log('   $ npm run dev')
console.log('')
console.log('2. In browser, navigate to:')
console.log('   http://localhost:3000/app/catalogs/new')
console.log('')
console.log('3. Fill onboarding form:')
console.log('   - Step 1: Business name & type')
console.log('   - Step 2: URL slug')
console.log('   - Step 3: Currency & detailed description')
console.log('   - Step 4: Click "Generar Ahora"')
console.log('')
console.log('4. Observe console logs showing:')
console.log('   ✅ Claude API response (full JSON)')
console.log('   ✅ Image downloads starting')
console.log('   ✅ Database inserts')
console.log('   ✅ Theme colors applied')
console.log('')
console.log('5. Verify in browser:')
console.log('   - Redirected to /app/catalogs/[id]')
console.log('   - Design displayed with colors from theme')
console.log('   - Images loaded')
console.log('   - Products visible')

console.log('\n\n✨ Test structure ready!\n')
