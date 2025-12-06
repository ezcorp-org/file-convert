import { test, expect } from '@playwright/test';

test.describe('Convert Page Working Test', () => {
  test('diagnose convert page error', async ({ page }) => {
    // Capture console messages
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    });

    // Capture page errors
    const pageErrors: string[] = [];
    page.on('pageerror', error => {
      pageErrors.push(error.message);
      console.error('Page error:', error.message);
    });

    // Navigate to the page
    console.log('Navigating to convert page...');
    try {
      const response = await page.goto('/convert', {
        waitUntil: 'domcontentloaded',
        timeout: 10000
      });
      
      console.log('Response status:', response?.status());
      
      if (response?.status() === 500) {
        // Try to get error details from the response
        const responseText = await response.text();
        if (responseText.includes('Internal Error')) {
          console.log('Server returned Internal Error');
        }
        
        // Check server logs
        console.log('\n=== Checking for specific errors ===');
        
        // Navigate to home page first
        await page.goto('/');
        
        // Try accessing convert via JavaScript
        const result = await page.evaluate(async () => {
          try {
            const response = await fetch('/convert');
            const text = await response.text();
            return {
              status: response.status,
              hasError: text.includes('Error'),
              snippet: text.substring(0, 500)
            };
          } catch (e) {
            return { error: e.message };
          }
        });
        
        console.log('Fetch result:', result);
      }
    } catch (error) {
      console.error('Navigation error:', error);
    }

    // Print all console messages
    if (consoleMessages.length > 0) {
      console.log('\n=== Console Messages ===');
      consoleMessages.forEach(msg => console.log(msg));
    }

    // Print all page errors
    if (pageErrors.length > 0) {
      console.log('\n=== Page Errors ===');
      pageErrors.forEach(err => console.log(err));
    }
  });

  test('test without SSR disabled', async ({ page }) => {
    // Try to directly access the API if available
    const response = await page.request.get('/convert');
    console.log('Direct request status:', response.status());
    
    if (response.status() !== 200) {
      const text = await response.text();
      console.log('Response body preview:', text.substring(0, 500));
    }
  });
});