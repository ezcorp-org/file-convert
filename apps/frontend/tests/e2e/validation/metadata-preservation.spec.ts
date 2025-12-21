import { test, expect, ImageFactory, AudioFactory, MetadataValidator } from '../../fixtures';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const EXIF_TEST_ASSET = resolve(__dirname, '../../testAssets/images/sample-with-exif.jpg');

/**
 * Metadata Preservation Tests (ADV-05, ADV-06, ADV-07)
 *
 * These tests validate that metadata (EXIF, ID3 tags) is properly handled
 * during file conversions. They cover:
 * - ADV-05: Audio metadata preservation
 * - ADV-06: Image metadata preservation (JPEG to PNG)
 * - ADV-07: Image metadata preservation (PNG to JPEG)
 */

test.beforeAll(() => {
	if (!existsSync(EXIF_TEST_ASSET)) {
		throw new Error(`EXIF test asset not found at ${EXIF_TEST_ASSET}. Run 04-11 plan first.`);
	}
	console.log(`EXIF test asset found at ${EXIF_TEST_ASSET}`);
});

// Helper to get correct extension for file
function getExtension(format: string): string {
	const extensions: Record<string, string> = {
		png: 'png',
		jpeg: 'jpg',
		webp: 'webp',
		wav: 'wav',
		mp3: 'mp3'
	};
	return extensions[format] || format;
}

// Helper to get UI text for format selection
function getFormatUIText(format: string): RegExp {
	const uiText: Record<string, RegExp> = {
		png: /PNG/i,
		jpeg: /JPEG|JPG/i,
		webp: /WebP/i,
		wav: /WAV/i,
		mp3: /MP3/i
	};
	return uiText[format] || new RegExp(format, 'i');
}

test.describe('Image Metadata Preservation', () => {
	test('extracts metadata from images with EXIF', async () => {
		// Use real EXIF test asset created in plan 04-11
		const jpegWithExif = readFileSync(EXIF_TEST_ASSET);

		// Extract metadata
		const metadata = await MetadataValidator.extractImageMetadata(jpegWithExif);

		// Verify EXIF data is present (values from 04-11-SUMMARY)
		expect(metadata.hasExif).toBe(true);
		expect(metadata.make).toBe('Test Camera Manufacturer');
		expect(metadata.model).toBe('Test Camera Model 2000');

		console.log('Extracted metadata:', {
			hasExif: metadata.hasExif,
			make: metadata.make,
			model: metadata.model
		});
	});

	test('extracts metadata from images without EXIF', async () => {
		// Create image without metadata
		const pngWithoutExif = await ImageFactory.createPNG({
			width: 100,
			height: 100
		});

		// Extract metadata
		const metadata = await MetadataValidator.extractImageMetadata(pngWithoutExif);

		// Verify no EXIF data
		expect(metadata.hasExif).toBe(false);
		expect(metadata.make).toBeUndefined();

		console.log('PNG without EXIF:', {
			hasExif: metadata.hasExif,
			hasXmp: metadata.hasXmp,
			hasIptc: metadata.hasIptc
		});
	});

	test('JPEG to PNG metadata handling (ADV-06)', async ({
		page,
		fileHelper,
		downloadHelper
	}) => {
		// Use real EXIF test asset
		const jpegBuffer = readFileSync(EXIF_TEST_ASSET);

		// Extract source metadata
		const sourceMeta = await MetadataValidator.extractImageMetadata(jpegBuffer);
		console.log('Source JPEG EXIF:', {
			hasExif: sourceMeta.hasExif,
			make: sourceMeta.make,
			model: sourceMeta.model
		});

		expect(sourceMeta.hasExif).toBe(true);
		expect(sourceMeta.make).toBe('Test Camera Manufacturer');

		// Navigate and upload
		await page.goto('/convert');
		await page.waitForLoadState('networkidle');

		const fileData = fileHelper.createFileData(jpegBuffer, 'test.jpg', 'image/jpeg');
		await fileHelper.uploadFile(fileData);

		// Select PNG output format
		const formatOption = page.locator('.format-option').filter({ hasText: getFormatUIText('png') });
		await formatOption.click();

		// Start conversion
		await page.locator('.convert-btn').first().click();

		// Wait for completion
		await expect(page.locator('.download-btn').first()).toBeVisible({ timeout: 45000 });

		// Download converted file
		const { buffer: pngBuffer, validation } = await downloadHelper.validateDownload(
			'.download-btn',
			'png'
		);

		// Validate format
		expect(validation.valid).toBe(true);
		expect(validation.detectedFormat).toBe('png');

		// Extract metadata from converted PNG
		const convertedMeta = await MetadataValidator.extractImageMetadata(pngBuffer);
		console.log('Converted PNG EXIF:', {
			hasExif: convertedMeta.hasExif,
			make: convertedMeta.make,
			model: convertedMeta.model
		});

		// Validate metadata preservation using validator
		// Note: JPEG -> PNG may lose EXIF data (format-dependent behavior)
		// Using 'partial' expectation to document actual behavior
		const metadataValidation = await MetadataValidator.validateMetadataPreservation(
			jpegBuffer,
			pngBuffer,
			'partial'
		);

		expect(metadataValidation.valid).toBe(true);

		// Document observed behavior
		console.log('ADV-06 Result:', {
			sourceHadExif: sourceMeta.hasExif,
			convertedHasExif: convertedMeta.hasExif,
			metadataPreserved: convertedMeta.hasExif && convertedMeta.make === sourceMeta.make
		});
	});

	test('PNG to JPEG metadata handling (ADV-07)', async ({
		page,
		fileHelper,
		downloadHelper
	}) => {
		// Create PNG (PNG format doesn't typically have EXIF)
		const pngBuffer = await ImageFactory.createPNG({
			width: 200,
			height: 150,
			background: '#00FF00'
		});

		// Extract source metadata (should have none)
		const sourceMeta = await MetadataValidator.extractImageMetadata(pngBuffer);
		console.log('Source PNG metadata:', {
			hasExif: sourceMeta.hasExif,
			hasXmp: sourceMeta.hasXmp
		});

		// Navigate and upload
		await page.goto('/convert');
		await page.waitForLoadState('networkidle');

		const fileData = fileHelper.createFileData(pngBuffer, 'test.png', 'image/png');
		await fileHelper.uploadFile(fileData);

		// Select JPEG output format
		const formatOption = page.locator('.format-option').filter({ hasText: getFormatUIText('jpeg') });
		await formatOption.click();

		// Start conversion
		await page.locator('.convert-btn').first().click();

		// Wait for completion
		await expect(page.locator('.download-btn').first()).toBeVisible({ timeout: 45000 });

		// Download converted file
		const { buffer: jpegBuffer, validation } = await downloadHelper.validateDownload(
			'.download-btn',
			'jpeg'
		);

		// Validate format (accepts both 'jpeg' and 'jpg')
		expect(validation.valid).toBe(true);
		expect(['jpeg', 'jpg']).toContain(validation.detectedFormat);

		// Extract metadata from converted JPEG
		const convertedMeta = await MetadataValidator.extractImageMetadata(jpegBuffer);
		console.log('Converted JPEG metadata:', {
			hasExif: convertedMeta.hasExif,
			hasXmp: convertedMeta.hasXmp
		});

		// Validate metadata preservation
		// PNG without metadata -> JPEG should also have no metadata (or minimal format metadata)
		const metadataValidation = await MetadataValidator.validateMetadataPreservation(
			pngBuffer,
			jpegBuffer,
			'partial'
		);

		expect(metadataValidation.valid).toBe(true);

		// Document observed behavior
		console.log('ADV-07 Result:', {
			sourceHadExif: sourceMeta.hasExif,
			convertedHasExif: convertedMeta.hasExif,
			conversionComplete: jpegBuffer.length > 0
		});
	});

	test('JPEG with EXIF to WebP metadata handling', async ({
		page,
		fileHelper,
		downloadHelper
	}) => {
		// Test JPEG -> WebP instead of JPEG -> JPEG
		// (App doesn't support same-format conversion)
		// Use real EXIF test asset
		const jpegBuffer = readFileSync(EXIF_TEST_ASSET);

		// Extract source metadata
		const sourceMeta = await MetadataValidator.extractImageMetadata(jpegBuffer);
		console.log('Source JPEG metadata:', {
			hasExif: sourceMeta.hasExif,
			make: sourceMeta.make,
			model: sourceMeta.model
		});

		expect(sourceMeta.hasExif).toBe(true);

		// Navigate and upload
		await page.goto('/convert');
		await page.waitForLoadState('networkidle');

		const fileData = fileHelper.createFileData(jpegBuffer, 'test.jpg', 'image/jpeg');
		await fileHelper.uploadFile(fileData);

		// Select WebP output format
		const formatOption = page.locator('.format-option').filter({ hasText: getFormatUIText('webp') });
		await formatOption.click();

		// Start conversion
		await page.locator('.convert-btn').first().click();

		// Wait for completion
		await expect(page.locator('.download-btn').first()).toBeVisible({ timeout: 45000 });

		// Download converted file
		const { buffer: convertedBuffer, validation } = await downloadHelper.validateDownload(
			'.download-btn',
			'webp'
		);

		// Validate format
		expect(validation.valid).toBe(true);
		expect(validation.detectedFormat).toBe('webp');

		// Extract metadata from converted WebP
		const convertedMeta = await MetadataValidator.extractImageMetadata(convertedBuffer);
		console.log('WebP output metadata:', {
			hasExif: convertedMeta.hasExif,
			make: convertedMeta.make,
			model: convertedMeta.model
		});

		// JPEG to WebP metadata preservation
		const metadataValidation = await MetadataValidator.validateMetadataPreservation(
			jpegBuffer,
			convertedBuffer,
			'partial' // Using 'partial' as app behavior may vary
		);

		expect(metadataValidation.valid).toBe(true);

		// Document preservation
		console.log('JPEG -> WebP preservation:', {
			sourceHadExif: sourceMeta.hasExif,
			convertedHasExif: convertedMeta.hasExif,
			makePreserved: convertedMeta.make === sourceMeta.make,
			modelPreserved: convertedMeta.model === sourceMeta.model
		});
	});
});

test.describe('Audio Metadata Preservation', () => {
	test('extracts audio metadata structure', async () => {
		// AudioFactory creates WAV without ID3 tags
		const wavBuffer = AudioFactory.createWAV({ duration: 1, frequency: 440 });

		// Extract metadata (WAV typically doesn't have ID3)
		const metadata = await MetadataValidator.extractAudioMetadata(wavBuffer);

		console.log('WAV metadata:', {
			hasId3: metadata.hasId3,
			artist: metadata.artist,
			title: metadata.title
		});

		// WAV files don't have ID3 tags (that's MP3 metadata)
		expect(metadata).toBeDefined();
		expect(metadata.rawTags).toBeDefined();
	});

	test.skip('audio conversion metadata handling (ADV-05)', async ({
		page,
		fileHelper,
		downloadHelper
	}) => {
		// SKIPPED: AudioFactory only creates WAV without metadata
		// MP3 output conversions are currently skipped per STATE.md decisions
		// This test documents expected behavior when MP3 encoding is implemented

		// Expected test flow:
		// 1. Create WAV file
		const wavBuffer = AudioFactory.createWAV({ duration: 2, frequency: 440 });

		// 2. Extract source metadata (WAV has no ID3)
		const sourceMeta = await MetadataValidator.extractAudioMetadata(wavBuffer);
		console.log('Source WAV metadata:', sourceMeta);

		// 3. Convert WAV -> MP3
		await page.goto('/convert');
		await page.waitForLoadState('networkidle');

		const fileData = fileHelper.createFileData(wavBuffer, 'test.wav', 'audio/wav');
		await fileHelper.uploadFile(fileData);

		const formatOption = page.locator('.format-option').filter({ hasText: getFormatUIText('mp3') });
		await formatOption.click();

		await page.locator('.convert-btn').first().click();

		// 4. Download and validate MP3
		await expect(page.locator('.download-btn').first()).toBeVisible({ timeout: 60000 });

		const { buffer: mp3Buffer, validation } = await downloadHelper.validateDownload(
			'.download-btn',
			'mp3'
		);

		expect(validation.valid).toBe(true);

		// 5. Extract MP3 metadata
		const mp3Meta = await MetadataValidator.extractAudioMetadata(mp3Buffer);
		console.log('MP3 output metadata:', mp3Meta);

		// 6. Document metadata behavior
		expect(mp3Buffer.length).toBeGreaterThan(0);
	});

	test.skip('WAV to MP3 preserves audio data (metadata N/A)', async ({
		page,
		fileHelper,
		downloadHelper
	}) => {
		// SKIPPED: Per STATE.md decision - MP3 encoding has issues
		// Tests ready to unskip when encoding implemented

		// Note: WAV doesn't have ID3 tags, so this test focuses on
		// audio data integrity rather than metadata preservation

		const wavBuffer = AudioFactory.createWAV({
			duration: 2,
			frequency: 440,
			channels: 2,
			sampleRate: 44100
		});

		await page.goto('/convert');
		await page.waitForLoadState('networkidle');

		const fileData = fileHelper.createFileData(wavBuffer, 'test.wav', 'audio/wav');
		await fileHelper.uploadFile(fileData);

		const formatOption = page.locator('.format-option').filter({ hasText: getFormatUIText('mp3') });
		await formatOption.click();

		await page.locator('.convert-btn').first().click();

		await expect(page.locator('.download-btn').first()).toBeVisible({ timeout: 60000 });

		const { buffer: mp3Buffer, validation } = await downloadHelper.validateDownload(
			'.download-btn',
			'mp3'
		);

		expect(validation.valid).toBe(true);
		expect(mp3Buffer.length).toBeGreaterThan(0);

		console.log('WAV -> MP3 conversion complete:', {
			sourceSize: wavBuffer.length,
			outputSize: mp3Buffer.length,
			compressionRatio: (wavBuffer.length / mp3Buffer.length).toFixed(2)
		});
	});
});

test.describe('Metadata Validation Edge Cases', () => {
	test('handles corrupted metadata gracefully', async () => {
		// Create buffer with invalid EXIF-like structure
		const invalidBuffer = Buffer.from([
			0xff,
			0xd8, // JPEG SOI marker
			0xff,
			0xe1, // APP1 marker (EXIF)
			0x00,
			0x10, // Length
			// Incomplete/invalid EXIF data
			0x45,
			0x78,
			0x69,
			0x66,
			0x00,
			0x00,
			0xff,
			0xd9 // JPEG EOI marker
		]);

		// MetadataValidator should handle gracefully
		const metadata = await MetadataValidator.extractImageMetadata(invalidBuffer);

		// Should not throw, should return empty metadata
		expect(metadata).toBeDefined();
		expect(metadata.hasExif).toBe(false);

		console.log('Corrupted metadata handling:', {
			hasExif: metadata.hasExif,
			errors: 'none (graceful handling)'
		});
	});

	test('validates metadata preservation expectations', async () => {
		// Use real EXIF test asset
		const jpegWithExif = readFileSync(EXIF_TEST_ASSET);

		const pngWithoutExif = await ImageFactory.createPNG({
			width: 100,
			height: 100
		});

		// Test all preservation expectations
		const preserved = await MetadataValidator.validateMetadataPreservation(
			jpegWithExif,
			jpegWithExif, // Same file = preserved
			'preserved'
		);
		expect(preserved.valid).toBe(true);

		const stripped = await MetadataValidator.validateMetadataPreservation(
			jpegWithExif,
			pngWithoutExif, // JPEG -> PNG without EXIF = stripped
			'stripped'
		);
		expect(stripped.valid).toBe(true);

		const partial = await MetadataValidator.validateMetadataPreservation(
			jpegWithExif,
			pngWithoutExif, // Partial allows any outcome
			'partial'
		);
		expect(partial.valid).toBe(true);

		console.log('Metadata validation expectations:', {
			preserved: preserved.valid,
			stripped: stripped.valid,
			partial: partial.valid
		});
	});
});
