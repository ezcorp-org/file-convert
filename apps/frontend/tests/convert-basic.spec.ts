import { test, expect } from '@playwright/test';

test.describe('Convert Page Basic Tests', () => {
  test('convert page loads without error', async ({ page }) => {
    const response = await page.goto('/convert');
    
    // Page should load with 200 status
    expect(response?.status()).toBe(200);
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/convert-page-loaded.png', fullPage: true });
    
    // Wait for any client-side rendering
    await page.waitForTimeout(2000);
    
    // Check if page has any content
    const bodyText = await page.textContent('body');
    console.log('Page body content:', bodyText?.substring(0, 200));
    
    // Check for basic elements
    const hasH1 = await page.locator('h1').count();
    console.log('H1 elements found:', hasH1);
    
    // Log page title
    const title = await page.title();
    console.log('Page title:', title || '(empty)');
  });
});