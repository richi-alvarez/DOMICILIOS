const { chromium } = require('playwright');

(async () => {
  console.log('Starting test...');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Setup error tracking
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error(`[BROWSER ERROR] ${msg.text()}`);
      errors.push(msg.text());
    }
  });

  page.on('pageerror', err => {
    console.error(`[PAGE ERROR] ${err.message}`);
    errors.push(err.message);
  });

  try {
    // Navigate to local dev server
    console.log('\n1. Navigating to app...');
    await page.goto('http://localhost:3000/auth/login', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Check if we're on login page
    const pageUrl = page.url();
    console.log(`Current URL: ${pageUrl}`);

    // Try to create account (use existing if available)
    const testEmail = `test-${Date.now()}@test.com`;
    console.log(`\n2. Creating test account with email: ${testEmail}`);

    // Try clicking signup link or direct navigation
    const signupBtn = await page.$('text=/registr|sign up|crear/i');
    if (signupBtn) {
      await signupBtn.click();
      await page.waitForNavigation().catch(() => {});
    } else {
      await page.goto('http://localhost:3000/auth/signup', { waitUntil: 'networkidle' });
    }

    await page.waitForTimeout(1500);

    // Fill signup form
    const emailInput = await page.$('input[type="email"]');
    if (emailInput) {
      await emailInput.fill(testEmail);
    }

    const passwordInputs = await page.$$('input[type="password"]');
    if (passwordInputs.length > 0) {
      await passwordInputs[0].fill('TestPassword123!');
    }

    // Find and click submit
    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) {
      await submitBtn.click();
      await page.waitForNavigation().catch(() => {});
      await page.waitForTimeout(2000);
    }

    // Navigate to catalogs
    console.log('\n3. Navigating to catalogs...');
    await page.goto('http://localhost:3000/app/catalogs', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // Create new catalog
    console.log('\n4. Creating new catalog...');
    const newCatalogBtn = await page.$('button:has-text("Nuevo"), a:has-text("Nuevo"), button:has-text("New"), a:has-text("New")');
    if (newCatalogBtn) {
      await newCatalogBtn.click();
      await page.waitForTimeout(2000);
    }

    // Fill form and continue through wizard
    const nameInput = await page.$('input[placeholder*="nombre" i], input[name="name"]');
    if (nameInput) {
      await nameInput.fill(`Test Catalog ${Date.now()}`);
    }

    // Click through wizard steps
    for (let i = 0; i < 6; i++) {
      const continueBtn = await page.$('button:has-text("Siguiente"), button:has-text("Continuar"), button:has-text("Crear")');
      if (continueBtn) {
        await continueBtn.click();
        await page.waitForTimeout(1500);
      } else {
        break;
      }
    }

    // Wait for catalog page
    await page.waitForURL(/catalogs\/[^/]+/, { timeout: 10000 }).catch(() => {});
    const catalogUrl = page.url();
    console.log(`Catalog URL: ${catalogUrl}`);

    // Navigate to design
    console.log('\n5. Navigating to design page...');
    const designBtn = await page.$('text=/diseño|design/i, a:has-text("Diseño"), button:has-text("Diseño")');
    if (designBtn) {
      await designBtn.click();
      await page.waitForNavigation().catch(() => {});
    } else {
      // Extract catalog ID and navigate directly
      const match = catalogUrl.match(/catalogs\/([^/]+)/);
      if (match) {
        await page.goto(`http://localhost:3000/app/catalogs/${match[1]}/design`, { waitUntil: 'networkidle' });
      }
    }

    await page.waitForTimeout(2000);
    console.log(`Design page URL: ${page.url()}`);
    await page.screenshot({ path: '/tmp/design-page.png' });

    // Look for footer block in the palette
    console.log('\n6. Looking for footer block...');

    // Wait for the blocks palette to be visible
    await page.waitForSelector('button:has-text("Pie de página"), button:has-text("Footer")', { timeout: 5000 }).catch(() => {
      console.log('Footer button not found with primary selectors, searching manually...');
    });

    const footerBtn = await page.$('button:has-text("Pie de página"), button:has-text("Footer")');

    if (footerBtn) {
      console.log('✅ Found footer block button!');
      await page.screenshot({ path: '/tmp/before-click-footer.png' });

      // Click to add footer block
      await footerBtn.click();
      await page.waitForTimeout(1500);

      console.log('✅ Clicked footer block button');
      await page.screenshot({ path: '/tmp/after-click-footer.png' });

      // Verify footer was added
      const footerInPanel = await page.$('text=/Pie de página|Footer/');
      if (footerInPanel) {
        console.log('✅ Footer block appears in the blocks list!');
      } else {
        console.log('⚠️ Footer block not visible in blocks list after clicking');
      }
    } else {
      console.log('❌ Footer block button NOT found');

      // Debug: list all buttons in the palette
      const allButtons = await page.$$('aside button');
      console.log(`Found ${allButtons.length} buttons in palette`);

      for (let i = 0; i < Math.min(allButtons.length, 10); i++) {
        const text = await allButtons[i].textContent();
        console.log(`  Button ${i}: ${text}`);
      }
    }

    // Final screenshot
    await page.screenshot({ path: '/tmp/final-state.png' });

    console.log('\n7. Test Results:');
    console.log(`Errors caught: ${errors.length}`);
    errors.forEach((e, i) => console.log(`  ${i + 1}. ${e}`));

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    await page.screenshot({ path: '/tmp/error.png' });
  }

  await browser.close();
  process.exit(0);
})();
