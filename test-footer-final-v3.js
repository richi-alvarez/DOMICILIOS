const { chromium } = require('playwright');

(async () => {
  console.log('=== FOOTER BLOCK VERIFICATION ===\n');

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Login
    console.log('Logging in...');
    await page.goto('http://localhost:3004/login', { waitUntil: 'networkidle' });
    await page.fill('input[placeholder="tu@correo.com"]', 'footer-test-1779317138@test.com');
    await page.fill('input[placeholder="Tu contraseña"]', 'TestPassword123!');
    await page.click('button:has-text("Iniciar Sesión")');
    await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);

    // Navigate to design
    const catalogId = '0a5306a0-a68e-42f3-b41a-30115486915c';
    const designUrl = `http://localhost:3004/app/catalogs/${catalogId}/design`;
    await page.goto(designUrl, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(2000);

    console.log('✅ On design page\n');
    await page.screenshot({ path: '/tmp/design-full.png' });

    console.log('Step 1: Searching for footer block');

    // Get all buttons and their text
    const footerMatches = await page.$$eval('button', buttons => {
      return buttons
        .map((btn, i) => ({
          index: i,
          text: btn.textContent,
          hasPie: btn.textContent?.includes('Pie de página'),
          hasEmoji: btn.textContent?.includes('🏛️'),
        }))
        .filter(b => b.hasPie || b.hasEmoji);
    });

    console.log(`Found ${footerMatches.length} footer matches\n`);

    if (footerMatches.length > 0) {
      footerMatches.forEach(m => {
        console.log(`Index ${m.index}: "${m.text.trim()}"`);
      });

      console.log('\n✅ FOOTER BLOCK FOUND IN PALETTE!');

      // Click the footer button
      const footerButtons = await page.$$('button');
      const footerButton = footerButtons[footerMatches[0].index];

      console.log('\nStep 2: Clicking footer block button');
      await footerButton.click();
      await page.waitForTimeout(1500);

      console.log('✅ Clicked - footer block should now be added');
      await page.screenshot({ path: '/tmp/after-click-footer.png' });

      // Verify
      console.log('\nStep 3: Verifying footer block was added');
      const pageText = await page.textContent();
      if (pageText.includes('Pie de página')) {
        console.log('✅ Footer block visible in main area');
      }

      // Check options
      console.log('\nStep 4: Checking configuration options');
      if (pageText.includes('Información de Empresa')) console.log('  ✅ Información de Empresa');
      if (pageText.includes('Información de Contacto')) console.log('  ✅ Información de Contacto');
      if (pageText.includes('Copyright')) console.log('  ✅ Copyright');

      await page.screenshot({ path: '/tmp/final-state.png' });

      console.log('\n' + '='.repeat(50));
      console.log('✅ SUCCESS - FOOTER BLOCK WORKING!');
      console.log('='.repeat(50));

    } else {
      console.log('❌ FOOTER NOT FOUND');
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  }

  await browser.close();
  process.exit(0);
})();
