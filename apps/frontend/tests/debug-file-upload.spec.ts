import { test, expect } from '@playwright/test';
import path from 'path';

test('Debug file upload process', async ({ page }) => {
  // Navigate to convert page
  await page.goto('/convert');
  
  // Enable console logging
  page.on('console', (msg) => {
    console.log(`Browser console: ${msg.text()}`);
  });
  
  // Listen for errors
  page.on('pageerror', (err) => {
    console.log(`Page error: ${err.message}`);
  });
  
  // Wait for page to be ready
  await expect(page.locator('h1')).toContainText('File Converter');
  
  // Check initial state
  const filesListVisible = await page.locator('.files-list').isVisible();
  console.log('Files list visible before upload:', filesListVisible);
  
  const uploadedFilesCount = await page.locator('.file-name').count();
  console.log('File count before upload:', uploadedFilesCount);
  
  // Create a proper PNG buffer (minimal PNG file)
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
  
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles({
    name: 'test.png',
    mimeType: 'image/png',
    buffer: pngBuffer
  });
  
  // Add debug logging to the page
  await page.evaluate(() => {
    // Override console.log temporarily to capture FileUploader logs
    const originalLog = console.log;
    console.log = (...args) => {
      originalLog(`DEBUG:`, ...args);
    };
    
    // Override console.error
    const originalError = console.error;  
    console.error = (...args) => {
      originalLog(`ERROR:`, ...args);
    };
    
    // Override console.warn
    const originalWarn = console.warn;
    console.warn = (...args) => {
      originalLog(`WARN:`, ...args);
    };
  });
  
  // Wait a moment for processing
  await page.waitForTimeout(3000);
  
  // Check if file input has files
  const fileInputHasFiles = await page.locator('input[type="file"]').evaluate(el => el.files?.length || 0);
  console.log('File input files count:', fileInputHasFiles);
  
  // Check state after upload
  const filesListVisibleAfter = await page.locator('.files-list').isVisible();
  console.log('Files list visible after upload:', filesListVisibleAfter);
  
  const uploadedFilesCountAfter = await page.locator('.file-name').count();
  console.log('File count after upload:', uploadedFilesCountAfter);
  
  // Check for FileUploader component
  const fileUploaderVisible = await page.locator('.drop-zone, [class*="file-uploader"]').count();
  console.log('FileUploader component elements found:', fileUploaderVisible);
  
  // Check for errors
  const errorElements = await page.locator('.error, .warning').count();
  console.log('Error elements found:', errorElements);
  
  if (errorElements > 0) {
    const errorTexts = await page.locator('.error, .warning').allTextContents();
    console.log('Error messages:', errorTexts);
  }
  
  // Take screenshot
  await page.screenshot({ path: 'debug-file-upload.png', fullPage: true });
});