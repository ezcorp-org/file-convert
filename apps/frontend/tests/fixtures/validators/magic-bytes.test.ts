import { describe, it, expect } from 'vitest';
import { MagicByteValidator, MAGIC_SIGNATURES } from './magic-bytes';
import { DownloadHelper } from '../download-helpers';

describe('MagicByteValidator', () => {
	describe('Binary format detection', () => {
		it('should detect PNG format', async () => {
			// Minimal PNG header (8 bytes) - manual detection
			const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
			const result = await MagicByteValidator.validate(pngBuffer, 'png');

			expect(result.valid).toBe(true);
			expect(result.detectedFormat).toBe('png');
			expect(result.expectedFormat).toBe('png');
			expect(result.confidence).toBe('medium'); // Manual detection for minimal header
		});

		it('should detect JPEG format', async () => {
			// Minimal JPEG header - manual detection
			const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
			const result = await MagicByteValidator.validate(jpegBuffer, 'jpeg');

			expect(result.valid).toBe(true);
			expect(result.detectedFormat).toMatch(/^jpe?g$/);
			expect(result.confidence).toBe('medium'); // Manual detection
		});

		it('should detect PDF format', async () => {
			// PDF header: %PDF-1.4 - manual detection
			const pdfBuffer = Buffer.from('%PDF-1.4\n', 'ascii');
			const result = await MagicByteValidator.validate(pdfBuffer, 'pdf');

			expect(result.valid).toBe(true);
			expect(result.detectedFormat).toBe('pdf');
			expect(result.confidence).toBe('medium'); // Manual detection
		});

		it('should detect ZIP format', async () => {
			// ZIP header: PK\x03\x04 - manual detection
			const zipBuffer = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00]);
			const result = await MagicByteValidator.validate(zipBuffer, 'zip');

			expect(result.valid).toBe(true);
			expect(result.detectedFormat).toBe('zip');
			expect(result.confidence).toBe('medium'); // Manual detection
		});

		it('should detect FLAC format', async () => {
			// FLAC header: fLaC - manual detection
			const flacBuffer = Buffer.from([0x66, 0x4c, 0x61, 0x43, 0x00, 0x00]);
			const result = await MagicByteValidator.validate(flacBuffer, 'flac');

			expect(result.valid).toBe(true);
			expect(result.detectedFormat).toBe('flac');
			expect(result.confidence).toBe('medium'); // Manual detection
		});
	});

	describe('Compound signature formats', () => {
		it('should detect WebP format with RIFF+WEBP signature', async () => {
			// WebP: RIFF[size]WEBP - manual compound detection
			const webpBuffer = Buffer.from([
				0x52,
				0x49,
				0x46,
				0x46, // RIFF
				0x00,
				0x00,
				0x00,
				0x00, // size (placeholder)
				0x57,
				0x45,
				0x42,
				0x50 // WEBP
			]);
			const result = await MagicByteValidator.validate(webpBuffer, 'webp');

			expect(result.valid).toBe(true);
			expect(result.detectedFormat).toBe('webp');
			expect(result.confidence).toBe('medium'); // Manual detection for minimal header
		});

		it('should detect WAV format with RIFF+WAVE signature', async () => {
			// WAV: RIFF[size]WAVE - manual compound detection
			const wavBuffer = Buffer.from([
				0x52,
				0x49,
				0x46,
				0x46, // RIFF
				0x00,
				0x00,
				0x00,
				0x00, // size (placeholder)
				0x57,
				0x41,
				0x56,
				0x45 // WAVE
			]);
			const result = await MagicByteValidator.validate(wavBuffer, 'wav');

			expect(result.valid).toBe(true);
			expect(result.detectedFormat).toBe('wav');
			expect(result.confidence).toBe('medium'); // Manual detection for minimal header
		});
	});

	describe('Text format detection', () => {
		it('should detect valid JSON format', async () => {
			const jsonBuffer = Buffer.from('{"key": "value"}', 'utf-8');
			const result = await MagicByteValidator.validate(jsonBuffer, 'json');

			expect(result.valid).toBe(true);
			expect(result.detectedFormat).toBe('json');
			expect(result.confidence).toBe('low'); // Text validation has lower confidence
		});

		it('should detect valid CSV format', async () => {
			const csvBuffer = Buffer.from('a,b,c\n1,2,3', 'utf-8');
			const result = await MagicByteValidator.validate(csvBuffer, 'csv');

			expect(result.valid).toBe(true);
			expect(result.detectedFormat).toBe('csv');
			expect(result.confidence).toBe('low');
		});

		it('should reject invalid UTF-8 for text formats', async () => {
			// Invalid UTF-8 sequence
			const invalidBuffer = Buffer.from([0xff, 0xfe, 0x00, 0x00]);
			const result = await MagicByteValidator.validate(invalidBuffer, 'txt');

			expect(result.valid).toBe(false);
			expect(result.confidence).toBe('low');
			expect(result.error).toContain('UTF-8');
		});

		it('should reject invalid JSON', async () => {
			const invalidJsonBuffer = Buffer.from('{invalid json}', 'utf-8');
			const result = await MagicByteValidator.validate(invalidJsonBuffer, 'json');

			expect(result.valid).toBe(false);
			expect(result.detectedFormat).toBe('txt');
			expect(result.error).toContain('Invalid JSON');
		});
	});

	describe('Format mismatch detection', () => {
		it('should detect mismatch when PNG header but expecting JPEG', async () => {
			const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
			const result = await MagicByteValidator.validate(pngBuffer, 'jpeg');

			expect(result.valid).toBe(false);
			expect(result.detectedFormat).toBe('png');
			expect(result.expectedFormat).toBe('jpeg');
		});

		it('should detect mismatch when JPEG header but expecting PNG', async () => {
			const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
			const result = await MagicByteValidator.validate(jpegBuffer, 'png');

			expect(result.valid).toBe(false);
			expect(result.detectedFormat).toMatch(/^jpe?g$/);
			expect(result.expectedFormat).toBe('png');
		});
	});

	describe('Edge cases', () => {
		it('should handle empty buffer', async () => {
			const emptyBuffer = Buffer.from([]);
			const result = await MagicByteValidator.validate(emptyBuffer, 'png');

			expect(result.valid).toBe(false);
			expect(result.detectedFormat).toBeNull();
			expect(result.error).toContain('Empty buffer');
		});

		it('should handle buffer too short for signature', async () => {
			const shortBuffer = Buffer.from([0x89, 0x50]); // Only 2 bytes of PNG header
			const result = await MagicByteValidator.validate(shortBuffer, 'png');

			expect(result.valid).toBe(false);
			expect(result.detectedFormat).toBeNull();
		});

		it('should handle unknown format gracefully', async () => {
			const randomBuffer = Buffer.from([0x00, 0x01, 0x02, 0x03]);
			const result = await MagicByteValidator.detectFormat(randomBuffer);

			expect(result).toBeNull();
		});
	});

	describe('getSignature', () => {
		it('should return PNG signature', () => {
			const signature = MagicByteValidator.getSignature('png');
			expect(signature).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
		});

		it('should return JPEG signature', () => {
			const signature = MagicByteValidator.getSignature('jpeg');
			expect(signature).toEqual(Buffer.from([0xff, 0xd8, 0xff]));
		});

		it('should return null for unknown format', () => {
			const signature = MagicByteValidator.getSignature('unknown');
			expect(signature).toBeNull();
		});
	});

	describe('MAGIC_SIGNATURES', () => {
		it('should have signatures for all major formats', () => {
			// Images
			expect(MAGIC_SIGNATURES.png).toBeDefined();
			expect(MAGIC_SIGNATURES.jpeg).toBeDefined();
			expect(MAGIC_SIGNATURES.webp).toBeDefined();
			expect(MAGIC_SIGNATURES.gif).toBeDefined();

			// Audio
			expect(MAGIC_SIGNATURES.wav).toBeDefined();
			expect(MAGIC_SIGNATURES.flac).toBeDefined();
			expect(MAGIC_SIGNATURES.mp3).toBeDefined();

			// Documents
			expect(MAGIC_SIGNATURES.pdf).toBeDefined();

			// Archives
			expect(MAGIC_SIGNATURES.zip).toBeDefined();
			expect(MAGIC_SIGNATURES['7z']).toBeDefined();
		});

		it('should mark compound signatures correctly', () => {
			expect(MAGIC_SIGNATURES.webp.compound).toBe(true);
			expect(MAGIC_SIGNATURES.wav.compound).toBe(true);
			expect(MAGIC_SIGNATURES.png.compound).toBeUndefined();
		});
	});

	describe('DownloadHelper integration', () => {
		it('should have validateFormat method that delegates to MagicByteValidator', async () => {
			// Create a mock PNG buffer
			const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

			// Verify direct MagicByteValidator call
			const directResult = await MagicByteValidator.validate(pngBuffer, 'png');
			expect(directResult.valid).toBe(true);
			expect(directResult.detectedFormat).toBe('png');
			expect(directResult.confidence).toBe('medium'); // Manual detection for minimal header

			// Verify DownloadHelper.validateFormat exists and has correct signature
			// Note: We can't test the full integration without a Playwright page,
			// but we can verify the method signature exists
			expect(DownloadHelper.prototype.validateFormat).toBeDefined();
			expect(typeof DownloadHelper.prototype.validateFormat).toBe('function');
		});

		it('should demonstrate ValidationResult type is exported from fixtures', async () => {
			// This test demonstrates that tests can import ValidationResult
			// and use it to validate downloaded files
			const buffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
			const result = await MagicByteValidator.validate(buffer, 'png');

			// ValidationResult structure
			expect(result).toHaveProperty('valid');
			expect(result).toHaveProperty('detectedFormat');
			expect(result).toHaveProperty('expectedFormat');
			expect(result).toHaveProperty('confidence');

			// This demonstrates tests can import from fixtures and validate formats
			expect(result.valid).toBe(true);
		});
	});
});
