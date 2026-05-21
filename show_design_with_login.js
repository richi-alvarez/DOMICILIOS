const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('1. Navigating to login...');
  await page.goto('http://localhost:3005/auth/login');
  await page.waitForLoadState('networkidle');
  
  // Fill login form
  console.log('2. Logging in...');
  await page.fill('input[type="email"]', 'ric.salda.94@gmail.com');
  await page.fill('input[type="password"]', 'Test@1234');
  
  // Click login button
  await page.click('button:has-text("Iniciar Sesión")');
  
  // Wait for redirect and navigation
  await page.waitForURL('**/app/**', { timeout: 10000 });
  await page.waitForLoadState('networkidle');
  
  console.log('3. Navigating to catalogs...');
  await page.goto('http://localhost:3005/app/catalogs');
  await page.waitForLoadState('networkidle');
  
  await page.screenshot({ path: '/tmp/catalogs-list.png' });
  console.log('Catalogs list screenshot saved');
  
  // Get all catalog rows/items
  const catalogLinks = await page.locator('a[href*="/catalogs/"], button:has-text("Ver"), [data-testid*="catalog"]').all();
  console.log('Found catalog links:', catalogLinks.length);
  
  if (catalogLinks.length > 0) {
    // Try to click first catalog
    const firstLink = await page.locator('a[href*="/catalogs/"], div:has-text("Design")').first();
    const href = await firstLink.getAttribute('href');
    
    if (href) {
      console.log('4. Opening catalog:', href);
      await page.goto(`http://localhost:3005${href}`);
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: '/tmp/catalog-detail.png' });
      console.log('Catalog detail screenshot saved');
      
      // Look for design button
      const designButton = await page.locator('button, a', { hasText: /Design|Diseño/ }).first();
      if (designButton) {
        await designButton.click();
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: '/tmp/design-page.png', fullPage: true });
        console.log('Design page screenshot saved');
      }
    }
  }
  
  console.log('5. Done. Browser still open for inspection.');
  
})().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
