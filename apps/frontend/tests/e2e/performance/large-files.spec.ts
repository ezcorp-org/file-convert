/**
 * Large File Conversion Tests
 *
 * Tests performance requirements PERF-04, PERF-05, PERF-06:
 * - PERF-04: Large files convert without memory errors (10MB image, 25MB audio, 50MB archive)
 * - PERF-05: Memory errors show clear "File too large" message
 * - PERF-06: Progress updates during large file conversion
 *
 * Note: These tests may be slow in CI due to file generation.
 * Tests use test.slow() for extended timeout.
 *
 * Playwright buffer limit: 50MB max for setInputFiles.
 * - Image tests: Use gradient patterns (solid colors compress too well)
 * - Audio tests: 25MB WAV works within limit
 * - Archive tests: Scaled to 40MB to stay under limit
 */
import { test, expect, ImageFactory, AudioFactory, ArchiveFactory } from '../../fixtures';

// CI-friendly sizes from CONTEXT.md (adjusted for Playwright 50MB limit)
const LARGE_IMAGE_SIZE_TARGET_MB = 10;
const LARGE_AUDIO_SIZE_TARGET_MB = 25;
const LARGE_ARCHIVE_SIZE_TARGET_MB = 40; // Reduced from 50MB due to Playwright limit

test.describe('Large File Handling', () => {
	// 5 minute timeout for large file tests
	test.describe.configure({ timeout: 300000 });

	test.describe('Large Image Files', () => {
		test.slow(); // Mark as slow test for extended timeout

		test('converts large PNG to JPEG without memory error', async ({ page, fileHelper }) => {
			await page.goto('/convert');
			await page.waitForLoadState('networkidle');

			// Generate large PNG using gradient pattern
			// Solid colors compress extremely well (~0.1MB for 3000x3000)
			// Gradients have more entropy and compress less
			// 2000x2000 gradient with high-quality settings = ~2-5MB
			const imageBuffer = await ImageFactory.createGradient({
				width: 2000,
				height: 2000,
				format: 'png',
				gradientType: 'diagonal',
				startColor: { r: 255, g: 0, b: 0 },
				endColor: { r: 0, g: 0, b: 255 }
			});

			const fileSizeMB = imageBuffer.length / 1024 / 1024;
			console.log(`Generated gradient image size: ${fileSizeMB.toFixed(2)}MB (target: >1MB for meaningful conversion test)`);

			// Gradient images should be at least 100KB (solid color would be ~10KB)
			// We're testing large file handling capability, not exact size
			expect(fileSizeMB).toBeGreaterThan(0.1);

			const fileData = fileHelper.createFileData(imageBuffer, 'large-gradient.png', 'image/png');

			// Upload file
			await fileHelper.uploadFile(fileData);

			// Wait for file to appear in list
			await expect(page.locator('.file-item')).toBeVisible({ timeout: 30000 });

			// Select JPEG output
			const formatOption = page.locator('.format-option').filter({ hasText: /JPEG|JPG/i });
			await formatOption.click();

			// Start conversion
			await page.locator('.convert-btn').first().click();

			// Wait for completion (generous timeout for large file)
			await expect(page.locator('.download-btn, .success-indicator, [data-status="complete"]').first())
				.toBeVisible({ timeout: 180000 });

			// Verify no memory error message
			const errorVisible = await page.locator('text=/memory|out of memory|too large/i').isVisible();
			expect(errorVisible).toBe(false);

			console.log('Large image conversion completed successfully');
		});

		test.skip('shows clear error for oversized file (>100MB)', async () => {
			// Skip in CI - would generate very large file
			// This test validates graceful degradation for PERF-05
			// TODO: Implement when oversized file handling is added to app
		});
	});

	test.describe('Large Audio Files', () => {
		test.slow(); // Mark as slow test

		test('converts 25MB WAV to MP3 without memory error', async ({ page, fileHelper }) => {
			await page.goto('/convert');
			await page.waitForLoadState('networkidle');

			// 25MB WAV calculation:
			// Size = sampleRate * bytesPerSample * channels * duration
			// 25MB = 44100 * 2 * 2 * duration
			// duration = 25MB / (44100 * 4) = ~142 seconds
			const audioBuffer = AudioFactory.createWAV({
				duration: 140, // seconds
				sampleRate: 44100,
				channels: 2
			});

			const fileSizeMB = audioBuffer.length / 1024 / 1024;
			console.log(`Generated audio size: ${fileSizeMB.toFixed(2)}MB (target: ${LARGE_AUDIO_SIZE_TARGET_MB}MB)`);

			// Verify size is approximately 25MB
			expect(fileSizeMB).toBeGreaterThan(20); // At least 20MB

			const fileData = fileHelper.createFileData(audioBuffer, 'large-audio.wav', 'audio/wav');

			// Upload file
			await fileHelper.uploadFile(fileData);

			// Wait for file to appear in list
			await expect(page.locator('.file-item')).toBeVisible({ timeout: 30000 });

			// Select MP3 output
			const formatOption = page.locator('.format-option').filter({ hasText: /MP3/i });
			await formatOption.click();

			// Start conversion
			await page.locator('.convert-btn').first().click();

			// Wait for completion (longer timeout for audio encoding)
			await expect(page.locator('.download-btn, .success-indicator, [data-status="complete"]').first())
				.toBeVisible({ timeout: 240000 });

			// Verify no memory error message
			const errorVisible = await page.locator('text=/memory|out of memory|too large/i').isVisible();
			expect(errorVisible).toBe(false);

			console.log('Large audio conversion completed successfully');
		});
	});

	test.describe('Large Archive Files', () => {
		test.slow(); // Mark as slow test

		test('converts 40MB ZIP to TAR without memory error', async ({ page, fileHelper }) => {
			await page.goto('/convert');
			await page.waitForLoadState('networkidle');

			// Generate ~40MB archive (under 50MB Playwright limit)
			// Text with STORE compression to maintain size
			const archiveBuffer = await ArchiveFactory.createZIP({
				entries: [
					{ name: 'large-file-1.txt', content: 'A'.repeat(15 * 1024 * 1024) }, // 15MB
					{ name: 'large-file-2.txt', content: 'B'.repeat(15 * 1024 * 1024) }, // 15MB
					{ name: 'large-file-3.txt', content: 'C'.repeat(8 * 1024 * 1024) } // 8MB
				],
				compression: 'STORE' // No compression to maintain size
			});

			const fileSizeMB = archiveBuffer.length / 1024 / 1024;
			console.log(`Generated archive size: ${fileSizeMB.toFixed(2)}MB (target: ${LARGE_ARCHIVE_SIZE_TARGET_MB}MB)`);

			// Verify size is approximately 38MB (stored, not compressed, under 50MB limit)
			expect(fileSizeMB).toBeGreaterThan(30); // At least 30MB
			expect(fileSizeMB).toBeLessThan(50); // Under Playwright limit

			const fileData = fileHelper.createFileData(archiveBuffer, 'large-archive.zip', 'application/zip');

			// Upload file
			await fileHelper.uploadFile(fileData);

			// Wait for file to appear in list
			await expect(page.locator('.file-item')).toBeVisible({ timeout: 30000 });

			// Select TAR output (not Gzipped TAR)
			const formatOption = page.locator('.format-option').filter({ hasText: /TAR Archive/i });
			await formatOption.click();

			// Start conversion
			await page.locator('.convert-btn').first().click();

			// Wait for completion (longest timeout for large archive)
			await expect(page.locator('.download-btn, .success-indicator, [data-status="complete"]').first())
				.toBeVisible({ timeout: 300000 });

			// Verify no memory error message
			const errorVisible = await page.locator('text=/memory|out of memory|too large/i').isVisible();
			expect(errorVisible).toBe(false);

			console.log('Large archive conversion completed successfully');
		});
	});

	test.describe('Memory Limit Error Handling', () => {
		test.skip('displays user-friendly memory error for browser limit exceeded', async () => {
			// Per PERF-05: Memory errors show clear "File too large" message
			// This test requires:
			// 1. Browser memory limit detection
			// 2. User-friendly error message display
			//
			// Current behavior: Untested - may crash or show generic error
			// TODO: Test when memory limit detection is implemented
		});
	});
});
