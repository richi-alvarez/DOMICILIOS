const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3005/auth/login');
  await page.waitForLoadState('domcontentloaded');
  
  // Get all inputs and buttons
  const inputs = await page.locator('input').all();
  const buttons = await page.locator('button').all();
  
  console.log('Inputs found:', inputs.length);
  for (let i = 0; i < inputs.length; i++) {
    const type = await inputs[i].getAttribute('type');
    const placeholder = await inputs[i].getAttribute('placeholder');
    const name = await inputs[i].getAttribute('name');
    console.log(`  Input ${i}: type=${type}, name=${name}, placeholder=${placeholder}`);
  }
  
  console.log('\nButtons found:', buttons.length);
  for (let i = 0; i < buttons.length; i++) {
    const text = await buttons[i].textContent();
    console.log(`  Button ${i}: "${text}"`);
  }
  
  // Take screenshot to see what we're working with
  await page.screenshot({ path: '/tmp/login-form-structure.png' });
  console.log('\nScreenshot saved: /tmp/login-form-structure.png');
  
  // Don't close browser
  console.log('Browser open. Press Ctrl+C to close.');
  
})().catch(console.error);
