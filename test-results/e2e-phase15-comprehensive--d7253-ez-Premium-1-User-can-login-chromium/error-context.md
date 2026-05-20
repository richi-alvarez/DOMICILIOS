# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/phase15-comprehensive.spec.ts >> Phase 15 - Advanced Reports Features E2E >> User: Juan Rodríguez (Premium) >> 1. User can login
- Location: tests/e2e/phase15-comprehensive.spec.ts:20:11

# Error details

```
Test timeout of 600000ms exceeded.
```

```
Error: page.fill: Test timeout of 600000ms exceeded.
Call log:
  - waiting for locator('input[name="email"]')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - img [ref=e5]
    - heading "404" [level=1] [ref=e10]
    - heading "Página no encontrada" [level=2] [ref=e11]
    - paragraph [ref=e12]: Lo sentimos, la página que buscas no existe o fue movida.
    - generic [ref=e13]:
      - link "Volver al inicio" [ref=e14] [cursor=pointer]:
        - /url: /
        - img
        - text: Volver al inicio
      - link "Ver planes" [ref=e15] [cursor=pointer]:
        - /url: /plans
  - region "Notifications alt+T"
  - alert [ref=e16]
  - button "Open Next.js Dev Tools" [ref=e22] [cursor=pointer]:
    - img [ref=e23]
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
> 23  |         await page.fill('input[name="email"]', user.email)
      |                    ^ Error: page.fill: Test timeout of 600000ms exceeded.
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
  50  |         await page.fill('input[name="name"]', `Catálogo Test ${user.name} ${Date.now()}`)
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
```