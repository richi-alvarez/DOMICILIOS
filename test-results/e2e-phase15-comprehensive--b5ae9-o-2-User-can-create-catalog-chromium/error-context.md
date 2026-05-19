# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/phase15-comprehensive.spec.ts >> Phase 15 - Advanced Reports Features E2E >> User: María López (Pro) >> 2. User can create catalog
- Location: tests/e2e/phase15-comprehensive.spec.ts:37:11

# Error details

```
Test timeout of 600000ms exceeded.
```

```
Error: page.fill: Target page, context or browser has been closed
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - link "WaStore WaStore" [ref=e4] [cursor=pointer]:
      - /url: /
      - img "WaStore" [ref=e5]
      - generic [ref=e6]: WaStore
    - generic [ref=e8]:
      - generic [ref=e9]:
        - heading "Iniciar Sesión" [level=3] [ref=e10]
        - paragraph [ref=e11]: Accede a tu panel de WaStore
      - generic [ref=e13]:
        - button "Continuar con Google" [ref=e14]:
          - img
          - text: Continuar con Google
        - generic [ref=e17]: O continúa con email
        - generic [ref=e19]:
          - text: Correo electrónico
          - textbox "Correo electrónico" [ref=e20]:
            - /placeholder: tu@correo.com
        - generic [ref=e21]:
          - generic [ref=e22]:
            - generic [ref=e23]: Contraseña
            - link "¿Olvidaste tu contraseña?" [ref=e24] [cursor=pointer]:
              - /url: /password-forgot
          - generic [ref=e25]:
            - textbox "Contraseña" [ref=e26]:
              - /placeholder: Tu contraseña
            - button [ref=e27]:
              - img [ref=e28]
        - button "Iniciar Sesión" [disabled]
        - paragraph [ref=e31]:
          - text: ¿No tienes cuenta?
          - link "Crear cuenta gratis" [ref=e32] [cursor=pointer]:
            - /url: /signup
  - region "Notifications alt+T"
  - alert [ref=e33]
  - button "Open Next.js Dev Tools" [ref=e39] [cursor=pointer]:
    - img [ref=e40]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test'
  2   | 
  3   | // Test users with different plans
  4   | const testUsers = [
  5   |   { email: 'carlos.garcia@test.com', name: 'Carlos García', plan: 'Gratis', catalogs: 1, products: 10 },
  6   |   { email: 'maria.lopez@test.com', name: 'María López', plan: 'Pro', catalogs: 2, products: 25 },
  7   |   { email: 'juan.rodriguez@test.com', name: 'Juan Rodríguez', plan: 'Premium', catalogs: 3, products: 40 },
  8   |   { email: 'ana.martinez@test.com', name: 'Ana Martínez', plan: 'Gratis', catalogs: 1, products: 15 },
  9   | ]
  10  | 
  11  | const baseURL = 'http://localhost:3000'
  12  | const password = 'Test@12345'
  13  | 
  14  | test.describe('Phase 15 - Advanced Reports Features E2E', () => {
  15  |   testUsers.forEach((user) => {
  16  |     test.describe(`User: ${user.name} (${user.plan})`, () => {
  17  |       let catalogId: string
  18  | 
  19  |       // ─── STEP 1: Login ───
  20  |       test('1. User can login', async ({ page }) => {
  21  |         await page.goto(`${baseURL}/auth/signin`, { waitUntil: 'domcontentloaded' })
  22  | 
  23  |         await page.fill('input[name="email"]', user.email)
  24  |         await page.fill('input[name="password"]', password)
  25  |         await page.click('button[type="submit"]')
  26  | 
  27  |         // Wait for navigation and verify we're in the app
  28  |         await page.waitForNavigation({ timeout: 10000 })
  29  |         const url = page.url()
  30  |         expect(url).not.toContain('/auth/signin')
  31  |         expect(url).toContain('/app')
  32  | 
  33  |         console.log(`✓ ${user.name} logged in successfully`)
  34  |       })
  35  | 
  36  |       // ─── STEP 2: Create Catalog ───
  37  |       test('2. User can create catalog', async ({ page }) => {
  38  |         await page.goto(`${baseURL}/app`, { waitUntil: 'domcontentloaded' })
  39  | 
  40  |         // Click on create catalog button
  41  |         const createBtn = page.locator('button:has-text("Crear catálogo")')
  42  |         if (await createBtn.isVisible()) {
  43  |           await createBtn.click()
  44  |         } else {
  45  |           // Alternative: look for other create buttons
  46  |           await page.locator('a:has-text("Nuevo catálogo")').click().catch(() => {})
  47  |         }
  48  | 
  49  |         // Fill form
> 50  |         await page.fill('input[name="name"]', `Catálogo Test ${user.name} ${Date.now()}`)
      |                    ^ Error: page.fill: Target page, context or browser has been closed
  51  |         await page.fill('input[name="description"]', `Test catalog for ${user.name}`)
  52  | 
  53  |         // Submit
  54  |         const submitBtn = page.locator('button:has-text("Crear"):visible').first()
  55  |         await submitBtn.click()
  56  | 
  57  |         // Wait for navigation
  58  |         await page.waitForNavigation({ timeout: 10000 })
  59  | 
  60  |         // Extract catalog ID from URL
  61  |         const url = page.url()
  62  |         const match = url.match(/\/catalogs\/([a-f0-9-]+)/)
  63  |         if (match) {
  64  |           catalogId = match[1]
  65  |         }
  66  | 
  67  |         expect(catalogId).toBeTruthy()
  68  |         console.log(`✓ ${user.name} created catalog: ${catalogId}`)
  69  |       })
  70  | 
  71  |       // ─── STEP 3: Add Products ───
  72  |       test('3. User can add products to catalog', async ({ page }) => {
  73  |         await page.goto(`${baseURL}/app/catalogs/${catalogId}`, { waitUntil: 'domcontentloaded' })
  74  | 
  75  |         // Add first product
  76  |         const addProductBtn = page.locator('button:has-text("Agregar producto"):first')
  77  |         await addProductBtn.click()
  78  | 
  79  |         // Fill product details
  80  |         await page.fill('input[name="name"]', `Producto Test 1`)
  81  |         await page.fill('input[name="price"]', '100')
  82  |         await page.fill('input[name="description"]', 'Descripción de producto test')
  83  | 
  84  |         // Save product
  85  |         const savBtn = page.locator('button:has-text("Guardar"):visible').first()
  86  |         await savBtn.click()
  87  | 
  88  |         // Wait for success message or navigation
  89  |         await page.waitForTimeout(2000)
  90  | 
  91  |         // Verify product appears in list
  92  |         const productList = page.locator('text=Producto Test 1')
  93  |         expect(await productList.isVisible().catch(() => false)).toBeTruthy()
  94  | 
  95  |         console.log(`✓ ${user.name} added products to catalog`)
  96  |       })
  97  | 
  98  |       // ─── STEP 4: Configure Design ───
  99  |       test('4. User can configure catalog design', async ({ page }) => {
  100 |         await page.goto(`${baseURL}/app/catalogs/${catalogId}/design`, { waitUntil: 'domcontentloaded' })
  101 | 
  102 |         // Select a template
  103 |         const templateBtn = page.locator('[data-testid*="template"]:first, button:has-text("Selecciona un tema"):first')
  104 |         if (await templateBtn.isVisible()) {
  105 |           await templateBtn.click()
  106 |           await page.waitForTimeout(500)
  107 |         }
  108 | 
  109 |         // Change background color (if available)
  110 |         const colorInput = page.locator('input[type="color"]:first')
  111 |         if (await colorInput.isVisible()) {
  112 |           await colorInput.fill('#FF5733')
  113 |         }
  114 | 
  115 |         // Save design
  116 |         const saveBtn = page.locator('button:has-text("Guardar"):visible').first()
  117 |         if (await saveBtn.isVisible()) {
  118 |           await saveBtn.click()
  119 |           await page.waitForTimeout(1500)
  120 |         }
  121 | 
  122 |         console.log(`✓ ${user.name} configured catalog design`)
  123 |       })
  124 | 
  125 |       // ─── STEP 5: View Catalog ───
  126 |       test('5. User can view catalog publicly', async ({ page }) => {
  127 |         await page.goto(`${baseURL}/app/catalogs/${catalogId}`, { waitUntil: 'domcontentloaded' })
  128 | 
  129 |         // Find and click the "Visitar" or public link button
  130 |         const visitBtn = page.locator('button:has-text("Visitar"), a:has-text("Ver catálogo")').first()
  131 |         if (await visitBtn.isVisible()) {
  132 |           await visitBtn.click()
  133 |           await page.waitForNavigation({ timeout: 10000 })
  134 |         }
  135 | 
  136 |         // Verify we're on the storefront
  137 |         const url = page.url()
  138 |         expect(url).toContain('/s/')
  139 | 
  140 |         console.log(`✓ ${user.name} can view catalog publicly`)
  141 |       })
  142 | 
  143 |       // ─── STEP 6: Purchase with Cash Payment ───
  144 |       test('6. Customer can make purchase with cash payment', async ({ page }) => {
  145 |         // Get the current catalog slug from URL
  146 |         const url = page.url()
  147 |         const slugMatch = url.match(/\/s\/([^/]+)/)
  148 |         const slug = slugMatch ? slugMatch[1] : ''
  149 | 
  150 |         // Navigate to catalog
```