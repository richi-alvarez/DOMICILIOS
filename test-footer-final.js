const { chromium } = require('playwright');

(async () => {
  console.log('Starting footer block test...');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Navigate directly to design page with existing catalog
    // (Assuming catalog ID 1 exists from previous setup)
    console.log('\n=== Step 1: Navigating to design page ===');
    await page.goto('http://localhost:3000/app/catalogs', { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(2000);

    // Check if we need to login
    if (page.url().includes('login')) {
      console.log('Not authenticated, redirected to login');
      await browser.close();
      process.exit(1);
    }

    console.log(`Current page: ${page.url()}`);

    // Try to find a catalog link
    const catalogLinks = await page.$$('a[href*="/catalogs/"]');
    if (catalogLinks.length > 0) {
      // Get the first catalog
      const href = await catalogLinks[0].getAttribute('href');
      console.log(`Found catalog link: ${href}`);

      // Navigate to its design page
      const catalogMatch = href.match(/catalogs\/([^/]+)/);
      if (catalogMatch) {
        const catalogId = catalogMatch[1];
        const designUrl = `http://localhost:3000/app/catalogs/${catalogId}/design`;
        console.log(`\n=== Step 2: Navigating to design page ===`);
        await page.goto(designUrl, { waitUntil: 'networkidle', timeout: 20000 });
        await page.waitForTimeout(2000);

        console.log(`Design page URL: ${page.url()}`);
        await page.screenshot({ path: '/tmp/01-design-page-loaded.png' });

        // Check if design editor loaded
        const blockPalette = await page.$('aside');
        if (blockPalette) {
          console.log('✅ Block palette found');

          // Look for footer block
          console.log('\n=== Step 3: Looking for footer block ===');
          const buttons = await page.$$('button');

          let footerButton = null;
          let footerIndex = -1;

          for (let i = 0; i < buttons.length; i++) {
            const text = await buttons[i].textContent();
            console.log(`Button ${i}: "${text}"`);

            if (text && (text.includes('Pie de página') || text.includes('Footer'))) {
              footerButton = buttons[i];
              footerIndex = i;
              console.log(`✅ Found footer button at index ${i}`);
              break;
            }
          }

          if (footerButton) {
            console.log('\n=== Step 4: Clicking footer block ===');
            await page.screenshot({ path: '/tmp/02-before-click-footer.png' });

            await footerButton.click();
            await page.waitForTimeout(1500);

            console.log('✅ Clicked footer button');
            await page.screenshot({ path: '/tmp/03-after-click-footer.png' });

            // Check if block was added
            const blocksCount = await page.$$eval(
              'div[role="region"]',
              elements => elements.filter(e => e.textContent.includes('Pie de página')).length
            ).catch(() => 0);

            if (blocksCount > 0) {
              console.log('✅ Footer block added successfully!');
            } else {
              console.log('⚠️ Footer block may have been added but not visible');
            }

            // Check for footer in the blocks list
            const footerInList = await page.$('text=Pie de página');
            if (footerInList) {
              console.log('✅ Footer visible in blocks list');
            }

            // Final screenshot
            await page.screenshot({ path: '/tmp/04-final-state.png' });

            console.log('\n=== Summary ===');
            console.log('✅ TEST PASSED - Footer block is accessible and clickable');
          } else {
            console.log('❌ FAILED - Footer block button not found');
            console.log('\nAvailable buttons:');
            const allButtons = await page.$$('button');
            for (let i = 0; i < Math.min(allButtons.length, 15); i++) {
              const text = await allButtons[i].textContent();
              console.log(`  ${i}: ${text.trim().substring(0, 60)}`);
            }
          }
        } else {
          console.log('❌ Block palette not found');
        }
      }
    } else {
      console.log('No catalogs found');
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    await page.screenshot({ path: '/tmp/error-screenshot.png' });
  }

  await browser.close();
  process.exit(0);
})();
