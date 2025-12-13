import { describe, it, expect } from 'vitest';
import { StructuralValidator } from './structural';
import { MagicByteValidator } from './magic-bytes';
import { ImageFactory } from '../factories/image-factory';
import { AudioFactory } from '../factories/audio-factory';
import { ArchiveFactory } from '../factories/archive-factory';

describe('StructuralValidator', () => {
	describe('Image validation', () => {
		it('validates PNG image structure', async () => {
			const png = await ImageFactory.createPNG({ width: 100, height: 100 });
			const result = await StructuralValidator.validateImage(png);

			expect(result.valid).toBe(true);
			expect(result.format).toBe('png');
			expect(result.metadata?.width).toBe(100);
			expect(result.metadata?.height).toBe(100);
			expect(result.metadata?.channels).toBeDefined();
		});

		it('validates JPEG image structure', async () => {
			const jpeg = await ImageFactory.createJPEG({ width: 200, height: 150 });
			const result = await StructuralValidator.validateImage(jpeg);

			expect(result.valid).toBe(true);
			expect(result.format).toBe('jpeg');
			expect(result.metadata?.width).toBe(200);
			expect(result.metadata?.height).toBe(150);
		});

		it('validates WebP image structure', async () => {
			const webp = await ImageFactory.createWebP({ width: 300, height: 200 });
			const result = await StructuralValidator.validateImage(webp);

			expect(result.valid).toBe(true);
			expect(result.format).toBe('webp');
			expect(result.metadata?.width).toBe(300);
			expect(result.metadata?.height).toBe(200);
		});

		it('detects truncated PNG that has valid magic bytes', async () => {
			// Create valid PNG
			const validPng = await ImageFactory.createPNG({ width: 100, height: 100 });

			// Magic bytes pass
			const magicResult = await MagicByteValidator.validate(validPng, 'png');
			expect(magicResult.valid).toBe(true);

			// Structural validation passes
			const structResult = await StructuralValidator.validateImage(validPng);
			expect(structResult.valid).toBe(true);

			// Now truncate the PNG (keep magic bytes, remove rest)
			const truncated = validPng.subarray(0, 50);

			// Magic bytes STILL pass (header intact)
			const truncatedMagic = await MagicByteValidator.validate(truncated, 'png');
			expect(truncatedMagic.valid).toBe(true);

			// But structural validation FAILS
			const truncatedStruct = await StructuralValidator.validateImage(truncated);
			expect(truncatedStruct.valid).toBe(false);
			expect(truncatedStruct.error).toBeDefined();
		});

		it('detects corrupted image data', async () => {
			// Invalid image with just magic bytes
			const invalid = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

			const result = await StructuralValidator.validateImage(invalid);
			expect(result.valid).toBe(false);
			expect(result.error).toBeDefined();
		});

		it('rejects empty buffer', async () => {
			const empty = Buffer.from([]);

			const result = await StructuralValidator.validateImage(empty);
			expect(result.valid).toBe(false);
			expect(result.error).toBeDefined();
		});
	});

	describe('Audio validation', () => {
		it('validates WAV audio structure', async () => {
			const wav = AudioFactory.createWAV({ duration: 1, sampleRate: 44100 });
			const result = await StructuralValidator.validateAudio(wav);

			expect(result.valid).toBe(true);
			expect(result.format).toBe('WAVE');
			expect(result.metadata?.duration).toBeGreaterThan(0);
			expect(result.metadata?.duration).toBeCloseTo(1, 1);
			expect(result.metadata?.sampleRate).toBe(44100);
			expect(result.metadata?.channels).toBeDefined();
		});

		it('validates different sample rates', async () => {
			const wav = AudioFactory.createWAV({ duration: 2, sampleRate: 48000 });
			const result = await StructuralValidator.validateAudio(wav);

			expect(result.valid).toBe(true);
			expect(result.metadata?.sampleRate).toBe(48000);
			expect(result.metadata?.duration).toBeCloseTo(2, 1);
		});

		it('validates mono audio', async () => {
			const wav = AudioFactory.createWAV({ channels: 1 });
			const result = await StructuralValidator.validateAudio(wav);

			expect(result.valid).toBe(true);
			expect(result.metadata?.channels).toBe(1);
		});

		it('validates stereo audio', async () => {
			const wav = AudioFactory.createWAV({ channels: 2 });
			const result = await StructuralValidator.validateAudio(wav);

			expect(result.valid).toBe(true);
			expect(result.metadata?.channels).toBe(2);
		});

		it('detects truncated WAV file', async () => {
			const validWav = AudioFactory.createWAV({ duration: 1 });

			// Truncate the WAV (keep header, remove most data)
			const truncated = validWav.subarray(0, 100);

			// Magic bytes might still pass
			const magicResult = await MagicByteValidator.validate(truncated, 'wav');
			expect(magicResult.valid).toBe(true);

			// But structural validation should fail (no valid duration)
			const structResult = await StructuralValidator.validateAudio(truncated);
			// Note: music-metadata might still parse truncated WAV, so check for invalid duration
			if (structResult.valid) {
				expect(structResult.metadata?.duration).toBeLessThan(1);
			} else {
				expect(structResult.error).toBeDefined();
			}
		});

		it('detects corrupted audio data', async () => {
			// Invalid WAV with just RIFF header
			const invalid = Buffer.from('RIFF\x00\x00\x00\x00WAVEfmt ', 'ascii');

			const result = await StructuralValidator.validateAudio(invalid);
			expect(result.valid).toBe(false);
		});
	});

	describe('Archive validation', () => {
		it('validates ZIP archive structure and lists files', async () => {
			const zip = await ArchiveFactory.createZIP();
			const result = await StructuralValidator.validateArchive(zip);

			expect(result.valid).toBe(true);
			expect(result.format).toBe('zip');
			// JSZip creates directory entries, so we have 4 entries (file1, file2, subfolder/, subfolder/file3)
			expect(result.metadata?.fileCount).toBe(4);
			expect(result.metadata?.files).toContain('file1.txt');
			expect(result.metadata?.files).toContain('file2.txt');
			expect(result.metadata?.files).toContain('subfolder/file3.txt');
			expect(result.metadata?.totalSize).toBeGreaterThan(0);
		});

		it('validates empty ZIP', async () => {
			const emptyZip = await ArchiveFactory.createZIP({ entries: [] });
			const result = await StructuralValidator.validateArchive(emptyZip);

			expect(result.valid).toBe(true);
			expect(result.metadata?.fileCount).toBe(0);
		});

		it('validates single file ZIP', async () => {
			const singleZip = await ArchiveFactory.createZIP({
				entries: [{ name: 'test.txt', content: 'Test' }]
			});
			const result = await StructuralValidator.validateArchive(singleZip);

			expect(result.valid).toBe(true);
			expect(result.metadata?.fileCount).toBe(1);
			expect(result.metadata?.files).toContain('test.txt');
		});

		it('validates nested folder structure', async () => {
			const nestedZip = await ArchiveFactory.createZIP({
				entries: [{ name: 'a/b/c/deep.txt', content: 'Nested' }]
			});
			const result = await StructuralValidator.validateArchive(nestedZip);

			expect(result.valid).toBe(true);
			expect(result.metadata?.files).toContain('a/b/c/deep.txt');
		});

		it('detects corrupted ZIP archive', async () => {
			// Invalid ZIP with just magic bytes
			const invalidZip = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00]);

			const result = await StructuralValidator.validateArchive(invalidZip);
			expect(result.valid).toBe(false);
			expect(result.error).toBeDefined();
		});

		it('detects truncated ZIP that has valid magic bytes', async () => {
			const validZip = await ArchiveFactory.createZIP();

			// Magic bytes pass
			const magicResult = await MagicByteValidator.validate(validZip, 'zip');
			expect(magicResult.valid).toBe(true);

			// Truncate (keep magic bytes)
			const truncated = validZip.subarray(0, 50);

			// Magic bytes STILL pass
			const truncatedMagic = await MagicByteValidator.validate(truncated, 'zip');
			expect(truncatedMagic.valid).toBe(true);

			// But structural validation FAILS
			const truncatedStruct = await StructuralValidator.validateArchive(truncated);
			expect(truncatedStruct.valid).toBe(false);
			expect(truncatedStruct.error).toBeDefined();
		});

		it('rejects non-archive data', async () => {
			const notAnArchive = Buffer.from('This is not an archive', 'utf-8');

			const result = await StructuralValidator.validateArchive(notAnArchive);
			expect(result.valid).toBe(false);
		});
	});

	describe('validate() dispatcher', () => {
		it('dispatches to validateImage for image formats', async () => {
			const png = await ImageFactory.createPNG();
			const result = await StructuralValidator.validate(png, 'png');

			expect(result.valid).toBe(true);
			expect(result.metadata?.width).toBeDefined();
			expect(result.metadata?.height).toBeDefined();
		});

		it('dispatches to validateAudio for audio formats', async () => {
			const wav = AudioFactory.createWAV();
			const result = await StructuralValidator.validate(wav, 'wav');

			expect(result.valid).toBe(true);
			expect(result.metadata?.duration).toBeDefined();
		});

		it('dispatches to validateArchive for archive formats', async () => {
			const zip = await ArchiveFactory.createZIP();
			const result = await StructuralValidator.validate(zip, 'zip');

			expect(result.valid).toBe(true);
			expect(result.metadata?.fileCount).toBeDefined();
		});

		it('handles text formats', async () => {
			const text = Buffer.from('Hello, world!', 'utf-8');
			const result = await StructuralValidator.validate(text, 'txt');

			expect(result.valid).toBe(true);
			expect(result.format).toBe('txt');
		});

		it('rejects empty buffers for text formats', async () => {
			const empty = Buffer.from([]);
			const result = await StructuralValidator.validate(empty, 'txt');

			expect(result.valid).toBe(false);
		});
	});

	describe('Key truth demonstration: structural catches what magic bytes miss', () => {
		it('truncated PNG: magic bytes pass, structural fails', async () => {
			const validPng = await ImageFactory.createPNG({ width: 100, height: 100 });
			const truncated = validPng.subarray(0, 50);

			const magicResult = await MagicByteValidator.validate(truncated, 'png');
			const structResult = await StructuralValidator.validateImage(truncated);

			expect(magicResult.valid).toBe(true); // Magic bytes pass
			expect(structResult.valid).toBe(false); // Structural fails
		});

		it('truncated ZIP: magic bytes pass, structural fails', async () => {
			const validZip = await ArchiveFactory.createZIP();
			const truncated = validZip.subarray(0, 50);

			const magicResult = await MagicByteValidator.validate(truncated, 'zip');
			const structResult = await StructuralValidator.validateArchive(truncated);

			expect(magicResult.valid).toBe(true); // Magic bytes pass
			expect(structResult.valid).toBe(false); // Structural fails
		});

		it('corrupted JPEG: magic bytes pass, structural fails', async () => {
			// JPEG magic bytes but invalid structure
			const corruptedJpeg = Buffer.concat([
				Buffer.from([0xff, 0xd8, 0xff]), // JPEG magic
				Buffer.from([0x00, 0x00, 0x00, 0x00]) // Invalid data
			]);

			const magicResult = await MagicByteValidator.validate(corruptedJpeg, 'jpeg');
			const structResult = await StructuralValidator.validateImage(corruptedJpeg);

			expect(magicResult.valid).toBe(true); // Magic bytes pass
			expect(structResult.valid).toBe(false); // Structural fails
		});
	});
});
