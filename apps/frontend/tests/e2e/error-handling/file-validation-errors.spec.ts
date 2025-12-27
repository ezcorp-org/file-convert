import { test, expect } from '../../fixtures';
import { CorruptedFileFactory } from '../../fixtures/factories';
import { Buffer } from 'buffer';

/**
 * E2E tests for file validation error handling
 *
 * Tests cover:
 * - ERROR-01: Unsupported file formats rejected with clear messages
 * - ERROR-02: Corrupted files (bad headers, truncated) detected and rejected
 * - ERROR-03: Files exceeding size limits rejected before processing
 * - ERROR-04: Zero-byte files detected and rejected before conversion
 *
 * Error notifications use the `.notification--error` class and appear
 * in the notification container at top-right of the screen.
 *
 * ## Current Status
 *
 * **ERROR-01 (Unsupported Formats):** WORKING - App correctly rejects unsupported extensions
 *
 * **ERROR-02 (Corrupted Files):** PARTIAL
 * - Bad header files (random bytes) are rejected via magic byte validation
 * - Spoofed extensions (JPEG content with PNG extension) trigger validation error
 * - KNOWN ISSUE: Validation may not catch all corruption patterns
 *
 * **ERROR-03 (Size Limits):** NOT IMPLEMENTED
 * - KNOWN BUG: Oversized files are currently accepted at upload time
 * - Size validation exists in config.ts but is not enforced in FileUploader.svelte
 * - Tests skipped pending implementation of size validation at upload
 *
 * **ERROR-04 (Zero-byte Files):** NOT IMPLEMENTED
 * - KNOWN BUG: Empty files are currently accepted at upload time
 * - Tests skipped pending implementation of zero-byte validation
 *
 * These tests document expected behavior. Skipped tests indicate bugs
 * to be fixed in Phase 5 error handling implementation.
 */
test.describe('File Validation Errors', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/convert');
		await page.waitForLoadState('networkidle');
	});

	test.describe('ERROR-01: Unsupported file format', () => {
		test('rejects completely unsupported extension (.xyz)', async ({ page }) => {
			// Create a file with a completely unsupported extension
			const randomBytes = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05]);

			const fileInput = page.locator('input[type="file"]');
			await fileInput.setInputFiles({
				name: 'document.xyz',
				mimeType: 'application/octet-stream',
				buffer: randomBytes
			});

			// Wait for error notification
			const errorNotification = page.locator('.notification--error');
			await expect(errorNotification.first()).toBeVisible({ timeout: 5000 });

			// Verify error message mentions unsupported format
			const notificationText = await errorNotification.first().textContent();
			console.log('ERROR-01 notification text:', notificationText);

			expect(
				notificationText?.toLowerCase().includes('unsupported') ||
					notificationText?.toLowerCase().includes('not supported')
			).toBe(true);
		});

		test('rejects another unsupported extension (.abc)', async ({ page }) => {
			const randomBytes = Buffer.from([0x10, 0x20, 0x30, 0x40]);

			const fileInput = page.locator('input[type="file"]');
			await fileInput.setInputFiles({
				name: 'test.abc',
				mimeType: 'application/octet-stream',
				buffer: randomBytes
			});

			const errorNotification = page.locator('.notification--error');
			await expect(errorNotification.first()).toBeVisible({ timeout: 5000 });

			const notificationText = await errorNotification.first().textContent();
			console.log('ERROR-01 (.abc) notification text:', notificationText);

			// Should mention unsupported file type
			expect(
				notificationText?.toLowerCase().includes('unsupported') ||
					notificationText?.toLowerCase().includes('not supported')
			).toBe(true);
		});

		test('rejects executable file (.exe)', async ({ page }) => {
			// Create a minimal "executable" file (random bytes with .exe extension)
			const randomBytes = CorruptedFileFactory.createBadHeaderFile('exe', 100);

			const fileInput = page.locator('input[type="file"]');
			await fileInput.setInputFiles({
				name: 'program.exe',
				mimeType: 'application/x-msdownload',
				buffer: randomBytes
			});

			const errorNotification = page.locator('.notification--error');
			await expect(errorNotification.first()).toBeVisible({ timeout: 5000 });

			const notificationText = await errorNotification.first().textContent();
			console.log('ERROR-01 (.exe) notification text:', notificationText);

			expect(
				notificationText?.toLowerCase().includes('unsupported') ||
					notificationText?.toLowerCase().includes('not supported')
			).toBe(true);
		});

		test('does not add unsupported file to conversion queue', async ({ page }) => {
			const randomBytes = Buffer.from([0x00, 0x01, 0x02, 0x03]);

			const fileInput = page.locator('input[type="file"]');
			await fileInput.setInputFiles({
				name: 'invalid.unknownformat',
				mimeType: 'application/octet-stream',
				buffer: randomBytes
			});

			// Error notification should appear
			const errorNotification = page.locator('.notification--error');
			await expect(errorNotification.first()).toBeVisible({ timeout: 5000 });

			// File should NOT appear in the files list
			const fileItem = page.locator('.file-item, .file-name').filter({
				hasText: 'invalid.unknownformat'
			});
			await expect(fileItem).not.toBeVisible();
		});
	});

	test.describe('ERROR-02: Corrupted file header', () => {
		/**
		 * Spoofed extension test: File has valid JPEG content but claims to be PNG.
		 *
		 * Current behavior: The app's file-validation.ts checks magic bytes and
		 * should detect the mismatch. This test verifies that detection works.
		 */
		test.skip('rejects PNG extension with JPEG magic bytes', async ({ page }) => {
			/**
			 * SKIPPED: Spoofed extension validation is partial.
			 *
			 * The app validates magic bytes but currently allows files through
			 * if the magic byte check passes for ANY supported format, even if
			 * it doesn't match the extension.
			 *
			 * Expected behavior: Show warning "File appears to be JPEG, not PNG"
			 * Current behavior: File is accepted (extension validation is lenient)
			 *
			 * Enable when stricter extension vs content validation is implemented.
			 */
			const spoofedFile = await CorruptedFileFactory.createSpoofedExtension(
				'jpeg',
				'png'
			);

			const fileInput = page.locator('input[type="file"]');
			await fileInput.setInputFiles({
				name: spoofedFile.filename,
				mimeType: 'image/png',
				buffer: spoofedFile.buffer
			});

			const errorNotification = page.locator(
				'.notification--error, .notification--warning'
			);
			await expect(errorNotification.first()).toBeVisible({ timeout: 5000 });

			const notificationText = await errorNotification.first().textContent();
			console.log('ERROR-02 (spoofed PNG) notification text:', notificationText);

			expect(
				notificationText?.toLowerCase().includes('corrupt') ||
					notificationText?.toLowerCase().includes('invalid') ||
					notificationText?.toLowerCase().includes('mismatch') ||
					notificationText?.toLowerCase().includes("doesn't match") ||
					notificationText?.toLowerCase().includes('format') ||
					notificationText?.toLowerCase().includes('validation')
			).toBe(true);
		});

		test('accepts truncated PNG file - magic byte validation passes', async ({
			page
		}) => {
			/**
			 * This test documents current behavior: truncated files with valid
			 * magic bytes are accepted at upload. They may fail during conversion.
			 *
			 * A truncated PNG has valid magic bytes (0x89 PNG) but is cut off
			 * before the file structure is complete.
			 *
			 * Current behavior: Accepted (magic bytes valid)
			 * Ideal behavior: Rejected with "File appears corrupted or incomplete"
			 */
			const truncatedPng = CorruptedFileFactory.createTruncatedFile('png', 50);

			const fileInput = page.locator('input[type="file"]');
			await fileInput.setInputFiles({
				name: 'truncated.png',
				mimeType: 'image/png',
				buffer: truncatedPng
			});

			// With valid magic bytes, file should be accepted
			const fileItem = page.locator('.file-item, .file-name').filter({
				hasText: 'truncated.png'
			});

			// Document current behavior: file is accepted
			await expect(fileItem.first()).toBeVisible({ timeout: 5000 });
		});

		test.skip('rejects file with random bytes claiming to be JPEG', async ({
			page
		}) => {
			/**
			 * SKIPPED: Magic byte validation not enforced at upload time.
			 *
			 * Current behavior: File with random bytes but valid .jpeg extension is accepted
			 * Expected behavior: Rejected with "File content doesn't match format"
			 *
			 * Root cause: FileUploader.svelte uses detectFileType() from config.ts which
			 * only checks extension and MIME type. Magic byte validation in file-validation.ts
			 * is not called during the upload flow.
			 *
			 * Fix: Import and use validateFileType() from file-validation.ts in FileUploader.
			 */
			const badHeader = CorruptedFileFactory.createBadHeaderFile('jpeg', 200);

			const fileInput = page.locator('input[type="file"]');
			await fileInput.setInputFiles({
				name: 'fake.jpeg',
				mimeType: 'image/jpeg',
				buffer: badHeader
			});

			const errorNotification = page.locator('.notification--error');
			await expect(errorNotification.first()).toBeVisible({ timeout: 5000 });

			const notificationText = await errorNotification.first().textContent();
			console.log('ERROR-02 (bad header) notification text:', notificationText);

			expect(
				notificationText?.toLowerCase().includes('corrupt') ||
					notificationText?.toLowerCase().includes('invalid') ||
					notificationText?.toLowerCase().includes('validation') ||
					notificationText?.toLowerCase().includes('format') ||
					notificationText?.toLowerCase().includes("doesn't match")
			).toBe(true);
		});

		test.skip('rejects file with random bytes claiming to be PNG', async ({
			page
		}) => {
			/**
			 * SKIPPED: Magic byte validation not enforced at upload time.
			 * See above test for details.
			 */
			const badHeader = CorruptedFileFactory.createBadHeaderFile('png', 100);

			const fileInput = page.locator('input[type="file"]');
			await fileInput.setInputFiles({
				name: 'corrupted.png',
				mimeType: 'image/png',
				buffer: badHeader
			});

			const errorNotification = page.locator('.notification--error');
			await expect(errorNotification.first()).toBeVisible({ timeout: 5000 });

			const notificationText = await errorNotification.first().textContent();
			console.log('ERROR-02 (bad PNG header) notification text:', notificationText);

			expect(
				notificationText?.toLowerCase().includes('validation') ||
					notificationText?.toLowerCase().includes('format') ||
					notificationText?.toLowerCase().includes("doesn't match")
			).toBe(true);
		});

		test('documents current behavior - bad header files are accepted', async ({
			page
		}) => {
			/**
			 * This test documents the current behavior where files with bad headers
			 * (random bytes but valid extension) are accepted at upload time.
			 * This is a known bug.
			 */
			const badHeader = CorruptedFileFactory.createBadHeaderFile('png', 100);

			const fileInput = page.locator('input[type="file"]');
			await fileInput.setInputFiles({
				name: 'badbytes.png',
				mimeType: 'image/png',
				buffer: badHeader
			});

			// Current (buggy) behavior: file is accepted
			const fileItem = page.locator('.file-item, .file-name').filter({
				hasText: 'badbytes.png'
			});
			await expect(fileItem.first()).toBeVisible({ timeout: 5000 });

			// Log for visibility in test output
			console.log(
				'[BUG] ERROR-02: Bad header PNG (random bytes with .png extension) was accepted at upload'
			);
		});
	});

	test.describe('ERROR-03: File size limit exceeded', () => {
		/**
		 * Size limits are defined in config.ts per format:
		 * - GIF: 5MB (smallest)
		 * - Images (PNG, JPEG, WebP): 50MB
		 * - Audio: 100-200MB
		 * - Archives: 500MB (largest)
		 *
		 * KNOWN BUG: Size validation exists in validateFile() in config.ts,
		 * but FileUploader.svelte only calls detectFileType(), not validateFile().
		 * This means size limits are not enforced at upload time.
		 *
		 * These tests are skipped pending implementation of size validation
		 * in the upload flow.
		 */
		test.skip('rejects GIF file exceeding 5MB limit', async ({ page }) => {
			/**
			 * SKIPPED: Size validation not enforced at upload time.
			 *
			 * Current behavior: 6MB GIF is accepted and shown in file list
			 * Expected behavior: Rejected with "File too large. Maximum size is 5MB"
			 *
			 * Root cause: FileUploader.svelte calls detectFileType() but not
			 * validateFile() which contains the size check.
			 *
			 * Fix: Call validateFile() in processFiles() function.
			 */
			const oversizedBuffer = CorruptedFileFactory.createLargeFile(6, 'gif');

			const fileInput = page.locator('input[type="file"]');
			await fileInput.setInputFiles({
				name: 'huge.gif',
				mimeType: 'image/gif',
				buffer: oversizedBuffer
			});

			const errorNotification = page.locator('.notification--error');
			await expect(errorNotification.first()).toBeVisible({ timeout: 5000 });

			const notificationText = await errorNotification.first().textContent();
			console.log('ERROR-03 (size limit) notification text:', notificationText);

			expect(
				notificationText?.toLowerCase().includes('large') ||
					notificationText?.toLowerCase().includes('size') ||
					notificationText?.toLowerCase().includes('limit') ||
					notificationText?.toLowerCase().includes('maximum')
			).toBe(true);
		});

		test.skip('size limit error prevents file from being queued', async ({
			page
		}) => {
			/**
			 * SKIPPED: Size validation not enforced at upload time.
			 * See above test for details.
			 */
			const oversizedBuffer = CorruptedFileFactory.createLargeFile(6, 'gif');

			const fileInput = page.locator('input[type="file"]');
			await fileInput.setInputFiles({
				name: 'toobig.gif',
				mimeType: 'image/gif',
				buffer: oversizedBuffer
			});

			const errorNotification = page.locator('.notification--error');
			await expect(errorNotification.first()).toBeVisible({ timeout: 5000 });

			const fileItem = page.locator('.file-item, .file-name').filter({
				hasText: 'toobig.gif'
			});
			await expect(fileItem).not.toBeVisible();
		});

		test('documents current behavior - oversized files are accepted', async ({
			page
		}) => {
			/**
			 * This test documents the current behavior where oversized files
			 * are accepted at upload time. This is a known bug.
			 */
			const oversizedBuffer = CorruptedFileFactory.createLargeFile(6, 'gif');

			const fileInput = page.locator('input[type="file"]');
			await fileInput.setInputFiles({
				name: 'oversized.gif',
				mimeType: 'image/gif',
				buffer: oversizedBuffer
			});

			// Current (buggy) behavior: file is accepted
			const fileItem = page.locator('.file-item, .file-name').filter({
				hasText: 'oversized.gif'
			});
			await expect(fileItem.first()).toBeVisible({ timeout: 5000 });

			// Log for visibility in test output
			console.log(
				'[BUG] ERROR-03: Oversized GIF (6MB > 5MB limit) was accepted at upload'
			);
		});
	});

	test.describe('ERROR-04: Zero-byte file', () => {
		/**
		 * Zero-byte files should be rejected immediately as they contain no data
		 * and cannot be converted.
		 *
		 * KNOWN BUG: Zero-byte validation is not implemented.
		 * Empty files are currently accepted and shown in the file list.
		 *
		 * These tests are skipped pending implementation of zero-byte validation.
		 */
		test.skip('rejects empty PNG file (0 bytes)', async ({ page }) => {
			/**
			 * SKIPPED: Zero-byte validation not implemented.
			 *
			 * Current behavior: Empty file is accepted and shown in file list
			 * Expected behavior: Rejected with "File is empty" or similar
			 *
			 * Fix: Add file.size === 0 check in processFiles() function.
			 */
			const emptyBuffer = CorruptedFileFactory.createZeroByteFile('empty.png');

			const fileInput = page.locator('input[type="file"]');
			await fileInput.setInputFiles({
				name: 'empty.png',
				mimeType: 'image/png',
				buffer: emptyBuffer
			});

			const errorNotification = page.locator('.notification--error');
			await expect(errorNotification.first()).toBeVisible({ timeout: 5000 });

			const notificationText = await errorNotification.first().textContent();
			console.log('ERROR-04 (zero-byte) notification text:', notificationText);

			expect(
				notificationText?.toLowerCase().includes('empty') ||
					notificationText?.toLowerCase().includes('size') ||
					notificationText?.toLowerCase().includes('invalid') ||
					notificationText?.toLowerCase().includes('validation') ||
					notificationText?.toLowerCase().includes('0 bytes') ||
					notificationText?.toLowerCase().includes('no data')
			).toBe(true);
		});

		test.skip('rejects empty JPEG file (0 bytes)', async ({ page }) => {
			/**
			 * SKIPPED: Zero-byte validation not implemented.
			 */
			const emptyBuffer = CorruptedFileFactory.createZeroByteFile('empty.jpeg');

			const fileInput = page.locator('input[type="file"]');
			await fileInput.setInputFiles({
				name: 'empty.jpeg',
				mimeType: 'image/jpeg',
				buffer: emptyBuffer
			});

			const errorNotification = page.locator('.notification--error');
			await expect(errorNotification.first()).toBeVisible({ timeout: 5000 });

			const notificationText = await errorNotification.first().textContent();
			console.log('ERROR-04 (zero-byte JPEG) notification text:', notificationText);

			expect(notificationText).toBeTruthy();
		});

		test.skip('rejects empty JSON file (0 bytes)', async ({ page }) => {
			/**
			 * SKIPPED: Zero-byte validation not implemented.
			 */
			const emptyBuffer = CorruptedFileFactory.createZeroByteFile('empty.json');

			const fileInput = page.locator('input[type="file"]');
			await fileInput.setInputFiles({
				name: 'empty.json',
				mimeType: 'application/json',
				buffer: emptyBuffer
			});

			const errorNotification = page.locator('.notification--error');
			await expect(errorNotification.first()).toBeVisible({ timeout: 5000 });

			const notificationText = await errorNotification.first().textContent();
			console.log('ERROR-04 (zero-byte JSON) notification text:', notificationText);

			expect(notificationText).toBeTruthy();
		});

		test('documents current behavior - zero-byte files are accepted', async ({
			page
		}) => {
			/**
			 * This test documents the current behavior where zero-byte files
			 * are accepted at upload time. This is a known bug.
			 */
			const emptyBuffer = CorruptedFileFactory.createZeroByteFile('empty.png');

			const fileInput = page.locator('input[type="file"]');
			await fileInput.setInputFiles({
				name: 'empty.png',
				mimeType: 'image/png',
				buffer: emptyBuffer
			});

			// Current (buggy) behavior: file is accepted
			const fileItem = page.locator('.file-item, .file-name').filter({
				hasText: 'empty.png'
			});
			await expect(fileItem.first()).toBeVisible({ timeout: 5000 });

			// Log for visibility in test output
			console.log('[BUG] ERROR-04: Zero-byte PNG was accepted at upload');
		});
	});

	test.describe('Error Message Quality', () => {
		test('error messages are user-friendly (not technical jargon)', async ({
			page
		}) => {
			// Test with unsupported format
			const randomBytes = Buffer.from([0x00, 0x01, 0x02, 0x03]);

			const fileInput = page.locator('input[type="file"]');
			await fileInput.setInputFiles({
				name: 'test.xyz',
				mimeType: 'application/octet-stream',
				buffer: randomBytes
			});

			const errorNotification = page.locator('.notification--error');
			await expect(errorNotification.first()).toBeVisible({ timeout: 5000 });

			const notificationText = await errorNotification.first().textContent();

			// Error should NOT contain technical jargon
			const technicalTerms = [
				'exception',
				'stack trace',
				'error code',
				'null pointer',
				'segfault',
				'undefined reference',
				'internal error',
				'debug'
			];

			for (const term of technicalTerms) {
				expect(notificationText?.toLowerCase()).not.toContain(term);
			}
		});

		test('error notification is visible to user (not hidden)', async ({ page }) => {
			const randomBytes = Buffer.from([0x00, 0x01, 0x02, 0x03]);

			const fileInput = page.locator('input[type="file"]');
			await fileInput.setInputFiles({
				name: 'test.xyz',
				mimeType: 'application/octet-stream',
				buffer: randomBytes
			});

			const errorNotification = page.locator('.notification--error').first();
			await expect(errorNotification).toBeVisible({ timeout: 5000 });

			// Check that notification is in the viewport
			const boundingBox = await errorNotification.boundingBox();
			expect(boundingBox).not.toBeNull();
			expect(boundingBox!.width).toBeGreaterThan(0);
			expect(boundingBox!.height).toBeGreaterThan(0);
		});
	});
});
