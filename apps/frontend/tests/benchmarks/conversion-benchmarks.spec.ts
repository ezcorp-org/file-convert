/**
 * Performance Regression Tests
 *
 * Validates that conversions complete within acceptable time thresholds.
 * Uses baselines.json for comparison - tests fail if >50% slower.
 *
 * Run with: bun test tests/benchmarks/conversion-benchmarks.spec.ts
 *
 * Note: Initial baselines are estimates. Calibrate by running benchmarks and
 * updating baselines.json with actual measurements from your environment.
 */

import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { FileHelper } from '../fixtures/file-helpers';
import { DownloadHelper } from '../fixtures/download-helpers';
import { ImageFactory } from '../fixtures/factories/image-factory';
import { SpreadsheetFactory } from '../fixtures/factories/spreadsheet-factory';
import type { Baselines, BaselineEntry } from '../../src/lib/benchmarks/runner';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load baselines
const baselinesPath = join(__dirname, '../../src/lib/benchmarks/baselines.json');
const baselines: Baselines = JSON.parse(readFileSync(baselinesPath, 'utf-8'));

/**
 * Helper to measure conversion time
 */
async function measureConversion(
	page: ReturnType<typeof test['info']>['page'],
	fileHelper: FileHelper,
	downloadHelper: DownloadHelper,
	file: { name: string; mimeType: string; buffer: Buffer },
	targetFormat: string
): Promise<number> {
	const start = Date.now();

	// Upload file
	await fileHelper.uploadFile(file);

	// Select target format
	const formatOption = page.locator('.format-option, .output-format').filter({ hasText: new RegExp(targetFormat, 'i') }).first();
	await formatOption.click();

	// Start conversion
	const convertButton = page.locator('button').filter({ hasText: /convert/i }).first();
	await convertButton.click();

	// Wait for download button to appear (conversion complete)
	await page.locator('button').filter({ hasText: /download/i }).first().waitFor({
		state: 'visible',
		timeout: 60000
	});

	const end = Date.now();
	return end - start;
}

/**
 * Helper to compare against baseline
 */
function checkRegression(
	name: string,
	durationMs: number,
	baseline: BaselineEntry
): { passed: boolean; message: string } {
	const allowedMax = baseline.baselineMs * (1 + baseline.threshold);
	const ratio = durationMs / baseline.baselineMs;
	const passed = durationMs <= allowedMax;

	const message = passed
		? `${name}: ${durationMs}ms (baseline: ${baseline.baselineMs}ms, ratio: ${ratio.toFixed(2)}x)`
		: `REGRESSION: ${name}: ${durationMs}ms exceeds ${allowedMax}ms (${Math.round(ratio * 100 - 100)}% slower)`;

	return { passed, message };
}

test.describe('Benchmark Baseline Validation', () => {
	test('baselines.json is valid and complete', () => {
		expect(baselines).toBeDefined();
		expect(baselines.conversions).toBeDefined();
		expect(baselines.meta).toBeDefined();
		expect(Object.keys(baselines.conversions).length).toBeGreaterThan(0);

		// Verify meta fields
		expect(baselines.meta.generatedAt).toBeDefined();
		expect(baselines.meta.environment).toBeDefined();
	});

	test('all baselines have required fields', () => {
		for (const [name, entry] of Object.entries(baselines.conversions)) {
			const baseline = entry as BaselineEntry;
			expect(baseline.baselineMs, `${name} missing baselineMs`).toBeDefined();
			expect(typeof baseline.baselineMs).toBe('number');
			expect(baseline.baselineMs).toBeGreaterThan(0);

			expect(baseline.threshold, `${name} missing threshold`).toBeDefined();
			expect(typeof baseline.threshold).toBe('number');
			expect(baseline.threshold).toBeGreaterThan(0);
			expect(baseline.threshold).toBeLessThanOrEqual(1); // Max 100%

			expect(baseline.fileSize, `${name} missing fileSize`).toBeDefined();
			expect(typeof baseline.fileSize).toBe('string');

			expect(baseline.lastUpdated, `${name} missing lastUpdated`).toBeDefined();
		}
	});

	test('threshold is 50% (0.5) per CONTEXT.md decision', () => {
		for (const [name, entry] of Object.entries(baselines.conversions)) {
			const baseline = entry as BaselineEntry;
			expect(baseline.threshold, `${name} should use 0.5 threshold`).toBe(0.5);
		}
	});

	test('key conversion paths have baselines', () => {
		// Image conversions
		expect(baselines.conversions['png-to-jpeg']).toBeDefined();
		expect(baselines.conversions['jpeg-to-png']).toBeDefined();
		expect(baselines.conversions['webp-to-png']).toBeDefined();

		// Audio conversions
		expect(baselines.conversions['wav-to-mp3']).toBeDefined();

		// Spreadsheet conversions
		expect(baselines.conversions['csv-to-json']).toBeDefined();
		expect(baselines.conversions['json-to-yaml']).toBeDefined();

		// Text conversions
		expect(baselines.conversions['md-to-html']).toBeDefined();
		expect(baselines.conversions['html-to-txt']).toBeDefined();

		// Archive conversions
		expect(baselines.conversions['zip-to-tar']).toBeDefined();
	});
});

test.describe('Performance Regression Tests', () => {
	test.describe.configure({ mode: 'serial' }); // Run serially for consistent timing

	let fileHelper: FileHelper;
	let downloadHelper: DownloadHelper;

	test.beforeEach(async ({ page }) => {
		fileHelper = new FileHelper(page);
		downloadHelper = new DownloadHelper(page);
		await page.goto('/convert');
		await page.waitForLoadState('networkidle');
	});

	test.afterEach(async () => {
		await downloadHelper.cleanup();
	});

	// ====================
	// IMAGE CONVERSIONS
	// ====================

	test('PNG to JPEG conversion within baseline', async ({ page }) => {
		const baseline = baselines.conversions['png-to-jpeg'];
		if (!baseline) {
			test.skip();
			return;
		}

		// Create 100x100 PNG (smaller for faster tests, ~1KB)
		const pngBuffer = await ImageFactory.createPNG({ width: 100, height: 100 });
		const file = {
			name: 'benchmark-test.png',
			mimeType: 'image/png',
			buffer: pngBuffer
		};

		const duration = await measureConversion(page, fileHelper, downloadHelper, file, 'JPEG');

		const result = checkRegression('PNG->JPEG', duration, baseline);
		console.log(result.message);

		expect(result.passed, result.message).toBe(true);
	});

	test('PNG to WebP conversion within baseline', async ({ page }) => {
		const baseline = baselines.conversions['png-to-webp'];
		if (!baseline) {
			test.skip();
			return;
		}

		const pngBuffer = await ImageFactory.createPNG({ width: 100, height: 100 });
		const file = {
			name: 'benchmark-test.png',
			mimeType: 'image/png',
			buffer: pngBuffer
		};

		const duration = await measureConversion(page, fileHelper, downloadHelper, file, 'WebP');

		const result = checkRegression('PNG->WebP', duration, baseline);
		console.log(result.message);

		expect(result.passed, result.message).toBe(true);
	});

	test('JPEG to PNG conversion within baseline', async ({ page }) => {
		const baseline = baselines.conversions['jpeg-to-png'];
		if (!baseline) {
			test.skip();
			return;
		}

		const jpegBuffer = await ImageFactory.createJPEG({ width: 100, height: 100 });
		const file = {
			name: 'benchmark-test.jpg',
			mimeType: 'image/jpeg',
			buffer: jpegBuffer
		};

		const duration = await measureConversion(page, fileHelper, downloadHelper, file, 'PNG');

		const result = checkRegression('JPEG->PNG', duration, baseline);
		console.log(result.message);

		expect(result.passed, result.message).toBe(true);
	});

	test('WebP to JPEG conversion within baseline', async ({ page }) => {
		const baseline = baselines.conversions['webp-to-jpeg'];
		if (!baseline) {
			test.skip();
			return;
		}

		const webpBuffer = await ImageFactory.createWebP({ width: 100, height: 100 });
		const file = {
			name: 'benchmark-test.webp',
			mimeType: 'image/webp',
			buffer: webpBuffer
		};

		const duration = await measureConversion(page, fileHelper, downloadHelper, file, 'JPEG');

		const result = checkRegression('WebP->JPEG', duration, baseline);
		console.log(result.message);

		expect(result.passed, result.message).toBe(true);
	});

	// ====================
	// SPREADSHEET CONVERSIONS
	// ====================

	test('CSV to JSON conversion within baseline', async ({ page }) => {
		const baseline = baselines.conversions['csv-to-json'];
		if (!baseline) {
			test.skip();
			return;
		}

		const csvBuffer = SpreadsheetFactory.createCSV();
		const file = {
			name: 'benchmark-test.csv',
			mimeType: 'text/csv',
			buffer: csvBuffer
		};

		const duration = await measureConversion(page, fileHelper, downloadHelper, file, 'JSON');

		const result = checkRegression('CSV->JSON', duration, baseline);
		console.log(result.message);

		expect(result.passed, result.message).toBe(true);
	});

	test('CSV to TSV conversion within baseline', async ({ page }) => {
		const baseline = baselines.conversions['csv-to-tsv'];
		if (!baseline) {
			test.skip();
			return;
		}

		const csvBuffer = SpreadsheetFactory.createCSV();
		const file = {
			name: 'benchmark-test.csv',
			mimeType: 'text/csv',
			buffer: csvBuffer
		};

		const duration = await measureConversion(page, fileHelper, downloadHelper, file, 'TSV');

		const result = checkRegression('CSV->TSV', duration, baseline);
		console.log(result.message);

		expect(result.passed, result.message).toBe(true);
	});

	test('JSON to YAML conversion within baseline', async ({ page }) => {
		const baseline = baselines.conversions['json-to-yaml'];
		if (!baseline) {
			test.skip();
			return;
		}

		const jsonBuffer = SpreadsheetFactory.createJSON();
		const file = {
			name: 'benchmark-test.json',
			mimeType: 'application/json',
			buffer: jsonBuffer
		};

		const duration = await measureConversion(page, fileHelper, downloadHelper, file, 'YAML');

		const result = checkRegression('JSON->YAML', duration, baseline);
		console.log(result.message);

		expect(result.passed, result.message).toBe(true);
	});

	// ====================
	// TEXT CONVERSIONS
	// ====================

	test('MD to HTML conversion within baseline', async ({ page }) => {
		const baseline = baselines.conversions['md-to-html'];
		if (!baseline) {
			test.skip();
			return;
		}

		const mdContent = `# Benchmark Test

This is a markdown file for performance testing.

- Item 1
- Item 2
- Item 3

**Bold text** and *italic text*.
`;
		const file = {
			name: 'benchmark-test.md',
			mimeType: 'text/markdown',
			buffer: Buffer.from(mdContent, 'utf-8')
		};

		const duration = await measureConversion(page, fileHelper, downloadHelper, file, 'HTML');

		const result = checkRegression('MD->HTML', duration, baseline);
		console.log(result.message);

		expect(result.passed, result.message).toBe(true);
	});

	test('HTML to TXT conversion within baseline', async ({ page }) => {
		const baseline = baselines.conversions['html-to-txt'];
		if (!baseline) {
			test.skip();
			return;
		}

		const htmlContent = `<!DOCTYPE html>
<html>
<head><title>Benchmark Test</title></head>
<body>
<h1>Header</h1>
<p>Paragraph text for performance testing.</p>
<ul>
<li>Item 1</li>
<li>Item 2</li>
</ul>
</body>
</html>`;
		const file = {
			name: 'benchmark-test.html',
			mimeType: 'text/html',
			buffer: Buffer.from(htmlContent, 'utf-8')
		};

		const duration = await measureConversion(page, fileHelper, downloadHelper, file, 'TXT');

		const result = checkRegression('HTML->TXT', duration, baseline);
		console.log(result.message);

		expect(result.passed, result.message).toBe(true);
	});
});

test.describe('Regression Detection Verification', () => {
	test('regression detection works correctly', () => {
		// Test passing case
		const passingResult = checkRegression('test-conversion', 100, {
			baselineMs: 100,
			threshold: 0.5,
			fileSize: '1MB',
			lastUpdated: '2026-01-25'
		});
		expect(passingResult.passed).toBe(true);
		expect(passingResult.message).toContain('1.00x');

		// Test at threshold (exactly 50% slower)
		const atThresholdResult = checkRegression('test-conversion', 150, {
			baselineMs: 100,
			threshold: 0.5,
			fileSize: '1MB',
			lastUpdated: '2026-01-25'
		});
		expect(atThresholdResult.passed).toBe(true);
		expect(atThresholdResult.message).toContain('1.50x');

		// Test regression (>50% slower)
		const regressionResult = checkRegression('test-conversion', 160, {
			baselineMs: 100,
			threshold: 0.5,
			fileSize: '1MB',
			lastUpdated: '2026-01-25'
		});
		expect(regressionResult.passed).toBe(false);
		expect(regressionResult.message).toContain('REGRESSION');
		expect(regressionResult.message).toContain('60%');
	});
});

/**
 * Worker Initialization Timing Tests (PERF-07)
 *
 * Validates that workers initialize within acceptable time limits.
 * Per CONTEXT.md: Worker initialization should complete within 10 seconds.
 *
 * Workers are lazy-loaded when files are uploaded, so we measure the time
 * from page load + file upload to first conversion being ready.
 */
test.describe('Worker Initialization', () => {
	const WORKER_INIT_TIMEOUT_MS = 10000; // 10 seconds per PERF-07

	let fileHelper: FileHelper;
	let downloadHelper: DownloadHelper;

	test.beforeEach(async ({ page }) => {
		fileHelper = new FileHelper(page);
		downloadHelper = new DownloadHelper(page);
	});

	test.afterEach(async () => {
		await downloadHelper.cleanup();
	});

	test('image worker initializes within 10 seconds', async ({ page }) => {
		const start = Date.now();

		// Navigate to convert page
		await page.goto('/convert');
		await page.waitForLoadState('networkidle');

		// Upload a small PNG to trigger image worker initialization
		const pngBuffer = await ImageFactory.createPNG({ width: 10, height: 10 });
		await fileHelper.uploadFile({
			name: 'init-test.png',
			mimeType: 'image/png',
			buffer: pngBuffer
		});

		// Wait for format options to appear (indicates worker is ready)
		await page.locator('.format-option, .output-format').first().waitFor({
			state: 'visible',
			timeout: WORKER_INIT_TIMEOUT_MS
		});

		const initTime = Date.now() - start;
		console.log(`Image worker init time: ${initTime}ms`);

		expect(initTime, `Image worker init (${initTime}ms) should be under ${WORKER_INIT_TIMEOUT_MS}ms`).toBeLessThan(WORKER_INIT_TIMEOUT_MS);
	});

	test('audio worker initializes within 10 seconds', async ({ page }) => {
		const start = Date.now();

		// Navigate to convert page
		await page.goto('/convert');
		await page.waitForLoadState('networkidle');

		// Create a minimal WAV file to trigger audio worker
		// WAV header: 44 bytes minimum
		const wavHeader = Buffer.alloc(44);
		// RIFF header
		wavHeader.write('RIFF', 0);
		wavHeader.writeUInt32LE(36, 4); // File size - 8
		wavHeader.write('WAVE', 8);
		// fmt chunk
		wavHeader.write('fmt ', 12);
		wavHeader.writeUInt32LE(16, 16); // fmt chunk size
		wavHeader.writeUInt16LE(1, 20); // Audio format (PCM)
		wavHeader.writeUInt16LE(1, 22); // Channels
		wavHeader.writeUInt32LE(44100, 24); // Sample rate
		wavHeader.writeUInt32LE(44100 * 2, 28); // Byte rate
		wavHeader.writeUInt16LE(2, 32); // Block align
		wavHeader.writeUInt16LE(16, 34); // Bits per sample
		// data chunk
		wavHeader.write('data', 36);
		wavHeader.writeUInt32LE(0, 40); // Data size

		await fileHelper.uploadFile({
			name: 'init-test.wav',
			mimeType: 'audio/wav',
			buffer: wavHeader
		});

		// Wait for format options to appear (indicates worker is ready)
		await page.locator('.format-option, .output-format').first().waitFor({
			state: 'visible',
			timeout: WORKER_INIT_TIMEOUT_MS
		});

		const initTime = Date.now() - start;
		console.log(`Audio worker init time: ${initTime}ms`);

		expect(initTime, `Audio worker init (${initTime}ms) should be under ${WORKER_INIT_TIMEOUT_MS}ms`).toBeLessThan(WORKER_INIT_TIMEOUT_MS);
	});

	test('spreadsheet worker initializes within 10 seconds', async ({ page }) => {
		const start = Date.now();

		// Navigate to convert page
		await page.goto('/convert');
		await page.waitForLoadState('networkidle');

		// Upload a simple CSV to trigger spreadsheet worker
		const csvBuffer = SpreadsheetFactory.createCSV();
		await fileHelper.uploadFile({
			name: 'init-test.csv',
			mimeType: 'text/csv',
			buffer: csvBuffer
		});

		// Wait for format options to appear (indicates worker is ready)
		await page.locator('.format-option, .output-format').first().waitFor({
			state: 'visible',
			timeout: WORKER_INIT_TIMEOUT_MS
		});

		const initTime = Date.now() - start;
		console.log(`Spreadsheet worker init time: ${initTime}ms`);

		expect(initTime, `Spreadsheet worker init (${initTime}ms) should be under ${WORKER_INIT_TIMEOUT_MS}ms`).toBeLessThan(WORKER_INIT_TIMEOUT_MS);
	});
});
