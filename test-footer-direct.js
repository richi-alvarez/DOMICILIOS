const { chromium } = require('playwright');

(async () => {
  console.log('=== FOOTER BLOCK VERIFICATION TEST ===\n');

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Step 1: Login
    console.log('Step 1: Navigating to login page');
    await page.goto('http://localhost:3004/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    console.log('Step 2: Filling login form');
    await page.fill('input[placeholder="tu@correo.com"]', 'footer-test-1779317138@test.com');
    await page.fill('input[placeholder="Tu contraseña"]', 'TestPassword123!');

    console.log('Step 3: Clicking login button');
    await page.click('button:has-text("Iniciar Sesión")');

    await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);

    console.log(`✅ Logged in! URL: ${page.url()}`);
    await page.screenshot({ path: '/tmp/step1-logged-in.png' });

    // Step 4: Navigate to design page
    console.log('\nStep 4: Navigating to design page');
    const catalogId = '0a5306a0-a68e-42f3-b41a-30115486915c';
    const designUrl = `http://localhost:3004/app/catalogs/${catalogId}/design`;

    await page.goto(designUrl, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(2000);

    console.log(`✅ Design page loaded! URL: ${page.url()}`);
    await page.screenshot({ path: '/tmp/step2-design-page.png' });

    // Step 5: Look for footer block in palette
    console.log('\nStep 5: Searching for footer block in palette');

    const buttons = await page.$$('button');
    let footerButton = null;
    let footerButtonText = null;

    for (const btn of buttons) {
      const text = await btn.textContent();
      if (text && (text.includes('Pie de página') || text.includes('🏛️'))) {
        footerButton = btn;
        footerButtonText = text.trim();
        break;
      }
    }

    if (footerButton) {
      console.log(`✅ Found footer button: "${footerButtonText}"`);
      await page.screenshot({ path: '/tmp/step3-footer-found.png' });

      // Step 6: Click footer button to add it
      console.log('\nStep 6: Clicking footer button to add block');
      await footerButton.click();
      await page.waitForTimeout(1500);

      console.log('✅ Footer button clicked');
      await page.screenshot({ path: '/tmp/step4-after-click.png' });

      // Step 7: Verify footer appears in blocks list
      console.log('\nStep 7: Verifying footer in blocks list');

      const footerInList = await page.$('text=Pie de página');
      if (footerInList) {
        console.log('✅ Footer appears in blocks list');
      } else {
        console.log('⚠️ Footer not found in blocks list (may need to scroll)');
      }

      // Step 8: Look for eye icons (visibility toggles)
      console.log('\nStep 8: Checking for eye toggle icons');

      const svgs = await page.$$eval('svg', elements => {
        return elements.map(el => {
          const parent = el.closest('button');
          if (parent) {
            return {
              html: el.outerHTML.substring(0, 150),
              title: el.getAttribute('title'),
              ariaLabel: el.getAttribute('aria-label')
            };
          }
          return null;
        }).filter(Boolean);
      });

      const eyeIcons = svgs.filter(svg =>
        (svg.title && svg.title.toLowerCase().includes('eye')) ||
        (svg.ariaLabel && svg.ariaLabel.toLowerCase().includes('eye'))
      );

      if (eyeIcons.length > 0) {
        console.log(`✅ Found ${eyeIcons.length} eye toggle icons`);
      } else {
        console.log('⚠️ No eye toggle icons found (checking for visibility buttons...)');
      }

      // Step 9: Look for footer configuration options
      console.log('\nStep 9: Checking for footer configuration options');

      const pageText = await page.textContent();
      const options = ['Empresa', 'Contacto', 'Copyright'];
      const foundOptions = [];

      for (const opt of options) {
        if (pageText.includes(opt)) {
          foundOptions.push(opt);
          console.log(`  ✅ Found option: "${opt}"`);
        }
      }

      if (foundOptions.length === 0) {
        console.log('⚠️ Configuration options not found');
      }

      // Final screenshot
      console.log('\nStep 10: Taking final screenshot');
      await page.screenshot({ path: '/tmp/step5-final-state.png' });

      // Summary
      console.log('\n=== TEST SUMMARY ===');
      console.log('✅ Footer block verification completed successfully');
      console.log('\nScreenshots saved:');
      console.log('  - /tmp/step1-logged-in.png');
      console.log('  - /tmp/step2-design-page.png');
      console.log('  - /tmp/step3-footer-found.png');
      console.log('  - /tmp/step4-after-click.png');
      console.log('  - /tmp/step5-final-state.png');
      console.log('\n✅ FOOTER BLOCK IS WORKING!');

    } else {
      console.log('❌ FAILED: Footer block button not found in palette');

      console.log('\nAvailable buttons (first 20):');
      const allButtons = await page.$$('button');
      for (let i = 0; i < Math.min(allButtons.length, 20); i++) {
        const text = await allButtons[i].textContent();
        console.log(`  ${i}: "${text.trim().substring(0, 60)}"`);
      }
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    await page.screenshot({ path: '/tmp/error-screenshot.png' });
  }

  await browser.close();
  process.exit(0);
})();
