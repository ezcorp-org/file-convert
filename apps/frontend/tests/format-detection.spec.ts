import { test, expect } from '@playwright/test';

test.describe('Format Detection and Dropdown', () => {
  test('should show format section when files array has items', async ({ page }) => {
    await page.goto('/convert');
    await page.waitForSelector('h1');
    
    // Directly manipulate the files array via JavaScript
    await page.evaluate(() => {
      // Find the Svelte component instance
      const dropZone = document.querySelector('.drop-zone');
      if (dropZone) {
        // Create a fake file
        const file = new File(['test content'], 'test.png', { type: 'image/png' });
        
        // Dispatch the files event directly
        const event = new CustomEvent('files', { 
          detail: [file],
          bubbles: true 
        });
        dropZone.dispatchEvent(event);
      }
    });
    
    // Check if files section appears
    const filesSection = await page.locator('.files-section');
    const isVisible = await filesSection.isVisible();
    console.log('Files section visible:', isVisible);
    
    if (isVisible) {
      // Check if format section appears
      const formatSection = await page.locator('.format-section');
      const formatVisible = await formatSection.isVisible();
      console.log('Format section visible:', formatVisible);
      
      if (formatVisible) {
        // Check dropdown content
        const dropdown = await page.locator('select.format-dropdown');
        const options = await dropdown.locator('option').allTextContents();
        console.log('Dropdown options:', options);
      }
    }
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/format-detection.png', fullPage: true });
  });
  
  test('manual file upload flow', async ({ page }) => {
    await page.goto('/convert');
    await page.waitForSelector('h1');
    
    // Enable console logging
    page.on('console', msg => {
      console.log(`${msg.type()}: ${msg.text()}`);
    });
    
    // Wait for drop zone
    await page.waitForSelector('.drop-zone');
    
    // Create a real file buffer
    const pngHeader = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    const pngData = Buffer.concat([pngHeader, Buffer.from('fake png data')]);
    
    // Upload file
    await page.setInputFiles('input[type="file"]', {
      name: 'real-test.png',
      mimeType: 'image/png',
      buffer: pngData
    });
    
    // Wait a bit for processing
    await page.waitForTimeout(1000);
    
    // Check what's visible
    const filesSectionCount = await page.locator('.files-section').count();
    const formatSectionCount = await page.locator('.format-section').count();
    
    console.log('Files section count:', filesSectionCount);
    console.log('Format section count:', formatSectionCount);
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/manual-upload.png', fullPage: true });
  });
});