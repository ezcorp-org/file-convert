import { test, expect } from '@playwright/test';

test('Debug conversion issue', async ({ page }) => {
  // Enable console logging
  page.on('console', (msg) => {
    console.log(`Browser console: ${msg.text()}`);
  });

  // Listen for errors
  page.on('pageerror', (err) => {
    console.log(`Page error: ${err.message}`);
  });

  // Go to our test page
  await page.goto('/test-worker-fix.html');
  
  // Wait for page to load
  await expect(page.locator('h1')).toHaveText('Test Worker Fix');
  
  // Click the test button
  await page.click('#testBtn');
  
  // Wait for some output
  await page.waitForTimeout(10000);
  
  // Check what happened
  const result = await page.locator('#result').textContent();
  console.log('Test result:', result);
  
  // Take a screenshot
  await page.screenshot({ path: 'debug-conversion-result.png' });
});