import { test, expect, calculateTimeout } from '../fixtures';

test.describe('Infrastructure Validation', () => {
	test.describe('Timeout Configuration', () => {
		test('calculates appropriate timeouts for different file sizes', async () => {
			// Small file, simple operation
			const smallSimple = calculateTimeout(1, 'simple');
			expect(smallSimple).toBe(32000); // 30000 base + 1*2000*1

			// Medium file, medium complexity
			const mediumMedium = calculateTimeout(10, 'medium');
			expect(mediumMedium).toBe(70000); // 30000 base + 10*2000*2

			// Large file, complex operation
			const largeComplex = calculateTimeout(50, 'complex');
			expect(largeComplex).toBe(430000); // 30000 base + 50*2000*4
		});
	});

	test.describe('FileHelper', () => {
		test('uploads a file and verifies it appears in UI', async ({ page, fileHelper }) => {
			await page.goto('/convert');
			await page.waitForLoadState('networkidle');

			// Create a minimal valid PNG (1x1 transparent pixel)
			const pngData = Buffer.from([
				0x89,
				0x50,
				0x4e,
				0x47,
				0x0d,
				0x0a,
				0x1a,
				0x0a,
				0x00,
				0x00,
				0x00,
				0x0d,
				0x49,
				0x48,
				0x44,
				0x52,
				0x00,
				0x00,
				0x00,
				0x01,
				0x00,
				0x00,
				0x00,
				0x01,
				0x08,
				0x06,
				0x00,
				0x00,
				0x00,
				0x1f,
				0x15,
				0xc4,
				0x89,
				0x00,
				0x00,
				0x00,
				0x0a,
				0x49,
				0x44,
				0x41,
				0x54,
				0x78,
				0x9c,
				0x63,
				0x00,
				0x01,
				0x00,
				0x00,
				0x05,
				0x00,
				0x01,
				0x0d,
				0x0a,
				0x2d,
				0xb4,
				0x00,
				0x00,
				0x00,
				0x00,
				0x49,
				0x45,
				0x4e,
				0x44,
				0xae,
				0x42,
				0x60,
				0x82
			]);

			const testFile = {
				name: 'test-infrastructure.png',
				mimeType: 'image/png',
				buffer: pngData
			};

			// Upload using helper
			const count = await fileHelper.uploadFile(testFile);
			expect(count).toBe(1);

			// Verify file appears in UI using web-first assertion
			await expect(page.locator('.file-item')).toContainText('test-infrastructure.png');
		});

		test('uploads multiple files', async ({ page, fileHelper }) => {
			await page.goto('/convert');
			await page.waitForLoadState('networkidle');

			// Create minimal PNG files
			const pngData = Buffer.from([
				0x89,
				0x50,
				0x4e,
				0x47,
				0x0d,
				0x0a,
				0x1a,
				0x0a,
				0x00,
				0x00,
				0x00,
				0x0d,
				0x49,
				0x48,
				0x44,
				0x52,
				0x00,
				0x00,
				0x00,
				0x01,
				0x00,
				0x00,
				0x00,
				0x01,
				0x08,
				0x06,
				0x00,
				0x00,
				0x00,
				0x1f,
				0x15,
				0xc4,
				0x89,
				0x00,
				0x00,
				0x00,
				0x0a,
				0x49,
				0x44,
				0x41,
				0x54,
				0x78,
				0x9c,
				0x63,
				0x00,
				0x01,
				0x00,
				0x00,
				0x05,
				0x00,
				0x01,
				0x0d,
				0x0a,
				0x2d,
				0xb4,
				0x00,
				0x00,
				0x00,
				0x00,
				0x49,
				0x45,
				0x4e,
				0x44,
				0xae,
				0x42,
				0x60,
				0x82
			]);

			const files = [
				{ name: 'file1.png', mimeType: 'image/png', buffer: pngData },
				{ name: 'file2.png', mimeType: 'image/png', buffer: pngData }
			];

			const count = await fileHelper.uploadFiles(files);
			expect(count).toBe(2);

			await expect(page.locator('.file-item')).toHaveCount(2);
		});
	});

	test.describe('WorkerLifecycle', () => {
		test('fixture is available and has expected methods', async ({ workerLifecycle }) => {
			// Verify the fixture has the expected API
			expect(typeof workerLifecycle.waitForWorkerReady).toBe('function');
			expect(typeof workerLifecycle.terminateAll).toBe('function');
			expect(typeof workerLifecycle.getActiveWorkerCount).toBe('function');
			expect(typeof workerLifecycle.isWorkerReady).toBe('function');
		});

		test('terminateAll completes without error', async ({ page, workerLifecycle }) => {
			await page.goto('/convert');
			await page.waitForLoadState('networkidle');

			// Terminate should work even if no workers active
			await expect(async () => {
				await workerLifecycle.terminateAll();
			}).not.toThrow();

			// Verify count is 0 after termination
			expect(workerLifecycle.getActiveWorkerCount()).toBe(0);
		});
	});

	test.describe('DownloadHelper', () => {
		test('validates file extension correctly', async ({ downloadHelper }) => {
			expect(downloadHelper.validateExtension('test.png', 'png')).toBe(true);
			expect(downloadHelper.validateExtension('test.PNG', 'png')).toBe(true);
			expect(downloadHelper.validateExtension('test.jpg', 'png')).toBe(false);
			expect(downloadHelper.validateExtension('test.tar.gz', 'gz')).toBe(true);
		});
	});

	test.describe('Full Conversion Flow with Fixtures', () => {
		test('complete flow: upload, convert, download', async (
			{ page, fileHelper, downloadHelper },
			testInfo
		) => {
			// Apply dynamic timeout for this test
			testInfo.setTimeout(calculateTimeout(1, 'medium'));

			await page.goto('/convert');
			await page.waitForLoadState('networkidle');

			// Create minimal PNG
			const pngData = Buffer.from([
				0x89,
				0x50,
				0x4e,
				0x47,
				0x0d,
				0x0a,
				0x1a,
				0x0a,
				0x00,
				0x00,
				0x00,
				0x0d,
				0x49,
				0x48,
				0x44,
				0x52,
				0x00,
				0x00,
				0x00,
				0x01,
				0x00,
				0x00,
				0x00,
				0x01,
				0x08,
				0x06,
				0x00,
				0x00,
				0x00,
				0x1f,
				0x15,
				0xc4,
				0x89,
				0x00,
				0x00,
				0x00,
				0x0a,
				0x49,
				0x44,
				0x41,
				0x54,
				0x78,
				0x9c,
				0x63,
				0x00,
				0x01,
				0x00,
				0x00,
				0x05,
				0x00,
				0x01,
				0x0d,
				0x0a,
				0x2d,
				0xb4,
				0x00,
				0x00,
				0x00,
				0x00,
				0x49,
				0x45,
				0x4e,
				0x44,
				0xae,
				0x42,
				0x60,
				0x82
			]);

			// Upload using fixture
			const testFile = {
				name: 'convert-test.png',
				mimeType: 'image/png',
				buffer: pngData
			};
			await fileHelper.uploadFile(testFile);

			// Select output format (JPEG)
			const jpegOption = page
				.locator('.format-option')
				.filter({ hasText: /JPEG|JPG/i })
				.first();
			await jpegOption.click();

			// Start conversion
			await page.locator('.convert-btn').first().click();

			// Wait for completion - look for the file download button specifically
			await expect(page.locator('.download-btn').first()).toBeVisible({ timeout: 30000 });

			// Download and validate
			const result = await downloadHelper.downloadFile('.download-btn');
			expect(result.buffer.length).toBeGreaterThan(0);
			// Accept both .jpg and .jpeg extensions
			const isJpeg =
				downloadHelper.validateExtension(result.filename, 'jpg') ||
				downloadHelper.validateExtension(result.filename, 'jpeg');
			expect(isJpeg).toBe(true);
		});
	});
});
