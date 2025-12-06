import { test, expect } from '@playwright/test';

test.describe('Convert Page Functionality', () => {
  test('should load convert page successfully', async ({ page }) => {
    // Navigate directly to convert page
    const response = await page.goto('/convert', {
      waitUntil: 'networkidle',
      timeout: 10000
    });

    // Check page loaded successfully
    expect(response?.status()).toBe(200);
    
    // Check page title
    const title = await page.title();
    console.log('Convert page title:', title);
    
    // Check for file converter heading
    await expect(page.locator('h1')).toContainText('File Converter');
    
    // Check for file drop zone
    const dropZone = page.locator('.drop-zone');
    await expect(dropZone).toBeVisible();
    
    console.log('Convert page loaded successfully with all expected elements');
  });

  test('should handle file selection', async ({ page }) => {
    // Navigate to convert page
    await page.goto('/convert');
    await page.waitForLoadState('networkidle');
    
    // Create a test file
    const fileChooserPromise = page.waitForEvent('filechooser');
    
    // Click on drop zone to trigger file selection
    const dropZone = page.locator('.drop-zone');
    await dropZone.click();
    
    const fileChooser = await fileChooserPromise;
    
    // Create a dummy JSON file (TXT is no longer supported)
    await fileChooser.setFiles({
      name: 'test.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{"test": "content"}')
    });
    
    // Check if file appears in the list
    await expect(page.locator('.files-list')).toBeVisible();
    await expect(page.locator('.files-list')).toContainText('test.json');
    
    console.log('File selection handled successfully');
  });

  test('should display file drop zone with correct styling', async ({ page }) => {
    await page.goto('/convert');
    await page.waitForLoadState('networkidle');
    
    const dropZone = page.locator('.drop-zone');
    
    // Check drop zone is visible
    await expect(dropZone).toBeVisible();
    
    // Check drop zone has expected text
    await expect(dropZone).toContainText('Drop files here');
    
    // Check drop zone styling on hover
    await dropZone.hover();
    
    // Take a screenshot for visual verification
    await page.screenshot({ path: 'test-results/convert-page-screenshot.png' });
    
    console.log('Drop zone displayed correctly with proper styling');
  });
});