import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

test.describe('File Conversion Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/convert');
    
    // Wait for the page to be fully loaded - use correct selector
    await page.waitForSelector('.drop-zone', { state: 'visible' });
  });

  test('should display the conversion page with all sections', async ({ page }) => {
    // Check that we're on the right page
    await expect(page.locator('.drop-zone')).toBeVisible();
    
    // Check for key elements
    const pageContent = await page.textContent('body');
    expect(pageContent).toContain('100% private');
    
    // Check browse button exists
    await expect(page.locator('.browse-btn')).toBeVisible();
  });

  test('should accept PNG file upload', async ({ page }) => {
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Wait for drop zone to be ready
    await page.waitForSelector('.drop-zone', { state: 'visible' });
    
    // Create a proper PNG file buffer
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
    
    // Upload the file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test.png',
      mimeType: 'image/png',
      buffer: pngBuffer
    });
    
    // Wait for files list to appear
    await page.waitForSelector('.files-list', { timeout: 5000 });
    
    // Check that file name appears in the file list
    await expect(page.locator('.file-name').first()).toContainText('test.png');
    
    // Check if files section is visible
    await expect(page.locator('.files-list')).toBeVisible();
    
    // Check if format options are shown after file upload
    const formatOptions = await page.locator('.format-option').count();
    expect(formatOptions).toBeGreaterThan(0);
  });

  test('should accept text file upload', async ({ page }) => {
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Wait for drop zone to be ready
    await page.waitForSelector('.drop-zone', { state: 'visible' });
    
    // Create test text content
    const testText = 'This is a test text file for conversion.';
    
    // Upload the file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from(testText)
    });
    
    // Wait for files list to appear
    await page.waitForSelector('.files-list', { timeout: 5000 });
    
    // Check that file name appears
    await expect(page.locator('.file-name').first()).toContainText('test.txt');
    
    // Check for format selection options
    const hasFormatOptions = await page.locator('.format-option').count();
    expect(hasFormatOptions).toBeGreaterThan(0);
  });

  test('should handle multiple files', async ({ page }) => {
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Wait for drop zone to be ready
    await page.waitForSelector('.drop-zone', { state: 'visible' });
    
    // Create proper PNG buffer
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
    
    // Upload multiple files using buffers
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles([
      {
        name: 'test.png',
        mimeType: 'image/png',
        buffer: pngBuffer
      },
      {
        name: 'test.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('Test text content')
      }
    ]);
    
    // Wait for files list to appear
    await page.waitForSelector('.files-list', { timeout: 5000 });
    
    // Check that file names appear in file list
    const fileNames = await page.locator('.file-name').allTextContents();
    expect(fileNames.length).toBeGreaterThan(0);
    expect(fileNames.some(name => name.includes('.png') || name.includes('.txt'))).toBeTruthy();
  });

  test('should show conversion options when file is selected', async ({ page }) => {
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Wait for drop zone to be ready
    await page.waitForSelector('.drop-zone', { state: 'visible' });
    
    // Use a PNG file instead of JSON since JSON might not be supported
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
    
    // Upload PNG file using buffer
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-convert.png',
      mimeType: 'image/png',
      buffer: pngBuffer
    });
    
    // Wait for files list to appear
    await page.waitForSelector('.files-list', { timeout: 5000 });
    
    // Check file appears
    await expect(page.locator('.file-name').first()).toContainText('test-convert.png');
    
    // Look for format options
    const formatOptions = await page.locator('.format-option').count();
    console.log('Found format options for PNG file:', formatOptions);
    expect(formatOptions).toBeGreaterThan(0);
  });

  test('should handle unsupported file gracefully', async ({ page }) => {
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Wait for drop zone to be ready
    await page.waitForSelector('.drop-zone', { state: 'visible' });
    
    // Try to upload unsupported file using buffer
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'unsupported.xyz',
      mimeType: 'application/octet-stream',
      buffer: Buffer.from('Unsupported file content')
    });
    
    await page.waitForTimeout(1500);
    
    // Page should not crash - drop zone should still be visible
    await expect(page.locator('.drop-zone')).toBeVisible();
    
    // Check if error message appears for unsupported file
    const errorCount = await page.locator('.error').count();
    if (errorCount > 0) {
      const errorText = await page.locator('.error-text').first().textContent();
      expect(errorText).toContain('Unsupported');
    } else {
      // File might not appear in the list at all
      const fileNames = await page.locator('.file-name').allTextContents();
      expect(fileNames).not.toContain('unsupported.xyz');
    }
  });
});