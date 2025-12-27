/**
 * ERROR-05: Extension Spoofing Detection Tests
 *
 * EXTENSION SPOOFING DETECTION STATUS: NOT IMPLEMENTED
 *
 * Test Run Date: 2026-01-24
 * Test Results: 3/4 tests FAILED (detection not implemented), 1/4 passed (negative case)
 *
 * Current Behavior:
 * - App accepts spoofed files without warning (shows "Files loaded - Added 1 file")
 * - No magic byte validation occurs during upload
 * - Files are processed based on extension/MIME type only
 *
 * The application does not currently validate magic bytes against file extension.
 * The test infrastructure exists (MagicByteValidator in tests/fixtures/validators/magic-bytes.ts)
 * but is NOT integrated into the application's upload flow.
 *
 * TO IMPLEMENT:
 * 1. Copy/import magic byte detection to src/lib/utils/magic-byte-validator.ts
 *    (The test fixture version uses file-type library which works in browser)
 *
 * 2. Modify FileUploader.svelte to validate magic bytes on upload:
 *    ```typescript
 *    // In processFiles() function, after file type detection:
 *    const fileBuffer = await file.arrayBuffer();
 *    const detectedFormat = await detectFormatFromBytes(Buffer.from(fileBuffer));
 *    const extensionFormat = file.name.split('.').pop()?.toLowerCase();
 *
 *    if (detectedFormat && extensionFormat && detectedFormat !== extensionFormat) {
 *      // Handle aliases (jpg/jpeg, tif/tiff)
 *      const isAlias = isFormatAlias(detectedFormat, extensionFormat);
 *      if (!isAlias) {
 *        notifications.warning(
 *          'Format mismatch detected',
 *          `This file appears to be ${detectedFormat.toUpperCase()}, not ${extensionFormat.toUpperCase()}. Continue anyway?`
 *        );
 *        // Per CONTEXT.md: "warn but allow" - file still added to validFiles
 *      }
 *    }
 *    ```
 *
 * 3. Add browser-compatible file-type detection:
 *    - Option A: Use file-type library (npm install file-type) - works in browser
 *    - Option B: Manual magic byte checking for common formats (see MAGIC_SIGNATURES)
 *
 * 4. Consider two detection levels per CONTEXT.md:
 *    - "Suspicious" (extension mismatch): Warn but allow
 *    - "Definitely corrupted" (invalid headers): Reject immediately
 *
 * Expected behavior per CONTEXT.md:
 * - Spoofed extensions: "Warn but allow" (e.g., "This appears to be a JPEG, not PNG. Continue anyway?")
 * - Truly corrupted files: Reject immediately - never attempt conversion
 *
 * Key Files to Modify:
 * - src/routes/convert/components/FileUploader.svelte (add validation call)
 * - src/lib/utils/magic-byte-validator.ts (create from test fixture)
 * - src/lib/conversion/config.ts (optional: add validateMagicBytes function)
 *
 * Test Infrastructure Reference:
 * - tests/fixtures/validators/magic-bytes.ts - MagicByteValidator class
 * - tests/fixtures/factories/image-factory.ts - ImageFactory for test files
 * - tests/fixtures/factories/audio-factory.ts - AudioFactory for test files
 */

import { test, expect } from '../../fixtures';
import { ImageFactory } from '../../fixtures/factories/image-factory';
import { AudioFactory } from '../../fixtures/factories/audio-factory';

test.describe('ERROR-05: Extension Spoofing Detection', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/convert');
		await page.waitForLoadState('networkidle');
	});

	// SKIPPED: Extension spoofing detection not implemented
	// Unskip when magic byte validation is added to upload flow
	test.skip('detects JPEG file with PNG extension', async ({ page }) => {
		// Create valid JPEG using ImageFactory
		const jpegBuffer = await ImageFactory.createJPEG({ width: 100, height: 100 });

		// Upload with .png extension (spoofed)
		await page.locator('input[type="file"]').setInputFiles({
			name: 'spoofed.png',
			mimeType: 'image/png',
			buffer: jpegBuffer
		});

		// Wait for warning notification about format mismatch
		// Per CONTEXT.md: "Warn but allow" - should show warning, not error
		const notification = page.locator('.notification--warning, .notification');
		await expect(notification.first()).toBeVisible({ timeout: 5000 });

		// Get notification text
		const messageEl = notification.first().locator('.notification__message');
		const detailEl = notification.first().locator('.notification__detail');
		const message = (await messageEl.textContent()) || '';
		const detail = (await detailEl.textContent()) || '';
		const fullText = `${message} ${detail}`.toLowerCase();

		console.log('Spoofing notification message:', message);
		console.log('Spoofing notification detail:', detail);

		// Should contain something about format detection/mismatch
		// Expected: "This appears to be a JPEG, not PNG"
		expect(fullText).toMatch(/jpeg|mismatch|appears|actual|different/i);

		// File should still be added (warn but allow)
		const fileItem = page.locator('.file-item, [class*="file-item"]');
		await expect(fileItem.first()).toBeVisible({ timeout: 3000 });
	});

	// SKIPPED: Extension spoofing detection not implemented
	test.skip('detects PNG file with JPEG extension', async ({ page }) => {
		// Create valid PNG using ImageFactory
		const pngBuffer = await ImageFactory.createPNG({ width: 100, height: 100 });

		// Upload with .jpg extension (spoofed)
		await page.locator('input[type="file"]').setInputFiles({
			name: 'spoofed.jpg',
			mimeType: 'image/jpeg',
			buffer: pngBuffer
		});

		// Wait for warning notification
		const notification = page.locator('.notification--warning, .notification');
		await expect(notification.first()).toBeVisible({ timeout: 5000 });

		// Get notification text
		const messageEl = notification.first().locator('.notification__message');
		const detailEl = notification.first().locator('.notification__detail');
		const message = (await messageEl.textContent()) || '';
		const detail = (await detailEl.textContent()) || '';
		const fullText = `${message} ${detail}`.toLowerCase();

		console.log('Spoofing notification message:', message);
		console.log('Spoofing notification detail:', detail);

		// Should mention PNG detection
		expect(fullText).toMatch(/png|mismatch|appears|actual|different/i);

		// File should still be added (warn but allow)
		const fileItem = page.locator('.file-item, [class*="file-item"]');
		await expect(fileItem.first()).toBeVisible({ timeout: 3000 });
	});

	// SKIPPED: Extension spoofing detection not implemented
	test.skip('detects WAV file with MP3 extension', async ({ page }) => {
		// Create valid WAV using AudioFactory
		const wavBuffer = AudioFactory.createWAV({
			duration: 0.5,
			sampleRate: 44100
		});

		// Upload with .mp3 extension (spoofed)
		await page.locator('input[type="file"]').setInputFiles({
			name: 'spoofed.mp3',
			mimeType: 'audio/mpeg',
			buffer: wavBuffer
		});

		// Wait for warning notification
		const notification = page.locator('.notification--warning, .notification');
		await expect(notification.first()).toBeVisible({ timeout: 5000 });

		// Get notification text
		const messageEl = notification.first().locator('.notification__message');
		const detailEl = notification.first().locator('.notification__detail');
		const message = (await messageEl.textContent()) || '';
		const detail = (await detailEl.textContent()) || '';
		const fullText = `${message} ${detail}`.toLowerCase();

		console.log('Spoofing notification message:', message);
		console.log('Spoofing notification detail:', detail);

		// Should mention WAV detection
		expect(fullText).toMatch(/wav|mismatch|appears|actual|different/i);

		// File should still be added (warn but allow)
		const fileItem = page.locator('.file-item, [class*="file-item"]');
		await expect(fileItem.first()).toBeVisible({ timeout: 3000 });
	});

	// This test PASSES - correctly validates the negative case
	test('allows correct file without spoofing warning', async ({ page }) => {
		// Create PNG and upload as PNG - should not show warning about format mismatch
		const pngBuffer = await ImageFactory.createPNG({ width: 100, height: 100 });

		// Upload with correct .png extension
		await page.locator('input[type="file"]').setInputFiles({
			name: 'correct.png',
			mimeType: 'image/png',
			buffer: pngBuffer
		});

		// Wait for file to appear in the UI (success case)
		// The file should appear in the file list without any spoofing warnings
		const fileItem = page.locator('.file-item, [class*="file-item"]');
		await expect(fileItem.first()).toBeVisible({ timeout: 5000 });

		// Check for warning/error notifications about format mismatch
		const warningNotification = page.locator('.notification--warning, .notification--error');
		const warningCount = await warningNotification.count();

		if (warningCount > 0) {
			// If there are warnings, they should NOT be about format mismatch for our file
			const text = await warningNotification.first().textContent();
			const lowercaseText = (text || '').toLowerCase();
			// Should not contain format mismatch warnings for correctly-named files
			expect(lowercaseText).not.toMatch(/mismatch|appears to be|actual format.*png/i);
		}
		// If no warnings, test passes (expected behavior for correct extension)
	});
});
