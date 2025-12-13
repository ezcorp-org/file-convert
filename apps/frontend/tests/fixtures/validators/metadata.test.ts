import { describe, it, expect } from 'vitest';
import { MetadataValidator } from './metadata';
import sharp from 'sharp';

describe('MetadataValidator', () => {
	describe('extractImageMetadata', () => {
		it('should extract metadata from PNG (minimal metadata)', async () => {
			// Create a simple PNG
			const buffer = await sharp({
				create: {
					width: 100,
					height: 100,
					channels: 4,
					background: { r: 255, g: 0, b: 0, alpha: 1 }
				}
			})
				.png()
				.toBuffer();

			const metadata = await MetadataValidator.extractImageMetadata(buffer);

			expect(metadata).toBeDefined();
			expect(metadata.rawTags).toBeDefined();
			// PNG typically has minimal EXIF data
			expect(metadata.hasExif).toBe(false);
			expect(metadata.hasXmp).toBe(false);
		});

		it('should handle images without metadata gracefully', async () => {
			// Create a minimal PNG buffer
			const buffer = Buffer.from([
				0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
				0x00, 0x00, 0x00, 0x0d, // IHDR chunk length
				0x49, 0x48, 0x44, 0x52, // IHDR
				0x00, 0x00, 0x00, 0x01, // width: 1
				0x00, 0x00, 0x00, 0x01, // height: 1
				0x08, 0x02, 0x00, 0x00, 0x00, // bit depth, color type, compression, filter, interlace
				0x90, 0x77, 0x53, 0xde, // CRC
				0x00, 0x00, 0x00, 0x0c, // IDAT chunk length
				0x49, 0x44, 0x41, 0x54, // IDAT
				0x08, 0x99, 0x63, 0xf8, 0xcf, 0xc0, 0x00, 0x00, 0x00, 0x03, 0x00, 0x01, // data
				0x92, 0x7c, 0xda, 0x8f, // CRC
				0x00, 0x00, 0x00, 0x00, // IEND chunk length
				0x49, 0x45, 0x4e, 0x44, // IEND
				0xae, 0x42, 0x60, 0x82 // CRC
			]);

			const metadata = await MetadataValidator.extractImageMetadata(buffer);

			expect(metadata).toBeDefined();
			expect(metadata.hasExif).toBe(false);
			expect(metadata.hasXmp).toBe(false);
			expect(metadata.rawTags).toBeDefined();
		});

		it('should return empty metadata for invalid buffer', async () => {
			const invalidBuffer = Buffer.from('not an image');

			const metadata = await MetadataValidator.extractImageMetadata(invalidBuffer);

			expect(metadata).toBeDefined();
			expect(metadata.hasExif).toBe(false);
			expect(metadata.hasXmp).toBe(false);
			expect(metadata.rawTags).toEqual({});
		});
	});

	describe('validateMetadataPreservation', () => {
		it('should validate when metadata is absent in both files (partial)', async () => {
			const buffer1 = await sharp({
				create: {
					width: 100,
					height: 100,
					channels: 4,
					background: { r: 255, g: 0, b: 0, alpha: 1 }
				}
			})
				.png()
				.toBuffer();

			const buffer2 = await sharp({
				create: {
					width: 100,
					height: 100,
					channels: 4,
					background: { r: 0, g: 255, b: 0, alpha: 1 }
				}
			})
				.png()
				.toBuffer();

			const result = await MetadataValidator.validateMetadataPreservation(
				buffer1,
				buffer2,
				'partial'
			);

			expect(result.valid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it('should validate stripped expectation when no metadata present', async () => {
			const buffer1 = await sharp({
				create: {
					width: 100,
					height: 100,
					channels: 4,
					background: { r: 255, g: 0, b: 0, alpha: 1 }
				}
			})
				.png()
				.toBuffer();

			const buffer2 = await sharp({
				create: {
					width: 100,
					height: 100,
					channels: 4,
					background: { r: 0, g: 255, b: 0, alpha: 1 }
				}
			})
				.png()
				.toBuffer();

			const result = await MetadataValidator.validateMetadataPreservation(
				buffer1,
				buffer2,
				'stripped'
			);

			expect(result.valid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});
	});

	describe('extractAudioMetadata', () => {
		it('should return empty metadata for buffer without ID3 tags', async () => {
			// Create minimal WAV header (RIFF header only)
			const buffer = Buffer.from([
				0x52, 0x49, 0x46, 0x46, // "RIFF"
				0x24, 0x00, 0x00, 0x00, // File size - 8
				0x57, 0x41, 0x56, 0x45 // "WAVE"
			]);

			const metadata = await MetadataValidator.extractAudioMetadata(buffer);

			expect(metadata).toBeDefined();
			expect(metadata.rawTags).toBeDefined();
			// music-metadata may still parse the WAV format even if there are no tags
			// The important thing is that it doesn't fail
			expect(metadata.artist).toBeUndefined();
			expect(metadata.title).toBeUndefined();
		});

		it('should handle invalid audio buffer gracefully', async () => {
			const invalidBuffer = Buffer.from('not audio data');

			const metadata = await MetadataValidator.extractAudioMetadata(invalidBuffer);

			expect(metadata).toBeDefined();
			expect(metadata.rawTags).toEqual({});
		});
	});
});
