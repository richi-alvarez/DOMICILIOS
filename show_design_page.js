const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Navigate to catalogs page
  await page.goto('http://localhost:3005/app/catalogs');
  await page.waitForLoadState('networkidle');
  
  // Take screenshot
  await page.screenshot({ path: '/tmp/catalogs-list.png' });
  console.log('Screenshot saved: /tmp/catalogs-list.png');
  
  // Get first catalog link
  const firstCatalog = await page.locator('[data-testid="catalog-item"], a[href*="/catalogs/"]').first();
  const href = await firstCatalog.getAttribute('href');
  console.log('First catalog link:', href);
  
  if (href) {
    // Navigate to catalog detail
    await page.goto(`http://localhost:3005${href}`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: '/tmp/catalog-detail.png' });
    console.log('Catalog detail screenshot: /tmp/catalog-detail.png');
    
    // Click design button/link
    const designLink = await page.locator('a[href*="/design"], button:has-text("Diseño")').first();
    if (designLink) {
      await designLink.click();
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: '/tmp/design-page.png' });
      console.log('Design page screenshot: /tmp/design-page.png');
    }
  }
  
  await browser.close();
})().catch(console.error);
