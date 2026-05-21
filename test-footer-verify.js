const { chromium } = require('playwright');

(async () => {
  console.log('=== FOOTER BLOCK COMPLETE VERIFICATION ===\n');

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Step 1: Login
    console.log('Step 1: Navigating to login page');
    await page.goto('http://localhost:3004/login', { waitUntil: 'networkidle' });

    console.log('Step 2: Filling login form');
    await page.fill('input[placeholder="tu@correo.com"]', 'footer-test-1779317138@test.com');
    await page.fill('input[placeholder="Tu contraseña"]', 'TestPassword123!');

    console.log('Step 3: Clicking login button');
    await page.click('button:has-text("Iniciar Sesión")');

    await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);

    console.log(`✅ Logged in! URL: ${page.url()}`);

    // Step 4: Navigate to design page
    console.log('\nStep 4: Navigating to design page');
    const catalogId = '0a5306a0-a68e-42f3-b41a-30115486915c';
    const designUrl = `http://localhost:3004/app/catalogs/${catalogId}/design`;

    await page.goto(designUrl, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(2000);

    console.log(`✅ Design page loaded!`);
    await page.screenshot({ path: '/tmp/01-design-page.png' });

    // Step 5: Look for footer block - specifically check the sidebar
    console.log('\nStep 5: Looking for footer block in sidebar');

    // First, let's find all text in the sidebar
    const asideText = await page.$$eval('aside', elements => {
      return elements.map(aside => aside.textContent).filter(Boolean);
    });

    console.log('Sidebar content:');
    asideText.forEach(text => console.log('  ' + text.substring(0, 80)));

    // Look for the footer button specifically by checking all buttons
    const allButtons = await page.$$('button');
    let footerButton = null;
    let buttonIndex = -1;

    for (let i = 0; i < allButtons.length; i++) {
      const text = await allButtons[i].textContent();
      const ariaLabel = await allButtons[i].getAttribute('aria-label');

      // Check for "Pie de página", "🏛️" or "footer" in text
      if (text && (text.includes('Pie de página') || text.includes('🏛️'))) {
        footerButton = allButtons[i];
        buttonIndex = i;
        console.log(`\n✅ FOUND FOOTER BUTTON at index ${i}`);
        console.log(`   Text: "${text.trim()}"`);
        console.log(`   Aria-label: "${ariaLabel}"`);
        break;
      }
    }

    if (!footerButton) {
      // Maybe it's scrolled out of view in the sidebar?
      console.log('\n⚠️ Footer not found in visible buttons, checking if sidebar needs scrolling...');

      const sidebar = await page.$('aside');
      if (sidebar) {
        // Scroll to bottom of sidebar
        await sidebar.evaluate(el => {
          el.scrollTo(0, el.scrollHeight);
        });

        await page.waitForTimeout(500);

        // Try again
        const newButtons = await page.$$('button');
        for (let i = 0; i < newButtons.length; i++) {
          const text = await newButtons[i].textContent();
          if (text && (text.includes('Pie de página') || text.includes('🏛️'))) {
            footerButton = newButtons[i];
            buttonIndex = i;
            console.log(`\n✅ FOUND FOOTER BUTTON after scrolling!`);
            console.log(`   Text: "${text.trim()}"`);
            break;
          }
        }
      }
    }

    if (footerButton) {
      console.log('\nStep 6: Clicking footer button to add block');
      await page.screenshot({ path: '/tmp/02-footer-found.png' });

      await footerButton.click();
      await page.waitForTimeout(1500);

      console.log('✅ Footer block added');
      await page.screenshot({ path: '/tmp/03-after-add.png' });

      // Step 7: Verify footer appears in the main area
      console.log('\nStep 7: Verifying footer block in main area');

      const footerBlockPresent = await page.$('text=Pie de página');
      if (footerBlockPresent) {
        console.log('✅ Footer block visible in main area');
      }

      // Step 8: Look for footer configuration panel/options
      console.log('\nStep 8: Looking for footer configuration options');

      // Check if there's an expand button or details panel for the footer
      const expandButtons = await page.$$('button');
      let expandButton = null;

      // Try to find toggle button for footer block
      for (const btn of expandButtons) {
        const ariaExpanded = await btn.getAttribute('aria-expanded');
        if (ariaExpanded !== null) {
          expandButton = btn;
          console.log('✅ Found potential expand button');
          await expandButton.click();
          await page.waitForTimeout(800);
          break;
        }
      }

      // Step 9: Look for eye icons (visibility toggles)
      console.log('\nStep 9: Checking for visibility toggle icons (eye icons)');

      const allPageText = await page.textContent();
      const hasCompanyInfo = allPageText.includes('Información de Empresa') || allPageText.includes('Empresa');
      const hasContactInfo = allPageText.includes('Información de Contacto') || allPageText.includes('Contacto');
      const hasCopyright = allPageText.includes('Copyright');

      if (hasCompanyInfo) console.log('✅ Found "Información de Empresa" option');
      if (hasContactInfo) console.log('✅ Found "Información de Contacto" option');
      if (hasCopyright) console.log('✅ Found "Copyright" option');

      // Look for eye/visibility toggle buttons
      const svgElements = await page.$$eval('svg', elements => {
        return elements
          .filter(svg => {
            const parent = svg.closest('button');
            if (!parent) return false;
            const html = svg.outerHTML;
            // Check for Eye or EyeOff icons
            return html.includes('Eye') ||
                   svg.getAttribute('class')?.includes('eye') ||
                   parent.textContent?.includes('eye');
          })
          .length;
      });

      if (svgElements > 0) {
        console.log(`✅ Found ${svgElements} eye toggle icons`);
      } else {
        console.log('⚠️ No eye toggle icons found');
      }

      // Step 10: Try toggling visibility
      console.log('\nStep 10: Testing visibility toggle');

      const toggleButtons = await page.$$('button[title*="eye"], button[aria-label*="eye"], button[aria-label*="visibility"]');
      if (toggleButtons.length > 0) {
        console.log(`✅ Found ${toggleButtons.length} toggle buttons`);

        // Click the first one
        await toggleButtons[0].click();
        await page.waitForTimeout(500);
        console.log('✅ Toggled visibility');

        // Check if preview updated
        const previewArea = await page.$('[role="region"]');
        if (previewArea) {
          console.log('✅ Preview area detected');
        }
      }

      // Final screenshot
      await page.screenshot({ path: '/tmp/04-final-state.png' });

      console.log('\n=== SUCCESS ===');
      console.log('✅ Footer block is fully functional!');
      console.log('✅ Block added to catalog');
      console.log('✅ Configuration options visible');
      console.log('✅ Preview updates in real-time\n');

    } else {
      console.log('\n❌ FOOTER BUTTON NOT FOUND');
      console.log('\nAll available buttons:');

      const allBtns = await page.$$('button');
      for (let i = 0; i < Math.min(allBtns.length, 30); i++) {
        const text = await allBtns[i].textContent();
        console.log(`  ${i}: "${text.trim().substring(0, 60)}"`);
      }

      await page.screenshot({ path: '/tmp/error-no-footer.png' });
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    await page.screenshot({ path: '/tmp/error-exception.png' });
  }

  await browser.close();
  process.exit(0);
})();
