const { chromium } = require('playwright');

(async () => {
  console.log('=== TESTING ADD BLOCK MODAL ===\n');

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Login
    console.log('Step 1: Logging in...');
    await page.goto('http://localhost:3004/login', { waitUntil: 'networkidle' });
    await page.fill('input[placeholder="tu@correo.com"]', 'footer-test-1779317138@test.com');
    await page.fill('input[placeholder="Tu contraseña"]', 'TestPassword123!');
    await page.click('button:has-text("Iniciar Sesión")');
    await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);
    console.log('✅ Logged in\n');

    // Go to design
    const catalogId = '0a5306a0-a68e-42f3-b41a-30115486915c';
    const designUrl = `http://localhost:3004/app/catalogs/${catalogId}/design`;
    await page.goto(designUrl, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(2000);
    console.log('✅ On design page\n');

    // Step 2: Click "Agregar Bloque" button
    console.log('Step 2: Looking for "Agregar Bloque" button');
    const buttons = await page.$$('button');
    let addBlockButton = null;

    for (const btn of buttons) {
      const text = await btn.textContent();
      if (text && text.includes('Agregar Bloque')) {
        addBlockButton = btn;
        console.log(`✅ Found "Agregar Bloque" button`);
        break;
      }
    }

    if (!addBlockButton) {
      console.log('❌ "Agregar Bloque" button not found');
      console.log('\nAll buttons:');
      for (let i = 0; i < buttons.length; i++) {
        const text = await buttons[i].textContent();
        console.log(`  [${i}] ${text.trim().substring(0, 50)}`);
      }
    } else {
      console.log('\nStep 3: Clicking "Agregar Bloque"');
      await addBlockButton.click();
      await page.waitForTimeout(1000);

      // Check if modal appeared
      const modalTitle = await page.$('text=Agregar Bloque');
      if (modalTitle) {
        console.log('✅ Modal opened\n');
        await page.screenshot({ path: '/tmp/modal-open.png' });

        // Step 4: Look for footer option in modal
        console.log('Step 4: Looking for footer block in modal');
        const footerOption = await page.$('text=Pie de Página');
        if (footerOption) {
          console.log('✅ FOOTER BLOCK FOUND IN MODAL!\n');
          await page.screenshot({ path: '/tmp/footer-in-modal.png' });

          // Step 5: Click footer option
          console.log('Step 5: Clicking footer option');
          await footerOption.click();
          await page.waitForTimeout(1500);

          console.log('✅ Clicked footer\n');
          await page.screenshot({ path: '/tmp/after-add-footer.png' });

          // Verify footer was added
          const pageText = await page.textContent();
          if (pageText.includes('Pie de Página')) {
            console.log('✅ Footer block added successfully!');
          }

          console.log('\n' + '='.repeat(50));
          console.log('✅ SUCCESS - FOOTER BLOCK WORKS!');
          console.log('='.repeat(50));

        } else {
          console.log('❌ Footer not found in modal');
          const modalText = await page.textContent();
          console.log('\nModal content includes:');
          if (modalText.includes('Presentación')) console.log('  - Presentación');
          if (modalText.includes('Contenido')) console.log('  - Contenido');
          if (modalText.includes('E-Commerce')) console.log('  - E-Commerce');
          if (modalText.includes('Institucional')) console.log('  - Institucional');
        }
      } else {
        console.log('❌ Modal did not open');
      }
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  }

  await browser.close();
  process.exit(0);
})();
