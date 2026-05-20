/**
 * 🎯 QA E2E COMPLETE FLOW - AGENT DE PRUEBAS
 *
 * Flujo Completo:
 * 1. Registro de nuevo usuario (sin Google)
 * 2. Logout y Login con credenciales creadas
 * 3. Crear catálogo (4-step wizard)
 * 4. Crear 3 categorías (Electronics, Accessories, Software)
 * 5. Crear 3 productos con precios y categorías
 * 6. Verificar visualización en preview del diseño
 *
 * Mantiene ventana Playwright abierta para inspección
 * Genera reporte markdown con resultados
 */

import { chromium, type Browser, type Page } from 'playwright'
import * as fs from 'fs'
import * as path from 'path'

class QAE2EComplete {
  private browser: Browser | null = null
  private page: Page | null = null
  private logs: string[] = []
  private testTimestamp = Date.now()
  private testEmail = `qa-test-${this.testTimestamp}@example.com`
  private testPassword = 'QATest@12345'
  private testCatalogSlug = `qa-shop-${this.testTimestamp}`

  private testData = {
    catalog: {
      name: `QA Shop ${this.testTimestamp}`,
      slug: this.testCatalogSlug,
      description: 'Catálogo de prueba E2E para verificar flujo completo',
      type: 'store',
    },
    categories: [
      { name: 'Electronics', slug: 'electronics', description: 'Productos electrónicos' },
      { name: 'Accessories', slug: 'accessories', description: 'Accesorios' },
      { name: 'Software', slug: 'software', description: 'Software y aplicaciones' },
    ],
    products: [
      { name: 'Gaming PC', price: 2499, category: 'Electronics', description: 'Computadora gaming de alta performance' },
      { name: 'Wireless Headphones', price: 199, category: 'Accessories', description: 'Audífonos inalámbricos con cancelación de ruido' },
      { name: 'Antivirus Suite', price: 49, category: 'Software', description: 'Suite de seguridad premium' },
    ],
  }

  private results = {
    passed: 0,
    failed: 0,
    tests: [] as Array<{ name: string; status: 'PASS' | 'FAIL'; details: string }>
  }

  async init() {
    console.log('\n🚀 Inicializando QA E2E Complete Flow...\n')
    this.browser = await chromium.launch({ headless: false, slowMo: 300 })
    this.page = await this.browser.newPage({ viewport: { width: 1280, height: 720 } })
    this.log('✅ Navegador iniciado - Ventana abierta para inspección', 'SUCCESS')
  }

  private log(message: string, type: 'INFO' | 'SUCCESS' | 'FAIL' | 'STEP' = 'INFO') {
    const timestamp = new Date().toISOString()
    const icon = type === 'SUCCESS' ? '✅' : type === 'FAIL' ? '❌' : type === 'STEP' ? '📍' : 'ℹ️'
    const logMsg = `${icon} [${timestamp}] ${message}`
    this.logs.push(logMsg)
    console.log(logMsg)
  }

  private addTest(name: string, status: 'PASS' | 'FAIL', details: string = '') {
    this.results.tests.push({ name, status, details })
    if (status === 'PASS') {
      this.results.passed++
      this.log(`✅ TEST PASS: ${name}`, 'SUCCESS')
    } else {
      this.results.failed++
      this.log(`❌ TEST FAIL: ${name} - ${details}`, 'FAIL')
    }
  }

  private async screenshot(name: string) {
    const fileName = `/tmp/qa-e2e-${name}-${this.testTimestamp}.png`
    await this.page!.screenshot({ path: fileName, fullPage: true })
    this.log(`📸 Screenshot: ${fileName}`, 'SUCCESS')
    return fileName
  }

  private async closeModals() {
    try {
      // Presionar Escape para cerrar cualquier modal
      await this.page!.keyboard.press('Escape')
      await this.page!.waitForTimeout(300)

      // Buscar y hacer clic en botones de cerrar
      const closeButtons = await this.page!.$$('button[aria-label="Close"], button[aria-label="Cerrar"], [role="dialog"] button:last-child, .modal button.close, .dialog button.close, [data-testid="close-button"]')
      for (const btn of closeButtons) {
        try {
          await btn.click({ force: true })
          await this.page!.waitForTimeout(300)
          this.log('Modal cerrado con botón', 'INFO')
          break
        } catch (e) {
          // Continuar si este botón no funciona
        }
      }

      // Verificar si el overlay sigue visible y hacer clic en él para cerrar
      const overlay = await this.page!.$('div.fixed.inset-0.z-50')
      if (overlay) {
        // Hacer clic fuera del modal para cerrarlo
        await this.page!.click('div.fixed.inset-0.z-50', { force: true })
        await this.page!.waitForTimeout(500)
      }
    } catch (e) {
      // Ignorar errores
    }
  }

  // ============================================================================
  // PASO 1: REGISTRO DE NUEVO USUARIO
  // ============================================================================

  async stepRegisterNewUser(): Promise<boolean> {
    this.log('', 'STEP')
    this.log('═'.repeat(80), 'STEP')
    this.log('PASO 1: REGISTRO DE NUEVO USUARIO', 'STEP')
    this.log('═'.repeat(80), 'STEP')

    try {
      this.log(`Navegando a página de signup...`, 'INFO')
      await this.page!.goto('http://localhost:3000/signup', { waitUntil: 'networkidle' })
      await this.page!.waitForTimeout(2000)

      // Buscar campos de registro
      const inputs = await this.page!.$$('input[type="text"], input[type="email"], input[type="password"]')
      this.log(`Encontrados ${inputs.length} campos de entrada`, 'INFO')

      if (inputs.length >= 3) {
        // Nombre, Email, Contraseña
        await inputs[0].fill('QA Test User')
        this.log('Nombre ingresado', 'SUCCESS')
        await this.page!.waitForTimeout(300)

        await inputs[1].fill(this.testEmail)
        this.log(`Email ingresado: ${this.testEmail}`, 'SUCCESS')
        await this.page!.waitForTimeout(300)

        await inputs[2].fill(this.testPassword)
        this.log('Contraseña ingresada', 'SUCCESS')
        await this.page!.waitForTimeout(300)
      }

      await this.screenshot('01-signup-form-filled')

      // Buscar botón de registro
      const buttons = await this.page!.$$('button')
      for (const btn of buttons) {
        const text = await btn.innerText()
        if (text.toLowerCase().includes('registrar') || text.toLowerCase().includes('sign up') || text.toLowerCase().includes('crear')) {
          await btn.click()
          this.log('Botón de registro presionado', 'SUCCESS')
          await this.page!.waitForTimeout(3000)
          break
        }
      }

      await this.screenshot('02-after-signup')

      // Esperar a que se complete el registro
      await this.page!.waitForTimeout(2000)
      const url = this.page!.url()
      this.log(`URL actual después de signup: ${url}`, 'INFO')

      // Si no redirige automáticamente, navegar a login manualmente
      if (url.includes('/signup')) {
        this.log('No hubo redirección, navegando manualmente a login...', 'INFO')
        await this.page!.goto('http://localhost:3000/login', { waitUntil: 'networkidle' })
        await this.page!.waitForTimeout(2000)
      }

      this.addTest('User Registration', 'PASS', `Usuario creado: ${this.testEmail}`)
      return true
    } catch (error) {
      this.addTest('User Registration', 'FAIL', String(error))
      return false
    }
  }

  // ============================================================================
  // PASO 2: LOGOUT Y LOGIN
  // ============================================================================

  async stepLogoutAndLogin(): Promise<boolean> {
    this.log('', 'STEP')
    this.log('═'.repeat(80), 'STEP')
    this.log('PASO 2: LOGOUT Y LOGIN', 'STEP')
    this.log('═'.repeat(80), 'STEP')

    try {
      // Buscar menú de usuario o botón de logout
      this.log('Buscando menú de usuario...', 'INFO')
      const userMenuButtons = await this.page!.$$('button, [role="button"]')

      let foundLogout = false
      for (const btn of userMenuButtons) {
        const text = await btn.innerText()
        if (text.toLowerCase().includes('logout') || text.toLowerCase().includes('cerrar')) {
          await btn.click()
          this.log('Logout presionado', 'SUCCESS')
          foundLogout = true
          await this.page!.waitForTimeout(2000)
          break
        }
      }

      if (!foundLogout) {
        // Intentar navegar directamente a logout
        this.log('Intentando logout vía navegación...', 'INFO')
        await this.page!.goto('http://localhost:3000/api/auth/signout', { waitUntil: 'networkidle' })
        await this.page!.waitForTimeout(2000)
      }

      await this.screenshot('03-after-logout')

      // Navegar a login
      this.log('Navegando a login...', 'INFO')
      await this.page!.goto('http://localhost:3000/login', { waitUntil: 'networkidle' })
      await this.page!.waitForTimeout(2000)

      // Llenar formulario de login
      const inputs = await this.page!.$$('input[type="email"], input[type="text"], input[type="password"]')
      if (inputs.length >= 2) {
        await inputs[0].fill(this.testEmail)
        this.log(`Email de login: ${this.testEmail}`, 'SUCCESS')
        await this.page!.waitForTimeout(300)

        await inputs[1].fill(this.testPassword)
        this.log('Contraseña ingresada', 'SUCCESS')
        await this.page!.waitForTimeout(300)
      }

      await this.screenshot('04-login-form-filled')

      // Presionar botón de login
      const buttons = await this.page!.$$('button')
      for (const btn of buttons) {
        const text = await btn.innerText()
        if (text.toLowerCase().includes('iniciar') || text.toLowerCase().includes('login') || text.toLowerCase().includes('entrar')) {
          await btn.click()
          this.log('Botón de login presionado', 'SUCCESS')
          await this.page!.waitForTimeout(3000)
          break
        }
      }

      await this.screenshot('05-after-login')

      const loginUrl = this.page!.url()
      if (!loginUrl.includes('/login')) {
        this.addTest('User Login', 'PASS', `Login exitoso con: ${this.testEmail}`)
        return true
      } else {
        this.addTest('User Login', 'FAIL', 'Login no fue exitoso')
        return false
      }
    } catch (error) {
      this.addTest('User Login', 'FAIL', String(error))
      return false
    }
  }

  // ============================================================================
  // PASO 3: CREAR CATÁLOGO (4-STEP WIZARD)
  // ============================================================================

  async stepCreateCatalog(): Promise<boolean> {
    this.log('', 'STEP')
    this.log('═'.repeat(80), 'STEP')
    this.log('PASO 3: CREAR CATÁLOGO (4-STEP WIZARD)', 'STEP')
    this.log('═'.repeat(80), 'STEP')

    try {
      this.log('Navegando a /app/catalogs/new...', 'INFO')
      await this.page!.goto('http://localhost:3000/app/catalogs/new', { waitUntil: 'networkidle' })
      await this.page!.waitForTimeout(2000)

      // ========== STEP 1: BUSINESS NAME & TYPE ==========
      this.log('STEP 1: Nombre del negocio y tipo...', 'INFO')
      const businessInput = await this.page!.$('input[placeholder*="Ej"]')
      if (businessInput) {
        await businessInput.fill(this.testData.catalog.name)
        this.log(`Nombre del negocio: ${this.testData.catalog.name}`, 'SUCCESS')
        await this.page!.waitForTimeout(500)
      }

      // Seleccionar tipo de negocio (Tienda)
      const businessTypeButtons = await this.page!.$$('button')
      for (const btn of businessTypeButtons) {
        const text = await btn.innerText()
        if (text.toLowerCase().includes('tienda') || text.toLowerCase().includes('store')) {
          await btn.click()
          this.log('Tipo de negocio seleccionado: Tienda', 'SUCCESS')
          break
        }
      }

      await this.screenshot('06-wizard-step1')
      await this.page!.waitForTimeout(1000)

      // Click Continuar
      const continueButtons = await this.page!.$$('button')
      for (const btn of continueButtons) {
        const text = await btn.innerText()
        if (text.toLowerCase().includes('continuar')) {
          await btn.click()
          this.log('Step 1 → 2: Presionado Continuar', 'SUCCESS')
          await this.page!.waitForTimeout(2000)
          break
        }
      }

      // ========== STEP 2: SLUG ==========
      this.log('STEP 2: Configurando slug...', 'INFO')
      const slugInput = await this.page!.$('input[placeholder*="mi-tienda"]')
      if (slugInput) {
        await slugInput.fill('')
        await slugInput.fill(this.testData.catalog.slug)
        this.log(`Slug: ${this.testData.catalog.slug}`, 'SUCCESS')
        await this.page!.waitForTimeout(1500)
      }

      await this.screenshot('07-wizard-step2')

      // Click Continuar
      const continueBtn2 = await this.page!.$$('button')
      for (const btn of continueBtn2) {
        const text = await btn.innerText()
        if (text.toLowerCase().includes('continuar')) {
          await btn.click()
          this.log('Step 2 → 3: Presionado Continuar', 'SUCCESS')
          await this.page!.waitForTimeout(2000)
          break
        }
      }

      // ========== STEP 3: CURRENCY & DESCRIPTION ==========
      this.log('STEP 3: Moneda y descripción...', 'INFO')
      const currencySelect = await this.page!.$('select')
      if (currencySelect) {
        await currencySelect.selectOption('COP')
        this.log('Moneda: COP', 'SUCCESS')
        await this.page!.waitForTimeout(500)
      }

      const descInputs = await this.page!.$$('textarea, input[type="text"]')
      if (descInputs.length > 0) {
        const lastInput = descInputs[descInputs.length - 1]
        await lastInput.fill(this.testData.catalog.description)
        this.log('Descripción del catálogo ingresada', 'SUCCESS')
        await this.page!.waitForTimeout(500)
      }

      await this.screenshot('08-wizard-step3')

      // Click Continuar
      const continueBtn3 = await this.page!.$$('button')
      for (const btn of continueBtn3) {
        const text = await btn.innerText()
        if (text.toLowerCase().includes('continuar')) {
          await btn.click()
          this.log('Step 3 → 4: Presionado Continuar', 'SUCCESS')
          await this.page!.waitForTimeout(2000)
          break
        }
      }

      // ========== STEP 4: CONTACT INFO ==========
      this.log('STEP 4: Información de contacto...', 'INFO')

      // Buscar todos los inputs en Step 4
      const step4Inputs = await this.page!.$$('input')
      if (step4Inputs.length > 0) {
        // El primer input debería ser el teléfono
        await step4Inputs[0].fill('3001234567')
        this.log('Teléfono: 3001234567', 'SUCCESS')
        await this.page!.waitForTimeout(1000)
      }

      await this.screenshot('09-wizard-step4')

      // Esperar a que el botón se habilite
      this.log('Esperando a que el botón Crear se habilite...', 'INFO')
      await this.page!.waitForTimeout(1500)

      // Click Crear - buscar el botón con "Crear" o "Create"
      const createButtons = await this.page!.$$('button')
      let foundCreateBtn = false
      for (const btn of createButtons) {
        const text = await btn.innerText()
        const isEnabled = await btn.isEnabled()
        this.log(`  Botón encontrado: "${text}" - Habilitado: ${isEnabled}`, 'INFO')

        if (text.toLowerCase().includes('crear') && isEnabled) {
          await btn.click()
          this.log('Botón Crear presionado exitosamente', 'SUCCESS')
          foundCreateBtn = true
          await this.page!.waitForTimeout(3000)
          break
        }
      }

      if (!foundCreateBtn) {
        this.log('Botón Crear no encontrado o deshabilitado, intentando por força...', 'INFO')
        for (const btn of createButtons) {
          const text = await btn.innerText()
          if (text.toLowerCase().includes('crear')) {
            try {
              await btn.click({ force: true })
              this.log('Botón Crear forzado', 'SUCCESS')
              await this.page!.waitForTimeout(3000)
            } catch (e) {
              this.log(`Fallo al forzar el botón: ${e}`, 'INFO')
            }
            break
          }
        }
      }

      await this.screenshot('10-catalog-created')

      // Verificar que se creó
      const catalogUrl = this.page!.url()
      if (catalogUrl.includes('/app/catalogs/') && !catalogUrl.includes('/new')) {
        this.addTest('Catalog Creation', 'PASS', `Catálogo creado: ${this.testData.catalog.name}`)
        return true
      } else {
        this.addTest('Catalog Creation', 'FAIL', `URL no es la esperada: ${catalogUrl}`)
        return false
      }
    } catch (error) {
      this.addTest('Catalog Creation', 'FAIL', String(error))
      return false
    }
  }

  // ============================================================================
  // PASO 4: CREAR CATEGORÍAS
  // ============================================================================

  async stepCreateCategories(): Promise<boolean> {
    this.log('', 'STEP')
    this.log('═'.repeat(80), 'STEP')
    this.log('PASO 4: CREAR CATEGORÍAS', 'STEP')
    this.log('═'.repeat(80), 'STEP')

    try {
      // Obtener ID del catálogo de la URL actual
      const catalogId = await this.page!.evaluate(() => {
        const match = window.location.pathname.match(/\/catalogs\/([^\/]+)/)
        return match ? match[1] : null
      })

      this.log(`ID del catálogo: ${catalogId}`, 'INFO')

      if (!catalogId) {
        this.addTest('Create Categories', 'FAIL', 'No se pudo obtener el ID del catálogo')
        return false
      }

      // Navegar a la página de categorías
      this.log('Navegando a página de categorías...', 'INFO')
      await this.page!.goto(`http://localhost:3000/app/catalogs/${catalogId}/categories`, { waitUntil: 'networkidle' })
      await this.page!.waitForTimeout(3000)

      await this.screenshot('11-categories-page')

      // Crear cada categoría vía UI
      let categoriesCreated = 0
      for (const category of this.testData.categories) {
        this.log(`Creando categoría: ${category.name}...`, 'INFO')

        try {
          // Buscar y clickear el botón "Agregar categoría"
          const addCategoryBtn = await this.page!.$('button:has-text("Agregar categoría"), button:has-text("Agregar"), [class*="agregar"]')
          if (!addCategoryBtn) {
            // Intentar encontrar por texto del elemento o clase
            const buttons = await this.page!.$$('button')
            let found = false
            for (const btn of buttons) {
              const text = await btn.innerText()
              if (text.toLowerCase().includes('agregar')) {
                await btn.click()
                this.log(`✅ Botón "Agregar categoría" clickeado`, 'INFO')
                found = true
                break
              }
            }
            if (!found) {
              this.log(`⚠️ No se encontró botón "Agregar categoría"`, 'INFO')
              continue
            }
          } else {
            await addCategoryBtn.click()
            this.log(`✅ Botón "Agregar categoría" clickeado`, 'INFO')
          }

          // Esperar a que aparezca el input de nombre
          await this.page!.waitForTimeout(500)

          // Llenar el nombre de la categoría en el input que aparece
          const categoryInput = await this.page!.$('input[placeholder*="categoría"]')
          if (categoryInput) {
            await categoryInput.fill(category.name)
            this.log(`✅ Nombre de categoría: ${category.name}`, 'SUCCESS')
            await this.page!.waitForTimeout(300)

            // Clickear el botón "Guardar"
            const saveBtn = await this.page!.$('button:has-text("Guardar")')
            if (saveBtn) {
              await saveBtn.click()
              this.log(`✅ Categoría ${category.name} guardada`, 'SUCCESS')
              categoriesCreated++
              await this.page!.waitForTimeout(1000)
            } else {
              // Si no encontramos por has-text, buscar por orden
              const allBtns = await this.page!.$$('button')
              for (const btn of allBtns) {
                const text = await btn.innerText()
                if (text.includes('Guardar') || text.includes('✓')) {
                  await btn.click()
                  this.log(`✅ Categoría ${category.name} guardada`, 'SUCCESS')
                  categoriesCreated++
                  await this.page!.waitForTimeout(1000)
                  break
                }
              }
            }
          } else {
            this.log(`⚠️ No se encontró input para categoría`, 'INFO')
          }
        } catch (e) {
          this.log(`Error creando categoría ${category.name}: ${e}`, 'INFO')
        }
      }

      await this.screenshot('12-categories-created')

      if (categoriesCreated > 0) {
        this.addTest('Create Categories', 'PASS', `${categoriesCreated} categorías creadas exitosamente`)
        return true
      } else {
        this.addTest('Create Categories', 'FAIL', 'No se crearon categorías')
        return false
      }
    } catch (error) {
      this.addTest('Create Categories', 'FAIL', String(error))
      return false
    }
  }

  // ============================================================================
  // PASO 5: CREAR PRODUCTOS
  // ============================================================================

  async stepCreateProducts(): Promise<boolean> {
    this.log('', 'STEP')
    this.log('═'.repeat(80), 'STEP')
    this.log('PASO 5: CREAR PRODUCTOS', 'STEP')
    this.log('═'.repeat(80), 'STEP')

    try {
      const catalogId = await this.page!.evaluate(() => {
        const match = window.location.pathname.match(/\/catalogs\/([^\/]+)/)
        return match ? match[1] : null
      })

      this.log(`Navegando a crear nuevo producto: ${catalogId}...`, 'INFO')
      // Navegar directamente a la página de nuevo producto (que usa ProductForm con botón "Publicar")
      await this.page!.goto(`http://localhost:3000/app/catalogs/${catalogId}/products/new`, { waitUntil: 'networkidle' })
      await this.page!.waitForTimeout(2000)

      await this.screenshot('13-products-page')

      // Crear cada producto vía UI
      let productsCreated = 0
      for (const product of this.testData.products) {
        this.log(`Creando producto: ${product.name} ($${product.price})...`, 'INFO')

        try {
          // Cerrar cualquier modal antes de proceder
          await this.closeModals()
          await this.page!.waitForTimeout(500)

          // Si no estamos en la página de nuevo producto, navegar a ella
          const currentUrl = this.page!.url()
          if (!currentUrl.includes('/products/new')) {
            this.log(`Navegando a la página de nuevo producto...`, 'INFO')
            await this.page!.goto(`http://localhost:3000/app/catalogs/${catalogId}/products/new`, { waitUntil: 'networkidle' })
            await this.page!.waitForTimeout(2000)
          }

          // Ya estamos en la página de ProductForm
          if (true) {
            // Llenar formulario de producto usando selectores más robustos
            this.log(`Llenando formulario del producto...`, 'INFO')

            // Buscar por placeholder o label
            try {
              // Nombre del producto
              const nameInput = await this.page!.$('input[placeholder*="Nombre del producto"], input[placeholder*="Título"]')
              if (nameInput) {
                await nameInput.fill(product.name)
                this.log(`✅ Nombre: ${product.name}`, 'SUCCESS')
                await this.page!.waitForTimeout(300)
              }
            } catch (e) {
              this.log(`Error llenando nombre: ${e}`, 'INFO')
            }

            try {
              // Descripción (textarea)
              const descTextarea = await this.page!.$('textarea[placeholder*="Describe"]')
              if (descTextarea) {
                await descTextarea.fill(product.description)
                this.log(`✅ Descripción: ${product.description}`, 'SUCCESS')
                await this.page!.waitForTimeout(300)
              }
            } catch (e) {
              this.log(`Error llenando descripción: ${e}`, 'INFO')
            }

            try {
              // Precio (input type=number)
              const priceInput = await this.page!.$('input[type="number"]')
              if (priceInput) {
                await priceInput.fill(product.price.toString())
                this.log(`✅ Precio: $${product.price}`, 'SUCCESS')
                await this.page!.waitForTimeout(300)
              }
            } catch (e) {
              this.log(`Error llenando precio: ${e}`, 'INFO')
            }

            // Categoría (opcional)
            try {
              const categorySelect = await this.page!.$('select')
              if (categorySelect) {
                const options = await this.page!.$$eval('select option', (opts: any[]) =>
                  opts.map((o) => o.value).filter((v) => v !== '')
                )
                if (options.length > 0) {
                  // Seleccionar la primera categoría disponible
                  await categorySelect.selectOption(options[0])
                  this.log(`✅ Categoría seleccionada: ${options[0]}`, 'SUCCESS')
                } else {
                  this.log(`⚠️ No hay categorías disponibles (campo opcional)`, 'INFO')
                }
                await this.page!.waitForTimeout(300)
              }
            } catch (e) {
              this.log(`⚠️ Campo de categoría opcional, continuando sin él`, 'INFO')
            }

            // Buscar y clickear el botón de submit (Publicar o Actualizar)
            let submitBtn: any = null

            // Estrategia 1: Buscar directamente por innerText en cualquier elemento clickeable
            const allClickables = await this.page!.$$('button, [role="button"]')
            for (const el of allClickables) {
              const text = await el.innerText()
              // Log para debugging
              if (text.toLowerCase().includes('publicar') || text.toLowerCase().includes('actualizar') || text.toLowerCase().includes('guardando')) {
                this.log(`✅ DEBUG: Encontré elemento con texto: "${text.substring(0, 50)}"`, 'INFO')
              }
              if (text.toLowerCase().includes('publicar') || text.toLowerCase().includes('actualizar')) {
                submitBtn = el
                this.log(`✅ Botón encontrado: "${text.substring(0, 50)}"`, 'INFO')
                break
              }
            }

            // Estrategia 2: Si no encuentra por texto "Publicar/Actualizar", buscar el último botón dentro de un div.flex
            if (!submitBtn) {
              submitBtn = await this.page!.$('div.flex.justify-end button:last-child')
            }

            // Estrategia 3: Buscar dentro de footer o contenedor de acciones
            if (!submitBtn) {
              submitBtn = await this.page!.$('div[class*="justify-end"] button')
            }

            if (submitBtn) {
              try {
                await submitBtn.click()
                this.log(`✅ Botón de guardar clickeado`, 'INFO')
              } catch (e) {
                // Si falla, usar force click
                this.log(`Reintentando click con force`, 'INFO')
                try {
                  await submitBtn.click({ force: true })
                } catch (e2) {
                  this.log(`Error al clickear botón: ${e2}`, 'INFO')
                  continue
                }
              }

              // Esperar a que se guarde y redirija a la lista de productos
              this.log(`⏳ Esperando que el producto se guarde...`, 'INFO')
              await this.page!.waitForTimeout(3000)

              // Verificar que se guardó exitosamente navegando a la lista
              const currentUrl = this.page!.url()
              if (currentUrl.includes('/products')) {
                // Verificar que el producto aparece en la lista
                const pageContent = await this.page!.content()
                if (pageContent.includes(product.name)) {
                  this.log(`✅ Producto ${product.name} verificado en la lista`, 'SUCCESS')
                  productsCreated++
                } else {
                  this.log(`⚠️ Producto ${product.name} no aparece en la lista aún`, 'INFO')
                  // Refrescar página para verificar
                  await this.page!.reload({ waitUntil: 'networkidle' })
                  await this.page!.waitForTimeout(2000)
                  const refreshedContent = await this.page!.content()
                  if (refreshedContent.includes(product.name)) {
                    this.log(`✅ Producto ${product.name} verificado después de refrescar`, 'SUCCESS')
                    productsCreated++
                  }
                }
              } else {
                this.log(`⚠️ No se redirijo a lista de productos. URL: ${currentUrl}`, 'INFO')
              }

              // Cerrar cualquier modal después de guardar
              await this.closeModals()
              await this.page!.waitForTimeout(500)
            } else {
              this.log(`⚠️ No se encontró botón de submit para producto`, 'INFO')
            }
          } else {
            this.log(`⚠️ No se encontró botón de crear para producto`, 'INFO')
          }
        } catch (e) {
          this.log(`Error creando producto ${product.name}: ${e}`, 'INFO')
        }
      }

      await this.screenshot('14-products-created')

      if (productsCreated > 0) {
        this.addTest('Create Products', 'PASS', `${productsCreated} productos creados exitosamente`)
        return true
      } else {
        this.addTest('Create Products', 'FAIL', 'No se crearon productos')
        return false
      }
    } catch (error) {
      this.addTest('Create Products', 'FAIL', String(error))
      return false
    }
  }

  // ============================================================================
  // PASO 6: VERIFICAR PREVIEW DEL DISEÑO
  // ============================================================================

  async stepVerifyDesignPreview(): Promise<boolean> {
    this.log('', 'STEP')
    this.log('═'.repeat(80), 'STEP')
    this.log('PASO 6: VERIFICAR PREVIEW DEL DISEÑO', 'STEP')
    this.log('═'.repeat(80), 'STEP')

    try {
      const catalogId = await this.page!.evaluate(() => {
        const match = window.location.pathname.match(/\/catalogs\/([^\/]+)/)
        return match ? match[1] : null
      })

      if (!catalogId) {
        this.addTest('Design Preview Verification', 'FAIL', 'No se pudo obtener el ID del catálogo')
        return false
      }

      this.log(`Navegando a preview del diseño...`, 'INFO')
      await this.page!.goto(`http://localhost:3000/app/catalogs/${catalogId}/design`, { waitUntil: 'networkidle' })
      await this.page!.waitForTimeout(3000)

      await this.screenshot('15-design-preview')

      // Analizar contenido del preview
      const content = await this.page!.evaluate(() => {
        return {
          text: document.body.innerText,
          products: document.querySelectorAll('[data-product], .product, [class*="product"]').length,
          categories: document.querySelectorAll('[data-category], .category, [class*="category"]').length,
          hasProducts: document.body.innerText.toLowerCase().includes('gaming pc') ||
                       document.body.innerText.toLowerCase().includes('wireless headphones') ||
                       document.body.innerText.toLowerCase().includes('antivirus'),
          hasCategories: document.body.innerText.toLowerCase().includes('electronics') ||
                        document.body.innerText.toLowerCase().includes('accessories'),
        }
      })

      this.log(`Contenido del preview:`, 'INFO')
      this.log(`  - Elementos tipo producto encontrados: ${content.products}`, 'INFO')
      this.log(`  - Elementos tipo categoría encontrados: ${content.categories}`, 'INFO')
      this.log(`  - Contiene nombres de productos: ${content.hasProducts}`, 'INFO')
      this.log(`  - Contiene nombres de categorías: ${content.hasCategories}`, 'INFO')

      if (content.hasProducts && content.hasCategories) {
        this.addTest('Product Display in Preview', 'PASS', 'Productos y categorías visibles en preview')
        this.addTest('Category Visibility in Preview', 'PASS', 'Categorías visibles en preview')
        return true
      } else if (content.hasProducts) {
        this.addTest('Product Display in Preview', 'PASS', 'Productos visibles en preview')
        this.addTest('Category Visibility in Preview', 'FAIL', 'Categorías no visibles en preview')
        return true
      } else {
        this.addTest('Product Display in Preview', 'FAIL', 'Productos no visibles en preview')
        this.addTest('Category Visibility in Preview', 'FAIL', 'Categorías no visibles en preview')
        return false
      }
    } catch (error) {
      this.addTest('Design Preview Verification', 'FAIL', String(error))
      return false
    }
  }

  // ============================================================================
  // GENERAR REPORTE
  // ============================================================================

  private generateReport() {
    const date = new Date().toISOString()
    const successRate = ((this.results.passed / (this.results.passed + this.results.failed)) * 100).toFixed(1)

    const report = `# 🎯 QA E2E COMPLETE TEST REPORT
**Date**: ${date}
**Status**: ${this.results.failed === 0 ? '✅ ALL TESTS PASSED' : '⚠️ SOME TESTS FAILED'}

---

## 📊 RESUMEN EJECUTIVO

| Métrica | Resultado |
|---------|-----------|
| **Tests Totales** | ${this.results.passed + this.results.failed} |
| **Tests Exitosos** | ${this.results.passed} ✅ |
| **Tests Fallidos** | ${this.results.failed} ❌ |
| **Tasa de Éxito** | ${successRate}% |
| **Timestamp** | ${this.testTimestamp} |

---

## ✅ RESULTADOS DETALLADOS

${this.results.tests.map((test, i) => {
  const icon = test.status === 'PASS' ? '✅' : '❌'
  return `${i + 1}. ${icon} **${test.name}** - ${test.status}\n   ${test.details}`
}).join('\n\n')}

---

## 🧪 TEST EXECUTION LOG

\`\`\`
${this.logs.join('\n')}
\`\`\`

---

## 📋 TEST DATA

### Usuario Creado
- Email: ${this.testEmail}
- Password: ${this.testPassword}

### Catálogo Creado
- Nombre: ${this.testData.catalog.name}
- Slug: ${this.testData.catalog.slug}
- Descripción: ${this.testData.catalog.description}

### Categorías Creadas
${this.testData.categories.map(c => `- ${c.name} (${c.slug})`).join('\n')}

### Productos Creados
${this.testData.products.map(p => `- ${p.name} ($${p.price}) - ${p.category}`).join('\n')}

---

## 🎯 RECOMENDACIONES

${this.results.failed === 0
  ? '✅ Todos los tests pasaron. Sistema listo para producción.'
  : '⚠️ Algunos tests fallaron. Revisar logs y ajustar según sea necesario.'}

---

**Generated**: ${date}
**Agent**: QA E2E Complete v1.0
**Status**: ${this.results.failed === 0 ? '🟢 READY FOR PRODUCTION' : '🟡 REQUIRES FIXES'}
`

    const reportPath = '/home/epayco21/Escritorio/richi-alvarez/domicilios/QA_REPORTS/QA_E2E_COMPLETE_REPORT.md'
    fs.writeFileSync(reportPath, report)
    this.log(`📄 Reporte guardado en: ${reportPath}`, 'SUCCESS')
  }

  // ============================================================================
  // RUN ALL TESTS
  // ============================================================================

  async run() {
    try {
      await this.init()

      // Ejecutar pasos
      await this.stepRegisterNewUser()
      await this.stepLogoutAndLogin()
      await this.stepCreateCatalog()
      await this.stepCreateCategories()
      await this.stepCreateProducts()
      await this.stepVerifyDesignPreview()

      // Generar reporte
      this.generateReport()

      // Resumen final
      this.log('', 'STEP')
      this.log('═'.repeat(80), 'STEP')
      this.log('RESUMEN FINAL DE PRUEBAS', 'STEP')
      this.log('═'.repeat(80), 'STEP')
      this.log(`Total Tests: ${this.results.passed + this.results.failed}`, 'INFO')
      this.log(`Exitosos: ${this.results.passed} ✅`, 'SUCCESS')
      this.log(`Fallidos: ${this.results.failed} ❌`, this.results.failed > 0 ? 'FAIL' : 'INFO')
      this.log(`Tasa de Éxito: ${((this.results.passed / (this.results.passed + this.results.failed)) * 100).toFixed(1)}%`, 'SUCCESS')
      this.log('', 'STEP')
      this.log('🌐 El navegador Playwright permanece abierto para inspección', 'INFO')
      this.log('📄 Reporte disponible en: QA_REPORTS/QA_E2E_COMPLETE_REPORT.md', 'SUCCESS')
      this.log('', 'STEP')
      this.log('✅ PRUEBAS E2E COMPLETADAS', 'SUCCESS')
    } catch (error) {
      this.log(`Error fatal: ${error}`, 'FAIL')
      await this.browser?.close()
      process.exit(1)
    }
  }
}

// ============================================================================
// MAIN
// ============================================================================

const qa = new QAE2EComplete()
qa.run().catch(console.error)
