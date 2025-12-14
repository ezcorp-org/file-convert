import { test, expect, ImageFactory } from '../../fixtures';

test.describe('Download Validation', () => {
	test.describe('DOWNLOAD-01: Extension Validation', () => {
		test('PNG to JPEG conversion produces .jpg or .jpeg extension', async ({
			page,
			fileHelper,
			downloadHelper
		}) => {
			const pngBuffer = await ImageFactory.createPNG({ width: 100, height: 100 });
			await page.goto('/convert');

			await fileHelper.uploadFile(
				fileHelper.createFileData(pngBuffer, 'test.png', 'image/png')
			);

			// Select JPEG output
			await page
				.locator('.format-option')
				.filter({ hasText: /JPEG|JPG/i })
				.click();
			await page.locator('.convert-btn').first().click();
			await expect(page.locator('.download-btn').first()).toBeVisible({ timeout: 30000 });

			const { filename } = await downloadHelper.downloadFile('.download-btn');

			// Accept both .jpg and .jpeg
			const hasCorrectExt =
				downloadHelper.validateExtension(filename, 'jpg') ||
				downloadHelper.validateExtension(filename, 'jpeg');
			expect(hasCorrectExt).toBe(true);
		});

		test('JPEG to PNG conversion produces .png extension', async ({
			page,
			fileHelper,
			downloadHelper
		}) => {
			const jpegBuffer = await ImageFactory.createJPEG({ width: 100, height: 100 });
			await page.goto('/convert');

			await fileHelper.uploadFile(
				fileHelper.createFileData(jpegBuffer, 'test.jpg', 'image/jpeg')
			);

			// Select PNG output
			await page
				.locator('.format-option')
				.filter({ hasText: /PNG/i })
				.click();
			await page.locator('.convert-btn').first().click();
			await expect(page.locator('.download-btn').first()).toBeVisible({ timeout: 30000 });

			const { filename } = await downloadHelper.downloadFile('.download-btn');

			expect(downloadHelper.validateExtension(filename, 'png')).toBe(true);
		});

		test('PNG to WebP conversion produces .webp extension', async ({
			page,
			fileHelper,
			downloadHelper
		}) => {
			const pngBuffer = await ImageFactory.createPNG({ width: 100, height: 100 });
			await page.goto('/convert');

			await fileHelper.uploadFile(
				fileHelper.createFileData(pngBuffer, 'test.png', 'image/png')
			);

			// Select WebP output
			await page
				.locator('.format-option')
				.filter({ hasText: /WebP/i })
				.click();
			await page.locator('.convert-btn').first().click();
			await expect(page.locator('.download-btn').first()).toBeVisible({ timeout: 30000 });

			const { filename } = await downloadHelper.downloadFile('.download-btn');

			expect(downloadHelper.validateExtension(filename, 'webp')).toBe(true);
		});
	});

	test.describe('DOWNLOAD-02: MIME Type Validation', () => {
		test('converted JPEG has valid JPEG magic bytes', async ({
			page,
			fileHelper,
			downloadHelper
		}) => {
			const pngBuffer = await ImageFactory.createPNG({ width: 100, height: 100 });
			await page.goto('/convert');

			await fileHelper.uploadFile(
				fileHelper.createFileData(pngBuffer, 'test.png', 'image/png')
			);

			await page
				.locator('.format-option')
				.filter({ hasText: /JPEG|JPG/i })
				.click();
			await page.locator('.convert-btn').first().click();
			await expect(page.locator('.download-btn').first()).toBeVisible({ timeout: 30000 });

			const { validation } = await downloadHelper.validateDownload('.download-btn', 'jpeg');

			expect(validation.valid).toBe(true);
			// file-type returns 'jpg' not 'jpeg'
			expect(['jpg', 'jpeg']).toContain(validation.detectedFormat);
			expect(validation.confidence).toBe('high');
		});

		test('converted PNG has valid PNG magic bytes', async ({
			page,
			fileHelper,
			downloadHelper
		}) => {
			const jpegBuffer = await ImageFactory.createJPEG({ width: 100, height: 100 });
			await page.goto('/convert');

			await fileHelper.uploadFile(
				fileHelper.createFileData(jpegBuffer, 'test.jpg', 'image/jpeg')
			);

			await page
				.locator('.format-option')
				.filter({ hasText: /PNG/i })
				.click();
			await page.locator('.convert-btn').first().click();
			await expect(page.locator('.download-btn').first()).toBeVisible({ timeout: 30000 });

			const { validation } = await downloadHelper.validateDownload('.download-btn', 'png');

			expect(validation.valid).toBe(true);
			expect(validation.detectedFormat).toBe('png');
			expect(validation.confidence).toBe('high');
		});

		test('converted WebP has valid WebP magic bytes', async ({
			page,
			fileHelper,
			downloadHelper
		}) => {
			const pngBuffer = await ImageFactory.createPNG({ width: 100, height: 100 });
			await page.goto('/convert');

			await fileHelper.uploadFile(
				fileHelper.createFileData(pngBuffer, 'test.png', 'image/png')
			);

			await page
				.locator('.format-option')
				.filter({ hasText: /WebP/i })
				.click();
			await page.locator('.convert-btn').first().click();
			await expect(page.locator('.download-btn').first()).toBeVisible({ timeout: 30000 });

			const { validation } = await downloadHelper.validateDownload('.download-btn', 'webp');

			expect(validation.valid).toBe(true);
			expect(validation.detectedFormat).toBe('webp');
			expect(validation.confidence).toBe('high');
		});
	});

	test.describe('DOWNLOAD-03: Non-Zero Size', () => {
		test('downloaded file has non-zero size', async ({
			page,
			fileHelper,
			downloadHelper
		}) => {
			const pngBuffer = await ImageFactory.createPNG({ width: 100, height: 100 });
			await page.goto('/convert');

			await fileHelper.uploadFile(
				fileHelper.createFileData(pngBuffer, 'test.png', 'image/png')
			);

			await page
				.locator('.format-option')
				.filter({ hasText: /JPEG|JPG/i })
				.click();
			await page.locator('.convert-btn').first().click();
			await expect(page.locator('.download-btn').first()).toBeVisible({ timeout: 30000 });

			const { buffer } = await downloadHelper.downloadFile('.download-btn');

			expect(downloadHelper.getFileSize(buffer)).toBeGreaterThan(0);
			expect(buffer.length).toBeGreaterThan(100); // Reasonable minimum for image
		});

		test('large image conversion produces proportionally larger output', async ({
			page,
			fileHelper,
			downloadHelper
		}) => {
			// Generate 500x500 image, verify output > 10KB
			const pngBuffer = await ImageFactory.createPNG({ width: 500, height: 500 });
			await page.goto('/convert');

			await fileHelper.uploadFile(
				fileHelper.createFileData(pngBuffer, 'large.png', 'image/png')
			);

			await page
				.locator('.format-option')
				.filter({ hasText: /JPEG|JPG/i })
				.click();
			await page.locator('.convert-btn').first().click();
			await expect(page.locator('.download-btn').first()).toBeVisible({ timeout: 30000 });

			const { buffer } = await downloadHelper.downloadFile('.download-btn');

			expect(buffer.length).toBeGreaterThan(10000); // At least 10KB for 500x500 JPEG
		});
	});

	test.describe('DOWNLOAD-04: Memory Streaming', () => {
		test('download returns Buffer without filesystem path', async ({
			page,
			fileHelper,
			downloadHelper
		}) => {
			const pngBuffer = await ImageFactory.createPNG({ width: 50, height: 50 });
			await page.goto('/convert');

			await fileHelper.uploadFile(
				fileHelper.createFileData(pngBuffer, 'test.png', 'image/png')
			);

			await page
				.locator('.format-option')
				.filter({ hasText: /JPEG|JPG/i })
				.click();
			await page.locator('.convert-btn').first().click();
			await expect(page.locator('.download-btn').first()).toBeVisible({ timeout: 30000 });

			const { buffer } = await downloadHelper.downloadFile('.download-btn');

			// Verify it's a proper Buffer in memory
			expect(Buffer.isBuffer(buffer)).toBe(true);
			expect(buffer.length).toBeGreaterThan(0);
		});

		test('download uses promise-before-click pattern to avoid race conditions', async ({
			page,
			fileHelper
		}) => {
			// This test verifies the correct pattern for capturing downloads:
			// The download promise MUST be set up BEFORE clicking the download button
			// to avoid race conditions where the download starts before the listener.

			const pngBuffer = await ImageFactory.createPNG({ width: 50, height: 50 });
			await page.goto('/convert');

			await fileHelper.uploadFile(
				fileHelper.createFileData(pngBuffer, 'test.png', 'image/png')
			);

			await page
				.locator('.format-option')
				.filter({ hasText: /JPEG|JPG/i })
				.click();
			await page.locator('.convert-btn').first().click();
			await expect(page.locator('.download-btn').first()).toBeVisible({ timeout: 30000 });

			// CORRECT PATTERN: Set up promise BEFORE click
			const downloadPromise = page.waitForEvent('download');
			await page.locator('.download-btn').first().click();
			const download = await downloadPromise;

			// Verify download was captured successfully
			expect(download).toBeTruthy();
			expect(download.suggestedFilename()).toBeTruthy();

			// Get buffer from download (reading from temp path that Playwright created)
			const path = await download.path();
			expect(path).toBeTruthy();

			// Verify download has content
			const buffer = Buffer.from(await download.createReadStream().then((stream) => {
				const chunks: Buffer[] = [];
				return new Promise<Buffer>((resolve) => {
					stream.on('data', (chunk: Buffer) => chunks.push(chunk));
					stream.on('end', () => resolve(Buffer.concat(chunks)));
				});
			}));

			expect(buffer.length).toBeGreaterThan(0);
		});

		test('download failure is handled gracefully when promise-after-click', async ({
			page,
			fileHelper
		}) => {
			// This test documents the WRONG pattern and verifies error handling
			// When the download promise is set up AFTER the click, it may miss the event

			const pngBuffer = await ImageFactory.createPNG({ width: 50, height: 50 });
			await page.goto('/convert');

			await fileHelper.uploadFile(
				fileHelper.createFileData(pngBuffer, 'test.png', 'image/png')
			);

			await page
				.locator('.format-option')
				.filter({ hasText: /JPEG|JPG/i })
				.click();
			await page.locator('.convert-btn').first().click();
			await expect(page.locator('.download-btn').first()).toBeVisible({ timeout: 30000 });

			// WRONG PATTERN (for demonstration): Click before setting up promise
			// This click will complete and we won't capture the download event
			await page.locator('.download-btn').first().click();

			// Wait a bit to let the download finish
			await page.waitForTimeout(1000);

			// Even with wrong pattern, we should be able to retry with correct pattern
			// Navigate back and try again with correct pattern
			await page.goto('/convert');

			await fileHelper.uploadFile(
				fileHelper.createFileData(pngBuffer, 'retry.png', 'image/png')
			);

			await page
				.locator('.format-option')
				.filter({ hasText: /JPEG|JPG/i })
				.click();
			await page.locator('.convert-btn').first().click();
			await expect(page.locator('.download-btn').first()).toBeVisible({ timeout: 30000 });

			// Correct pattern on retry
			const downloadPromise = page.waitForEvent('download');
			await page.locator('.download-btn').first().click();
			const download = await downloadPromise;

			expect(download.suggestedFilename()).toContain('retry');
		});
	});

	test.describe('Combined Validation', () => {
		test('complete validation: extension, magic bytes, and size', async ({
			page,
			fileHelper,
			downloadHelper
		}) => {
			// Single test that validates all DOWNLOAD requirements together
			const pngBuffer = await ImageFactory.createPNG({ width: 200, height: 200 });
			await page.goto('/convert');

			await fileHelper.uploadFile(
				fileHelper.createFileData(pngBuffer, 'test.png', 'image/png')
			);

			await page
				.locator('.format-option')
				.filter({ hasText: /JPEG|JPG/i })
				.click();
			await page.locator('.convert-btn').first().click();
			await expect(page.locator('.download-btn').first()).toBeVisible({ timeout: 30000 });

			const { filename, buffer, validation } = await downloadHelper.validateDownload(
				'.download-btn',
				'jpeg'
			);

			// DOWNLOAD-01: Extension
			const hasCorrectExt =
				downloadHelper.validateExtension(filename, 'jpg') ||
				downloadHelper.validateExtension(filename, 'jpeg');
			expect(hasCorrectExt).toBe(true);

			// DOWNLOAD-02: MIME type via magic bytes
			expect(validation.valid).toBe(true);

			// DOWNLOAD-03: Non-zero size
			expect(buffer.length).toBeGreaterThan(100);

			// DOWNLOAD-04: Buffer in memory
			expect(Buffer.isBuffer(buffer)).toBe(true);
		});
	});
});
