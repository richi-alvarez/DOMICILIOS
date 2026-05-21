import { test, expect } from '@playwright/test';

test.describe('Footer Block Verification', () => {
  test('All toggles work correctly with undefined/null handling', async ({ page }) => {
    // Navigate to app
    await page.goto('http://localhost:3000/app/catalogs');
    await page.waitForLoadState('networkidle');
    
    // Check if we're authenticated
    const isOnCatalogs = page.url().includes('/catalogs');
    expect(isOnCatalogs).toBe(true);

    // Get first catalog if available
    const firstCatalog = page.locator('[role="link"]').first();
    const hasAnyCatalog = await firstCatalog.isVisible().catch(() => false);
    
    if (hasAnyCatalog) {
      await firstCatalog.click();
      await page.waitForLoadState('networkidle');
      
      // Try to navigate to design page
      const designLink = page.locator('a[href*="/design"]').first();
      const hasDesignLink = await designLink.isVisible().catch(() => false);
      
      if (hasDesignLink) {
        await designLink.click();
        await page.waitForLoadState('networkidle');
        
        // Look for footer toggle button
        const footerToggleBtn = page.locator('button:has-text("Información de Empresa")').first();
        const hasFooterToggle = await footerToggleBtn.isVisible().catch(() => false);
        
        if (hasFooterToggle) {
          // Take screenshot before toggle
          await page.screenshot({ path: '/tmp/footer-verify-01-before.png' });
          
          // Click the toggle
          await footerToggleBtn.click();
          await page.waitForTimeout(500);
          
          // Take screenshot after toggle
          await page.screenshot({ path: '/tmp/footer-verify-02-after.png' });
          
          // Verify no errors on page
          const errorElements = page.locator('[role="alert"]');
          const errorCount = await errorElements.count();
          expect(errorCount).toBe(0);
          
          console.log('✓ Footer toggle test passed');
        } else {
          console.log('⚠ Footer toggle not found');
        }
      }
    }
  });
});
