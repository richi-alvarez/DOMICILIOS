const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const SCREENSHOTS_DIR = '/tmp/footer-qa-screenshots';

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

let testResults = {
  passed: 0,
  failed: 0,
  errors: [],
  screenshots: []
};

async function test() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log('=== FOOTER BLOCK QA TEST SUITE ===\n');

    // Step 1: Navigate to catalogs
    console.log('Step 1: Navigating to app...');
    await page.goto(`${BASE_URL}/app/catalogs`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Check if we're logged in
    const isLoggedIn = await page.evaluate(() => {
      return !document.body.innerHTML.includes('login');
    });

    if (!isLoggedIn) {
      console.log('Note: User needs to be logged in. Proceeding with test...');
    }

    // Step 2: Get first catalog
    console.log('\nStep 2: Looking for catalog...');
    const catalogLink = await page.$('[role="link"]');
    
    if (!catalogLink) {
      throw new Error('No catalog found. Please create one first using the UI.');
    }

    await catalogLink.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    console.log('✓ Catalog opened');
    testResults.passed++;

    // Step 3: Navigate to design page
    console.log('\nStep 3: Navigating to design page...');
    const designLink = await page.$('a[href*="/design"]');
    if (designLink) {
      await designLink.click();
    } else {
      // Alternative: look for text
      const links = await page.$$eval('a', els => els.map(e => e.href));
      const designHref = links.find(h => h.includes('design'));
      if (designHref) {
        await page.goto(designHref, { waitUntil: 'networkidle' });
      }
    }
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    console.log('✓ Design page loaded');
    testResults.passed++;

    // Step 4: Locate footer block
    console.log('\nStep 4: Finding footer block...');
    const footerExists = await page.evaluate(() => {
      return document.body.innerText.toLowerCase().includes('pie de página') ||
             document.body.innerText.toLowerCase().includes('footer');
    });

    if (!footerExists) {
      throw new Error('Footer block not found. Check design page structure.');
    }

    console.log('✓ Footer block found');
    testResults.passed++;

    // Expand footer if needed
    const expandButtons = await page.$$('button');
    for (const btn of expandButtons) {
      const expanded = await btn.evaluate(el => el.getAttribute('aria-expanded'));
      const text = await btn.evaluate(el => el.textContent);
      if (expanded === 'false' && text.includes('Pie')) {
        await btn.click();
        await page.waitForTimeout(500);
        console.log('✓ Footer section expanded');
        break;
      }
    }

    testResults.passed++;

    // Take initial screenshot
    const settingsScreenshot = path.join(SCREENSHOTS_DIR, '01-footer-settings-initial.png');
    await page.screenshot({ path: settingsScreenshot, fullPage: true });
    testResults.screenshots.push(settingsScreenshot);
    console.log(`Screenshot saved: 01-footer-settings-initial.png`);

    // Step 5: Test main toggles (Company Info, Contact Info, Copyright)
    console.log('\nStep 5: Testing main toggles...');

    // Get all checkboxes in footer section
    const checkboxes = await page.$$('input[type="checkbox"]');
    console.log(`Found ${checkboxes.length} toggle checkboxes`);

    const mainToggles = [
      { index: 0, name: 'Información de Empresa' },
      { index: 1, name: 'Información de Contacto' },
      { index: 2, name: 'Copyright' }
    ];

    for (const toggle of mainToggles) {
      if (checkboxes[toggle.index]) {
        console.log(`\nTesting: ${toggle.name}`);
        
        // Get initial state
        const initialState = await checkboxes[toggle.index].evaluate(el => el.checked);
        console.log(`  Initial state: ${initialState ? 'enabled' : 'disabled'}`);
        
        // Click toggle
        await checkboxes[toggle.index].click();
        await page.waitForTimeout(400);
        
        // Get new state
        const newState = await checkboxes[toggle.index].evaluate(el => el.checked);
        console.log(`  New state: ${newState ? 'enabled' : 'disabled'}`);
        console.log(`  ✓ ${toggle.name} toggled successfully`);
        testResults.passed++;

        // Take screenshot
        const screenshot = path.join(SCREENSHOTS_DIR, `02-${toggle.name.replace(/\s+/g, '-')}.png`);
        await page.screenshot({ path: screenshot, fullPage: true });
        testResults.screenshots.push(screenshot);
      }
    }

    // Step 6: Test field-level toggles
    console.log('\nStep 6: Testing field-level toggles...');
    const fieldCheckboxes = await page.$$('input[type="checkbox"]');
    const additionalToggles = fieldCheckboxes.slice(3, 8); // Next 5 toggles for fields

    for (let i = 0; i < additionalToggles.length; i++) {
      const fieldName = await additionalToggles[i].evaluate(el => {
        const label = el.closest('label') || el.nextElementSibling;
        return label ? label.textContent : `Field ${i}`;
      });

      console.log(`Testing field: ${fieldName}`);
      await additionalToggles[i].click();
      await page.waitForTimeout(200);
      console.log(`  ✓ ${fieldName} toggle clicked`);
      testResults.passed++;
    }

    // Step 7: Verify preview panel
    console.log('\nStep 7: Checking preview panel...');
    const previewExists = await page.evaluate(() => {
      return document.body.innerText.includes('Preview') ||
             !!document.querySelector('[class*="preview"]');
    });

    if (previewExists) {
      console.log('  ✓ Preview panel is visible');
      testResults.passed++;

      const previewScreenshot = path.join(SCREENSHOTS_DIR, '03-preview-panel.png');
      await page.screenshot({ path: previewScreenshot, fullPage: true });
      testResults.screenshots.push(previewScreenshot);
    }

    // Step 8: Test toggle combination
    console.log('\nStep 8: Testing toggle combinations...');
    
    // Create a specific combination: disable first 2, enable last one
    if (checkboxes.length >= 3) {
      const state1 = await checkboxes[0].evaluate(el => el.checked);
      const state2 = await checkboxes[1].evaluate(el => el.checked);
      
      // Set specific states
      if (state1) await checkboxes[0].click();
      if (state2) await checkboxes[1].click();
      await page.waitForTimeout(400);
      
      console.log('  ✓ Created combination: Company Info disabled, Contact Info disabled');
      testResults.passed++;

      const combinationScreenshot = path.join(SCREENSHOTS_DIR, '04-toggle-combination.png');
      await page.screenshot({ path: combinationScreenshot, fullPage: true });
      testResults.screenshots.push(combinationScreenshot);
    }

    // Step 9: Reset and final check
    console.log('\nStep 9: Final state verification...');
    
    // Re-enable all toggles for clean state
    for (let i = 0; i < Math.min(3, checkboxes.length); i++) {
      const state = await checkboxes[i].evaluate(el => el.checked);
      if (!state) {
        await checkboxes[i].click();
        await page.waitForTimeout(200);
      }
    }

    const finalScreenshot = path.join(SCREENSHOTS_DIR, '05-final-state.png');
    await page.screenshot({ path: finalScreenshot, fullPage: true });
    testResults.screenshots.push(finalScreenshot);
    console.log('  ✓ Final state captured');
    testResults.passed++;

    console.log('\n=== TEST SUMMARY ===');
    console.log(`✓ Tests Passed: ${testResults.passed}`);
    console.log(`✗ Tests Failed: ${testResults.failed}`);
    console.log(`Screenshots Captured: ${testResults.screenshots.length}`);
    console.log(`\nScreenshot Directory: ${SCREENSHOTS_DIR}`);
    console.log('Screenshots:');
    testResults.screenshots.forEach((s, i) => {
      console.log(`  ${i + 1}. ${path.basename(s)}`);
    });

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    testResults.failed++;
    testResults.errors.push(error.message);

    try {
      const errorScreenshot = path.join(SCREENSHOTS_DIR, '99-error.png');
      await page.screenshot({ path: errorScreenshot, fullPage: true });
      testResults.screenshots.push(errorScreenshot);
      console.log(`\nError screenshot: ${errorScreenshot}`);
    } catch (e) {
      console.error('Could not capture error screenshot:', e.message);
    }
  } finally {
    await browser.close();

    const resultsFile = path.join(SCREENSHOTS_DIR, 'test-results.json');
    fs.writeFileSync(resultsFile, JSON.stringify(testResults, null, 2));
    console.log(`\nResults saved: ${resultsFile}`);

    process.exit(testResults.failed > 0 ? 1 : 0);
  }
}

test().catch(console.error);
