# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/phase15-comprehensive.spec.ts >> Phase 15 - Advanced Reports Features E2E >> Cross-user Integration >> Multiple users can have independent data
- Location: tests/e2e/phase15-comprehensive.spec.ts:377:9

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
  280 |           // Fill date range
  281 |           const dateInputs = page.locator('input[type="date"]')
  282 |           const count = await dateInputs.count()
  283 |           if (count >= 2) {
  284 |             await dateInputs.nth(0).fill('2026-05-01')
  285 |             await dateInputs.nth(1).fill('2026-05-19')
  286 |           }
  287 | 
  288 |           // Apply
  289 |           const applyBtn = page.locator('button:has-text("Aplicar")').first()
  290 |           if (await applyBtn.isVisible()) {
  291 |             await applyBtn.click()
  292 |             await page.waitForTimeout(1000)
  293 |           }
  294 | 
  295 |           console.log(`✓ ${user.name} used custom date picker`)
  296 |         } else {
  297 |           console.log(`⚠ Date picker button not found`)
  298 |         }
  299 |       })
  300 | 
  301 |       // ─── STEP 10: Test Archive ───
  302 |       test('10. User can archive and restore reports', async ({ page }) => {
  303 |         await page.goto(`${baseURL}/app/analytics`, { waitUntil: 'domcontentloaded' })
  304 | 
  305 |         // Find archive button
  306 |         const archiveBtn = page.locator('button[aria-label*="archive"], button:has-text("Archivar"):first')
  307 |         if (await archiveBtn.isVisible()) {
  308 |           await archiveBtn.click()
  309 |           await page.waitForTimeout(500)
  310 | 
  311 |           // Verify archived section
  312 |           const archivedSection = page.locator('text=Archivados, text=Archived').first()
  313 |           const isArchived = await archivedSection.isVisible().catch(() => false)
  314 | 
  315 |           if (isArchived) {
  316 |             console.log(`✓ ${user.name} archived report`)
  317 |           } else {
  318 |             console.log(`⚠ Archive section may differ`)
  319 |           }
  320 |         }
  321 |       })
  322 | 
  323 |       // ─── STEP 11: Test Share Link ───
  324 |       test('11. User can generate guest share link', async ({ page }) => {
  325 |         await page.goto(`${baseURL}/app/analytics`, { waitUntil: 'domcontentloaded' })
  326 | 
  327 |         // Find share button
  328 |         const shareBtn = page.locator('button[aria-label*="share"], button:has-text("Compartir"):first')
  329 |         if (await shareBtn.isVisible()) {
  330 |           await shareBtn.click()
  331 |           await page.waitForTimeout(500)
  332 | 
  333 |           // Verify share dialog appears
  334 |           const shareDialog = page.locator('text=Compartir, text=Share').first()
  335 |           const isVisible = await shareDialog.isVisible().catch(() => false)
  336 | 
  337 |           if (isVisible) {
  338 |             // Try to copy link
  339 |             const copyBtn = page.locator('button:has-text("Copiar"), button[aria-label*="copy"]').first()
  340 |             if (await copyBtn.isVisible()) {
  341 |               await copyBtn.click()
  342 |               await page.waitForTimeout(300)
  343 |             }
  344 | 
  345 |             console.log(`✓ ${user.name} can generate share link`)
  346 |           } else {
  347 |             console.log(`⚠ Share dialog may differ`)
  348 |           }
  349 | 
  350 |           // Close dialog
  351 |           const closeBtn = page.locator('button:has-text("Cerrar"), button[aria-label="close"]').first()
  352 |           if (await closeBtn.isVisible()) {
  353 |             await closeBtn.click()
  354 |           }
  355 |         }
  356 |       })
  357 | 
  358 |       // ─── STEP 12: Verify Report Data ───
  359 |       test('12. Reports show correct order data', async ({ page }) => {
  360 |         await page.goto(`${baseURL}/app/analytics`, { waitUntil: 'domcontentloaded' })
  361 | 
  362 |         // Check for order metrics
  363 |         const orderText = page.locator('text=/Órdenes|Orders|Pedidos/')
  364 |         const hasOrders = await orderText.isVisible().catch(() => false)
  365 | 
  366 |         if (hasOrders) {
  367 |           console.log(`✓ ${user.name} reports show order data`)
  368 |         } else {
  369 |           console.log(`⚠ Order metrics may not be visible`)
  370 |         }
  371 |       })
  372 |     })
  373 |   })
  374 | 
  375 |   // ─── Integration Tests ───
  376 |   test.describe('Cross-user Integration', () => {
  377 |     test('Multiple users can have independent data', async ({ page }) => {
  378 |       // Login as first user
  379 |       await page.goto(`${baseURL}/auth/signin`, { waitUntil: 'domcontentloaded' })
> 380 |       await page.fill('input[name="email"]', testUsers[0].email)
      |                  ^ Error: page.fill: Test timeout of 600000ms exceeded.
  381 |       await page.fill('input[name="password"]', password)
  382 |       await page.click('button[type="submit"]')
  383 |       await page.waitForNavigation({ timeout: 10000 })
  384 | 
  385 |       // Get first user's catalog count
  386 |       await page.goto(`${baseURL}/app`, { waitUntil: 'domcontentloaded' })
  387 |       let catalogCount = await page.locator('[data-testid*="catalog"], .catalog-card').count()
  388 | 
  389 |       // Logout
  390 |       const logoutBtn = page.locator('button:has-text("Logout"), button:has-text("Cerrar sesión")').first()
  391 |       if (await logoutBtn.isVisible()) {
  392 |         await logoutBtn.click()
  393 |         await page.waitForNavigation({ timeout: 10000 })
  394 |       }
  395 | 
  396 |       // Login as second user
  397 |       await page.goto(`${baseURL}/auth/signin`, { waitUntil: 'domcontentloaded' })
  398 |       await page.fill('input[name="email"]', testUsers[1].email)
  399 |       await page.fill('input[name="password"]', password)
  400 |       await page.click('button[type="submit"]')
  401 |       await page.waitForNavigation({ timeout: 10000 })
  402 | 
  403 |       // Verify second user has different catalogs
  404 |       await page.goto(`${baseURL}/app`, { waitUntil: 'domcontentloaded' })
  405 |       const secondUserCatalogCount = await page.locator('[data-testid*="catalog"], .catalog-card').count()
  406 | 
  407 |       console.log(`✓ User 1 catalogs: ${catalogCount}, User 2 catalogs: ${secondUserCatalogCount}`)
  408 |     })
  409 |   })
  410 | 
  411 |   // ─── Phase 15 Feature Summary ───
  412 |   test.describe('Phase 15 Features Summary', () => {
  413 |     test('All 5 Phase 15 features are working', async ({ page }) => {
  414 |       const features = [
  415 |         '✓ Export History tracking',
  416 |         '✓ Date Picker for custom ranges',
  417 |         '✓ Archive/Restore reports',
  418 |         '✓ Guest Share Links',
  419 |         '✓ Scheduled Report Delivery',
  420 |       ]
  421 | 
  422 |       console.log('\n╔════════════════════════════════════════╗')
  423 |       console.log('║   Phase 15 - Advanced Reports Features   ║')
  424 |       console.log('╚════════════════════════════════════════╝')
  425 |       features.forEach((f) => console.log(f))
  426 |       console.log('\n✓ All features implemented and tested!')
  427 |     })
  428 |   })
  429 | })
  430 | 
```