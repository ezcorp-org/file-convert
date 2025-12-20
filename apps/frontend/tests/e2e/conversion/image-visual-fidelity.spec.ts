import { test, expect, ImageFactory, SSIMValidator } from '../../fixtures';

/**
 * Visual Fidelity Validation Tests
 *
 * These tests use SSIM (Structural Similarity Index) to verify that image conversions
 * maintain visual quality. SSIM scores range from 0 (completely different) to 1 (identical).
 *
 * Thresholds (from RESEARCH.md ADV-08, ADV-09, ADV-10):
 * - Lossless conversions (PNG->PNG, WebP lossless): SSIM >0.99
 * - Lossy conversions (PNG->JPEG, JPEG->WebP): SSIM >0.95
 * - Lossy round-trips (JPEG->WebP->PNG): SSIM >0.90
 */

// SSIM thresholds for different conversion scenarios
const LOSSLESS_THRESHOLD = 0.99; // PNG->PNG, WebP lossless
const LOSSY_THRESHOLD = 0.95; // PNG->JPEG, JPEG->WebP
const LOSSY_LOSSY_THRESHOLD = 0.90; // JPEG->WebP->PNG (double lossy)

// Helper to get UI text for format selection
function getFormatUIText(format: string): RegExp {
	const uiText: Record<string, RegExp> = {
		png: /PNG/i,
		jpeg: /JPEG|JPG/i,
		webp: /WebP/i
	};
	return uiText[format] || new RegExp(format, 'i');
}

test.describe('Visual Fidelity Validation', () => {
	test('PNG to JPEG maintains visual fidelity (SSIM >0.95)', async ({
		page,
		fileHelper,
		downloadHelper
	}) => {
		// Generate source PNG with gradient for SSIM variance
		const sourceBuffer = await ImageFactory.create({
			format: 'png',
			width: 100,
			height: 100,
			background: { r: 255, g: 128, b: 0 }
		});

		const fileData = fileHelper.createFileData(sourceBuffer, 'test.png', 'image/png');

		// Navigate and upload
		await page.goto('/convert');
		await page.waitForLoadState('networkidle');
		await fileHelper.uploadFile(fileData);

		// Select JPEG format
		const formatOption = page
			.locator('.format-option')
			.filter({ hasText: getFormatUIText('jpeg') });
		await formatOption.click();

		// Start conversion
		await page.locator('.convert-btn').first().click();

		// Wait for completion and download
		await expect(page.locator('.download-btn').first()).toBeVisible({ timeout: 45000 });
		const { buffer } = await downloadHelper.validateDownload('.download-btn', 'jpeg');

		// Validate visual fidelity using SSIM
		const ssimResult = await SSIMValidator.validateVisualFidelity(
			sourceBuffer,
			buffer,
			LOSSY_THRESHOLD
		);

		console.log(
			`PNG->JPEG SSIM: ${ssimResult.score.toFixed(4)} (threshold: ${LOSSY_THRESHOLD})`
		);

		expect(ssimResult.valid).toBe(true);
		expect(ssimResult.score).toBeGreaterThanOrEqual(LOSSY_THRESHOLD);
	});

	test('JPEG to WebP maintains visual fidelity (SSIM >0.95)', async ({
		page,
		fileHelper,
		downloadHelper
	}) => {
		// Generate source JPEG
		const sourceBuffer = await ImageFactory.create({
			format: 'jpeg',
			width: 100,
			height: 100,
			background: { r: 0, g: 128, b: 255 }
		});

		const fileData = fileHelper.createFileData(sourceBuffer, 'test.jpg', 'image/jpeg');

		// Navigate and upload
		await page.goto('/convert');
		await page.waitForLoadState('networkidle');
		await fileHelper.uploadFile(fileData);

		// Select WebP format
		const formatOption = page
			.locator('.format-option')
			.filter({ hasText: getFormatUIText('webp') });
		await formatOption.click();

		// Start conversion
		await page.locator('.convert-btn').first().click();

		// Wait for completion and download
		await expect(page.locator('.download-btn').first()).toBeVisible({ timeout: 45000 });
		const { buffer } = await downloadHelper.validateDownload('.download-btn', 'webp');

		// Validate visual fidelity using SSIM
		const ssimResult = await SSIMValidator.validateVisualFidelity(
			sourceBuffer,
			buffer,
			LOSSY_THRESHOLD
		);

		console.log(
			`JPEG->WebP SSIM: ${ssimResult.score.toFixed(4)} (threshold: ${LOSSY_THRESHOLD})`
		);

		expect(ssimResult.valid).toBe(true);
		expect(ssimResult.score).toBeGreaterThanOrEqual(LOSSY_THRESHOLD);
	});

	test('WebP to PNG maintains visual fidelity (SSIM >0.95)', async ({
		page,
		fileHelper,
		downloadHelper
	}) => {
		// Generate source WebP
		const sourceBuffer = await ImageFactory.create({
			format: 'webp',
			width: 100,
			height: 100,
			background: { r: 128, g: 255, b: 128 }
		});

		const fileData = fileHelper.createFileData(sourceBuffer, 'test.webp', 'image/webp');

		// Navigate and upload
		await page.goto('/convert');
		await page.waitForLoadState('networkidle');
		await fileHelper.uploadFile(fileData);

		// Select PNG format
		const formatOption = page
			.locator('.format-option')
			.filter({ hasText: getFormatUIText('png') });
		await formatOption.click();

		// Start conversion
		await page.locator('.convert-btn').first().click();

		// Wait for completion and download
		await expect(page.locator('.download-btn').first()).toBeVisible({ timeout: 45000 });
		const { buffer } = await downloadHelper.validateDownload('.download-btn', 'png');

		// Validate visual fidelity using SSIM
		const ssimResult = await SSIMValidator.validateVisualFidelity(
			sourceBuffer,
			buffer,
			LOSSY_THRESHOLD
		);

		console.log(
			`WebP->PNG SSIM: ${ssimResult.score.toFixed(4)} (threshold: ${LOSSY_THRESHOLD})`
		);

		expect(ssimResult.valid).toBe(true);
		expect(ssimResult.score).toBeGreaterThanOrEqual(LOSSY_THRESHOLD);
	});

	test('PNG to WebP to JPEG round-trip (SSIM >0.90)', async ({
		page,
		fileHelper,
		downloadHelper
	}) => {
		// Generate original PNG
		const originalBuffer = await ImageFactory.create({
			format: 'png',
			width: 100,
			height: 100,
			background: { r: 200, g: 100, b: 50 }
		});

		// Step 1: PNG to WebP
		await page.goto('/convert');
		await page.waitForLoadState('networkidle');
		await fileHelper.uploadFile(
			fileHelper.createFileData(originalBuffer, 'test.png', 'image/png')
		);

		await page.locator('.format-option').filter({ hasText: getFormatUIText('webp') }).click();
		await page.locator('.convert-btn').first().click();
		await expect(page.locator('.download-btn').first()).toBeVisible({ timeout: 45000 });

		const { buffer: webpBuffer } = await downloadHelper.validateDownload('.download-btn', 'webp');

		// Step 2: WebP to JPEG
		await page.goto('/convert');
		await page.waitForLoadState('networkidle');
		await fileHelper.uploadFile(
			fileHelper.createFileData(webpBuffer, 'test.webp', 'image/webp')
		);

		await page.locator('.format-option').filter({ hasText: getFormatUIText('jpeg') }).click();
		await page.locator('.convert-btn').first().click();
		await expect(page.locator('.download-btn').first()).toBeVisible({ timeout: 45000 });

		const { buffer: finalBuffer } = await downloadHelper.validateDownload('.download-btn', 'jpeg');

		// Validate visual fidelity between original PNG and final JPEG
		const ssimResult = await SSIMValidator.validateVisualFidelity(
			originalBuffer,
			finalBuffer,
			LOSSY_LOSSY_THRESHOLD
		);

		console.log(
			`PNG->WebP->JPEG SSIM: ${ssimResult.score.toFixed(4)} (threshold: ${LOSSY_LOSSY_THRESHOLD})`
		);

		expect(ssimResult.valid).toBe(true);
		expect(ssimResult.score).toBeGreaterThanOrEqual(LOSSY_LOSSY_THRESHOLD);
	});
});
