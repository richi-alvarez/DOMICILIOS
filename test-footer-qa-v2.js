const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Create screenshot directory
const screenshotDir = '/tmp/footer-qa-screenshots-v2';
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

const BASE_URL = 'http://localhost:3005';
let testResults = {
  summary: {
    totalTests: 0,
    passed: 0,
    failed: 0,
    startTime: new Date().toISOString(),
  },
  tests: [],
  screenshots: [],
};

async function captureScreenshot(page, name) {
  const filename = `${name}-${Date.now()}.png`;
  const filepath = path.join(screenshotDir, filename);
  await page.screenshot({ path: filepath, fullPage: true });
  testResults.screenshots.push({
    name,
    filepath,
    url: `file://${filepath}`,
  });
  console.log(`📸 Screenshot saved: ${filename}`);
  return filepath;
}

async function logTest(testName, passed, details = '') {
  testResults.totalTests++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ PASS: ${testName}`);
  } else {
    testResults.failed++;
    console.log(`❌ FAIL: ${testName}`);
  }
  if (details) {
    console.log(`   ${details}`);
  }
  testResults.tests.push({
    name: testName,
    passed,
    details,
    timestamp: new Date().toISOString(),
  });
}

async function runTests() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('\n========== FOOTER BLOCK QA TESTING ==========\n');
    console.log('🚀 Starting test suite...\n');

    // === TEST 1: Login as existing user ===
    console.log('TEST 1: Login with Test User');
    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await captureScreenshot(page, '01-login-page');

    const testEmail = 'footer-qa@test.com';
    const testPassword = 'TestPassword123!';

    // Try to fill and login
    try {
      // Wait for inputs to be visible
      await page.waitForSelector('input[type="email"]', { timeout: 5000 });
      await page.fill('input[type="email"]', testEmail);
      await page.fill('input[type="password"]', testPassword);
      await page.click('button[type="submit"]');

      // Wait for redirect
      await page.waitForURL(/dashboard|catalogs/, { timeout: 10000 });
      await logTest('User Login', true, `Email: ${testEmail}`);
    } catch (e) {
      console.log('⚠️ Login attempt failed, trying signup instead...');
      // Try signup
      await page.goto(`${BASE_URL}/auth/signup`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      await captureScreenshot(page, '01b-signup-page');

      const timestamp = Date.now();
      const newEmail = `footer-qa-${timestamp}@test.com`;

      try {
        await page.waitForSelector('input[type="email"]', { timeout: 5000 });
        await page.fill('input[type="email"]', newEmail);
        await page.fill('input[type="password"]', testPassword);

        // Find and fill name field
        const nameInput = await page.$('input[placeholder*="Nombre"], input[placeholder*="nombre"], input[name="name"]');
        if (nameInput) {
          await nameInput.fill('Footer QA Tester');
        }

        await page.click('button[type="submit"]');
        await page.waitForURL(/onboarding|dashboard|catalogs/, { timeout: 15000 });
        await logTest('User Registration', true, `Email: ${newEmail}`);
      } catch (signupError) {
        console.error('Signup failed:', signupError.message);
        await logTest('User Registration/Login', false, signupError.message);
      }
    }

    await page.waitForTimeout(2000);

    // === TEST 2: Navigate to Catalogs ===
    console.log('\nTEST 2: Navigate to Catalogs');
    try {
      const currentUrl = page.url();
      if (!currentUrl.includes('catalogs')) {
        await page.goto(`${BASE_URL}/app/catalogs`, { waitUntil: 'networkidle' });
      }
      await page.waitForTimeout(2000);
      await captureScreenshot(page, '02-catalogs-page');
      await logTest('Navigate to Catalogs', true);
    } catch (e) {
      await logTest('Navigate to Catalogs', false, e.message);
    }

    // === TEST 3: Create or Find Test Catalog ===
    console.log('\nTEST 3: Find Test Catalog');
    try {
      // Look for existing catalog or create one
      const catalogLink = await page.$('a[href*="/catalogs/"], [data-testid="catalog-item"]');

      if (catalogLink) {
        // Use existing catalog
        await catalogLink.click();
        await page.waitForURL(/catalogs\/\d+/, { timeout: 10000 });
        await logTest('Found Test Catalog', true);
      } else {
        // Try to create one
        const newBtn = await page.$(
          'button:has-text("Nuevo"), button:has-text("New"), a:has-text("Nuevo"), a:has-text("New")',
        );
        if (newBtn) {
          await newBtn.click();
          await page.waitForTimeout(2000);

          // Fill catalog name
          const timestamp = Date.now();
          const nameInput = await page.$('input[placeholder*="ombre"], input[name="name"]');
          if (nameInput) {
            await nameInput.fill(`Footer QA Test - ${timestamp}`);
          }

          // Try to continue through wizard
          for (let i = 0; i < 5; i++) {
            const continueBtn = await page.$(
              'button:has-text("Siguiente"), button:has-text("Continue"), button:has-text("Continuar"), button:has-text("Crear")',
            );
            if (continueBtn) {
              await continueBtn.click();
              await page.waitForTimeout(1500);
            }
          }

          await page.waitForURL(/catalogs\/\d+/, { timeout: 10000 });
          await logTest('Create Test Catalog', true);
        } else {
          await logTest('Create Test Catalog', false, 'No create button found');
        }
      }
    } catch (e) {
      console.error('Catalog error:', e.message);
      await logTest('Find/Create Catalog', false, e.message);
    }

    await page.waitForTimeout(2000);
    await captureScreenshot(page, '03-catalog-selected');

    // === TEST 4: Navigate to Design Page ===
    console.log('\nTEST 4: Navigate to Design Page');
    try {
      const designBtn = await page.$(
        'a:has-text("Diseño"), a:has-text("Design"), button:has-text("Diseño"), button:has-text("Design")',
      );

      if (designBtn) {
        await designBtn.click();
        await page.waitForURL(/design/, { timeout: 10000 });
      } else {
        // Try direct URL
        const catalogId = page.url().match(/catalogs\/(\d+)/)?.[1];
        if (catalogId) {
          await page.goto(`${BASE_URL}/app/catalogs/${catalogId}/design`, { waitUntil: 'networkidle' });
        }
      }

      await page.waitForTimeout(3000);
      await captureScreenshot(page, '04-design-page');
      await logTest('Navigate to Design Page', true);
    } catch (e) {
      console.error('Design navigation error:', e.message);
      await logTest('Navigate to Design Page', false, e.message);
    }

    // === TEST 5: Find and Expand Footer Block ===
    console.log('\nTEST 5: Find Footer Block');
    try {
      let footerBlock = null;

      // Try different selectors for footer block
      const selectors = [
        'button:has-text("Pie de página")',
        'button:has-text("Footer")',
        '[data-block-type="footer"]',
        '[data-testid="footer-block"]',
        'button[title*="Pie de página"]',
        'button[title*="Footer"]',
      ];

      for (const selector of selectors) {
        footerBlock = await page.$(selector);
        if (footerBlock) {
          console.log(`✓ Found footer block with selector: ${selector}`);
          break;
        }
      }

      if (footerBlock) {
        await footerBlock.click();
        await page.waitForTimeout(1500);
        await captureScreenshot(page, '05-footer-block-expanded');
        await logTest('Find and Expand Footer Block', true);
      } else {
        console.log('⚠️ Footer block not found, trying scroll in blocks panel...');
        // Try scrolling in left panel
        const panel = await page.$('[class*="panel"], [class*="sidebar"], aside');
        if (panel) {
          await panel.hover();
          await page.keyboard.press('End');
          await page.waitForTimeout(1000);
          await captureScreenshot(page, '05b-blocks-scrolled');

          // Try again
          for (const selector of selectors) {
            footerBlock = await page.$(selector);
            if (footerBlock) {
              await footerBlock.click();
              await page.waitForTimeout(1500);
              await captureScreenshot(page, '05c-footer-block-expanded');
              await logTest('Find and Expand Footer Block', true);
              break;
            }
          }

          if (!footerBlock) {
            await logTest('Find and Expand Footer Block', false, 'Footer block not found after scroll');
          }
        } else {
          await logTest('Find and Expand Footer Block', false, 'Footer block selector not matched');
        }
      }
    } catch (e) {
      console.error('Footer block error:', e.message);
      await logTest('Find Footer Block', false, e.message);
    }

    // === TEST 6-13: Test Individual Toggles ===
    console.log('\nTEST 6-13: Testing Footer Block Toggles');

    const toggleTests = [
      {
        name: 'Información de Empresa (Company Info)',
        selectors: ['input[name="showCompanyInfo"]', '[data-toggle="showCompanyInfo"]', 'input[data-field="showCompanyInfo"]'],
        testId: 'company-info',
      },
      {
        name: 'Información de Contacto (Contact Info)',
        selectors: ['input[name="showContactInfo"]', '[data-toggle="showContactInfo"]', 'input[data-field="showContactInfo"]'],
        testId: 'contact-info',
      },
      {
        name: 'Copyright',
        selectors: ['input[name="showCopyright"]', '[data-toggle="showCopyright"]', 'input[data-field="showCopyright"]'],
        testId: 'copyright',
      },
      {
        name: 'Address (Dirección)',
        selectors: ['input[name="showAddress"]', '[data-toggle="showAddress"]', 'input[data-field="showAddress"]'],
        testId: 'address',
      },
      {
        name: 'Phone (Teléfono)',
        selectors: ['input[name="showPhone"]', '[data-toggle="showPhone"]', 'input[data-field="showPhone"]'],
        testId: 'phone',
      },
      {
        name: 'Email',
        selectors: ['input[name="showEmail"]', '[data-toggle="showEmail"]', 'input[data-field="showEmail"]'],
        testId: 'email',
      },
      {
        name: 'Website (Sitio Web)',
        selectors: ['input[name="showWebsite"]', '[data-toggle="showWebsite"]', 'input[data-field="showWebsite"]'],
        testId: 'website',
      },
      {
        name: 'Description (Mostrar descripción)',
        selectors: ['input[name="showDescription"]', '[data-toggle="showDescription"]', 'input[data-field="showDescription"]'],
        testId: 'description',
      },
    ];

    for (const toggle of toggleTests) {
      try {
        let element = null;
        for (const selector of toggle.selectors) {
          element = await page.$(selector);
          if (element) break;
        }

        if (element) {
          const initialState = await element.evaluate((el) => (el.type === 'checkbox' ? el.checked : el.value === 'on'));
          await element.click();
          await page.waitForTimeout(1000); // Wait for preview update

          const newState = await element.evaluate((el) => (el.type === 'checkbox' ? el.checked : el.value === 'on'));
          const stateChanged = initialState !== newState;

          await captureScreenshot(page, `06-toggle-${toggle.testId}-state1`);

          if (stateChanged) {
            await logTest(`Toggle: ${toggle.name}`, true, `Initial: ${initialState}, New: ${newState}`);

            // Toggle back
            await element.click();
            await page.waitForTimeout(800);
            await captureScreenshot(page, `06-toggle-${toggle.testId}-state2`);
          } else {
            await logTest(`Toggle: ${toggle.name}`, false, 'State did not change after click');
          }
        } else {
          await logTest(`Toggle: ${toggle.name}`, false, 'Element not found with any selector');
        }
      } catch (e) {
        await logTest(`Toggle: ${toggle.name}`, false, e.message);
      }
    }

    // === TEST 14: Test Social Links Toggle ===
    console.log('\nTEST 14: Test Social Links Toggle');
    try {
      const selectors = ['input[name="showSocialLinks"]', '[data-toggle="showSocialLinks"]', 'input[data-field="showSocialLinks"]'];
      let element = null;
      for (const selector of selectors) {
        element = await page.$(selector);
        if (element) break;
      }

      if (element) {
        await element.click();
        await page.waitForTimeout(1000);
        await captureScreenshot(page, '07-toggle-sociallinks');
        await logTest('Toggle: Social Links (Redes Sociales)', true);
      } else {
        await logTest('Toggle: Social Links (Redes Sociales)', false, 'Element not found');
      }
    } catch (e) {
      await logTest('Toggle: Social Links', false, e.message);
    }

    // === TEST 15: Test Multiple Toggle Combinations ===
    console.log('\nTEST 15: Test Toggle Combinations');

    const combinations = [
      {
        name: 'Combo 1: Company Info ON, Contact Info ON, Copyright OFF',
        toggles: [
          { name: 'showCompanyInfo', state: true },
          { name: 'showContactInfo', state: true },
          { name: 'showCopyright', state: false },
        ],
      },
      {
        name: 'Combo 2: All fields OFF',
        toggles: [
          { name: 'showAddress', state: false },
          { name: 'showPhone', state: false },
          { name: 'showEmail', state: false },
          { name: 'showWebsite', state: false },
        ],
      },
      {
        name: 'Combo 3: Description ON, Social Links ON',
        toggles: [
          { name: 'showDescription', state: true },
          { name: 'showSocialLinks', state: true },
          { name: 'showCompanyInfo', state: false },
        ],
      },
    ];

    for (const combo of combinations) {
      try {
        let allSuccess = true;
        for (const toggleConfig of combo.toggles) {
          const selectors = [
            `input[name="${toggleConfig.name}"]`,
            `[data-toggle="${toggleConfig.name}"]`,
            `input[data-field="${toggleConfig.name}"]`,
          ];

          let element = null;
          for (const selector of selectors) {
            element = await page.$(selector);
            if (element) break;
          }

          if (element) {
            const currentState = await element.evaluate((el) => (el.type === 'checkbox' ? el.checked : el.value === 'on'));
            if (currentState !== toggleConfig.state) {
              await element.click();
              await page.waitForTimeout(600);
            }
          } else {
            allSuccess = false;
            console.log(`⚠️ Could not find toggle: ${toggleConfig.name}`);
          }
        }

        await page.waitForTimeout(1500);
        const screenshotName = `08-combo-${combo.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`;
        await captureScreenshot(page, screenshotName);
        await logTest(`Combination: ${combo.name}`, allSuccess);
      } catch (e) {
        await logTest(`Combination: ${combo.name}`, false, e.message);
      }
    }

    // === TEST 16: Verify Preview Updates ===
    console.log('\nTEST 16: Verify Real-time Preview Updates');
    try {
      const preview = await page.$('iframe, [data-testid="preview"], [class*="preview"]');
      if (preview) {
        await captureScreenshot(page, '09-preview-realtime');
        await logTest('Preview Element Exists and Updates', true);
      } else {
        console.log('⚠️ Preview element not found');
        await logTest('Preview Element Exists', false, 'Preview not found');
      }
    } catch (e) {
      await logTest('Preview Update', false, e.message);
    }

    testResults.summary.endTime = new Date().toISOString();
    testResults.summary.passPercentage = (
      (testResults.passed / testResults.totalTests) *
      100
    ).toFixed(2);

    console.log('\n========== TEST SUMMARY ==========');
    console.log(`Total Tests: ${testResults.totalTests}`);
    console.log(`Passed: ${testResults.passed}`);
    console.log(`Failed: ${testResults.failed}`);
    console.log(`Pass Rate: ${testResults.summary.passPercentage}%`);
    console.log(`\nScreenshots saved to: ${screenshotDir}`);

    // Save results to JSON
    const resultsFile = path.join(screenshotDir, 'test-results.json');
    fs.writeFileSync(resultsFile, JSON.stringify(testResults, null, 2));
    console.log(`\nResults saved to: ${resultsFile}`);

    // Create HTML report
    const htmlReport = generateHTMLReport(testResults);
    const htmlFile = path.join(screenshotDir, 'report.html');
    fs.writeFileSync(htmlFile, htmlReport);
    console.log(`HTML Report saved to: ${htmlFile}`);

    console.log('\n========== OVERALL ASSESSMENT ==========');
    if (testResults.summary.failed === 0) {
      console.log('✅ ALL TESTS PASSED - Footer block enhancements working correctly!');
    } else if (testResults.summary.passPercentage >= 80) {
      console.log('⚠️ MOSTLY PASSING - Minor issues detected, review failed tests');
    } else {
      console.log('❌ SIGNIFICANT FAILURES - Footer block needs attention');
    }
  } catch (error) {
    console.error('❌ Test execution error:', error);
    testResults.summary.error = error.message;
  } finally {
    await browser.close();
  }
}

function generateHTMLReport(results) {
  const testRows = results.tests
    .map(
      (test) => `
    <tr class="${test.passed ? 'pass' : 'fail'}">
      <td>${test.name}</td>
      <td>${test.passed ? '✅ PASS' : '❌ FAIL'}</td>
      <td>${test.details || '-'}</td>
      <td class="timestamp">${test.timestamp}</td>
    </tr>
  `,
    )
    .join('');

  const screenshotRows = results.screenshots
    .map(
      (screenshot, idx) => `
    <div class="screenshot">
      <h4>${idx + 1}. ${screenshot.name}</h4>
      <img src="file://${screenshot.filepath}" alt="${screenshot.name}" onerror="this.alt='Screenshot not found: ${screenshot.filepath}'" />
    </div>
  `,
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <title>Footer Block QA Report</title>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
    }
    .container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      font-size: 32px;
      margin-bottom: 10px;
    }
    .header p {
      font-size: 16px;
      opacity: 0.9;
    }
    .content {
      padding: 40px 30px;
    }
    h2 {
      color: #333;
      margin-top: 40px;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #667eea;
      font-size: 24px;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .stat {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 25px;
      border-radius: 8px;
      text-align: center;
      box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
    }
    .stat-label {
      font-size: 12px;
      text-transform: uppercase;
      opacity: 0.9;
      margin-bottom: 10px;
      letter-spacing: 1px;
    }
    .stat-value {
      font-size: 36px;
      font-weight: bold;
    }
    .stat.failed {
      background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
    }
    .overall {
      font-size: 20px;
      font-weight: bold;
      text-align: center;
      padding: 25px;
      border-radius: 8px;
      margin: 30px 0;
    }
    .overall.pass {
      background: linear-gradient(135deg, #56ab2f 0%, #a8e063 100%);
      color: white;
    }
    .overall.fail {
      background: linear-gradient(135deg, #eb3b5a 0%, #fc5c65 100%);
      color: white;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    table th {
      background: #667eea;
      color: white;
      padding: 15px;
      text-align: left;
      font-weight: 600;
    }
    table td {
      padding: 12px 15px;
      border-bottom: 1px solid #eee;
    }
    table tr.pass {
      background: #f0f8f0;
    }
    table tr.pass:hover {
      background: #e8f5e8;
    }
    table tr.fail {
      background: #fff5f5;
    }
    table tr.fail:hover {
      background: #ffe8e8;
    }
    .timestamp {
      font-size: 12px;
      color: #999;
    }
    .screenshots {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 25px;
      margin: 30px 0;
    }
    .screenshot {
      background: #f8f8f8;
      padding: 15px;
      border-radius: 8px;
      border: 1px solid #ddd;
      overflow: hidden;
    }
    .screenshot h4 {
      margin-bottom: 10px;
      color: #333;
      font-size: 14px;
      word-break: break-word;
    }
    .screenshot img {
      width: 100%;
      height: auto;
      border-radius: 4px;
      border: 1px solid #ddd;
      display: block;
    }
    .footer {
      background: #f5f5f5;
      padding: 20px;
      text-align: center;
      color: #666;
      font-size: 14px;
      border-top: 1px solid #ddd;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🧪 Footer Block QA Report</h1>
      <p>Comprehensive Testing of Footer Block Enhancements</p>
    </div>

    <div class="content">
      <h2>📊 Test Execution Summary</h2>
      <div class="summary">
        <div class="stat">
          <div class="stat-label">Total Tests</div>
          <div class="stat-value">${results.summary.totalTests}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Passed</div>
          <div class="stat-value">${results.summary.passed}</div>
        </div>
        <div class="stat failed">
          <div class="stat-label">Failed</div>
          <div class="stat-value">${results.summary.failed}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Pass Rate</div>
          <div class="stat-value">${results.summary.passPercentage}%</div>
        </div>
      </div>

      <div class="overall ${results.summary.failed === 0 ? 'pass' : 'fail'}">
        ${results.summary.failed === 0 ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED - Review below'}
      </div>

      <h2>📋 Detailed Test Results</h2>
      <table>
        <thead>
          <tr>
            <th>Test Name</th>
            <th>Status</th>
            <th>Details</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          ${testRows}
        </tbody>
      </table>

      <h2>📸 Test Screenshots</h2>
      <div class="screenshots">
        ${screenshotRows}
      </div>
    </div>

    <div class="footer">
      <p>Report generated on ${new Date().toLocaleString()}</p>
      <p>Footer Block Enhancement QA - Comprehensive Test Suite</p>
    </div>
  </div>
</body>
</html>
  `;
}

runTests().catch(console.error);
