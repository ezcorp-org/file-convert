import { test, expect } from '@playwright/test';

test.describe('Convert Page Manual Test', () => {
  test('manual inspection of convert page', async ({ page }) => {
    // Navigate to convert page
    await page.goto('http://localhost:5173/convert');
    
    // Wait for page to load
    await page.waitForSelector('h1', { timeout: 5000 });
    
    // Check heading
    const heading = await page.textContent('h1');
    console.log('Heading:', heading);
    
    // Click on the drop zone to open file dialog
    const dropZone = await page.locator('.drop-zone').first();
    if (await dropZone.count() > 0) {
      console.log('Drop zone found');
      
      // Trigger file input programmatically
      await page.evaluate(() => {
        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (input) {
          // Create a fake file
          const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
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
          console.log('Available formats:', options);
          
          // Try to select first real option (skip placeholder)
          if (options.length > 1) {
            await dropdown.selectOption({ index: 1 });
            const selectedValue = await dropdown.inputValue();
            console.log('Selected format value:', selectedValue);
            
            // Check if preview appears
            const preview = await page.locator('.format-preview');
            const previewVisible = await preview.isVisible();
            console.log('Preview visible:', previewVisible);
            
            if (previewVisible) {
              const previewText = await preview.textContent();
              console.log('Preview text:', previewText);
            }
            
            // Check convert button
            const convertBtn = await page.locator('.convert-button');
            const btnVisible = await convertBtn.isVisible();
            console.log('Convert button visible:', btnVisible);
            
            if (btnVisible) {
              const btnText = await convertBtn.textContent();
              console.log('Convert button text:', btnText);
            }
          }
        }
      }
    }
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/convert-manual.png', fullPage: true });
    
    console.log('Test complete - check screenshot at test-results/convert-manual.png');
  });
});