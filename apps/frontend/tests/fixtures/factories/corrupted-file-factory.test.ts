import { describe, it, expect } from 'vitest';
import { CorruptedFileFactory } from './corrupted-file-factory';

describe('CorruptedFileFactory', () => {
	describe('createZeroByteFile', () => {
		it('creates a zero-byte buffer', () => {
			const buffer = CorruptedFileFactory.createZeroByteFile('test.png');
			expect(buffer.length).toBe(0);
		});
	});

	describe('createTruncatedFile', () => {
		it('creates truncated PNG with valid header', () => {
			const buffer = CorruptedFileFactory.createTruncatedFile('png', 50);
			expect(buffer.length).toBe(50);
			// Check PNG magic bytes
			expect(buffer[0]).toBe(0x89);
			expect(buffer[1]).toBe(0x50);
			expect(buffer[2]).toBe(0x4e);
			expect(buffer[3]).toBe(0x47);
		});

		it('creates truncated JPEG with valid header', () => {
			const buffer = CorruptedFileFactory.createTruncatedFile('jpeg', 30);
			expect(buffer.length).toBe(30);
			// Check JPEG magic bytes
			expect(buffer[0]).toBe(0xff);
			expect(buffer[1]).toBe(0xd8);
			expect(buffer[2]).toBe(0xff);
		});

		it('creates truncated WAV with compound signature', () => {
			const buffer = CorruptedFileFactory.createTruncatedFile('wav', 50);
			expect(buffer.length).toBe(50);
			// Check RIFF magic
			expect(buffer[0]).toBe(0x52);
			expect(buffer[1]).toBe(0x49);
			expect(buffer[2]).toBe(0x46);
			expect(buffer[3]).toBe(0x46);
			// Check WAVE marker at bytes 8-11
			const waveMarker = buffer.subarray(8, 12).toString('ascii');
			expect(waveMarker).toBe('WAVE');
		});

		it('throws for unknown format', () => {
			expect(() => CorruptedFileFactory.createTruncatedFile('unknownformat')).toThrow();
		});
	});

	describe('createBadHeaderFile', () => {
		it('creates buffer with random bytes', () => {
			const buffer = CorruptedFileFactory.createBadHeaderFile('png', 100);
			expect(buffer.length).toBe(100);
			// Should NOT have PNG magic bytes
			const hasPngMagic =
				buffer[0] === 0x89 &&
				buffer[1] === 0x50 &&
				buffer[2] === 0x4e &&
				buffer[3] === 0x47;
			expect(hasPngMagic).toBe(false);
		});

		it('avoids common magic byte patterns', () => {
			const buffer = CorruptedFileFactory.createBadHeaderFile('jpeg', 50);
			// First byte should not be 0xFF (JPEG) or 0x89 (PNG) or common magic bytes
			// The implementation uses 0x10-0x7F range
			for (let i = 0; i < buffer.length; i++) {
				expect(buffer[i]).toBeGreaterThanOrEqual(0x10);
				expect(buffer[i]).toBeLessThan(0x80);
			}
		});
	});

	describe('createOversizedMetadata', () => {
		it('returns buffer with size metadata', () => {
			const result = CorruptedFileFactory.createOversizedMetadata('png', 100);
			expect(result.buffer.length).toBe(100); // Small actual buffer
			expect(result.metadata.size).toBe(100 * 1024 * 1024); // Claimed 100MB
			expect(result.metadata.name).toBe('oversized.png');
			expect(result.metadata.mimeType).toBe('image/png');
		});

		it('uses correct mime types', () => {
			expect(
				CorruptedFileFactory.createOversizedMetadata('jpeg', 50).metadata.mimeType
			).toBe('image/jpeg');
			expect(
				CorruptedFileFactory.createOversizedMetadata('wav', 50).metadata.mimeType
			).toBe('audio/wav');
			expect(
				CorruptedFileFactory.createOversizedMetadata('pdf', 50).metadata.mimeType
			).toBe('application/pdf');
		});
	});

	describe('createSpoofedExtension', () => {
		it('creates real PNG with wrong extension', async () => {
			const result = await CorruptedFileFactory.createSpoofedExtension('png', 'jpeg');
			expect(result.buffer.length).toBeGreaterThan(0);
			expect(result.filename).toBe('spoofed-png.jpeg');
			expect(result.actualFormat).toBe('png');
			expect(result.claimedExtension).toBe('jpeg');
			// Buffer should have PNG magic bytes
			expect(result.buffer[0]).toBe(0x89);
			expect(result.buffer[1]).toBe(0x50);
		});

		it('creates real JPEG with wrong extension', async () => {
			const result = await CorruptedFileFactory.createSpoofedExtension('jpeg', 'png');
			expect(result.buffer.length).toBeGreaterThan(0);
			// Buffer should have JPEG magic bytes
			expect(result.buffer[0]).toBe(0xff);
			expect(result.buffer[1]).toBe(0xd8);
		});

		it('creates real WAV with wrong extension', async () => {
			const result = await CorruptedFileFactory.createSpoofedExtension('wav', 'mp3');
			expect(result.buffer.length).toBeGreaterThan(0);
			expect(result.filename).toBe('spoofed-wav.mp3');
			// Buffer should have RIFF magic bytes
			expect(result.buffer.subarray(0, 4).toString('ascii')).toBe('RIFF');
		});
	});

	describe('createPartialSignature', () => {
		it('creates buffer with partial PNG signature', () => {
			const buffer = CorruptedFileFactory.createPartialSignature('png');
			expect(buffer.length).toBe(50);
			// PNG has 8 byte signature, so partial should be 4 bytes
			expect(buffer[0]).toBe(0x89);
			expect(buffer[1]).toBe(0x50);
			expect(buffer[2]).toBe(0x4e);
			expect(buffer[3]).toBe(0x47);
			// But not full signature (bytes 4-7 should be random)
		});
	});

	describe('createLargeFile', () => {
		it('creates file of specified size', () => {
			const buffer = CorruptedFileFactory.createLargeFile(1, 'png');
			expect(buffer.length).toBe(1 * 1024 * 1024); // 1MB
			// Should have PNG header
			expect(buffer[0]).toBe(0x89);
		});
	});
});
