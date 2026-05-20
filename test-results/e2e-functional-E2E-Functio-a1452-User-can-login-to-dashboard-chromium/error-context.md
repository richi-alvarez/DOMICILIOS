# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e-functional.spec.ts >> E2E Functional Tests - Full User Flow >> 2. User can login to dashboard
- Location: tests/e2e-functional.spec.ts:31:7

# Error details

```
Error: expect(received).toBeTruthy()

Received: false
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test'
  2   | 
  3   | const BASE_URL = 'http://localhost:3000'
  4   | 
  5   | test.describe('E2E Functional Tests - Full User Flow', () => {
  6   |   test.beforeEach(async ({ page }) => {
  7   |     // Clear cookies and storage before each test
  8   |     await page.context().clearCookies()
  9   |   })
  10  | 
  11  |   test('1. User can register and login with email', async ({ page }) => {
  12  |     await page.goto(`${BASE_URL}/signup`)
  13  | 
  14  |     // Check signup form exists
  15  |     await expect(page).toHaveTitle(/signup|login|registro/i)
  16  | 
  17  |     // Fill signup form
  18  |     const randomEmail = `test-${Date.now()}@example.com`
  19  |     await page.fill('input[type="email"]', randomEmail)
  20  |     await page.fill('input[type="password"]', 'Test123!@#')
  21  | 
  22  |     // Try to submit
  23  |     const submitBtn = page.locator('button[type="submit"]')
  24  |     if (await submitBtn.isVisible()) {
  25  |       await submitBtn.click()
  26  |       // Wait for navigation or success message
  27  |       await page.waitForTimeout(2000)
  28  |     }
  29  |   })
  30  | 
  31  |   test('2. User can login to dashboard', async ({ page }) => {
  32  |     await page.goto(BASE_URL)
  33  | 
  34  |     // Look for login button or link
  35  |     const loginBtn = page.locator('a:has-text("Login"), button:has-text("Login"), a:has-text("Ingresar")')
  36  |     if (await loginBtn.isVisible()) {
  37  |       await loginBtn.click()
  38  |       await page.waitForNavigation({ waitUntil: 'networkidle' })
  39  |     }
  40  | 
  41  |     // Check we're on login/auth page
  42  |     const currentUrl = page.url()
  43  |     expect([currentUrl.includes('/login'), currentUrl.includes('/auth'), currentUrl.includes('/signup')].some(v => v))
> 44  |       .toBeTruthy()
      |        ^ Error: expect(received).toBeTruthy()
  45  |   })
  46  | 
  47  |   test('3. Dashboard loads without errors', async ({ page }) => {
  48  |     const errors: string[] = []
  49  | 
  50  |     page.on('console', msg => {
  51  |       if (msg.type() === 'error') errors.push(msg.text())
  52  |     })
  53  | 
  54  |     await page.goto(`${BASE_URL}/app/dashboard`)
  55  |     await page.waitForTimeout(2000)
  56  | 
  57  |     // Check page loaded
  58  |     expect(errors.length).toBe(0)
  59  |   })
  60  | 
  61  |   test('4. Can navigate to catalogs page', async ({ page }) => {
  62  |     await page.goto(`${BASE_URL}/app`)
  63  | 
  64  |     // Look for catalogs link
  65  |     const catalogsLink = page.locator('a:has-text("Catalog"), a:has-text("Catálogo"), a[href*="catalog"]')
  66  | 
  67  |     if (await catalogsLink.first().isVisible()) {
  68  |       await catalogsLink.first().click()
  69  |       await page.waitForNavigation({ waitUntil: 'networkidle' })
  70  | 
  71  |       const url = page.url()
  72  |       expect(url.toLowerCase()).toContain('catalog')
  73  |     }
  74  |   })
  75  | 
  76  |   test('5. Catalog list page loads correctly', async ({ page }) => {
  77  |     await page.goto(`${BASE_URL}/app/catalogs`)
  78  |     await page.waitForTimeout(1000)
  79  | 
  80  |     // Check page didn't error
  81  |     const statusCode = page.url()
  82  |     expect(statusCode).not.toBe('')
  83  | 
  84  |     // Look for catalog elements or create button
  85  |     const createBtn = page.locator('button:has-text("Create"), button:has-text("Crear"), button:has-text("New")')
  86  |     expect(createBtn.isVisible() || page.locator('[data-testid*="catalog"]').isVisible())
  87  |   })
  88  | 
  89  |   test('6. Can view products page', async ({ page }) => {
  90  |     await page.goto(`${BASE_URL}/app/products`)
  91  |     await page.waitForTimeout(1000)
  92  | 
  93  |     // Check page loaded
  94  |     expect(page.url()).toContain('products')
  95  |   })
  96  | 
  97  |   test('7. API endpoints respond correctly', async ({ request }) => {
  98  |     // Health check
  99  |     const health = await request.get(`${BASE_URL}/api/health`)
  100 |     expect(health.status()).toBe(200)
  101 | 
  102 |     const healthData = await health.json()
  103 |     expect(healthData.status).toBe('ok')
  104 |   })
  105 | 
  106 |   test('8. Public catalog view works', async ({ page }) => {
  107 |     // Try to access a catalog publicly (without auth)
  108 |     await page.goto(`${BASE_URL}`)
  109 | 
  110 |     // Look for public catalogs or featured section
  111 |     const catalogLinks = page.locator('a[href*="/catalog"]')
  112 | 
  113 |     if (await catalogLinks.first().isVisible()) {
  114 |       await catalogLinks.first().click()
  115 |       await page.waitForNavigation({ waitUntil: 'networkidle' })
  116 | 
  117 |       // Should see catalog details
  118 |       expect(page.url()).toContain('catalog')
  119 |     }
  120 |   })
  121 | 
  122 |   test('9. Mobile responsive layout works', async ({ page }) => {
  123 |     // Test mobile viewport
  124 |     await page.setViewportSize({ width: 375, height: 667 })
  125 |     await page.goto(`${BASE_URL}`)
  126 | 
  127 |     // Page should render without horizontal scroll
  128 |     const bodyWidth = await page.evaluate(() => document.body.offsetWidth)
  129 |     const windowWidth = await page.evaluate(() => window.innerWidth)
  130 | 
  131 |     expect(bodyWidth).toBeLessThanOrEqual(windowWidth + 10) // small margin allowed
  132 |   })
  133 | 
  134 |   test('10. Error pages display correctly', async ({ page }) => {
  135 |     // Try non-existent page
  136 |     await page.goto(`${BASE_URL}/this-page-does-not-exist`)
  137 | 
  138 |     // Should either redirect or show 404 page
  139 |     const url = page.url()
  140 |     expect([url.includes('404'), url === BASE_URL].some(v => v)).toBeTruthy()
  141 |   })
  142 | 
  143 |   test('11. Database connectivity verified', async ({ request }) => {
  144 |     // Check if API can fetch data (requires DB connection)
```