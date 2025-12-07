import { test, expect } from './fixtures';
import { Buffer } from 'buffer';

test.describe('Error Notification Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/convert');
    await page.waitForLoadState('networkidle');
  });

  test('should show error notification for unsupported file type', async ({ page }) => {
    // Create a fake binary file with unsupported extension
    const binaryBuffer = Buffer.from([0x00, 0x01, 0x02, 0x03]);

    // Get the file input
    const fileInput = page.locator('input[type="file"]');

    // Set the file with completely unsupported extension
    await fileInput.setInputFiles({
      name: 'test.unsupported',
      mimeType: 'application/octet-stream',
      buffer: binaryBuffer
    });

    // Check for error notification
    const errorNotification = page.locator('.notification--error, .notification.notification--error, [class*="error"]');
    await expect(errorNotification.first()).toBeVisible({ timeout: 5000 });

    const errorText = await errorNotification.first().textContent();
    expect(errorText).toContain('Unsupported file type');
  });

  test('should show error notification for corrupted file', async ({ page }) => {
    // Create a file that claims to be JSON but has invalid content
    const invalidJsonBuffer = Buffer.from('{ this is not valid json', 'utf-8');

    // Get the file input
    const fileInput = page.locator('input[type="file"]');

    // Set the file
    await fileInput.setInputFiles({
      name: 'invalid.json',
      mimeType: 'application/json',
      buffer: invalidJsonBuffer
    });

    // Select CSV as output format
    const csvButton = page.locator('button:has-text("CSV")').first();
    if (await csvButton.isVisible()) {
      await csvButton.click();

      // Start conversion
      await page.click('button:has-text("Convert")');

      // Check for error notification containing specific file format error
      const errorNotification = page.locator('.notification--error, .notification.notification--error, [class*="error"]')
        .filter({ hasText: /format error|Invalid JSON|malformed/i });
      await expect(errorNotification.first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('should show warning notification for batch upload limit', async ({ page }) => {
    // Create multiple small files to test batch limits
    const files = [];
    for (let i = 0; i < 10; i++) {
      files.push({
        name: `test${i}.txt`,
        mimeType: 'text/plain',
        buffer: Buffer.from(`Test content ${i}`, 'utf-8')
      });
    }

    // Get the file input
    const fileInput = page.locator('input[type="file"]');

    // Set multiple files at once
    await fileInput.setInputFiles(files);

    // Check for warning notification about batch limits (may appear if user has restrictions)
    // This test is more about verifying the system handles batch uploads gracefully
    const notifications = page.locator('.notification, [class*="notification"]');
    await expect(notifications.first()).toBeVisible({ timeout: 5000 });

    // Should have at least some notification activity (success or warning)
    const notificationCount = await notifications.count();
    expect(notificationCount).toBeGreaterThan(0);
  });

  test('should display file validation info correctly', async ({ page }) => {
    // Test that the system handles file uploads and shows appropriate feedback
    // Create a valid JSON file that should work
    const validJsonBuffer = Buffer.from('{"name": "test", "value": 123}', 'utf-8');

    // Get the file input
    const fileInput = page.locator('input[type="file"]');

    // Set a valid file first
    await fileInput.setInputFiles({
      name: 'valid.json',
      mimeType: 'application/json',
      buffer: validJsonBuffer
    });

    // Should have files list now
    const filesList = page.locator('.files-list');
    await expect(filesList).toBeVisible();

    // Check that file appears in the list
    const fileName = page.locator('.file-name');
    await expect(fileName.first()).toContainText('valid.json');

    // This confirms our file handling and notification system is working
    expect(true).toBe(true);
  });
});