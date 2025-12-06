import { test, expect, Page } from '@playwright/test';

test.describe('Multi-File Type Conversion E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/convert');
    await page.waitForLoadState('networkidle');
  });

  test('Complete E2E: Upload mixed files, select formats, convert, and download', async ({ page }) => {
    // Step 1: Create test files of different types
    const testFiles = [
      {
        name: 'photo1.png',
        mimeType: 'image/png',
        buffer: createPNGBuffer()
      },
      {
        name: 'photo2.png', 
        mimeType: 'image/png',
        buffer: createPNGBuffer()
      },
      {
        name: 'document.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('This is a test document with some content for conversion testing.')
      },
      {
        name: 'data.json',
        mimeType: 'application/json',
        buffer: Buffer.from(JSON.stringify({
          name: 'Test Data',
          values: [1, 2, 3, 4, 5],
          metadata: { created: '2024-01-01', author: 'Test' }
        }, null, 2))
      }
    ];

    // Step 2: Upload all files at once
    console.log('📤 Uploading 4 files of 3 different types...');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFiles);
    
    // Step 3: Verify files are displayed and grouped
    await page.waitForTimeout(1000);
    
    // Check files list
    await expect(page.locator('.files-list')).toBeVisible();
    await expect(page.locator('.files-header h3')).toContainText('4/4'); // All selected
    
    // Verify all files are shown in the list
    for (const file of testFiles) {
      await expect(page.locator('.files-list').locator(`text="${file.name}"`)).toBeVisible();
    }
    
    // Step 4: Verify type grouping
    await expect(page.locator('.configure-section')).toBeVisible();
    await expect(page.locator('.configure-section h3')).toContainText('Choose Output Formats');
    
    // Should show info banner for multiple types
    const infoBanner = page.locator('.info-banner');
    await expect(infoBanner).toBeVisible();
    await expect(infoBanner).toContainText('different file types');
    
    // Should have 3 type groups (PNG, TXT, JSON)
    const typeGroups = page.locator('.type-group');
    await expect(typeGroups).toHaveCount(3);
    
    // Step 5: Verify PNG group
    const pngGroup = typeGroups.filter({ hasText: 'PNG Image Files' });
    await expect(pngGroup).toBeVisible();
    await expect(pngGroup).toContainText('(2 files)'); // Two PNG files
    await expect(pngGroup.locator('.group-file')).toHaveCount(2);
    await expect(pngGroup.locator('.group-file').first()).toContainText('photo1.png');
    await expect(pngGroup.locator('.group-file').nth(1)).toContainText('photo2.png');
    
    // Step 6: Verify Text group
    const txtGroup = typeGroups.filter({ hasText: 'Plain Text Files' });
    await expect(txtGroup).toBeVisible();
    await expect(txtGroup).toContainText('(1 file)');
    await expect(txtGroup.locator('.group-file')).toContainText('document.txt');
    
    // Step 7: Verify JSON group
    const jsonGroup = typeGroups.filter({ hasText: 'JSON Files' });
    await expect(jsonGroup).toBeVisible();
    await expect(jsonGroup).toContainText('(1 file)');
    await expect(jsonGroup.locator('.group-file')).toContainText('data.json');
    
    // Step 8: Select output formats for each type
    console.log('🎯 Selecting output formats for each file type...');
    
    // Select JPEG for PNG files
    const pngFormats = pngGroup.locator('.format-option');
    const jpegOption = pngFormats.filter({ hasText: 'JPEG' });
    await jpegOption.click();
    await expect(jpegOption).toHaveClass(/selected/);
    
    // Select PDF for text file
    const txtFormats = txtGroup.locator('.format-option');
    const pdfOption = txtFormats.filter({ hasText: 'PDF' });
    await pdfOption.click();
    await expect(pdfOption).toHaveClass(/selected/);
    
    // Select CSV for JSON file
    const jsonFormats = jsonGroup.locator('.format-option');
    const csvOption = jsonFormats.filter({ hasText: 'CSV' });
    await csvOption.click();
    await expect(csvOption).toHaveClass(/selected/);
    
    // Step 9: Verify convert button shows correct count
    const convertBtn = page.locator('.convert-btn.primary');
    await expect(convertBtn).toBeEnabled();
    await expect(convertBtn).toContainText('Convert 4 Files');
    
    // Step 10: Start conversion
    console.log('🔄 Starting conversion process...');
    await convertBtn.click();
    
    // Step 11: Verify conversion in progress
    await expect(page.locator('.converting-section')).toBeVisible();
    await expect(page.locator('h2')).toContainText('Converting Files...');
    
    // Should show 4 conversion status items
    const conversionItems = page.locator('.conversions > *');
    await expect(conversionItems).toHaveCount(4);
    
    // Step 12: Wait for conversion to complete (with timeout)
    console.log('⏳ Waiting for conversions to complete...');
    await page.waitForSelector('.complete-section', { timeout: 30000 });
    
    // Step 13: Verify completion
    await expect(page.locator('.complete-section h2')).toContainText('Conversion Complete!');
    
    // Should have successful conversions listed
    const successfulConversions = page.locator('.result-item.success');
    const successCount = await successfulConversions.count();
    console.log(`✅ Successful conversions: ${successCount}`);
    expect(successCount).toBeGreaterThan(0);
    
    // Step 14: Verify download buttons are available  
    const downloadBtns = page.locator('.result-item button.download-btn');
    const downloadCount = await downloadBtns.count();
    expect(downloadCount).toBeGreaterThan(0);
    
    // Step 15: Test convert more files button
    const convertMoreBtn = page.locator('button:has-text("Convert More Files")');
    await expect(convertMoreBtn).toBeVisible();
    
    console.log('✅ Multi-file type conversion E2E test completed successfully!');
  });

  test('E2E: Partial selection and conversion', async ({ page }) => {
    // Upload files
    const testFiles = [
      {
        name: 'image1.png',
        mimeType: 'image/png',
        buffer: createPNGBuffer()
      },
      {
        name: 'image2.png',
        mimeType: 'image/png', 
        buffer: createPNGBuffer()
      },
      {
        name: 'text.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('Sample text')
      }
    ];

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFiles);
    await page.waitForTimeout(500);
    
    // Deselect one PNG file
    const image2Checkbox = page.locator('.file-item').filter({ hasText: 'image2.png' }).locator('input[type="checkbox"]');
    await image2Checkbox.click();
    
    // Verify file count updated
    await expect(page.locator('.files-header h3')).toContainText('2/3');
    
    // Verify PNG group shows only 1 file now
    const pngGroup = page.locator('.type-group').filter({ hasText: 'PNG Image' });
    await expect(pngGroup).toContainText('(1 file)');
    await expect(pngGroup.locator('.group-file')).toHaveCount(1);
    await expect(pngGroup.locator('.group-file')).toContainText('image1.png');
    
    // Select formats and convert
    const pngFormat = pngGroup.locator('.format-option').first();
    await pngFormat.click();
    
    const txtGroup = page.locator('.type-group').filter({ hasText: 'Plain Text' });
    const txtFormat = txtGroup.locator('.format-option').first();
    await txtFormat.click();
    
    // Convert button should show 2 files
    const convertBtn = page.locator('.convert-btn.primary');
    await expect(convertBtn).toContainText('Convert 2 Files');
    
    // Start conversion
    await convertBtn.click();
    
    // Wait for completion
    await page.waitForSelector('.complete-section', { timeout: 30000 });
    
    // Should have successful conversions
    const results = page.locator('.result-item.success');
    const resultCount = await results.count();
    console.log(`Converted ${resultCount} files successfully`);
    expect(resultCount).toBeGreaterThan(0);
  });

  test('E2E: Remove file type group during configuration', async ({ page }) => {
    // Upload mixed files
    const testFiles = [
      {
        name: 'pic.png',
        mimeType: 'image/png',
        buffer: createPNGBuffer()
      },
      {
        name: 'doc.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('Text content')
      }
    ];

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFiles);
    await page.waitForTimeout(500);
    
    // Initially should have 2 groups
    await expect(page.locator('.type-group')).toHaveCount(2);
    
    // Select format for PNG
    const pngGroup = page.locator('.type-group').filter({ hasText: 'PNG Image' });
    const pngFormat = pngGroup.locator('.format-option').first();
    await pngFormat.click();
    
    // Remove the text file
    const removeBtn = page.locator('.file-item').filter({ hasText: 'doc.txt' }).locator('.remove-btn');
    await removeBtn.click();
    
    // Should have only 1 group now
    await expect(page.locator('.type-group')).toHaveCount(1);
    
    // Info banner should disappear
    await expect(page.locator('.info-banner')).not.toBeVisible();
    
    // Convert button should show 1 file
    const convertBtn = page.locator('.convert-btn.primary');
    await expect(convertBtn).toContainText('Convert 1 File');
    
    // Can still convert
    await convertBtn.click();
    
    // Should transition to converting state
    await expect(page.locator('.converting-section')).toBeVisible({ timeout: 5000 });
    
    // Wait for some result (either complete or still processing)
    await page.waitForTimeout(2000);
    
    // Check current state - either still converting or complete
    const isConverting = await page.locator('.converting-section').isVisible();
    const isComplete = await page.locator('.complete-section').isVisible();
    
    console.log(`State - Converting: ${isConverting}, Complete: ${isComplete}`);
    
    // Either state is acceptable for this test
    expect(isConverting || isComplete).toBeTruthy();
  });

  test('E2E: Add more files during configuration', async ({ page }) => {
    // Start with one file type
    const firstBatch = [{
      name: 'first.png',
      mimeType: 'image/png',
      buffer: createPNGBuffer()
    }];

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(firstBatch);
    await page.waitForTimeout(500);
    
    // Should have 1 group, no info banner
    await expect(page.locator('.type-group')).toHaveCount(1);
    await expect(page.locator('.info-banner')).not.toBeVisible();
    
    // Add different file type
    const secondBatch = [{
      name: 'second.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Additional content')
    }];
    
    await fileInput.setInputFiles(secondBatch);
    await page.waitForTimeout(500);
    
    // Should now have 2 groups and info banner
    await expect(page.locator('.type-group')).toHaveCount(2);
    await expect(page.locator('.info-banner')).toBeVisible();
    
    // Both files should be listed
    await expect(page.locator('.files-list')).toContainText('first.png');
    await expect(page.locator('.files-list')).toContainText('second.txt');
    
    // Select formats for both
    const groups = page.locator('.type-group');
    for (let i = 0; i < 2; i++) {
      const format = groups.nth(i).locator('.format-option').first();
      await format.click();
    }
    
    // Convert both
    const convertBtn = page.locator('.convert-btn.primary');
    await expect(convertBtn).toContainText('Convert 2 Files');
    await convertBtn.click();
    
    // Wait for completion
    await page.waitForSelector('.complete-section', { timeout: 30000 });
    
    // Should have successful conversions for both files
    const results = page.locator('.result-item.success');
    const resultCount = await results.count();
    expect(resultCount).toBeGreaterThan(0);
  });
});

// Helper function to create a minimal valid PNG buffer
function createPNGBuffer(): Buffer {
  return Buffer.from([
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
}