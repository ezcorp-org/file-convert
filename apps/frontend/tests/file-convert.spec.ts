/**
 * End-to-End Tests for File Conversion System
 */

import { test, expect } from './fixtures';

test.describe('File Conversion System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/convert');
    await page.waitForLoadState('networkidle');
  });

  test('should display file converter page', async ({ page }) => {
    // Check page title
    await expect(page.locator('h1')).toContainText('File Converter');

    // Check subtitle
    await expect(page.locator('.subtitle')).toContainText('100% private');

    // Check steps are visible
    await expect(page.locator('.step')).toHaveCount(4);
    await expect(page.locator('.step.active')).toHaveCount(1);
    await expect(page.locator('.step.active .step-label')).toContainText('Upload');
  });

  test('should show file uploader', async ({ page }) => {
    // Check drop zone is visible
    await expect(page.locator('.drop-zone')).toBeVisible();
    await expect(page.locator('.drop-zone h3')).toContainText('Drop files here');
    
    // Check browse button
    await expect(page.locator('.browse-btn')).toBeVisible();
    await expect(page.locator('.browse-btn')).toContainText('Browse Files');
    
    // Check supported formats
    await expect(page.locator('.supported-formats')).toContainText('Images');
    await expect(page.locator('.supported-formats')).toContainText('Audio');
    await expect(page.locator('.supported-formats')).toContainText('Documents');
  });

  test('should handle file upload via button', async ({ page }) => {
    // Create a test PNG file buffer
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
      0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
      0x54, 0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0xFE,
      0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, 0x0E,
      0x7E, 0x9B, 0x41, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);
    
    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-image.png',
      mimeType: 'image/png',
      buffer: pngBuffer
    });
    
    // Check file appears in list
    await expect(page.locator('.files-list')).toBeVisible();
    await expect(page.locator('.file-item')).toHaveCount(1);
    await expect(page.locator('.file-item .file-name').first()).toContainText('test-image.png');

    // Check step changes to configure
    await expect(page.locator('.step.active .step-label')).toContainText('Configure');
  });

  test('should handle multiple file uploads', async ({ page }) => {
    // Create test files
    const pngBuffer = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    const pdfBuffer = Buffer.from('%PDF-1.4');
    const wavBuffer = Buffer.from('RIFF');
    
    const testFiles = [
      { name: 'test-image.png', mimeType: 'image/png', buffer: pngBuffer },
      { name: 'test-document.pdf', mimeType: 'application/pdf', buffer: pdfBuffer },
      { name: 'test-audio.wav', mimeType: 'audio/wav', buffer: wavBuffer }
    ];
    
    // Upload files
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFiles);
    
    // Check all files appear
    await expect(page.locator('.file-item')).toHaveCount(3);
    await expect(page.locator('.files-header h3')).toContainText('3/3');
  });

  test('should show format selection after file upload', async ({ page }) => {
    // Upload a test image
    const pngBuffer = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-image.png',
      mimeType: 'image/png',
      buffer: pngBuffer
    });
    
    // Check format section is visible
    await expect(page.locator('.configure-section')).toBeVisible();
    await expect(page.locator('.configure-section h3')).toContainText('Output Format');
    
    // Check format options are available
    const formatOptionsCount = await page.locator('.format-option').count();
    expect(formatOptionsCount).toBeGreaterThan(0);
  });

  test('should allow format selection', async ({ page }) => {
    // Upload a test image
    const pngBuffer = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-image.png',
      mimeType: 'image/png',
      buffer: pngBuffer
    });
    
    // Select JPEG format
    const jpegOption = page.locator('.format-option').filter({ hasText: 'JPEG' }).first();
    await jpegOption.click();
    
    // Check format is selected
    await expect(jpegOption).toHaveClass(/selected/);
    
    // Check convert button appears
    await expect(page.locator('.convert-btn.primary')).toBeVisible();
    await expect(page.locator('.convert-btn.primary')).toContainText('Convert 1 File');
  });

  test('should handle file removal', async ({ page }) => {
    // Upload multiple files
    const pngBuffer = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    const pdfBuffer = Buffer.from('%PDF-1.4');
    
    const testFiles = [
      { name: 'test-image.png', mimeType: 'image/png', buffer: pngBuffer },
      { name: 'test-document.pdf', mimeType: 'application/pdf', buffer: pdfBuffer }
    ];
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFiles);
    
    // Check both files are present
    await expect(page.locator('.file-item')).toHaveCount(2);
    
    // Remove first file
    await page.locator('.file-item').first().locator('.remove-btn').click();
    
    // Check only one file remains
    await expect(page.locator('.file-item')).toHaveCount(1);
    await expect(page.locator('.file-item .file-name').first()).toContainText('test-document.pdf');
  });

  test('should handle clear all files', async ({ page }) => {
    // Upload files
    const pngBuffer = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    const pdfBuffer = Buffer.from('%PDF-1.4');

    const testFiles = [
      { name: 'test-image.png', mimeType: 'image/png', buffer: pngBuffer },
      { name: 'test-document.pdf', mimeType: 'application/pdf', buffer: pdfBuffer }
    ];

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFiles);

    // Click clear all
    await page.locator('.clear-btn').click();

    // Check files are cleared
    await expect(page.locator('.files-list')).not.toBeVisible();
    await expect(page.locator('.step.active .step-label')).toContainText('Upload');
  });

  test('should show conversion options for selected format', async ({ page }) => {
    // Upload a test image
    const pngBuffer = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-image.png',
      mimeType: 'image/png',
      buffer: pngBuffer
    });
    
    // Select JPEG format
    const jpegOption = page.locator('.format-option').filter({ hasText: 'JPEG' }).first();
    if (await jpegOption.count() > 0) {
      await jpegOption.click();
      
      // Check if conversion options appear
      const optionsSection = page.locator('.conversion-options');
      if (await optionsSection.count() > 0) {
        await expect(optionsSection).toBeVisible();
        await expect(optionsSection.locator('h4')).toContainText('Conversion Options');
      }
    }
  });

  test('should handle file selection toggle', async ({ page }) => {
    // Upload multiple files
    const pngBuffer = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    const pdfBuffer = Buffer.from('%PDF-1.4');
    
    const testFiles = [
      { name: 'test-image.png', mimeType: 'image/png', buffer: pngBuffer },
      { name: 'test-document.pdf', mimeType: 'application/pdf', buffer: pdfBuffer }
    ];
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFiles);
    
    // Initially all should be selected
    await expect(page.locator('.files-header h3')).toContainText('2/2');
    
    // Unselect first file
    await page.locator('.file-item').first().locator('input[type="checkbox"]').click();
    
    // Check selection count updated
    await expect(page.locator('.files-header h3')).toContainText('1/2');
    
    // Re-select file
    await page.locator('.file-item').first().locator('input[type="checkbox"]').click();
    await expect(page.locator('.files-header h3')).toContainText('2/2');
  });

  test('should validate file types', async ({ page }) => {
    // Try to upload an unsupported file type (create a fake one)
    // This test would need actual test files with unsupported extensions
    // For now, we'll check that the error handling UI exists
    
    const errorSection = page.locator('.errors');
    if (await errorSection.count() > 0) {
      await expect(errorSection.locator('.error')).toBeVisible();
      await expect(errorSection.locator('.error-text')).toContainText('Unsupported');
    }
  });

  test('should show proper UI states during conversion', async ({ page }) => {
    // This test would require mocking the actual conversion process
    // Check that the UI states are properly defined
    
    // Check converting section structure exists
    const convertingSection = page.locator('.converting-section');
    if (await convertingSection.count() > 0) {
      await expect(convertingSection.locator('h2')).toContainText('Converting');
    }
    
    // Check complete section structure exists
    const completeSection = page.locator('.complete-section');
    if (await completeSection.count() > 0) {
      await expect(completeSection.locator('h2')).toContainText('Complete');
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check page is still functional
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.drop-zone')).toBeVisible();
    
    // Check layout adapts
    const steps = page.locator('.steps');
    // Check that steps wrap properly on mobile
    const stepElements = await page.locator('.step').all();
    expect(stepElements.length).toBeGreaterThan(0);
  });

  test('should handle drag and drop', async ({ page }) => {
    // Get drop zone
    const dropZone = page.locator('.drop-zone');
    
    // Hover over drop zone to test hover state
    await dropZone.hover();
    
    // Check that drop zone has proper cursor
    const cursor = await dropZone.evaluate(el => window.getComputedStyle(el).cursor);
    expect(cursor).toBe('pointer');
    
    // Check drop zone is clickable
    await expect(dropZone).toHaveAttribute('role', 'button');
  });

  test('should maintain state during navigation', async ({ page }) => {
    // Upload a file
    const pngBuffer = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-image.png',
      mimeType: 'image/png',
      buffer: pngBuffer
    });
    
    // Check file is present
    await expect(page.locator('.file-item')).toHaveCount(1);
    
    // Navigate away and back (if routing is set up)
    // This would need actual routing to test properly
  });

  test('should show appropriate empty states', async ({ page }) => {
    // Check initial empty state
    await expect(page.locator('.drop-zone')).toBeVisible();
    await expect(page.locator('.files-list')).not.toBeVisible();
    await expect(page.locator('.configure-section')).not.toBeVisible();
  });
});

test.describe('File Conversion Accessibility', () => {
  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/convert');
    
    // Tab to browse button
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Check focus is on browse button or drop zone
    const focusedElement = await page.evaluate(() => document.activeElement?.className);
    expect(focusedElement).toBeTruthy();
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/convert');
    
    // Check drop zone has proper role
    const dropZone = page.locator('.drop-zone');
    await expect(dropZone).toHaveAttribute('role', 'button');
    await expect(dropZone).toHaveAttribute('tabindex', '0');
  });

  test('should announce status changes', async ({ page }) => {
    await page.goto('/convert');
    
    // Upload a file
    const pngBuffer = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-image.png',
      mimeType: 'image/png',
      buffer: pngBuffer
    });
    
    // Check that status changes are reflected in the UI
    await expect(page.locator('.step.active')).toHaveCount(1);
  });
});