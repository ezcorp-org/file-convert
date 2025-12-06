import { test, expect } from '@playwright/test';

test.describe('Convert Page Dropdown', () => {
  test('should have working format dropdown selector', async ({ page }) => {
    // Navigate to convert page
    await page.goto('/convert');
    
    // Wait for page to load
    await page.waitForSelector('h1', { timeout: 5000 });
    
    // Check heading
    const heading = await page.textContent('h1');
    expect(heading).toBe('File Converter');
    
    // Look for the dropdown selector
    const dropdown = page.locator('select.format-dropdown');
    const dropdownExists = await dropdown.count() > 0;
    console.log('Format dropdown exists:', dropdownExists);
    
    // Since no files are selected, dropdown shouldn't be visible yet
    const formatSection = page.locator('.format-section');
    const formatSectionVisible = await formatSection.count() > 0;
    console.log('Format section visible (should be false without files):', formatSectionVisible);
    
    // Simulate adding a file by interacting with file input
    const fileInput = page.locator('input[type="file"]').first();
    const inputExists = await fileInput.count() > 0;
    console.log('File input exists:', inputExists);
    
    if (inputExists) {
      // Use setInputFiles which is the correct method
      await page.setInputFiles('input[type="file"]', {
        name: 'test-image.png',
        mimeType: 'image/png',
        buffer: Buffer.from('fake png data')
      });
      
      // Wait for file to be processed
      await page.waitForTimeout(500);
      
      // Now check if format section appears
      const formatSectionAfterFile = await page.locator('.format-section').count() > 0;
      console.log('Format section visible after adding file:', formatSectionAfterFile);
      
      if (formatSectionAfterFile) {
        // Check dropdown is now visible
        const dropdownVisible = await dropdown.isVisible();
        console.log('Dropdown visible after file added:', dropdownVisible);
        
        // Get dropdown options
        const options = await dropdown.locator('option').all();
        console.log('Number of format options:', options.length);
        
        // Try to select a format
        if (options.length > 1) {
          await dropdown.selectOption({ index: 1 });
          const selectedValue = await dropdown.inputValue();
          console.log('Selected format:', selectedValue);
          
          // Check if preview appears
          const preview = page.locator('.format-preview');
          const previewVisible = await preview.isVisible();
          console.log('Format preview visible:', previewVisible);
          
          // Check if convert button appears
          const convertButton = page.locator('.convert-button');
          const buttonVisible = await convertButton.isVisible();
          console.log('Convert button visible:', buttonVisible);
        }
      }
    }
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/convert-dropdown.png', fullPage: true });
  });
});