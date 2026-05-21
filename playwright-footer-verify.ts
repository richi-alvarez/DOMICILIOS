import { test, expect } from '@playwright/test';

test.describe('Footer Block QA', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
  });

  test('Footer toggles test', async ({ page }) => {
    // Navigate to catalogs
    await page.goto('http://localhost:3000/app/catalogs');
    await page.waitForLoadState('networkidle');
    
    // Get first catalog
    const catalogLink = page.locator('[role="link"]').first();
    const catalogExists = await catalogLink.isVisible().catch(() => false);
    
    if (catalogExists) {
      await catalogLink.click();
      await page.waitForLoadState('networkidle');
    }
  });
});
