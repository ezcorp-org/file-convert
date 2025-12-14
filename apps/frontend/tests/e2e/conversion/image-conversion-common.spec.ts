import { test, expect, ImageFactory } from '../../fixtures';

// Common image conversion paths (high-usage formats)
// Note: TIFF excluded as it's not fully implemented in the app yet
const COMMON_CONVERSIONS = [
	// PNG source
	{ from: 'png', to: 'jpeg', mimeType: 'image/png' },
	{ from: 'png', to: 'webp', mimeType: 'image/png' },
	// JPEG source
	{ from: 'jpeg', to: 'png', mimeType: 'image/jpeg' },
	{ from: 'jpeg', to: 'webp', mimeType: 'image/jpeg' },
	// WebP source
	{ from: 'webp', to: 'png', mimeType: 'image/webp' },
	{ from: 'webp', to: 'jpeg', mimeType: 'image/webp' }
];

// Helper to get correct extension for file
function getExtension(format: string): string {
	const extensions: Record<string, string> = {
		png: 'png',
		jpeg: 'jpg',
		webp: 'webp',
		tiff: 'tiff'
	};
	return extensions[format] || format;
}

// Helper to get UI text for format selection
function getFormatUIText(format: string): RegExp {
	const uiText: Record<string, RegExp> = {
		png: /PNG/i,
		jpeg: /JPEG|JPG/i,
		webp: /WebP/i,
		tiff: /TIFF/i
	};
	return uiText[format] || new RegExp(format, 'i');
}

test.describe('Common Image Conversions', () => {
	for (const { from, to, mimeType } of COMMON_CONVERSIONS) {
		test(`converts ${from.toUpperCase()} to ${to.toUpperCase()}`, async ({
			page,
			fileHelper,
			downloadHelper
		}) => {
			// Generate source image
			const sourceBuffer = await ImageFactory.create({
				format: from as 'png' | 'jpeg' | 'webp' | 'tiff',
				width: 100,
				height: 100,
				background: '#FF0000'
			});

			const fileData = fileHelper.createFileData(
				sourceBuffer,
				`test.${getExtension(from)}`,
				mimeType
			);

			// Navigate to convert page
			await page.goto('/convert');
			await page.waitForLoadState('networkidle');

			// Upload source file
			await fileHelper.uploadFile(fileData);

			// Select output format
			const formatOption = page.locator('.format-option').filter({ hasText: getFormatUIText(to) });
			await formatOption.click();

			// Start conversion
			await page.locator('.convert-btn').first().click();

			// Wait for completion
			await expect(page.locator('.download-btn').first()).toBeVisible({ timeout: 30000 });

			// Download and validate
			const { filename, buffer, validation } = await downloadHelper.validateDownload(
				'.download-btn',
				to
			);

			// Validate format
			expect(validation.valid).toBe(true);

			// Validate size
			expect(buffer.length).toBeGreaterThan(0);

			// Log for debugging if needed
			console.log(`${from} -> ${to}: ${buffer.length} bytes, detected: ${validation.detectedFormat}`);
		});
	}
});

test.describe('Conversion UI States', () => {
	test('shows completion UI after conversion', async ({
		page,
		fileHelper,
		downloadHelper
	}) => {
		const sourceBuffer = await ImageFactory.createPNG({ width: 100, height: 100 });
		const fileData = fileHelper.createFileData(sourceBuffer, 'test.png', 'image/png');

		await page.goto('/convert');
		await page.waitForLoadState('networkidle');
		await fileHelper.uploadFile(fileData);

		await page.locator('.format-option').filter({ hasText: /JPEG/i }).click();
		await page.locator('.convert-btn').first().click();

		// Wait for completion - download button visible indicates success
		await expect(page.locator('.download-btn').first()).toBeVisible({ timeout: 30000 });

		// Verify conversion produced valid output
		const { validation } = await downloadHelper.validateDownload('.download-btn', 'jpeg');
		expect(validation.valid).toBe(true);
	});

	test('allows starting new conversion after completion', async ({
		page,
		fileHelper,
		downloadHelper
	}) => {
		// First conversion
		const sourceBuffer = await ImageFactory.createPNG({ width: 100, height: 100 });
		await page.goto('/convert');
		await page.waitForLoadState('networkidle');

		await fileHelper.uploadFile(
			fileHelper.createFileData(sourceBuffer, 'first.png', 'image/png')
		);
		await page.locator('.format-option').filter({ hasText: /JPEG/i }).click();
		await page.locator('.convert-btn').first().click();
		await expect(page.locator('.download-btn').first()).toBeVisible({ timeout: 30000 });

		// Navigate back to start new conversion
		await page.goto('/convert');
		await page.waitForLoadState('networkidle');

		// Second conversion should work
		const secondBuffer = await ImageFactory.createJPEG({ width: 100, height: 100 });
		await fileHelper.uploadFile(
			fileHelper.createFileData(secondBuffer, 'second.jpg', 'image/jpeg')
		);
		await page.locator('.format-option').filter({ hasText: /PNG/i }).click();
		await page.locator('.convert-btn').first().click();

		const { validation } = await downloadHelper.validateDownload('.download-btn', 'png');
		expect(validation.valid).toBe(true);
	});

	test('handles multiple sequential conversions', async ({
		page,
		fileHelper,
		downloadHelper
	}) => {
		await page.goto('/convert');
		await page.waitForLoadState('networkidle');

		// Conversion 1: PNG -> JPEG
		const png = await ImageFactory.createPNG({ width: 50, height: 50 });
		await fileHelper.uploadFile(fileHelper.createFileData(png, 'test1.png', 'image/png'));
		await page.locator('.format-option').filter({ hasText: /JPEG/i }).click();
		await page.locator('.convert-btn').first().click();
		await expect(page.locator('.download-btn').first()).toBeVisible({ timeout: 30000 });

		// Reset for second conversion
		await page.goto('/convert');
		await page.waitForLoadState('networkidle');

		// Conversion 2: JPEG -> WebP
		const jpeg = await ImageFactory.createJPEG({ width: 50, height: 50 });
		await fileHelper.uploadFile(fileHelper.createFileData(jpeg, 'test2.jpg', 'image/jpeg'));
		await page.locator('.format-option').filter({ hasText: /WebP/i }).click();
		await page.locator('.convert-btn').first().click();
		await expect(page.locator('.download-btn').first()).toBeVisible({ timeout: 30000 });

		// Reset for third conversion
		await page.goto('/convert');
		await page.waitForLoadState('networkidle');

		// Conversion 3: WebP -> PNG
		const webp = await ImageFactory.createWebP({ width: 50, height: 50 });
		await fileHelper.uploadFile(fileHelper.createFileData(webp, 'test3.webp', 'image/webp'));
		await page.locator('.format-option').filter({ hasText: /PNG/i }).click();
		await page.locator('.convert-btn').first().click();

		const { validation } = await downloadHelper.validateDownload('.download-btn', 'png');
		expect(validation.valid).toBe(true);
	});
});
