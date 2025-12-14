import { test, expect, ImageFactory } from '../../fixtures';

/**
 * Cross-Browser Smoke Tests
 *
 * COVER-09: Cross-browser compatibility (Chromium, Firefox, WebKit)
 *
 * These tests run on all browsers to verify basic functionality.
 * Keep this suite minimal - 3-5 tests max - for fast CI feedback.
 *
 * Naming: File uses 'smoke' which can be matched by playwright.config
 * for cross-browser projects.
 *
 * Selectors: Use resilient selectors (getByRole, getByText) for cross-browser stability.
 */
test.describe('Cross-Browser Smoke Tests', () => {

  test('page loads and shows conversion interface', async ({ page, browserName }) => {
    console.log(`[${browserName}] Testing page load`);

    await page.goto('/convert');
    await page.waitForLoadState('networkidle');

    // Use resilient selectors - heading by role
    const heading = page.getByRole('heading').first();
    await expect(heading).toBeVisible();

    // Upload area - try multiple resilient approaches
    // Option 1: File input (always present for accessibility)
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();

    // Option 2: Drop zone by role or text (fallback)
    // The UI should have some indication of upload capability
  });

  test('file input accepts files', async ({ page, fileHelper, browserName }) => {
    console.log(`[${browserName}] Testing file input`);

    const pngBuffer = await ImageFactory.createPNG({ width: 50, height: 50 });

    await page.goto('/convert');
    await page.waitForLoadState('networkidle');

    const count = await fileHelper.uploadFile(
      fileHelper.createFileData(pngBuffer, 'test.png', 'image/png')
    );

    expect(count).toBe(1);

    // Verify file appears in the file list
    await expect(page.locator('.file-item')).toContainText('test.png');
  });

  test('basic PNG to JPEG conversion works', async ({
    page,
    fileHelper,
    downloadHelper,
    browserName
  }, testInfo) => {
    console.log(`[${browserName}] Testing PNG to JPEG conversion`);

    // Longer timeout for slower browsers
    const timeout = browserName === 'chromium' ? 30000 : 45000;
    testInfo.setTimeout(timeout + 30000); // Extra buffer for worker init

    const pngBuffer = await ImageFactory.createPNG({ width: 100, height: 100 });

    await page.goto('/convert');
    await page.waitForLoadState('networkidle');

    await fileHelper.uploadFile(
      fileHelper.createFileData(pngBuffer, 'test.png', 'image/png')
    );

    // Select JPEG format using class-based selector (consistent with other tests)
    const jpegOption = page.locator('.format-option').filter({ hasText: /JPEG|JPG/i });
    await jpegOption.click();

    // Click convert button
    await page.locator('.convert-btn').first().click();

    // Wait for download button
    await expect(page.locator('.download-btn').first()).toBeVisible({ timeout });

    // Validate downloaded file
    const { validation } = await downloadHelper.validateDownload('.download-btn', 'jpeg');
    expect(validation.valid).toBe(true);

    console.log(`[${browserName}] Conversion successful`);
  });

  test('JPEG to PNG conversion works', async ({
    page,
    fileHelper,
    downloadHelper,
    browserName
  }, testInfo) => {
    console.log(`[${browserName}] Testing JPEG to PNG conversion`);

    const timeout = browserName === 'chromium' ? 30000 : 45000;
    testInfo.setTimeout(timeout + 30000);

    const jpegBuffer = await ImageFactory.createJPEG({ width: 100, height: 100 });

    await page.goto('/convert');
    await page.waitForLoadState('networkidle');

    await fileHelper.uploadFile(
      fileHelper.createFileData(jpegBuffer, 'test.jpg', 'image/jpeg')
    );

    // Select PNG format
    const pngOption = page.locator('.format-option').filter({ hasText: /PNG/i });
    await pngOption.click();

    // Click convert button
    await page.locator('.convert-btn').first().click();

    // Wait for download button
    await expect(page.locator('.download-btn').first()).toBeVisible({ timeout });

    // Validate downloaded file
    const { validation } = await downloadHelper.validateDownload('.download-btn', 'png');
    expect(validation.valid).toBe(true);

    console.log(`[${browserName}] Conversion successful`);
  });

  test('multiple files can be uploaded', async ({
    page,
    fileHelper,
    browserName
  }) => {
    console.log(`[${browserName}] Testing multiple file upload`);

    const images = await Promise.all([
      ImageFactory.createPNG({ width: 50, height: 50 }),
      ImageFactory.createPNG({ width: 50, height: 50 }),
    ]);

    await page.goto('/convert');
    await page.waitForLoadState('networkidle');

    const count = await fileHelper.uploadFiles([
      fileHelper.createFileData(images[0], 'file1.png', 'image/png'),
      fileHelper.createFileData(images[1], 'file2.png', 'image/png'),
    ]);

    expect(count).toBe(2);

    // Verify both files appear in the file list
    const fileItems = page.locator('.file-item');
    await expect(fileItems).toHaveCount(2);
    await expect(fileItems.first()).toContainText('file1.png');
    await expect(fileItems.nth(1)).toContainText('file2.png');
  });
});
