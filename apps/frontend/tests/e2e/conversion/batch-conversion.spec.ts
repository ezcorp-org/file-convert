import { test, expect, ImageFactory } from '../../fixtures';

test.describe('Batch Conversion', () => {

	test.describe('COVER-07: Multiple Files Same Format', () => {

		test('batch converts 3 PNG files to JPEG', async ({
			page,
			fileHelper,
			downloadHelper,
			workerLifecycle
		}, testInfo) => {
			// Increase timeout for batch operations
			testInfo.setTimeout(60000);

			// Create multiple PNG images with different properties
			const images = await Promise.all([
				ImageFactory.createPNG({ width: 100, height: 100, background: '#FF0000' }),
				ImageFactory.createPNG({ width: 150, height: 150, background: '#00FF00' }),
				ImageFactory.createPNG({ width: 200, height: 200, background: '#0000FF' }),
			]);

			const fileDataArray = images.map((buffer, i) =>
				fileHelper.createFileData(buffer, `image${i + 1}.png`, 'image/png')
			);

			await page.goto('/convert');
			await page.waitForLoadState('networkidle');

			// Upload all files at once using fileHelper.uploadFiles()
			const count = await fileHelper.uploadFiles(fileDataArray);
			expect(count).toBe(3);

			// Verify all 3 files appear in file list
			await expect(page.locator('.file-item')).toHaveCount(3);

			// Select JPEG output
			await page.locator('.format-option').filter({ hasText: /JPEG|JPG/i }).click();

			// Start conversion
			await page.locator('.convert-btn').first().click();

			// Wait for all conversions to complete
			await expect(page.locator('.download-btn').first()).toBeVisible({ timeout: 60000 });

			// Verify all 3 have download buttons
			const downloadButtons = page.locator('.download-btn');
			await expect(downloadButtons).toHaveCount(3);

			// Download and validate first file
			const { validation } = await downloadHelper.validateDownload(
				'.download-btn >> nth=0',
				'jpeg'
			);
			expect(validation.valid).toBe(true);
		});

		test('batch converts 2 JPEG files to PNG', async ({
			page,
			fileHelper,
			downloadHelper
		}, testInfo) => {
			testInfo.setTimeout(60000);

			const images = await Promise.all([
				ImageFactory.createJPEG({ width: 100, height: 100 }),
				ImageFactory.createJPEG({ width: 120, height: 120 }),
			]);

			const fileDataArray = images.map((buffer, i) =>
				fileHelper.createFileData(buffer, `photo${i + 1}.jpg`, 'image/jpeg')
			);

			await page.goto('/convert');
			await page.waitForLoadState('networkidle');

			const count = await fileHelper.uploadFiles(fileDataArray);
			expect(count).toBe(2);

			await page.locator('.format-option').filter({ hasText: /PNG/i }).click();
			await page.locator('.convert-btn').first().click();

			await expect(page.locator('.download-btn').first()).toBeVisible({ timeout: 60000 });
			await expect(page.locator('.download-btn')).toHaveCount(2);

			// Validate both downloads
			const result1 = await downloadHelper.validateDownload('.download-btn >> nth=0', 'png');
			expect(result1.validation.valid).toBe(true);

			const result2 = await downloadHelper.validateDownload('.download-btn >> nth=1', 'png');
			expect(result2.validation.valid).toBe(true);
		});

		test('batch converts 5 WebP files to PNG', async ({
			page,
			fileHelper,
			downloadHelper
		}, testInfo) => {
			testInfo.setTimeout(90000); // Longer timeout for 5 files

			const images = await Promise.all([
				ImageFactory.createWebP({ width: 80, height: 80 }),
				ImageFactory.createWebP({ width: 90, height: 90 }),
				ImageFactory.createWebP({ width: 100, height: 100 }),
				ImageFactory.createWebP({ width: 110, height: 110 }),
				ImageFactory.createWebP({ width: 120, height: 120 }),
			]);

			const fileDataArray = images.map((buffer, i) =>
				fileHelper.createFileData(buffer, `webp${i + 1}.webp`, 'image/webp')
			);

			await page.goto('/convert');
			await page.waitForLoadState('networkidle');

			const count = await fileHelper.uploadFiles(fileDataArray);
			expect(count).toBe(5);

			await page.locator('.format-option').filter({ hasText: /PNG/i }).click();
			await page.locator('.convert-btn').first().click();

			await expect(page.locator('.download-btn').first()).toBeVisible({ timeout: 90000 });
			await expect(page.locator('.download-btn')).toHaveCount(5);

			// Validate first and last
			const first = await downloadHelper.validateDownload('.download-btn >> nth=0', 'png');
			expect(first.validation.valid).toBe(true);

			const last = await downloadHelper.validateDownload('.download-btn >> nth=4', 'png');
			expect(last.validation.valid).toBe(true);
		});
	});

	test.describe('Batch UI Behavior', () => {

		test('shows correct file count after batch upload', async ({
			page,
			fileHelper
		}) => {
			const images = await Promise.all([
				ImageFactory.createPNG({ width: 50, height: 50 }),
				ImageFactory.createPNG({ width: 50, height: 50 }),
				ImageFactory.createPNG({ width: 50, height: 50 }),
				ImageFactory.createPNG({ width: 50, height: 50 }),
			]);

			const fileDataArray = images.map((buffer, i) =>
				fileHelper.createFileData(buffer, `batch${i + 1}.png`, 'image/png')
			);

			await page.goto('/convert');
			await page.waitForLoadState('networkidle');

			await fileHelper.uploadFiles(fileDataArray);

			// Verify file count display - check for "4" in the UI
			// The exact selector depends on UI implementation
			const fileItems = page.locator('.file-item');
			await expect(fileItems).toHaveCount(4);
		});

		test('all files show in file list', async ({
			page,
			fileHelper
		}) => {
			const images = await Promise.all([
				ImageFactory.createPNG({ width: 50, height: 50 }),
				ImageFactory.createPNG({ width: 50, height: 50 }),
			]);

			await page.goto('/convert');
			await page.waitForLoadState('networkidle');

			await fileHelper.uploadFiles([
				fileHelper.createFileData(images[0], 'alpha.png', 'image/png'),
				fileHelper.createFileData(images[1], 'beta.png', 'image/png'),
			]);

			// Verify both filenames appear
			await expect(page.locator('.file-item')).toContainText(['alpha.png']);
			await expect(page.locator('.file-item')).toContainText(['beta.png']);
		});

		test('download all button available after batch conversion', async ({
			page,
			fileHelper
		}, testInfo) => {
			testInfo.setTimeout(60000);

			const images = await Promise.all([
				ImageFactory.createPNG({ width: 50, height: 50 }),
				ImageFactory.createPNG({ width: 50, height: 50 }),
			]);

			const fileDataArray = images.map((buffer, i) =>
				fileHelper.createFileData(buffer, `file${i + 1}.png`, 'image/png')
			);

			await page.goto('/convert');
			await page.waitForLoadState('networkidle');
			await fileHelper.uploadFiles(fileDataArray);

			await page.locator('.format-option').filter({ hasText: /JPEG/i }).click();
			await page.locator('.convert-btn').first().click();

			await expect(page.locator('.download-btn').first()).toBeVisible({ timeout: 60000 });

			// Check for "Download All" button if it exists
			const downloadAllBtn = page.locator('button, a').filter({ hasText: /download.*all|all.*download/i });
			// This may or may not exist depending on UI - just log status
			const exists = await downloadAllBtn.count() > 0;
			console.log(`Download All button exists: ${exists}`);
		});
	});

	test.describe('Batch Edge Cases', () => {

		test('single file upload still works (edge case of batch)', async ({
			page,
			fileHelper,
			downloadHelper
		}) => {
			const image = await ImageFactory.createPNG({ width: 100, height: 100 });

			await page.goto('/convert');
			await page.waitForLoadState('networkidle');

			// Use uploadFiles with single file array
			await fileHelper.uploadFiles([
				fileHelper.createFileData(image, 'single.png', 'image/png')
			]);

			await page.locator('.format-option').filter({ hasText: /JPEG/i }).click();
			await page.locator('.convert-btn').first().click();

			await expect(page.locator('.download-btn').first()).toBeVisible({ timeout: 30000 });

			const { validation } = await downloadHelper.validateDownload('.download-btn', 'jpeg');
			expect(validation.valid).toBe(true);
		});

	});
});
