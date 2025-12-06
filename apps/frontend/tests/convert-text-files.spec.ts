import { test, expect } from '@playwright/test';
import { Buffer } from 'buffer';

test.describe('Text File Conversion Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/convert');
    await page.waitForLoadState('networkidle');
  });

  test('should show error for unsupported TXT files', async ({ page }) => {
    // Create a text file buffer (TXT files are no longer supported)
    const textContent = 'This is a test text file.\nIt has multiple lines.\nTesting TXT file rejection.';
    const textBuffer = Buffer.from(textContent, 'utf-8');

    // Get the file input
    const fileInput = page.locator('input[type="file"]');
    
    // Set the file
    await fileInput.setInputFiles({
      name: 'test.txt',
      mimeType: 'text/plain',
      buffer: textBuffer
    });

    // Wait for file to be processed
    await page.waitForTimeout(2000);

    // Check for error notification or that file is not added (TXT is no longer supported)
    const errorNotifications = page.locator('.notification--error, .notification.notification--error, [class*="error"]');
    const hasError = await errorNotifications.count() > 0;
    const filesListEmpty = await page.locator('.files-list').count() === 0;
    
    // Either error notification appears or file is rejected
    expect(hasError || filesListEmpty).toBe(true);
  });

  test('should upload and convert CSV to JSON', async ({ page }) => {
    // Create a CSV file buffer
    const csvContent = 'Name,Age,City\nJohn,30,New York\nJane,25,Los Angeles\nBob,35,Chicago';
    const csvBuffer = Buffer.from(csvContent, 'utf-8');

    // Get the file input
    const fileInput = page.locator('input[type="file"]');
    
    // Set the file
    await fileInput.setInputFiles({
      name: 'test.csv',
      mimeType: 'text/csv',
      buffer: csvBuffer
    });

    // Wait for file to be processed
    await page.waitForTimeout(1000);

    // Check if file was uploaded
    const fileName = await page.locator('.file-name').first().textContent();
    expect(fileName).toContain('test.csv');

    // Select JSON as output format using button click
    await page.click('button:has-text("JSON")');

    // Start conversion
    await page.click('button:has-text("Convert")');

    // Wait for conversion to complete
    await page.waitForSelector('.result-item.success', { timeout: 30000 });

    // Check if download button exists
    const downloadButton = page.locator('button:has-text("Download")').first();
    await expect(downloadButton).toBeVisible();
  });

  test('should upload and convert JSON to YAML', async ({ page }) => {
    // Create a JSON file buffer
    const jsonContent = JSON.stringify({
      name: 'Test',
      version: '1.0.0',
      features: ['convert', 'upload', 'download']
    }, null, 2);
    const jsonBuffer = Buffer.from(jsonContent, 'utf-8');

    // Get the file input
    const fileInput = page.locator('input[type="file"]');
    
    // Set the file
    await fileInput.setInputFiles({
      name: 'test.json',
      mimeType: 'application/json',
      buffer: jsonBuffer
    });

    // Wait for file to be processed
    await page.waitForTimeout(1000);

    // Check if file was uploaded
    const fileName = await page.locator('.file-name').first().textContent();
    expect(fileName).toContain('test.json');

    // Select YAML as output format using button click
    await page.click('button:has-text("YAML")');

    // Start conversion
    await page.click('button:has-text("Convert")');

    // Wait for conversion to complete
    await page.waitForSelector('.result-item.success', { timeout: 30000 });

    // Check if download button exists
    const downloadButton = page.locator('button:has-text("Download")').first();
    await expect(downloadButton).toBeVisible();
  });

  test('should upload and convert JSON to CSV', async ({ page }) => {
    // Create a JSON file buffer with array data
    const jsonContent = JSON.stringify([
      { name: 'John', age: 30, city: 'New York' },
      { name: 'Jane', age: 25, city: 'Los Angeles' },
      { name: 'Bob', age: 35, city: 'Chicago' }
    ], null, 2);
    const jsonBuffer = Buffer.from(jsonContent, 'utf-8');

    // Get the file input
    const fileInput = page.locator('input[type="file"]');
    
    // Set the file
    await fileInput.setInputFiles({
      name: 'test.json',
      mimeType: 'application/json',
      buffer: jsonBuffer
    });

    // Wait for file to be processed
    await page.waitForTimeout(1000);

    // Check if file was uploaded
    const fileName = await page.locator('.file-name').first().textContent();
    expect(fileName).toContain('test.json');

    // Select CSV as output format using button click
    await page.click('button:has-text("CSV")');

    // Start conversion
    await page.click('button:has-text("Convert")');

    // Wait for conversion to complete
    await page.waitForSelector('.result-item.success', { timeout: 30000 });

    // Check if download button exists
    const downloadButton = page.locator('button:has-text("Download")').first();
    await expect(downloadButton).toBeVisible();
  });

  test('should show error toast for unsupported file type', async ({ page }) => {
    // Create a fake binary file
    const binaryBuffer = Buffer.from([0x00, 0x01, 0x02, 0x03]);

    // Get the file input
    const fileInput = page.locator('input[type="file"]');
    
    // Set the file with unsupported extension
    await fileInput.setInputFiles({
      name: 'test.xyz',
      mimeType: 'application/octet-stream',
      buffer: binaryBuffer
    });

    // Wait for error to appear
    await page.waitForTimeout(2000);

    // Check for error message or notification
    const errorNotification = page.locator('.notification--error, .notification.notification--error, [class*="error"]');
    await expect(errorNotification.first()).toBeVisible({ timeout: 5000 });
    
    const errorText = await errorNotification.first().textContent();
    expect(errorText).toContain('Unsupported file type');
  });
});