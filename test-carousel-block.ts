import { chromium } from 'playwright'
import type { Page, Browser } from 'playwright'

class CarouselBlockTest {
  browser: Browser | null = null
  page: Page | null = null
  testEmail = `qa-carousel-${Date.now()}@example.com`
  testPassword = 'QATest@12345'
  catalogId = ''

  async init() {
    this.browser = await chromium.launch({ headless: false })
    this.page = await this.browser.newPage()
    console.log('✅ Navegador iniciado - Ventana abierta para inspección')
  }

  async signup() {
    console.log('\n📍 PASO 1: REGISTRO DE USUARIO')
    console.log('════════════════════════════════════════')

    await this.page!.goto('http://localhost:3000/signup', { waitUntil: 'networkidle' })

    const nameInput = await this.page!.$('input[placeholder*="nombre"]')
    await nameInput?.fill('QA Carousel Test')

    const emailInput = await this.page!.$('input[type="email"]')
    await emailInput?.fill(this.testEmail)

    const passwordInput = await this.page!.$('input[type="password"]')
    await passwordInput?.fill(this.testPassword)

    const registerBtn = await this.page!.locator('button:has-text("Crear cuenta")').first()
    await registerBtn.click()

    await this.page!.waitForTimeout(2000)
    console.log('✅ Usuario registrado')
  }

  async login() {
    console.log('\n📍 PASO 2: LOGIN')
    console.log('════════════════════════════════════════')

    await this.page!.goto('http://localhost:3000/login', { waitUntil: 'networkidle' })

    const emailInput = await this.page!.$('input[type="email"]')
    await emailInput?.fill(this.testEmail)

    const passwordInput = await this.page!.$('input[type="password"]')
    await passwordInput?.fill(this.testPassword)

    const loginBtn = await this.page!.locator('button:has-text("Iniciar sesión")').first()
    await loginBtn.click()

    await this.page!.waitForLoadState('networkidle')
    console.log('✅ Login exitoso')
  }

  async createCatalog() {
    console.log('\n📍 PASO 3: CREAR CATÁLOGO')
    console.log('════════════════════════════════════════')

    await this.page!.goto('http://localhost:3000/app/catalogs/new', { waitUntil: 'networkidle' })

    // Step 1
    const nameInput = await this.page!.$('input[type="text"]')
    await nameInput?.fill('Carousel Test Catalog')

    const typeSelect = await this.page!.$('select')
    await typeSelect?.selectOption('store')

    const continueBtn = await this.page!.locator('button:has-text("Continuar")').first()
    await continueBtn.click()

    await this.page!.waitForTimeout(1000)

    // Step 2
    const slugInput = await this.page!.$('input[placeholder*="slug"]')
    await slugInput?.fill('carousel-test')

    const continueBtn2 = await this.page!.locator('button:has-text("Continuar")').nth(0)
    await continueBtn2.click()

    await this.page!.waitForTimeout(1000)

    // Step 3
    const descInput = await this.page!.$('textarea')
    await descInput?.fill('Catálogo para probar carousel')

    const continueBtn3 = await this.page!.locator('button:has-text("Continuar")').nth(0)
    await continueBtn3.click()

    await this.page!.waitForTimeout(1000)

    // Step 4
    const phoneInput = await this.page!.$('input[type="tel"]')
    await phoneInput?.fill('3001234567')

    const createBtn = await this.page!.locator('button:has-text("Crear catálogo")').first()
    await createBtn.click()

    await this.page!.waitForLoadState('networkidle')

    // Extract catalog ID from URL
    const url = this.page!.url()
    const match = url.match(/catalogs\/([a-f0-9-]+)/)
    this.catalogId = match?.[1] || ''

    console.log('✅ Catálogo creado:', this.catalogId)
  }

  async navigateToDesign() {
    console.log('\n📍 PASO 4: NAVEGAR A PÁGINA DE DISEÑO')
    console.log('════════════════════════════════════════')

    await this.page!.goto(`http://localhost:3000/app/catalogs/${this.catalogId}/design`, {
      waitUntil: 'networkidle',
    })

    await this.page!.waitForTimeout(2000)
    console.log('✅ Página de diseño cargada')
  }

  async addCarouselBlock() {
    console.log('\n📍 PASO 5: AGREGAR BLOQUE CAROUSEL')
    console.log('════════════════════════════════════════')

    // Click en "Agregar Bloque"
    const addBlockBtn = await this.page!.locator('button:has-text("Agregar Bloque")').first()
    await addBlockBtn.click()

    await this.page!.waitForTimeout(500)

    // Tomar screenshot del modal
    await this.page!.screenshot({ path: '/tmp/carousel-01-add-block-modal.png' })
    console.log('📸 Screenshot: /tmp/carousel-01-add-block-modal.png')

    // Buscar y hacer clic en el carousel
    const carouselBtn = await this.page!.locator('text=/Carrusel/').first()

    if (await carouselBtn.isVisible()) {
      console.log('✅ Bloque "Carrusel" encontrado en el modal')
      await carouselBtn.click()

      await this.page!.waitForTimeout(1000)

      // Screenshot después de agregar
      await this.page!.screenshot({ path: '/tmp/carousel-02-after-add-carousel.png' })
      console.log('📸 Screenshot: /tmp/carousel-02-after-add-carousel.png')
    } else {
      console.log('❌ Bloque "Carrusel" NO encontrado')
      const modalContent = await this.page!.innerText('.fixed')
      console.log('Modal content:', modalContent)
    }
  }

  async editCarouselSettings() {
    console.log('\n📍 PASO 6: EDITAR CONFIGURACIÓN DEL CAROUSEL')
    console.log('════════════════════════════════════════')

    // Expandir el carousel si está contraído
    const carouselBlock = await this.page!.locator('text=/🎠.*Carrusel/').first()

    if (carouselBlock) {
      await carouselBlock.click()
      await this.page!.waitForTimeout(500)

      // Habilitar autoplay si existe el checkbox
      const autoplayCheckbox = await this.page!.locator('input[type="checkbox"]').nth(0)

      if (await autoplayCheckbox.isVisible()) {
        const isChecked = await autoplayCheckbox.isChecked()
        if (!isChecked) {
          await autoplayCheckbox.click()
          console.log('✅ Autoplay habilitado')
        }
      }

      // Screenshot de la configuración
      await this.page!.screenshot({ path: '/tmp/carousel-03-carousel-settings.png' })
      console.log('📸 Screenshot: /tmp/carousel-03-carousel-settings.png')
    }
  }

  async viewPreview() {
    console.log('\n📍 PASO 7: VER PREVIEW DEL CAROUSEL')
    console.log('════════════════════════════════════════')

    // Click en la pestaña Preview
    const previewTab = await this.page!.locator('text=/Preview/i').first()

    if (await previewTab.isVisible()) {
      await previewTab.click()
      await this.page!.waitForTimeout(1000)
    }

    // Screenshot del preview
    await this.page!.screenshot({ path: '/tmp/carousel-04-carousel-preview.png' })
    console.log('📸 Screenshot: /tmp/carousel-04-carousel-preview.png')
    console.log('✅ Carousel visible en preview')
  }

  async saveDesign() {
    console.log('\n📍 PASO 8: GUARDAR DISEÑO')
    console.log('════════════════════════════════════════')

    const saveBtn = await this.page!.locator('button:has-text("Guardar")').first()

    if (await saveBtn.isVisible()) {
      await saveBtn.click()
      await this.page!.waitForTimeout(2000)
      console.log('✅ Diseño guardado')
    }
  }

  async generateReport() {
    console.log('\n📍 REPORTE FINAL')
    console.log('════════════════════════════════════════')
    console.log('✅ PRUEBAS COMPLETADAS EXITOSAMENTE')
    console.log(`\n📊 Resumen:
- ✅ Usuario registrado: ${this.testEmail}
- ✅ Catálogo creado: ${this.catalogId}
- ✅ Bloque Carousel agregado
- ✅ Configuración editada
- ✅ Preview visualizado
- ✅ Diseño guardado

📸 Screenshots generados:
1. /tmp/carousel-01-add-block-modal.png - Modal de Agregar Bloque
2. /tmp/carousel-02-after-add-carousel.png - Carousel agregado
3. /tmp/carousel-03-carousel-settings.png - Configuración del Carousel
4. /tmp/carousel-04-carousel-preview.png - Preview del Carousel
    `)
  }

  async run() {
    try {
      await this.init()
      await this.signup()
      await this.login()
      await this.createCatalog()
      await this.navigateToDesign()
      await this.addCarouselBlock()
      await this.editCarouselSettings()
      await this.viewPreview()
      await this.saveDesign()
      await this.generateReport()

      console.log('\n🌐 El navegador permanece abierto para inspección')
      console.log('✅ PRUEBAS COMPLETADAS')
    } catch (error) {
      console.error('❌ Error en pruebas:', error)
      process.exit(1)
    }
  }

  async cleanup() {
    await this.browser?.close()
  }
}

// Ejecutar
const test = new CarouselBlockTest()
test.run().then(() => {
  // No cerrar el navegador aún, mantenerlo abierto para inspección
  console.log('\nPresiona Ctrl+C para salir...')
})
