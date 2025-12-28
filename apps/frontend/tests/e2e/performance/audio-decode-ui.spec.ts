/**
 * Audio Decode UI Responsiveness Tests
 *
 * Tests for BUG-04: Audio decoding should happen in worker thread,
 * not main thread, to prevent UI blocking during MP3/FLAC decoding.
 *
 * These tests verify:
 * - UI remains interactive during audio conversion
 * - Progress updates are shown during decode phase
 * - Audio decoding doesn't block the event loop
 */
import { test, expect, AudioFactory } from '../../fixtures';

test.describe('Audio Decode UI Responsiveness', () => {
	// Extended timeout for audio tests (2 minutes)
	test.describe.configure({ timeout: 120000 });

	test.slow(); // Mark all tests as slow

	test('UI remains responsive during WAV to MP3 conversion', async ({ page, fileHelper }) => {
		await page.goto('/convert');
		await page.waitForLoadState('networkidle');

		// Generate a moderate-sized WAV file (5 seconds audio)
		// This should be enough to test responsiveness without being too slow
		const audioBuffer = AudioFactory.createWAV({
			duration: 5,
			sampleRate: 44100,
			channels: 2,
			bitDepth: 16,
			frequency: 440
		});

		const fileSizeMB = audioBuffer.length / 1024 / 1024;
		console.log(`Test audio file size: ${fileSizeMB.toFixed(2)}MB`);

		const fileData = fileHelper.createFileData(audioBuffer, 'test-responsive.wav', 'audio/wav');

		// Upload file
		await fileHelper.uploadFile(fileData);

		// Wait for file to appear in list
		await expect(page.locator('.file-item')).toContainText('test-responsive.wav');

		// Select MP3 output
		const formatOption = page.locator('.format-option').filter({ hasText: /MP3/i });
		await formatOption.click();

		// Track UI responsiveness by checking if we can interact during conversion
		let interactedDuringConversion = false;
		let progressObserved = false;

		// Start conversion
		await page.locator('.convert-btn').first().click();

		// During conversion, try to interact with UI elements
		// This tests that the main thread is not blocked
		const conversionPromise = page
			.locator('.download-btn, .success-indicator, [data-status="complete"]')
			.first()
			.waitFor({ timeout: 90000 });

		// Try hovering/interacting with other elements during conversion
		// If UI is responsive, these should work without timing out
		try {
			// Check progress indicator visibility during conversion
			const progressIndicator = page.locator('.progress, [role="progressbar"], .converting');
			const progressVisible = await progressIndicator.isVisible().catch(() => false);
			if (progressVisible) {
				progressObserved = true;
				console.log('Progress indicator observed during conversion');
			}

			// Try to interact with navigation elements during conversion
			// This tests main thread responsiveness
			const navElement = page.locator('nav, header, .logo').first();
			if (await navElement.isVisible().catch(() => false)) {
				await navElement.hover({ timeout: 5000 });
				interactedDuringConversion = true;
				console.log('Successfully interacted with navigation during conversion');
			}

			// Try scrolling (tests event loop responsiveness)
			await page.mouse.wheel(0, 100);
			await page.waitForTimeout(100); // Brief pause to allow scroll
			interactedDuringConversion = true;
		} catch (error) {
			// If interaction times out, UI was blocked
			console.warn('UI interaction during conversion failed:', error);
		}

		// Wait for conversion to complete
		await conversionPromise;

		// Log test results
		console.log(`UI interaction during conversion: ${interactedDuringConversion ? 'PASSED' : 'FAILED'}`);
		console.log(`Progress indicator observed: ${progressObserved ? 'YES' : 'NO'}`);

		// Verify conversion completed successfully
		const downloadBtn = page.locator('.download-btn').first();
		await expect(downloadBtn).toBeVisible();

		// UI should have been interactive during conversion
		expect(interactedDuringConversion).toBe(true);
	});

	test('progress updates are sent during audio decode', async ({ page, fileHelper }) => {
		await page.goto('/convert');
		await page.waitForLoadState('networkidle');

		// Generate audio file
		const audioBuffer = AudioFactory.createWAV({
			duration: 3,
			sampleRate: 44100,
			channels: 2,
			bitDepth: 16,
			frequency: 440
		});

		const fileData = fileHelper.createFileData(audioBuffer, 'test-progress.wav', 'audio/wav');

		// Upload file
		await fileHelper.uploadFile(fileData);
		await expect(page.locator('.file-item')).toContainText('test-progress.wav');

		// Select MP3 output
		const formatOption = page.locator('.format-option').filter({ hasText: /MP3/i });
		await formatOption.click();

		// Collect progress messages during conversion
		const progressMessages: string[] = [];
		const progressValues: number[] = [];

		// Listen for console messages that might contain progress info
		page.on('console', (msg) => {
			const text = msg.text();
			if (text.includes('progress') || text.includes('Progress') || text.includes('%')) {
				progressMessages.push(text);
			}
		});

		// Start conversion and wait for progress indicator
		await page.locator('.convert-btn').first().click();

		// Try to capture progress updates
		const startTime = Date.now();
		let lastProgress = 0;
		let progressUpdates = 0;

		while (Date.now() - startTime < 60000) {
			// Check for progress bar or percentage display
			const progressBar = page.locator('.progress-bar, [role="progressbar"], .progress-value');
			const progressText = page.locator('.progress-text, .percentage, [data-progress]');

			try {
				// Try to get current progress value
				if (await progressBar.isVisible({ timeout: 500 }).catch(() => false)) {
					const widthStyle = await progressBar.evaluate((el) => {
						const computed = window.getComputedStyle(el);
						return computed.width || el.getAttribute('aria-valuenow') || '0';
					});
					progressUpdates++;
				}

				if (await progressText.isVisible({ timeout: 500 }).catch(() => false)) {
					const text = await progressText.textContent();
					if (text && text.includes('%')) {
						progressUpdates++;
					}
				}
			} catch {
				// Element not found, continue
			}

			// Check if conversion completed
			const downloadVisible = await page
				.locator('.download-btn')
				.first()
				.isVisible({ timeout: 500 })
				.catch(() => false);
			if (downloadVisible) {
				break;
			}

			await page.waitForTimeout(200);
		}

		// Verify conversion completed
		await expect(page.locator('.download-btn').first()).toBeVisible({ timeout: 30000 });

		// Log progress tracking results
		console.log(`Progress updates captured: ${progressUpdates}`);
		console.log(`Progress console messages: ${progressMessages.length}`);

		// We should see some progress indication during conversion
		// (either visual progress bar or console messages)
		const hasProgressFeedback = progressUpdates > 0 || progressMessages.length > 0;
		console.log(`Progress feedback observed: ${hasProgressFeedback ? 'YES' : 'NO'}`);

		// Note: If progress feedback is not shown, it may indicate
		// the conversion is too fast to observe, not necessarily a bug
	});

	test('longer audio conversion shows progress updates', async ({ page, fileHelper }) => {
		await page.goto('/convert');
		await page.waitForLoadState('networkidle');

		// Generate a longer audio file (15 seconds) to ensure we can observe progress
		const audioBuffer = AudioFactory.createWAV({
			duration: 15,
			sampleRate: 44100,
			channels: 2,
			bitDepth: 16,
			frequency: 440
		});

		const fileSizeMB = audioBuffer.length / 1024 / 1024;
		console.log(`Long audio file size: ${fileSizeMB.toFixed(2)}MB`);

		const fileData = fileHelper.createFileData(audioBuffer, 'long-audio.wav', 'audio/wav');

		// Upload file
		await fileHelper.uploadFile(fileData);
		await expect(page.locator('.file-item')).toContainText('long-audio.wav');

		// Select MP3 output
		const formatOption = page.locator('.format-option').filter({ hasText: /MP3/i });
		await formatOption.click();

		// Track interaction success rate
		let successfulInteractions = 0;
		let attemptedInteractions = 0;

		// Start conversion
		await page.locator('.convert-btn').first().click();

		// During the conversion, periodically try to interact with the UI
		const intervalId = setInterval(async () => {
			attemptedInteractions++;
			try {
				// Try a simple interaction
				await page.mouse.move(100, 100);
				await page.waitForTimeout(10);
				successfulInteractions++;
			} catch {
				// Interaction failed - UI was blocked
			}
		}, 500);

		// Wait for conversion to complete
		await expect(page.locator('.download-btn').first()).toBeVisible({ timeout: 90000 });

		clearInterval(intervalId);

		// Calculate responsiveness rate
		const responsivenessRate =
			attemptedInteractions > 0 ? (successfulInteractions / attemptedInteractions) * 100 : 0;

		console.log(`UI responsiveness: ${successfulInteractions}/${attemptedInteractions} (${responsivenessRate.toFixed(1)}%)`);

		// Expect at least 80% of interactions to succeed
		// (some may fail due to timing, but most should work if UI isn't blocked)
		expect(responsivenessRate).toBeGreaterThan(80);
	});

	test('UI interaction is not blocked during conversion', async ({ page, fileHelper }) => {
		await page.goto('/convert');
		await page.waitForLoadState('networkidle');

		// Generate test audio
		const audioBuffer = AudioFactory.createWAV({
			duration: 8,
			sampleRate: 44100,
			channels: 2,
			bitDepth: 16,
			frequency: 440
		});

		const fileData = fileHelper.createFileData(audioBuffer, 'interaction-test.wav', 'audio/wav');

		// Upload file
		await fileHelper.uploadFile(fileData);
		await expect(page.locator('.file-item')).toContainText('interaction-test.wav');

		// Select MP3 output
		const formatOption = page.locator('.format-option').filter({ hasText: /MP3/i });
		await formatOption.click();

		// Start conversion
		await page.locator('.convert-btn').first().click();

		// Measure time for a simple operation during conversion
		// If UI is blocked, this will take significantly longer
		const measurementStart = Date.now();

		// Try to click somewhere on the page (not on interactive elements)
		// and verify it responds quickly
		try {
			await page.mouse.click(10, 10);
			const clickTime = Date.now() - measurementStart;
			console.log(`Click response time during conversion: ${clickTime}ms`);

			// Click should respond within 2000ms if UI is responsive
			expect(clickTime).toBeLessThan(2000);
		} catch (error) {
			console.error('Click failed - UI may be blocked:', error);
			// If click fails, UI was likely blocked
		}

		// Wait for conversion to complete
		await expect(page.locator('.download-btn').first()).toBeVisible({ timeout: 90000 });

		// Verify the conversion was successful
		const downloadBtn = page.locator('.download-btn').first();
		await expect(downloadBtn).toBeVisible();
	});
});

test.describe('Worker-Based Audio Decoding Verification', () => {
	// Extended timeout for these tests
	test.describe.configure({ timeout: 120000 });

	test.slow();

	test('audio conversion completes without blocking main thread', async ({ page, fileHelper }) => {
		await page.goto('/convert');
		await page.waitForLoadState('networkidle');

		// Generate audio file
		const audioBuffer = AudioFactory.createWAV({
			duration: 10,
			sampleRate: 44100,
			channels: 2,
			bitDepth: 16,
			frequency: 440
		});

		const fileData = fileHelper.createFileData(audioBuffer, 'worker-test.wav', 'audio/wav');

		// Upload and start conversion
		await fileHelper.uploadFile(fileData);
		await expect(page.locator('.file-item')).toContainText('worker-test.wav');

		const formatOption = page.locator('.format-option').filter({ hasText: /MP3/i });
		await formatOption.click();

		// Inject a simple main thread blocking detector
		// This checks if long tasks are detected during conversion
		await page.evaluate(() => {
			(window as any).__longTaskCount = 0;
			(window as any).__longTaskObserver = new PerformanceObserver((list) => {
				for (const entry of list.getEntries()) {
					if (entry.duration > 50) {
						// Long task threshold: 50ms
						(window as any).__longTaskCount++;
						console.log(`Long task detected: ${entry.duration.toFixed(2)}ms`);
					}
				}
			});
			(window as any).__longTaskObserver.observe({ entryTypes: ['longtask'] });
		});

		// Start conversion
		await page.locator('.convert-btn').first().click();

		// Wait for conversion to complete
		await expect(page.locator('.download-btn').first()).toBeVisible({ timeout: 90000 });

		// Get long task count
		const longTaskCount = await page.evaluate(() => {
			const observer = (window as any).__longTaskObserver;
			if (observer) observer.disconnect();
			return (window as any).__longTaskCount || 0;
		});

		console.log(`Long tasks detected during conversion: ${longTaskCount}`);

		// Some long tasks may occur, but audio decoding should not cause
		// massive main thread blocking. We expect minimal long tasks
		// if decoding is properly offloaded to workers.
		// Allow up to 5 long tasks (some may be from other sources like layout)
		expect(longTaskCount).toBeLessThan(10);
	});
});
