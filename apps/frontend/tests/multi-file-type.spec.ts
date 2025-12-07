import { test, expect } from './fixtures';

test.describe('Multi-File Type Conversion', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/convert');
    await page.waitForLoadState('networkidle');
  });

  test('should handle multiple file types with separate conversion options', async ({ page }) => {
    // Create test files of different types (using supported formats)
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

    const jsonBuffer = Buffer.from(JSON.stringify({ test: 'data', value: 123 }));

    // Upload multiple files of different types
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles([
      {
        name: 'test-image.png',
        mimeType: 'image/png',
        buffer: pngBuffer
      },
      {
        name: 'test-data.json',
        mimeType: 'application/json',
        buffer: jsonBuffer
      }
    ]);

    // Check that files are displayed
    await expect(page.locator('.files-list')).toBeVisible();
    await expect(page.locator('.files-list').locator('text=test-image.png')).toBeVisible();
    await expect(page.locator('.files-list').locator('text=test-data.json')).toBeVisible();
    
    // Check that configure section appears
    await expect(page.locator('.configure-section')).toBeVisible();

    // Check that we have two separate type groups
    const typeGroups = page.locator('.type-group');
    await expect(typeGroups).toHaveCount(2);
    
    // Check for PNG group
    const pngGroup = typeGroups.filter({ hasText: 'PNG Image Files' });
    await expect(pngGroup).toBeVisible();
    await expect(pngGroup.locator('.group-file')).toContainText('test-image.png');

    // Check PNG has image format options
    const pngFormats = pngGroup.locator('.format-option');
    const pngFormatCount = await pngFormats.count();
    expect(pngFormatCount).toBeGreaterThan(0);

    // Check for JSON group
    const jsonGroup = typeGroups.filter({ hasText: 'JSON Files' });
    await expect(jsonGroup).toBeVisible();
    await expect(jsonGroup.locator('.group-file')).toContainText('test-data.json');

    // Check JSON has different format options
    const jsonFormats = jsonGroup.locator('.format-option');
    const jsonFormatCount = await jsonFormats.count();
    expect(jsonFormatCount).toBeGreaterThan(0);

    // Select output formats for each type
    await pngFormats.first().click();
    await jsonFormats.first().click();
    
    // Check that convert button is enabled with correct count
    const convertBtn = page.locator('.convert-btn.primary');
    await expect(convertBtn).toBeEnabled();
    await expect(convertBtn).toContainText('Convert 2 Files');
  });

  test('should update when files are removed from mixed types', async ({ page }) => {
    // Upload multiple files of different types (using supported formats)
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles([
      {
        name: 'file1.png',
        mimeType: 'image/png',
        buffer: Buffer.from([0x89, 0x50, 0x4E, 0x47])
      },
      {
        name: 'file2.json',
        mimeType: 'application/json',
        buffer: Buffer.from(JSON.stringify({ text: 'content' }))
      },
      {
        name: 'file3.png',
        mimeType: 'image/png',
        buffer: Buffer.from([0x89, 0x50, 0x4E, 0x47])
      }
    ]);

    // Should have 2 type groups initially
    await expect(page.locator('.type-group')).toHaveCount(2);
    
    // Remove one PNG file
    const removeBtn = page.locator('.file-item').filter({ hasText: 'file1.png' }).locator('.remove-btn');
    await removeBtn.click();
    
    // Should still have 2 type groups
    await expect(page.locator('.type-group')).toHaveCount(2);
    
    // PNG group should show 1 file
    const pngGroup = page.locator('.type-group').filter({ hasText: 'PNG Image' });
    await expect(pngGroup).toContainText('(1)');

    // Remove the JSON file
    const removeJsonBtn = page.locator('.file-item').filter({ hasText: 'file2.json' }).locator('.remove-btn');
    await removeJsonBtn.click();

    // Should now have only 1 type group
    await expect(page.locator('.type-group')).toHaveCount(1);
  });

  test('should handle selecting/deselecting files from mixed types', async ({ page }) => {
    // Upload multiple files (using supported formats)
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles([
      {
        name: 'image.png',
        mimeType: 'image/png',
        buffer: Buffer.from([0x89, 0x50, 0x4E, 0x47])
      },
      {
        name: 'data.json',
        mimeType: 'application/json',
        buffer: Buffer.from(JSON.stringify({ test: 'data' }))
      }
    ]);

    // Both files should be selected by default
    await expect(page.locator('.type-group')).toHaveCount(2);

    // Deselect the PNG file
    const pngCheckbox = page.locator('.file-item').filter({ hasText: 'image.png' }).locator('input[type="checkbox"]');
    await pngCheckbox.click();

    // Should now have only 1 type group (JSON)
    await expect(page.locator('.type-group')).toHaveCount(1);
    await expect(page.locator('.type-group')).toContainText('JSON Files');
    
    // Re-select the PNG file
    await pngCheckbox.click();
    
    // Should have 2 type groups again
    await expect(page.locator('.type-group')).toHaveCount(2);
  });
});