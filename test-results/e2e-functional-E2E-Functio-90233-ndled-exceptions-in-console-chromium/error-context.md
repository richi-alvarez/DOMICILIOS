# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e-functional.spec.ts >> E2E Functional Tests - Full User Flow >> 17. No unhandled exceptions in console
- Location: tests/e2e-functional.spec.ts:213:7

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 0
Received: 34
```

# Test source

```ts
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
> 231 |     expect(criticalErrors.length).toBe(0)
      |                                   ^ Error: expect(received).toBe(expected) // Object.is equality
  232 |   })
  233 | 
  234 |   test('18. Database and services healthy', async ({ request }) => {
  235 |     const health = await request.get(`${BASE_URL}/api/health`)
  236 |     expect(health.status()).toBe(200)
  237 | 
  238 |     const data = await health.json()
  239 |     expect(data.status).toBe('ok')
  240 |     expect(data.uptime).toBeGreaterThan(0)
  241 |   })
  242 | 
  243 |   test('19. API authentication works', async ({ request }) => {
  244 |     // Protected endpoint should return 401 without auth
  245 |     const response = await request.get(`${BASE_URL}/api/reports`)
  246 |     expect([401, 403]).toContain(response.status())
  247 |   })
  248 | 
  249 |   test('20. No 5xx errors on main pages', async ({ page }) => {
  250 |     const pages = [
  251 |       '/',
  252 |       '/app',
  253 |       '/app/dashboard',
  254 |       '/app/catalogs',
  255 |     ]
  256 | 
  257 |     for (const path of pages) {
  258 |       const response = await page.goto(`${BASE_URL}${path}`)
  259 |       const status = response?.status() || 200
  260 | 
  261 |       // Should not be 5xx
  262 |       expect(status).toBeLessThan(500)
  263 |     }
  264 |   })
  265 | })
  266 | 
```