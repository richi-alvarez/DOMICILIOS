const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('1. Going to /login...');
  await page.goto('http://localhost:3005/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  
  await page.screenshot({ path: '/tmp/login-page.png' });
  console.log('Login page screenshot saved');
  
  // Try to find and fill email input
  const emailInputs = await page.locator('input[name="email"], input[placeholder*="email" i], input[placeholder*="correo" i]').all();
  console.log('Email inputs found:', emailInputs.length);
  
  if (emailInputs.length > 0) {
    console.log('2. Found email input, filling...');
    await emailInputs[0].fill('ric.salda.94@gmail.com');
    
    // Find password input
    const passwordInputs = await page.locator('input[name="password"], input[type="password"]').all();
    if (passwordInputs.length > 0) {
      console.log('3. Found password input, filling...');
      await passwordInputs[0].fill('Test@1234');
      
      // Find login button
      const loginBtn = await page.locator('button:has-text("Iniciar"), button:has-text("Login"), button:has-text("Sign in")').first();
      if (loginBtn) {
        console.log('4. Found login button, clicking...');
        await loginBtn.click();
        
        // Wait for navigation
        await page.waitForURL('**/app/**', { timeout: 15000 });
        console.log('5. Logged in, navigating...');
        
        // Go to catalogs
        await page.goto('http://localhost:3005/app/catalogs');
        await page.waitForLoadState('networkidle');
        
        await page.screenshot({ path: '/tmp/catalogs-dashboard.png' });
        console.log('Catalogs dashboard screenshot saved');
        
        // Try to find and click first catalog
        const catalogItems = await page.locator('[data-testid*="catalog"], a[href*="/catalogs/"]').all();
        console.log('Catalog items found:', catalogItems.length);
        
        if (catalogItems.length > 0) {
          const firstCatalogLink = catalogItems[0];
          const href = await firstCatalogLink.getAttribute('href');
          console.log('6. Opening first catalog:', href);
          
          if (href) {
            await page.goto(`http://localhost:3005${href}`);
            await page.waitForLoadState('networkidle');
            
            await page.screenshot({ path: '/tmp/catalog-view.png' });
            console.log('Catalog view screenshot saved');
            
            // Click design tab/button
            const designBtn = await page.locator('a[href*="/design"], button:has-text("Diseño"), a:has-text("Diseño")').first();
            if (designBtn) {
              console.log('7. Clicking design button...');
              await designBtn.click();
              await page.waitForLoadState('networkidle');
              
              await page.screenshot({ path: '/tmp/design-editor.png', fullPage: true });
              console.log('Design editor screenshot saved - SUCCESS!');
            }
          }
        }
      }
    }
  } else {
    console.log('Could not find email input on this page');
  }
  
  console.log('\nDone! Browser still open.');
  
})().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
