import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('http://localhost:3000/login');
  console.log('✅ Navegador Chrome ABIERTO EN MODO VISIBLE');
  console.log('URL: http://localhost:3000/login');
  console.log('El navegador está visible en tu pantalla');
  // Mantener abierto indefinidamente
  await new Promise(() => {});
})();
