import { test, expect } from '@playwright/test';

test.describe('Convert Page File Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Capture console logs for debugging
    page.on('console', msg => {
      if (msg.text().includes('[Convert Page]') || msg.type() === 'error') {
        console.log(`${msg.type()}: ${msg.text()}`);
      }
    });
    
    // Navigate to convert page
    await page.goto('/convert');
    
    // Wait for page to load
    await page.waitForSelector('h1', { timeout: 5000 });
  });

  test('should show format dropdown after selecting a PNG file', async ({ page }) => {
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Wait for drop zone to be ready
    await page.waitForSelector('.drop-zone', { state: 'visible' });
    
    // Create a proper PNG file
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, // IHDR length
      0x49, 0x48, 0x44, 0x52, // IHDR
      0x00, 0x00, 0x00, 0x01, // width: 1
      0x00, 0x00, 0x00, 0x01, // height: 1
      0x08, 0x02, // bit depth: 8, color type: 2 (RGB)
      0x00, 0x00, 0x00, // compression, filter, interlace
      0x90, 0x77, 0x53, 0xDE, // CRC
      0x00, 0x00, 0x00, 0x0C, // IDAT length
      0x49, 0x44, 0x41, 0x54, // IDAT
      0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0xFE, 0xFF, 0x00, 0x00, 0x00, 0x02, // compressed data
      0x00, 0x01, // CRC start
      0x0E, 0x7E, 0x9B, 0x41, // CRC
      0x00, 0x00, 0x00, 0x00, // IEND length
      0x49, 0x45, 0x4E, 0x44, // IEND
      0xAE, 0x42, 0x60, 0x82  // CRC
    ]);
    
    // Find the file input and set files directly
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-image.png',
      mimeType: 'image/png',
      buffer: pngBuffer
    });
    
    // Wait a moment for the event handlers to process
    await page.waitForTimeout(500);
    
    // Wait for files list to appear
    await page.waitForSelector('.files-list', { timeout: 5000 });
    
    // Check that file is listed
    await expect(page.locator('.file-name').filter({ hasText: 'test-image.png' }).first()).toBeVisible();
    
    // Check that configure section appears
    await page.waitForSelector('.configure-section', { timeout: 5000 });
    await expect(page.locator('.configure-section h3')).toContainText('Output Format');
    
    // Check that format options exist
    const formatOptions = page.locator('.format-option');
    const optionsCount = await formatOptions.count();
    
    expect(optionsCount).toBeGreaterThan(0);
    console.log(`Found ${optionsCount} format options`);
    
    // Verify format options are visible
    const firstOption = formatOptions.first();
    await expect(firstOption).toBeVisible();
  });

  test('should enable convert button after selecting format', async ({ page }) => {
    // Wait for page to be ready
    await page.waitForLoadState('networkidle');
    
    // Upload a file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-doc.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Test document content')
    });
    
    // Wait for files to be processed
    await page.waitForTimeout(500);
    
    // Wait for files list to appear
    await page.waitForSelector('.files-list', { timeout: 5000 });
    
    // Wait for configure section
    await page.waitForSelector('.configure-section', { timeout: 5000 });
    
    // Check format options are available
    const formatOptions = page.locator('.format-option');
    await expect(formatOptions.first()).toBeVisible();
    
    // Click first format option
    await formatOptions.first().click();
    
    // Check that convert button appears and is enabled
    const convertButton = page.locator('.convert-btn.primary');
    await expect(convertButton).toBeVisible();
    await expect(convertButton).toBeEnabled();
    
    // Get button text
    const buttonText = await convertButton.textContent();
    expect(buttonText).toContain('Convert');
  });

  test('should handle multiple files', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const fileInput = page.locator('input[type="file"]');
    
    // Create valid file buffers
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52
    ]);
    const jpegBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]);
    
    // Upload multiple files
    await fileInput.setInputFiles([
      {
        name: 'image1.png',
        mimeType: 'image/png',
        buffer: pngBuffer
      },
      {
        name: 'image2.jpg',
        mimeType: 'image/jpeg',
        buffer: jpegBuffer
      }
    ]);
    
    // Wait for files to be processed
    await page.waitForTimeout(500);
    
    // Wait for files list to appear
    await page.waitForSelector('.files-list', { timeout: 5000 });
    
    // Check both files are listed
    await expect(page.locator('.file-name').filter({ hasText: 'image1.png' }).first()).toBeVisible();
    await expect(page.locator('.file-name').filter({ hasText: 'image2.jpg' }).first()).toBeVisible();
    
    // Check files count in header
    await expect(page.locator('.files-header h3')).toContainText('2/2');
    
    // Configure section should be visible
    await expect(page.locator('.configure-section')).toBeVisible();
  });

  test('should clear all files when Clear All is clicked', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Upload a file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4') // Basic PDF header
    });
    
    // Wait for files to be processed
    await page.waitForTimeout(500);
    
    // Wait for files section
    await page.waitForSelector('text=/Selected Files/i', { timeout: 5000 });
    
    // Click Clear All button
    const clearButton = page.locator('button:has-text("Clear All")');
    await clearButton.click();
    
    // Files section should disappear
    await expect(page.locator('text=/Selected Files/i')).not.toBeVisible();
    
    // Format section should also disappear
    await expect(page.locator('text=/Convert to:/i')).not.toBeVisible();
  });

  test('should remove individual file when X is clicked', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Upload multiple files
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles([
      {
        name: 'file1.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('File 1')
      },
      {
        name: 'file2.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('File 2')
      }
    ]);
    
    // Wait for files to be processed
    await page.waitForTimeout(500);
    
    // Wait for files list
    await page.waitForSelector('.files-list', { timeout: 5000 });
    await expect(page.locator('.files-header h3')).toContainText('2/2');
    
    // Find and click the X button for the first file
    const removeButton = page.locator('.file-item').first().locator('.remove-btn');
    await removeButton.click();
    
    // Wait for update
    await page.waitForTimeout(300);
    
    // Check that only one file remains
    await expect(page.locator('.files-header h3')).toContainText('1/1');
    
    // Check that file2.txt is still there but file1.txt is gone
    await expect(page.locator('.file-name').filter({ hasText: 'file1.txt' })).not.toBeVisible();
    await expect(page.locator('.file-name').filter({ hasText: 'file2.txt' }).first()).toBeVisible();
  });
});