const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('Navigating to home...');
  await page.goto('http://localhost:3005', { waitUntil: 'domcontentloaded' });
  
  // Wait a bit for any redirects
  await page.waitForTimeout(2000);
  
  // Get current URL
  const url = page.url();
  console.log('Current URL:', url);
  
  // Get all links
  const links = await page.locator('a').all();
  console.log(`Found ${links.length} links`);
  
  for (let i = 0; i < Math.min(10, links.length); i++) {
    const href = await links[i].getAttribute('href');
    const text = await links[i].textContent();
    console.log(`  Link ${i}: "${text}" -> ${href}`);
  }
  
  await page.screenshot({ path: '/tmp/home-page.png' });
  console.log('Screenshot saved: /tmp/home-page.png');
  
  console.log('\nBrowser open for inspection.');
  
})().catch(console.error);
