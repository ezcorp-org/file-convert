import { test, expect, ImageFactory } from '../../fixtures';

test.describe('File Size Variants', () => {
	const FILE_SIZE_VARIANTS = [
		{ name: 'tiny', width: 10, height: 10 }, // ~1KB
		{ name: 'small', width: 100, height: 100 }, // ~10KB
		{ name: 'medium', width: 500, height: 500 }, // ~100KB
		{ name: 'large', width: 1000, height: 1000 }, // ~1MB
		{ name: 'xlarge', width: 2000, height: 2000 } // ~4-10MB
	];

	for (const { name, width, height } of FILE_SIZE_VARIANTS) {
		test(`handles ${name} file (${width}x${height})`, async ({ page, fileHelper }, testInfo) => {
			// Adjust timeout for larger files
			if (width > 1000) {
				testInfo.setTimeout(60000); // 60s for large files
			}

			const buffer = await ImageFactory.createPNG({ width, height });
			const fileSizeKB = Math.round(buffer.length / 1024);

			// Log file size for debugging (not an assertion)
			console.log(`${name} file: ${fileSizeKB}KB (${width}x${height})`);

			const fileData = fileHelper.createFileData(buffer, `${name}.png`, 'image/png');

			await page.goto('/convert');
			await page.waitForLoadState('networkidle');

			const count = await fileHelper.uploadFile(fileData);
			expect(count).toBe(1);

			// Verify file appears in UI
			await expect(page.locator('.file-item')).toContainText(`${name}.png`);
			await expect(page.locator('.configure-section, .format-options')).toBeVisible();
		});
	}

	// Skip very large file test in normal runs (too slow for CI)
	// Uncomment to test manually:
	// test.skip('handles very large file (100MB)', async ({ page, fileHelper }, testInfo) => {
	//   testInfo.setTimeout(180000); // 3 minutes
	//
	//   const buffer = await ImageFactory.createPNG({ width: 5000, height: 5000 });
	//   const fileSizeMB = Math.round(buffer.length / 1024 / 1024);
	//   expect(fileSizeMB).toBeGreaterThanOrEqual(50);
	//
	//   const fileData = fileHelper.createFileData(buffer, 'very-large.png', 'image/png');
	//
	//   await page.goto('/convert');
	//   await page.waitForLoadState('networkidle');
	//
	//   const count = await fileHelper.uploadFile(fileData);
	//   expect(count).toBe(1);
	// });
});
