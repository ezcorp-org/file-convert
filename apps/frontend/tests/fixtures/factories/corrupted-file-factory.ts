import { MAGIC_SIGNATURES } from '../validators/magic-bytes';
import { ImageFactory } from './image-factory';
import { AudioFactory } from './audio-factory';

/**
 * Corrupted file metadata for size limit testing
 */
export interface OversizedFileMetadata {
	buffer: Buffer;
	metadata: {
		name: string;
		mimeType: string;
		size: number;
	};
}

/**
 * Spoofed extension file data
 */
export interface SpoofedExtensionFile {
	buffer: Buffer;
	filename: string;
	mimeType: string;
	actualFormat: string;
	claimedExtension: string;
}

/**
 * Factory for generating corrupted and malformed test files
 *
 * Use this factory to test error handling for:
 * - Zero-byte files (ERROR-04)
 * - Truncated files with valid headers (ERROR-02)
 * - Bad header files (random bytes) (ERROR-02)
 * - Files exceeding size limits (ERROR-03)
 * - Spoofed extension files (format mismatch)
 *
 * @example
 * ```typescript
 * import { CorruptedFileFactory } from './fixtures/factories';
 *
 * // Create a zero-byte file
 * const emptyFile = CorruptedFileFactory.createZeroByteFile('empty.png');
 *
 * // Create a truncated PNG (valid header, incomplete body)
 * const truncatedPng = CorruptedFileFactory.createTruncatedFile('png', 50);
 *
 * // Create a file with random bytes claiming to be PNG
 * const badHeader = CorruptedFileFactory.createBadHeaderFile('png');
 *
 * // Create a file for size limit testing
 * const oversized = CorruptedFileFactory.createOversizedMetadata('png', 100);
 *
 * // Create a JPEG file with .png extension
 * const spoofed = await CorruptedFileFactory.createSpoofedExtension('jpeg', 'png');
 * ```
 */
export class CorruptedFileFactory {
	/**
	 * Create a zero-byte (empty) file
	 * @param filename - The filename to use (extension determines claimed format)
	 * @returns Empty buffer (0 bytes)
	 */
	static createZeroByteFile(_filename: string): Buffer {
		return Buffer.alloc(0);
	}

	/**
	 * Create a truncated file with valid magic bytes but incomplete body
	 *
	 * The file starts with valid format magic bytes but is cut off before
	 * the format's required structure is complete. This simulates partially
	 * downloaded or corrupted files.
	 *
	 * @param format - Format to create (png, jpeg, wav, etc.)
	 * @param totalBytes - Total size of truncated file (including header)
	 * @returns Buffer with valid header + random bytes (truncated)
	 */
	static createTruncatedFile(format: string, totalBytes: number = 50): Buffer {
		const lowerFormat = format.toLowerCase();
		const signature = MAGIC_SIGNATURES[lowerFormat];

		if (!signature || signature.bytes.length === 0) {
			throw new Error(`Unknown format for truncation: ${format}`);
		}

		// Get the first signature variant
		const magicBytes = signature.bytes[0];
		const offset = signature.offset || 0;

		// Build the buffer
		const buffer = Buffer.alloc(totalBytes);

		// Fill with random bytes first
		for (let i = 0; i < totalBytes; i++) {
			buffer[i] = Math.floor(Math.random() * 256);
		}

		// Write magic bytes at the correct offset
		for (let i = 0; i < magicBytes.length && offset + i < totalBytes; i++) {
			buffer[offset + i] = magicBytes[i];
		}

		// Handle compound signatures (WebP, WAV, Opus)
		if (signature.compound && lowerFormat === 'webp' && totalBytes >= 12) {
			// Write WEBP marker at bytes 8-11
			Buffer.from('WEBP').copy(buffer, 8);
		} else if (signature.compound && lowerFormat === 'wav' && totalBytes >= 12) {
			// Write WAVE marker at bytes 8-11
			Buffer.from('WAVE').copy(buffer, 8);
		}

		return buffer;
	}

	/**
	 * Create a file with random bytes (bad/invalid header)
	 *
	 * The file contains random bytes that don't match any known
	 * format signature. The filename extension claims a format
	 * but the content is garbage.
	 *
	 * @param claimedFormat - The format the file claims to be (for filename)
	 * @param size - Size of random data in bytes (default: 100)
	 * @returns Buffer with random bytes
	 */
	static createBadHeaderFile(_claimedFormat: string, size: number = 100): Buffer {
		const buffer = Buffer.alloc(size);

		// Fill with random bytes that don't match any known signature
		// Avoid common magic byte sequences
		for (let i = 0; i < size; i++) {
			// Use bytes in range 0x10-0x7F to avoid magic byte patterns
			// (most magic bytes are 0x00-0x0F or specific values like 0x89, 0xFF)
			buffer[i] = 0x10 + Math.floor(Math.random() * 0x6F);
		}

		return buffer;
	}

	/**
	 * Create metadata for oversized file testing
	 *
	 * Returns a small buffer with metadata claiming a large size.
	 * Use this to test size limit validation without creating huge files.
	 *
	 * Note: The actual buffer is small for test efficiency. The metadata.size
	 * field contains the claimed size for validation testing. Your test may
	 * need to create an actual large file if the application validates by
	 * reading the buffer rather than trusting metadata.
	 *
	 * @param format - Format of the "file"
	 * @param sizeMB - Claimed size in megabytes
	 * @returns Object with buffer and metadata including claimed size
	 */
	static createOversizedMetadata(
		format: string,
		sizeMB: number
	): OversizedFileMetadata {
		const lowerFormat = format.toLowerCase();

		// Create a minimal valid-looking file (just header)
		let buffer: Buffer;
		try {
			buffer = this.createTruncatedFile(lowerFormat, 100);
		} catch {
			// If format not recognized, use random bytes
			buffer = this.createBadHeaderFile(lowerFormat, 100);
		}

		const mimeTypes: Record<string, string> = {
			png: 'image/png',
			jpeg: 'image/jpeg',
			jpg: 'image/jpeg',
			webp: 'image/webp',
			gif: 'image/gif',
			wav: 'audio/wav',
			mp3: 'audio/mpeg',
			pdf: 'application/pdf',
			zip: 'application/zip'
		};

		return {
			buffer,
			metadata: {
				name: `oversized.${lowerFormat}`,
				mimeType: mimeTypes[lowerFormat] || 'application/octet-stream',
				size: sizeMB * 1024 * 1024
			}
		};
	}

	/**
	 * Create a large buffer for actual size limit testing
	 *
	 * Creates a real buffer of the specified size. Use sparingly as this
	 * allocates actual memory.
	 *
	 * @param sizeMB - Size in megabytes
	 * @param format - Format for filename/mime type
	 * @returns Buffer filled with format header + padding
	 */
	static createLargeFile(sizeMB: number, format: string = 'bin'): Buffer {
		const sizeBytes = sizeMB * 1024 * 1024;
		const buffer = Buffer.alloc(sizeBytes);

		// Try to add valid header if format is recognized
		const lowerFormat = format.toLowerCase();
		const signature = MAGIC_SIGNATURES[lowerFormat];

		if (signature && signature.bytes.length > 0) {
			const magicBytes = signature.bytes[0];
			const offset = signature.offset || 0;

			for (let i = 0; i < magicBytes.length; i++) {
				buffer[offset + i] = magicBytes[i];
			}
		}

		// Fill rest with repeating pattern (more realistic than zeros)
		for (let i = 20; i < sizeBytes; i++) {
			buffer[i] = i % 256;
		}

		return buffer;
	}

	/**
	 * Create a valid file with mismatched extension (spoofed)
	 *
	 * Creates a real, valid file of one format but with a filename
	 * extension claiming a different format. This tests format mismatch
	 * detection (magic bytes vs extension validation).
	 *
	 * @param actualFormat - The real format to create (png, jpeg, webp, wav)
	 * @param claimedExtension - The extension to use in filename
	 * @returns Object with buffer, filename, mimeType, and format details
	 */
	static async createSpoofedExtension(
		actualFormat: 'png' | 'jpeg' | 'webp' | 'wav',
		claimedExtension: string
	): Promise<SpoofedExtensionFile> {
		let buffer: Buffer;

		switch (actualFormat) {
			case 'png':
				buffer = await ImageFactory.createPNG({ width: 50, height: 50 });
				break;
			case 'jpeg':
				buffer = await ImageFactory.createJPEG({ width: 50, height: 50 });
				break;
			case 'webp':
				buffer = await ImageFactory.createWebP({ width: 50, height: 50 });
				break;
			case 'wav':
				buffer = AudioFactory.createWAV({ duration: 0.1 });
				break;
			default:
				throw new Error(`Unsupported actual format: ${actualFormat}`);
		}

		// Determine claimed mime type from extension
		const claimedMimeTypes: Record<string, string> = {
			png: 'image/png',
			jpeg: 'image/jpeg',
			jpg: 'image/jpeg',
			webp: 'image/webp',
			gif: 'image/gif',
			bmp: 'image/bmp',
			wav: 'audio/wav',
			mp3: 'audio/mpeg',
			flac: 'audio/flac'
		};

		return {
			buffer,
			filename: `spoofed-${actualFormat}.${claimedExtension}`,
			mimeType: claimedMimeTypes[claimedExtension.toLowerCase()] || 'application/octet-stream',
			actualFormat,
			claimedExtension
		};
	}

	/**
	 * Create a file with only partial magic bytes
	 *
	 * Creates a file that starts with the first few bytes of a format's
	 * magic signature but is missing some required signature bytes.
	 *
	 * @param format - Format to partially mimic
	 * @returns Buffer with partial signature
	 */
	static createPartialSignature(format: string): Buffer {
		const lowerFormat = format.toLowerCase();
		const signature = MAGIC_SIGNATURES[lowerFormat];

		if (!signature || signature.bytes.length === 0) {
			throw new Error(`Unknown format for partial signature: ${format}`);
		}

		const magicBytes = signature.bytes[0];

		// Only include first half of magic bytes (rounded down)
		const partialLength = Math.floor(magicBytes.length / 2);
		if (partialLength === 0) {
			// If magic is only 1-2 bytes, include 1 byte + random
			const buffer = Buffer.alloc(10);
			buffer[0] = magicBytes[0];
			for (let i = 1; i < 10; i++) {
				buffer[i] = Math.floor(Math.random() * 256);
			}
			return buffer;
		}

		// Create buffer with partial signature + random bytes
		const buffer = Buffer.alloc(50);
		for (let i = 0; i < partialLength; i++) {
			buffer[i] = magicBytes[i];
		}
		for (let i = partialLength; i < 50; i++) {
			buffer[i] = Math.floor(Math.random() * 256);
		}

		return buffer;
	}
}
