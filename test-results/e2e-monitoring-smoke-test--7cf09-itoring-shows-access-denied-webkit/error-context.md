# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/monitoring-smoke-test.spec.ts >> Monitoring Dashboard - Smoke Test >> Free user accessing /app/monitoring shows access denied
- Location: tests/e2e/monitoring-smoke-test.spec.ts:41:7

# Error details

```
Test timeout of 210000ms exceeded.
```

```
Error: page.fill: Test timeout of 210000ms exceeded.
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
      - link "Volver al inicio" [ref=e14]:
        - /url: /
        - img
        - text: Volver al inicio
      - link "Ver planes" [ref=e15]:
        - /url: /plans
  - region "Notifications alt+T"
  - alert [ref=e16]
  - button "Open Next.js Dev Tools" [ref=e22] [cursor=pointer]:
    - img [ref=e23]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | 
  3  | test.describe('Monitoring Dashboard - Smoke Test', () => {
  4  |   test('App is running on localhost:3000', async ({ page }) => {
  5  |     const response = await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' })
  6  |     expect(response?.status()).toBeLessThan(400)
  7  |   })
  8  | 
  9  |   test('Sign in page is accessible', async ({ page }) => {
  10 |     await page.goto('http://localhost:3000/auth/signin', { waitUntil: 'domcontentloaded' })
  11 |     await expect(page.locator('input[name="email"]')).toBeVisible()
  12 |     await expect(page.locator('input[name="password"]')).toBeVisible()
  13 |   })
  14 | 
  15 |   test('Free user can login with credentials', async ({ page }) => {
  16 |     await page.goto('http://localhost:3000/auth/signin', { waitUntil: 'domcontentloaded' })
  17 | 
  18 |     await page.fill('input[name="email"]', 'carlos.garcia@test.com')
  19 |     await page.fill('input[name="password"]', 'Test@12345')
  20 |     await page.click('button[type="submit"]')
  21 | 
  22 |     // Should redirect after login
  23 |     await page.waitForNavigation({ timeout: 10000 })
  24 |     const url = page.url()
  25 |     expect(url).not.toContain('/auth/signin')
  26 |   })
  27 | 
  28 |   test('Pro user can login with credentials', async ({ page }) => {
  29 |     await page.goto('http://localhost:3000/auth/signin', { waitUntil: 'domcontentloaded' })
  30 | 
  31 |     await page.fill('input[name="email"]', 'maria.lopez@test.com')
  32 |     await page.fill('input[name="password"]', 'Test@12345')
  33 |     await page.click('button[type="submit"]')
  34 | 
  35 |     // Should redirect after login
  36 |     await page.waitForNavigation({ timeout: 10000 })
  37 |     const url = page.url()
  38 |     expect(url).not.toContain('/auth/signin')
  39 |   })
  40 | 
  41 |   test('Free user accessing /app/monitoring shows access denied', async ({ page }) => {
  42 |     // Login as free user
  43 |     await page.goto('http://localhost:3000/auth/signin', { waitUntil: 'domcontentloaded' })
> 44 |     await page.fill('input[name="email"]', 'carlos.garcia@test.com')
     |                ^ Error: page.fill: Test timeout of 210000ms exceeded.
  45 |     await page.fill('input[name="password"]', 'Test@12345')
  46 |     await page.click('button[type="submit"]')
  47 |     await page.waitForNavigation({ timeout: 10000 })
  48 | 
  49 |     // Navigate to monitoring
  50 |     await page.goto('http://localhost:3000/app/monitoring', { waitUntil: 'domcontentloaded' })
  51 | 
  52 |     // Should see "Monitoring Locked" message
  53 |     const lockedMessage = page.locator('text=Monitoring Locked')
  54 |     const isVisible = await lockedMessage.isVisible().catch(() => false)
  55 | 
  56 |     if (isVisible) {
  57 |       expect(isVisible).toBe(true)
  58 |       console.log('✓ Free user correctly sees access denied')
  59 |     } else {
  60 |       console.log('⚠ Monitoring Locked message not found, checking page content...')
  61 |       const content = await page.content()
  62 |       console.log('Page contains:', content.substring(0, 500))
  63 |     }
  64 |   })
  65 | 
  66 |   test('Pro user accessing /app/monitoring shows dashboard', async ({ page }) => {
  67 |     // Login as pro user
  68 |     await page.goto('http://localhost:3000/auth/signin', { waitUntil: 'domcontentloaded' })
  69 |     await page.fill('input[name="email"]', 'maria.lopez@test.com')
  70 |     await page.fill('input[name="password"]', 'Test@12345')
  71 |     await page.click('button[type="submit"]')
  72 |     await page.waitForNavigation({ timeout: 10000 })
  73 | 
  74 |     // Navigate to monitoring
  75 |     await page.goto('http://localhost:3000/app/monitoring', { waitUntil: 'domcontentloaded' })
  76 | 
  77 |     // Should see "System Monitoring" heading
  78 |     const heading = page.locator('text=System Monitoring')
  79 |     const isVisible = await heading.isVisible().catch(() => false)
  80 | 
  81 |     if (isVisible) {
  82 |       expect(isVisible).toBe(true)
  83 |       console.log('✓ Pro user correctly sees monitoring dashboard')
  84 |     } else {
  85 |       console.log('⚠ System Monitoring heading not found, checking page content...')
  86 |       const content = await page.content()
  87 |       console.log('Page contains:', content.substring(0, 500))
  88 |     }
  89 |   })
  90 | })
  91 | 
```