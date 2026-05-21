const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.createContext();

  // Capturar errores de consola
  const consoleLogs = [];
  const pageErrors = [];

  const page = await context.newPage();

  page.on('console', msg => {
    console.log(`[${msg.type()}] ${msg.text()}`);
    consoleLogs.push({ type: msg.type(), text: msg.text() });
  });

  page.on('pageerror', error => {
    console.error(`[PAGE ERROR] ${error.message}`);
    pageErrors.push({ message: error.message, stack: error.stack });
  });

  try {
    // 1. Ir a login
    console.log('\n=== STEP 1: Navigating to login ===');
    await page.goto('http://localhost:3000/auth/login');
    await page.waitForLoadState('networkidle');

    // 2. Crear cuenta de prueba (o usar una existente)
    console.log('\n=== STEP 2: Creating test account ===');
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';

    // Click en link de signup
    await page.click('text=/registr|sign up/i', { timeout: 5000 }).catch(() => {
      console.log('No signup link found, trying alternative');
    });

    await page.waitForNavigation().catch(() => {});
    await page.waitForLoadState('networkidle').catch(() => {});

    // Verificar si estamos en la página de signup
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);

    if (!currentUrl.includes('signup')) {
      console.log('Not on signup page, retrying...');
      await page.goto('http://localhost:3000/auth/signup');
      await page.waitForLoadState('networkidle');
    }

    // Llenar email
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);

    // Click signup
    await page.click('button:has-text("Crear Cuenta"), button:has-text("Sign Up")', { timeout: 5000 }).catch(() => {
      // Try to find the button by other means
      const buttons = await page.$$('button');
      for (const btn of buttons) {
        const text = await btn.textContent();
        if (text && (text.includes('Crear') || text.includes('Sign'))) {
          await btn.click();
          break;
        }
      }
    });

    await page.waitForNavigation().catch(() => {});
    await page.waitForLoadState('networkidle');

    // 3. Crear catálogo
    console.log('\n=== STEP 3: Creating new catalog ===');
    await page.goto('http://localhost:3000/app/catalogs');
    await page.waitForLoadState('networkidle');

    // Click en botón de crear catálogo
    await page.click('text=/crear|nuevo|new/i, button:has-text("+")', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Llenar formulario de catálogo
    const catalogName = `Test Catalog ${Date.now()}`;
    await page.fill('input[placeholder*="nombre" i], input[placeholder*="name" i]', catalogName);

    // Click crear
    await page.click('button:has-text("Crear"), button:has-text("Create")', { timeout: 5000 });
    await page.waitForNavigation().catch(() => {});
    await page.waitForLoadState('networkidle');

    // 4. Navegar a diseño
    console.log('\n=== STEP 4: Navigating to design page ===');
    const catalogUrl = page.url();
    console.log(`Catalog URL: ${catalogUrl}`);

    // Si estamos en la página de catálogo, buscar el botón de diseño
    await page.click('text=/diseño|design|editar/i', { timeout: 10000 }).catch(async () => {
      console.log('Design button not found, trying to navigate directly');
      // Extracting catalog ID and navigating to design
      const matches = catalogUrl.match(/catalogs\/([^\/]+)/);
      if (matches) {
        const catalogId = matches[1];
        await page.goto(`http://localhost:3000/app/catalogs/${catalogId}/design`);
        await page.waitForLoadState('networkidle');
      }
    });

    // 5. Buscar el botón "Agregar Bloque"
    console.log('\n=== STEP 5: Adding footer block ===');
    await page.screenshot({ path: '/tmp/before-add-block.png' });

    // Buscar y hacer click en "Agregar Bloque"
    const addBlockButton = await page.$('button:has-text("Agregar Bloque"), button:has-text("Add Block")');
    if (addBlockButton) {
      console.log('Found "Agregar Bloque" button');
      await addBlockButton.click();
      await page.waitForTimeout(500);
    } else {
      console.log('Add Block button not found');
    }

    await page.screenshot({ path: '/tmp/after-click-add-block.png' });

    // 6. Seleccionar footer block
    console.log('\n=== STEP 6: Selecting footer block ===');

    // Buscar el footer block en el menú
    const footerOption = await page.$('text=/footer/i, [data-testid*="footer"]');
    if (footerOption) {
      console.log('Found footer option');
      await footerOption.click();
      await page.waitForTimeout(1000);
    } else {
      // Intentar hacer click en cualquier opción que diga footer
      const allText = await page.content();
      if (allText.includes('footer') || allText.includes('Footer')) {
        console.log('Footer text found in page');
        // Buscar más específicamente
        const elements = await page.$$('button, div[role="button"]');
        for (const el of elements) {
          const text = await el.textContent();
          if (text && text.toLowerCase().includes('footer')) {
            console.log(`Clicking on element with text: ${text}`);
            await el.click();
            await page.waitForTimeout(1000);
            break;
          }
        }
      } else {
        console.log('No footer option found on page');
      }
    }

    await page.screenshot({ path: '/tmp/after-select-footer.png' });

    // 7. Esperar a ver si hay errores
    console.log('\n=== STEP 7: Checking for errors ===');
    await page.waitForTimeout(2000);

    // 8. Captura final
    console.log('\n=== STEP 8: Final screenshot ===');
    await page.screenshot({ path: '/tmp/final-footer-state.png' });

  } catch (error) {
    console.error('\n[ERROR] Exception caught:', error.message);
    console.error(error.stack);
    await page.screenshot({ path: '/tmp/error-screenshot.png' });
  }

  // Resumen de errores
  console.log('\n=== CONSOLE LOGS SUMMARY ===');
  const errors = consoleLogs.filter(l => l.type === 'error' || l.type === 'warning');
  if (errors.length > 0) {
    console.log('Errors/Warnings found:');
    errors.forEach(e => console.log(`  [${e.type}] ${e.text}`));
  } else {
    console.log('No errors in console');
  }

  console.log('\n=== PAGE ERRORS SUMMARY ===');
  if (pageErrors.length > 0) {
    console.log('Page errors found:');
    pageErrors.forEach(e => console.log(`  ${e.message}`));
  } else {
    console.log('No page errors');
  }

  await browser.close();
})();
