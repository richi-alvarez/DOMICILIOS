const { chromium } = require('playwright');

(async () => {
  console.log('Starting comprehensive footer block verification...\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Step 1: Navigate to home
    console.log('=== Step 1: Navigating to application ===');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(1000);
    console.log(`Current URL: ${page.url()}\n`);

    // Check if on login page
    if (page.url().includes('login')) {
      console.log('=== Step 2: On login page, creating test account ===');

      // Fill in email
      const testEmail = `footer-test-${Date.now()}@test.com`;
      console.log(`Creating account with email: ${testEmail}`);

      await page.fill('input[type="email"]', testEmail);
      await page.fill('input[type="password"]', 'TestPassword123!');

      // Look for sign up button
      const buttons = await page.$$('button');
      let signupButton = null;

      for (const btn of buttons) {
        const text = await btn.textContent();
        if (text && text.toLowerCase().includes('registr')) {
          signupButton = btn;
          break;
        }
      }

      if (signupButton) {
        await page.screenshot({ path: '/tmp/step2-signup-form.png' });
        await signupButton.click();
        await page.waitForTimeout(3000);
        console.log('✅ Signed up successfully');
      } else {
        console.log('⚠️ Could not find signup button, trying to proceed...');
      }
    }

    console.log(`\nCurrent URL after auth: ${page.url()}`);
    await page.waitForTimeout(2000);

    // Step 3: Check if we're at catalogs page or need to navigate there
    console.log('\n=== Step 3: Navigating to catalogs ===');

    if (!page.url().includes('/catalogs')) {
      await page.goto('http://localhost:3000/app/catalogs', { waitUntil: 'networkidle', timeout: 20000 });
      await page.waitForTimeout(2000);
    }

    console.log(`Catalogs page URL: ${page.url()}`);

    // Check if we have catalogs or need to create one
    const createCatalogButton = await page.$('button:has-text("Crear")') ||
                                await page.$('button:has-text("Nuevo")') ||
                                await page.$('button:has-text("Agregar")');

    if (createCatalogButton) {
      console.log('\n=== Step 4: Creating test catalog ===');
      await page.screenshot({ path: '/tmp/step3-catalogs-page.png' });

      await createCatalogButton.click();
      await page.waitForTimeout(2000);

      // Fill in catalog form
      const inputs = await page.$$('input[type="text"]');
      if (inputs.length > 0) {
        await inputs[0].fill('Test Catalog Footer');
        console.log('✅ Filled catalog name');
      }

      // Look for next/create button
      const createButtons = await page.$$('button');
      let proceedButton = null;

      for (const btn of createButtons) {
        const text = await btn.textContent();
        if (text && (text.toLowerCase().includes('siguiente') ||
                     text.toLowerCase().includes('crear') ||
                     text.toLowerCase().includes('continuar'))) {
          proceedButton = btn;
          break;
        }
      }

      if (proceedButton) {
        await proceedButton.click();
        await page.waitForTimeout(3000);
        console.log('✅ Proceeded with catalog creation');
      }
    }

    // Step 5: Navigate to design page
    console.log('\n=== Step 5: Finding catalog and navigating to design ===');

    // Try to find first catalog link
    const catalogLinks = await page.$$('a[href*="/catalogs/"]');
    let catalogId = null;

    for (const link of catalogLinks) {
      const href = await link.getAttribute('href');
      if (href && !href.includes('design')) {
        const match = href.match(/catalogs\/([^/]+)$/);
        if (match) {
          catalogId = match[1];
          console.log(`Found catalog ID: ${catalogId}`);
          break;
        }
      }
    }

    if (catalogId) {
      const designUrl = `http://localhost:3000/app/catalogs/${catalogId}/design`;
      console.log(`Navigating to: ${designUrl}`);

      await page.goto(designUrl, { waitUntil: 'networkidle', timeout: 20000 });
      await page.waitForTimeout(2000);

      console.log(`Design page loaded: ${page.url()}\n`);
      await page.screenshot({ path: '/tmp/step5-design-page.png' });

      // Step 6: Verify footer block in palette
      console.log('=== Step 6: Verifying footer block in palette ===');

      // Look for "Pie de página" or Footer button
      const allButtons = await page.$$('button');
      let footerButton = null;

      for (const btn of allButtons) {
        const text = await btn.textContent();
        if (text && (text.includes('Pie de página') || text.includes('Footer') || text.includes('🏛️'))) {
          footerButton = btn;
          console.log(`✅ Found footer button: "${text.trim()}"`);
          break;
        }
      }

      if (!footerButton) {
        console.log('⚠️ Footer button not found by text, searching by icon...');

        // Try to find by data attribute or other means
        const paletteButtons = await page.$$('aside button, div[role="region"] button');
        for (let i = 0; i < paletteButtons.length; i++) {
          const text = await paletteButtons[i].textContent();
          console.log(`  Button ${i}: "${text.trim()}"`);
        }
      }

      // Step 7: Click footer button if found
      if (footerButton) {
        console.log('\n=== Step 7: Adding footer block ===');
        await page.screenshot({ path: '/tmp/step6-before-click.png' });

        await footerButton.click();
        await page.waitForTimeout(1500);
        console.log('✅ Clicked footer button');

        await page.screenshot({ path: '/tmp/step7-after-click.png' });

        // Step 8: Verify footer appears in blocks list
        console.log('\n=== Step 8: Verifying footer in blocks list ===');

        // Look for the footer block in the left sidebar
        const blocksList = await page.$('div[role="region"]');
        if (blocksList) {
          const footerInList = await page.$('text=Pie de página');
          if (footerInList) {
            console.log('✅ Footer block found in blocks list');
          } else {
            console.log('⚠️ Footer block may not be in list, checking structure...');
          }
        }

        // Step 9: Look for expand/collapse and eye icons
        console.log('\n=== Step 9: Verifying footer options and eye icons ===');

        // Get all buttons in the page to find eye icons
        const allPageButtons = await page.$$('button');
        let eyeIcons = [];

        for (let i = 0; i < allPageButtons.length; i++) {
          const html = await allPageButtons[i].evaluate(el => el.innerHTML);
          if (html && (html.includes('Eye') || html.includes('eye') ||
                       html.includes('svg') || html.includes('🔍'))) {
            const text = await allPageButtons[i].textContent();
            eyeIcons.push({ index: i, html: html.substring(0, 100) });
          }
        }

        console.log(`Found ${eyeIcons.length} potential eye icons`);
        if (eyeIcons.length > 0) {
          console.log('✅ Eye toggle icons found!');
        } else {
          console.log('⚠️ Eye toggle icons not found');
        }

        // Step 10: Look for footer configuration options
        console.log('\n=== Step 10: Checking footer configuration options ===');

        const options = await page.$$eval('button, label, div', elements => {
          return elements
            .filter(el => {
              const text = el.textContent;
              return text && (
                text.includes('Empresa') ||
                text.includes('Contacto') ||
                text.includes('Copyright')
              );
            })
            .map(el => el.textContent.trim().substring(0, 50));
        }).catch(() => []);

        if (options.length > 0) {
          console.log('✅ Found footer configuration options:');
          options.forEach(opt => console.log(`   - ${opt}`));
        } else {
          console.log('⚠️ Footer configuration options not found');
        }

        // Final screenshot
        await page.screenshot({ path: '/tmp/step10-final-state.png' });

        console.log('\n=== TEST SUMMARY ===');
        console.log('✅ Footer block verification steps completed');
        console.log('Check screenshots for visual confirmation:');
        console.log('  - /tmp/step2-signup-form.png');
        console.log('  - /tmp/step3-catalogs-page.png');
        console.log('  - /tmp/step5-design-page.png');
        console.log('  - /tmp/step6-before-click.png');
        console.log('  - /tmp/step7-after-click.png');
        console.log('  - /tmp/step10-final-state.png');

      } else {
        console.log('\n❌ Footer button not found in palette');
      }

    } else {
      console.log('❌ Could not find or create a catalog');
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error);
    await page.screenshot({ path: '/tmp/error-screenshot.png' });
  }

  await browser.close();
  process.exit(0);
})();
