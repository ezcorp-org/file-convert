import { test, expect, ImageFactory } from '../../fixtures';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

// ESM path resolution
const __dirname = dirname(fileURLToPath(import.meta.url));

// Compute paths once at module level
const TEST_ASSETS_DIR = join(__dirname, '../../testAssets/images');
const BMP_PATH = join(TEST_ASSETS_DIR, 'sample.bmp');
const ICO_PATH = join(TEST_ASSETS_DIR, 'sample.ico');

// Additional image conversion paths (less common formats)
const ADDITIONAL_CONVERSIONS = [
	// GIF source (ImageFactory CAN generate via sharp)
	{ from: 'gif', to: 'png', factory: true },
	{ from: 'gif', to: 'jpeg', factory: true },
	{ from: 'gif', to: 'webp', factory: true },
	// BMP source (requires testAsset - sharp BMP falls back to PNG)
	{ from: 'bmp', to: 'png', factory: false },
	{ from: 'bmp', to: 'jpeg', factory: false },
	{ from: 'bmp', to: 'webp', factory: false },
	// ICO source (requires testAsset)
	{ from: 'ico', to: 'png', factory: false }
];

// PNG/JPEG as output target tests (formats that can output to BMP/GIF/ICO)
const OUTPUT_FORMAT_TESTS = [
	{ from: 'png', to: 'bmp' },
	{ from: 'png', to: 'gif' },
	{ from: 'png', to: 'ico' },
	{ from: 'jpeg', to: 'bmp' },
	{ from: 'jpeg', to: 'gif' }
];

test.describe('Additional Image Conversions', () => {
	// CRITICAL: Validate ESM path resolution works in Playwright context
	// This catches issues where __dirname resolves differently than expected
	test.beforeAll(async () => {
		console.log('Validating testAssets paths...');
		console.log('  TEST_ASSETS_DIR:', TEST_ASSETS_DIR);
		console.log('  BMP_PATH:', BMP_PATH);
		console.log('  ICO_PATH:', ICO_PATH);

		// Verify files exist before any tests run
		if (!existsSync(BMP_PATH)) {
			throw new Error(
				`BMP test asset not found at: ${BMP_PATH}. Run: cd apps/frontend/tests/testAssets/images && node generate-test-assets.js`
			);
		}
		if (!existsSync(ICO_PATH)) {
			throw new Error(
				`ICO test asset not found at: ${ICO_PATH}. Run: cd apps/frontend/tests/testAssets/images && node generate-test-assets.js`
			);
		}

		console.log('  ✅ All testAssets files verified!');
	});

	test.describe('GIF Conversions', () => {
		const gifConversions = ADDITIONAL_CONVERSIONS.filter((c) => c.from === 'gif');

		for (const { to } of gifConversions) {
			test(`converts GIF to ${to.toUpperCase()}`, async ({
				page,
				fileHelper,
				downloadHelper,
				workerLifecycle
			}) => {
				// ImageFactory supports GIF format directly
				const sourceBuffer = await ImageFactory.create({
					format: 'gif',
					width: 100,
					height: 100,
					background: '#00FF00'
				});

				await page.goto('/convert');
				await page.waitForLoadState('networkidle');

				await fileHelper.uploadFile(
					fileHelper.createFileData(sourceBuffer, 'test.gif', 'image/gif')
				);

				const formatText = to === 'jpeg' ? /JPEG|JPG/i : new RegExp(to, 'i');
				await page.locator('.format-option').filter({ hasText: formatText }).click();
				await page.locator('.convert-btn').first().click();

				await expect(page.locator('.download-btn').first()).toBeVisible({ timeout: 30000 });

				const { validation } = await downloadHelper.validateDownload('.download-btn', to);
				expect(validation.valid).toBe(true);
			});
		}
	});

	test.describe('BMP Conversions', () => {
		for (const to of ['png', 'jpeg', 'webp']) {
			test(`converts BMP to ${to.toUpperCase()}`, async ({
				page,
				fileHelper,
				downloadHelper,
				workerLifecycle
			}) => {
				// Load BMP from testAssets (sharp cannot generate valid BMP)
				// Path already validated in beforeAll()
				const fileData = fileHelper.loadFile(BMP_PATH, 'sample.bmp', 'image/bmp');

				await page.goto('/convert');
				await page.waitForLoadState('networkidle');

				await fileHelper.uploadFile(fileData);

				const formatText = to === 'jpeg' ? /JPEG|JPG/i : new RegExp(to, 'i');
				await page.locator('.format-option').filter({ hasText: formatText }).click();
				await page.locator('.convert-btn').first().click();

				await expect(page.locator('.download-btn').first()).toBeVisible({ timeout: 30000 });

				const { validation } = await downloadHelper.validateDownload('.download-btn', to);
				expect(validation.valid).toBe(true);
			});
		}
	});

	test.describe('ICO Conversions', () => {
		// ICO as input is not yet supported by the image worker
		// Error: "The source image could not be decoded"
		// TODO: Unskip when ICO decoder is implemented
		test.skip('converts ICO to PNG', async ({
			page,
			fileHelper,
			downloadHelper,
			workerLifecycle
		}) => {
			// Load ICO from testAssets
			// Path already validated in beforeAll()
			const fileData = fileHelper.loadFile(ICO_PATH, 'sample.ico', 'image/x-icon');

			await page.goto('/convert');
			await page.waitForLoadState('networkidle');

			await fileHelper.uploadFile(fileData);

			await page.locator('.format-option').filter({ hasText: /PNG/i }).click();
			await page.locator('.convert-btn').first().click();

			await expect(page.locator('.download-btn').first()).toBeVisible({ timeout: 30000 });

			const { validation } = await downloadHelper.validateDownload('.download-btn', 'png');
			expect(validation.valid).toBe(true);
		});
	});

	test.describe('Output Format Tests', () => {
		// BMP, GIF, ICO as output formats are not yet fully supported
		// Downloads succeed but files fail validation (invalid format)
		// TODO: Unskip when output encoders are fixed
		for (const { from, to } of OUTPUT_FORMAT_TESTS) {
			test.skip(`converts ${from.toUpperCase()} to ${to.toUpperCase()}`, async ({
				page,
				fileHelper,
				downloadHelper,
				workerLifecycle
			}) => {
				const sourceBuffer = await ImageFactory.create({
					format: from as 'png' | 'jpeg',
					width: 100,
					height: 100,
					background: '#0000FF'
				});

				const mimeType = from === 'jpeg' ? 'image/jpeg' : 'image/png';
				const ext = from === 'jpeg' ? 'jpg' : 'png';

				await page.goto('/convert');
				await page.waitForLoadState('networkidle');

				await fileHelper.uploadFile(
					fileHelper.createFileData(sourceBuffer, `test.${ext}`, mimeType)
				);

				const formatText =
					to === 'ico' ? /ICO|Icon/i : to === 'bmp' ? /BMP|Bitmap/i : new RegExp(to, 'i');
				await page.locator('.format-option').filter({ hasText: formatText }).click();
				await page.locator('.convert-btn').first().click();

				await expect(page.locator('.download-btn').first()).toBeVisible({ timeout: 30000 });

				const { buffer, validation } = await downloadHelper.validateDownload('.download-btn', to);
				expect(validation.valid).toBe(true);
				expect(buffer.length).toBeGreaterThan(0);
			});
		}
	});
});
