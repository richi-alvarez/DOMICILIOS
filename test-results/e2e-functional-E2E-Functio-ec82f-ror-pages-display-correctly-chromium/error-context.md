# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e-functional.spec.ts >> E2E Functional Tests - Full User Flow >> 10. Error pages display correctly
- Location: tests/e2e-functional.spec.ts:134:7

# Error details

```
Error: expect(received).toBeTruthy()

Received: false
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
  - button "Open Next.js Dev Tools" [ref=e21] [cursor=pointer]:
    - img [ref=e22]
  - alert [ref=e25]
```

# Test source

```ts
  40  | 
  41  |     // Check we're on login/auth page
  42  |     const currentUrl = page.url()
  43  |     expect([currentUrl.includes('/login'), currentUrl.includes('/auth'), currentUrl.includes('/signup')].some(v => v))
  44  |       .toBeTruthy()
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
> 140 |     expect([url.includes('404'), url === BASE_URL].some(v => v)).toBeTruthy()
      |                                                                  ^ Error: expect(received).toBeTruthy()
  141 |   })
  142 | 
  143 |   test('11. Database connectivity verified', async ({ request }) => {
  144 |     // Check if API can fetch data (requires DB connection)
  145 |     const response = await request.get(`${BASE_URL}/api/health`)
  146 |     expect(response.status()).toBe(200)
  147 | 
  148 |     const data = await response.json()
  149 |     expect(data.timestamp).toBeDefined()
  150 |   })
  151 | 
  152 |   test('12. Security headers are present', async ({ page }) => {
  153 |     const response = await page.goto(`${BASE_URL}/api/health`)
  154 |     const headers = response?.headers() || {}
  155 | 
  156 |     // Check for security headers
  157 |     expect(headers['x-content-type-options']).toBe('nosniff')
  158 |     expect(headers['x-frame-options']).toBe('DENY')
  159 |     expect(headers['content-security-policy']).toBeDefined()
  160 |     expect(headers['strict-transport-security']).toBeDefined()
  161 |   })
  162 | 
  163 |   test('13. Navigation menu renders', async ({ page }) => {
  164 |     await page.goto(`${BASE_URL}/app`)
  165 | 
  166 |     // Look for header/nav
  167 |     const header = page.locator('header, nav, [role="navigation"]')
  168 | 
  169 |     if (await header.isVisible()) {
  170 |       expect(await header.isVisible()).toBeTruthy()
  171 |     }
  172 |   })
  173 | 
  174 |   test('14. Forms are interactive', async ({ page }) => {
  175 |     // Try to find and interact with a form
  176 |     await page.goto(`${BASE_URL}/app`)
  177 | 
  178 |     const forms = page.locator('form')
  179 |     if (await forms.first().isVisible()) {
  180 |       const inputs = page.locator('input')
  181 |       if (await inputs.first().isVisible()) {
  182 |         await inputs.first().fill('test input')
  183 |         const value = await inputs.first().inputValue()
  184 |         expect(value).toBe('test input')
  185 |       }
  186 |     }
  187 |   })
  188 | 
  189 |   test('15. Images load without errors', async ({ page }) => {
  190 |     let imageErrors = 0
  191 | 
  192 |     page.on('response', response => {
  193 |       if (response.url().match(/\.(jpg|jpeg|png|gif|webp)$/i) && response.status() >= 400) {
  194 |         imageErrors++
  195 |       }
  196 |     })
  197 | 
  198 |     await page.goto(`${BASE_URL}`)
  199 |     await page.waitForTimeout(2000)
  200 | 
  201 |     expect(imageErrors).toBe(0)
  202 |   })
  203 | 
  204 |   test('16. Performance: Page loads in reasonable time', async ({ page }) => {
  205 |     const startTime = Date.now()
  206 |     await page.goto(`${BASE_URL}`, { waitUntil: 'networkidle' })
  207 |     const loadTime = Date.now() - startTime
  208 | 
  209 |     // Page should load in less than 5 seconds
  210 |     expect(loadTime).toBeLessThan(5000)
  211 |   })
  212 | 
  213 |   test('17. No unhandled exceptions in console', async ({ page }) => {
  214 |     const errors: string[] = []
  215 |     const warnings: string[] = []
  216 | 
  217 |     page.on('console', msg => {
  218 |       if (msg.type() === 'error') errors.push(msg.text())
  219 |       if (msg.type() === 'warning') warnings.push(msg.text())
  220 |     })
  221 | 
  222 |     await page.goto(`${BASE_URL}/app`)
  223 |     await page.waitForTimeout(2000)
  224 | 
  225 |     // No critical errors (warnings are ok)
  226 |     const criticalErrors = errors.filter(e =>
  227 |       !e.includes('Failed to fetch') &&
  228 |       !e.includes('Cannot read') &&
  229 |       !e.includes('Unexpected')
  230 |     )
  231 |     expect(criticalErrors.length).toBe(0)
  232 |   })
  233 | 
  234 |   test('18. Database and services healthy', async ({ request }) => {
  235 |     const health = await request.get(`${BASE_URL}/api/health`)
  236 |     expect(health.status()).toBe(200)
  237 | 
  238 |     const data = await health.json()
  239 |     expect(data.status).toBe('ok')
  240 |     expect(data.uptime).toBeGreaterThan(0)
```