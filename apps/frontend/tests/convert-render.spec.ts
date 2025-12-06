import { test, expect } from '@playwright/test';

test.describe('Convert Page Render Test', () => {
  test('should render convert page with all components', async ({ page }) => {
    // Capture console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Navigate to convert page
    await page.goto('http://localhost:5173/convert');
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Wait for client-side rendering
    await page.waitForSelector('h1', { timeout: 5000 });
    
    // Check main elements
    const heading = await page.textContent('h1');
    console.log('Heading:', heading);
    
    // Look for any drop zone element
    const dropZones = await page.locator('[class*="drop"], [class*="Drop"], [id*="drop"], [id*="Drop"]').all();
    console.log('Found potential drop zones:', dropZones.length);
    
    // Check for file input
    const fileInputs = await page.locator('input[type="file"]').all();
    console.log('File inputs found:', fileInputs.length);
    
    // Log any console errors
    if (consoleErrors.length > 0) {
      console.log('Console errors:', consoleErrors);
    }
    
    // Check page structure
    const fileConvertPage = await page.locator('.file-convert-page');
    const pageVisible = await fileConvertPage.isVisible();
    console.log('File convert page visible:', pageVisible);
    
    // Check for drop zone
    const dropZone = await page.locator('.drop-zone');
    const dropZoneVisible = await dropZone.isVisible();
    console.log('Drop zone visible:', dropZoneVisible);
    
    // Check if loading message is gone
    const loadingGone = await page.locator('.loading').count() === 0;
    console.log('Loading message gone:', loadingGone);
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/convert-render.png', fullPage: true });
    
    // Expect the page to have loaded properly
    expect(heading).toBeTruthy();
    expect(pageVisible).toBe(true);
    expect(dropZoneVisible).toBe(true);
  });
});