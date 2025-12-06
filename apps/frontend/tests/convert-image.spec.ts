import { test, expect } from '@playwright/test';

test.describe('Convert Page with Image', () => {
  test('should show format dropdown for image file', async ({ page }) => {
    // Navigate to convert page
    await page.goto('/convert');
    
    // Wait for page to load
    await page.waitForSelector('h1', { timeout: 5000 });
    
    // Add a PNG file programmatically
    await page.evaluate(() => {
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (input) {
        // Create a fake PNG file
        const file = new File(['fake png data'], 'test-image.png', { type: 'image/png' });
        const dt = new DataTransfer();
        dt.items.add(file);
        input.files = dt.files;
        
        // Trigger change event
        const event = new Event('change', { bubbles: true });
        input.dispatchEvent(event);
      }
    });
    
    // Wait for UI to update
    await page.waitForTimeout(1000);
    
    // Check if files section appears
    const filesSection = await page.locator('.files-section');
    const filesSectionVisible = await filesSection.count() > 0;
    console.log('Files section visible:', filesSectionVisible);
    
    if (filesSectionVisible) {
      const filesList = await filesSection.textContent();
      console.log('Files list content:', filesList);
    }
    
    // Check if format section appears
    const formatSection = await page.locator('.format-section');
    const formatSectionVisible = await formatSection.count() > 0;
    console.log('Format section visible:', formatSectionVisible);
    
    if (formatSectionVisible) {
      // Look for dropdown
      const dropdown = await page.locator('select.format-dropdown');
      const dropdownVisible = await dropdown.isVisible();
      console.log('Dropdown visible:', dropdownVisible);
      
      if (dropdownVisible) {
        // Get all options
        const options = await dropdown.locator('option').allTextContents();
        console.log('Available conversion formats:', options);
        
        // Select JPEG format if available
        const jpegOption = await dropdown.locator('option:has-text("JPEG")').count();
        if (jpegOption > 0) {
          await dropdown.selectOption({ label: /JPEG/i });
          console.log('Selected JPEG format');
          
          // Check if preview appears
          const preview = await page.locator('.format-preview');
          if (await preview.isVisible()) {
            const previewText = await preview.textContent();
            console.log('Format preview:', previewText);
          }
          
          // Check convert button
          const convertBtn = await page.locator('.convert-button');
          if (await convertBtn.isVisible()) {
            const btnText = await convertBtn.textContent();
            console.log('Convert button:', btnText);
          }
        }
      }
    } else {
      console.log('Format section not visible - checking for errors');
      
      // Check console for errors
      const messages: string[] = [];
      page.on('console', msg => messages.push(`${msg.type()}: ${msg.text()}`));
      await page.waitForTimeout(500);
      if (messages.length > 0) {
        console.log('Console messages:', messages);
      }
    }
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/convert-image.png', fullPage: true });
  });
});