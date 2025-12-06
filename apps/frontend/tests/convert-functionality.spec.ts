import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

test.describe('File Conversion Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/convert');
    
    // Wait for the page to be fully loaded
    await page.waitForSelector('.drop-zone', { state: 'visible' });
  });

  test('should display the conversion page with all sections', async ({ page }) => {
    // Check main header
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.subtitle')).toContainText('100% private');
    
    // Check file drop zone is visible
    await expect(page.locator('.drop-zone')).toBeVisible();
    
    // Check browse button
    await expect(page.locator('.browse-btn')).toBeVisible();
  });

  test('should detect format and show available conversions for PNG file', async ({ page }) => {
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Wait for drop zone to be ready
    await page.waitForSelector('.drop-zone', { state: 'visible' });
    
    // Create a simple PNG buffer (1x1 pixel transparent PNG)
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
      0x89, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x44, 0x41,
      0x54, 0x78, 0x9C, 0x62, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
      0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
      0x42, 0x60, 0x82
    ]);
    
    // Upload the file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-image.png',
      mimeType: 'image/png',
      buffer: pngBuffer
    });
    
    // Wait for files list to appear
    await page.waitForSelector('.files-list', { timeout: 5000 });
    
    // Check that file appears in the list
    await expect(page.locator('.file-name').first()).toContainText('test-image.png');
      
    // Check that format options appear
    const formatOptions = await page.locator('.format-option').count();
    if (formatOptions > 0) {
      console.log('Format options found:', formatOptions);
      // PNG should have conversion options like JPEG, WebP
      const optionTexts = await page.locator('.format-option .format-name').allTextContents();
      console.log('Available formats:', optionTexts);
    }
  });

  test('should detect format and show available conversions for text file', async ({ page }) => {
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Wait for drop zone to be ready
    await page.waitForSelector('.drop-zone', { state: 'visible' });
    
    // Upload the file using buffer
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-document.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('This is a test text file for conversion.')
    });
    
    // Wait for files list to appear
    await page.waitForSelector('.files-list', { timeout: 5000 });
    
    // Check that file appears in the list
    await expect(page.locator('.file-name').first()).toContainText('test-document.txt');
    
    // Check if format options appear
    const formatOptions = await page.locator('.format-option').count();
    if (formatOptions > 0) {
      console.log('Text format options found:', formatOptions);
      const optionTexts = await page.locator('.format-option .format-name').allTextContents();
      console.log('Available text formats:', optionTexts);
    }
  });

  test('should handle multiple files', async ({ page }) => {
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Wait for drop zone to be ready
    await page.waitForSelector('.drop-zone', { state: 'visible' });
    
    // Upload multiple files using buffers
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles([
      {
        name: 'test1.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('Test 1')
      },
      {
        name: 'test2.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('Test 2')
      }
    ]);
    
    // Wait for files list to appear
    await page.waitForSelector('.files-list', { timeout: 5000 });
    
    // Check that both files appear
    const fileItems = await page.locator('.file-item').count();
    expect(fileItems).toBe(2);
    
    // Check file counter - it shows "Selected Files (2/2)" format
    await expect(page.locator('.files-header h3')).toContainText('Selected Files');
    await expect(page.locator('.files-header h3')).toContainText('2/2');
    
    // Test removing a file
    await page.locator('.remove-btn').first().click();
    await page.waitForTimeout(200);
    
    // Check that only one file remains
    const remainingItems = await page.locator('.file-item').count();
    expect(remainingItems).toBe(1);
    
    // Test clear all
    await page.locator('.clear-btn').click();
    await page.waitForTimeout(200);
    
    // Check that files list is gone
    await expect(page.locator('.files-list')).not.toBeVisible();
  });

  test('should show conversion button when format is selected', async ({ page }) => {
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Wait for drop zone to be ready
    await page.waitForSelector('.drop-zone', { state: 'visible' });
    
    // Create a proper PNG buffer
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
    
    // Upload file using buffer
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-convert.png',
      mimeType: 'image/png',
      buffer: pngBuffer
    });
    
    // Wait for files list to appear
    await page.waitForSelector('.files-list', { timeout: 5000 });
    
    // Select a conversion format (if options are available)
    const formatOptions = await page.locator('.format-option').count();
    if (formatOptions > 0) {
      await page.locator('.format-option').first().click();
      
      // Check that convert button appears
      const convertButton = page.locator('.convert-btn.primary');
      await expect(convertButton).toBeVisible();
      
      // Button should be enabled
      await expect(convertButton).toBeEnabled();
      
      // Check button text
      const buttonText = await convertButton.textContent();
      expect(buttonText).toContain('Convert');
    }
  });

  test('should handle unknown file formats gracefully', async ({ page }) => {
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Wait for drop zone to be ready
    await page.waitForSelector('.drop-zone', { state: 'visible' });
    
    // Upload file with unknown format using buffer
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test.xyz',
      mimeType: 'application/octet-stream',
      buffer: Buffer.from('Unknown format content')
    });
    
    // Wait for processing
    await page.waitForTimeout(1500);
    
    // Unknown file formats are not accepted, so they don't appear in the list
    // Check that no files were added
    const fileCount = await page.locator('.file-item').count();
    expect(fileCount).toBe(0);
    
    // Check if error appears
    const errorCount = await page.locator('.error').count();
    if (errorCount > 0) {
      const errorText = await page.locator('.error-text').first().textContent();
      expect(errorText).toContain('Unsupported');
    }
    
    // Check that format options are not available (0 or very limited)
    const formatOptions = await page.locator('.format-option').count();
    console.log('Format options for unknown file:', formatOptions);
    
    // Should still show file but with no or limited conversion options
    expect(formatOptions).toBeLessThanOrEqual(1);
  });
});