import { fileTypeFromBuffer } from 'file-type';

/**
 * Validation result for magic byte checking
 */
export interface ValidationResult {
	valid: boolean;
	detectedFormat: string | null;
	expectedFormat: string;
	confidence: 'high' | 'medium' | 'low';
	error?: string;
}

/**
 * Magic byte signatures for file format detection
 * Used for formats that file-type library doesn't cover well or as fallback
 */
export const MAGIC_SIGNATURES: Record<
	string,
	{ bytes: number[][]; offset?: number; compound?: boolean }
> = {
	// Images
	png: { bytes: [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]] },
	jpeg: { bytes: [[0xff, 0xd8, 0xff]] },
	jpg: { bytes: [[0xff, 0xd8, 0xff]] }, // Alias for jpeg
	webp: { bytes: [[0x52, 0x49, 0x46, 0x46]], compound: true }, // RIFF + WEBP at byte 8
	tiff: { bytes: [[0x49, 0x49, 0x2a, 0x00], [0x4d, 0x4d, 0x00, 0x2a]] }, // LE and BE
	tif: { bytes: [[0x49, 0x49, 0x2a, 0x00], [0x4d, 0x4d, 0x00, 0x2a]] }, // Alias
	bmp: { bytes: [[0x42, 0x4d]] },
	gif: { bytes: [[0x47, 0x49, 0x46, 0x38]] },
	ico: { bytes: [[0x00, 0x00, 0x01, 0x00]] },
	pnm: {
		bytes: [
			[0x50, 0x31],
			[0x50, 0x32],
			[0x50, 0x33],
			[0x50, 0x34],
			[0x50, 0x35],
			[0x50, 0x36]
		]
	}, // P1-P6
	pbm: { bytes: [[0x50, 0x31], [0x50, 0x34]] }, // P1 or P4
	pgm: { bytes: [[0x50, 0x32], [0x50, 0x35]] }, // P2 or P5
	ppm: { bytes: [[0x50, 0x33], [0x50, 0x36]] }, // P3 or P6

	// Audio
	wav: { bytes: [[0x52, 0x49, 0x46, 0x46]], compound: true }, // RIFF + WAVE at byte 8
	flac: { bytes: [[0x66, 0x4c, 0x61, 0x43]] },
	mp3: { bytes: [[0xff, 0xfb], [0xff, 0xfa], [0x49, 0x44, 0x33]] }, // MP3 frame or ID3
	ogg: { bytes: [[0x4f, 0x67, 0x67, 0x53]] },
	opus: { bytes: [[0x4f, 0x67, 0x67, 0x53]], compound: true }, // OGG + OpusHead at byte 28

	// Documents
	pdf: { bytes: [[0x25, 0x50, 0x44, 0x46]] }, // %PDF

	// Archives
	zip: { bytes: [[0x50, 0x4b, 0x03, 0x04], [0x50, 0x4b, 0x05, 0x06]] }, // Normal or empty
	'7z': { bytes: [[0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c]] },
	tar: { bytes: [[0x75, 0x73, 0x74, 0x61, 0x72]], offset: 257 }, // 'ustar' at offset 257
	gz: { bytes: [[0x1f, 0x8b]] },
	gzip: { bytes: [[0x1f, 0x8b]] },
	bz2: { bytes: [[0x42, 0x5a, 0x68]] },
	bzip2: { bytes: [[0x42, 0x5a, 0x68]] },
	xz: { bytes: [[0xfd, 0x37, 0x7a, 0x58, 0x5a, 0x00]] },
	tgz: { bytes: [[0x1f, 0x8b]] }, // GZIP (tarball compressed with gzip)
	tbz2: { bytes: [[0x42, 0x5a, 0x68]] }, // BZIP2
	txz: { bytes: [[0xfd, 0x37, 0x7a, 0x58, 0x5a, 0x00]] }, // XZ

	// Office documents (ZIP-based)
	xlsx: { bytes: [[0x50, 0x4b, 0x03, 0x04]] },
	docx: { bytes: [[0x50, 0x4b, 0x03, 0x04]] }
};

/**
 * Text-based formats that should be validated by UTF-8 encoding
 */
const TEXT_FORMATS = [
	'txt',
	'csv',
	'tsv',
	'json',
	'xml',
	'yaml',
	'yml',
	'html',
	'htm',
	'md',
	'markdown'
];

/**
 * Magic byte validator for file format detection
 */
export class MagicByteValidator {
	/**
	 * Validate that a buffer matches the expected format
	 * @param buffer - File buffer to validate
	 * @param expectedFormat - Expected format (e.g., 'png', 'pdf')
	 * @returns Validation result with detected format and confidence level
	 */
	static async validate(buffer: Buffer, expectedFormat: string): Promise<ValidationResult> {
		// Handle empty buffer
		if (!buffer || buffer.length === 0) {
			return {
				valid: false,
				detectedFormat: null,
				expectedFormat,
				confidence: 'high',
				error: 'Empty buffer provided'
			};
		}

		const expected = expectedFormat.toLowerCase();

		// Try file-type library first (highest confidence)
		try {
			const fileType = await fileTypeFromBuffer(buffer);
			if (fileType) {
				const detected = fileType.ext.toLowerCase();

				// Check if detected matches expected (handle aliases like jpg/jpeg)
				const isMatch =
					detected === expected ||
					(expected === 'jpeg' && detected === 'jpg') ||
					(expected === 'jpg' && detected === 'jpeg') ||
					(expected === 'tiff' && detected === 'tif') ||
					(expected === 'tif' && detected === 'tiff');

				return {
					valid: isMatch,
					detectedFormat: detected,
					expectedFormat: expected,
					confidence: 'high'
				};
			}
		} catch (error) {
			// file-type failed, fall through to manual checks
		}

		// Text format validation (low confidence)
		if (TEXT_FORMATS.includes(expected)) {
			return this.validateTextFormat(buffer, expected);
		}

		// Manual signature check (medium confidence)
		const manualDetection = this.detectFormatManual(buffer);
		if (manualDetection) {
			const isMatch =
				manualDetection === expected ||
				(expected === 'jpeg' && manualDetection === 'jpg') ||
				(expected === 'jpg' && manualDetection === 'jpeg') ||
				(expected === 'tiff' && manualDetection === 'tif') ||
				(expected === 'tif' && manualDetection === 'tiff');

			return {
				valid: isMatch,
				detectedFormat: manualDetection,
				expectedFormat: expected,
				confidence: 'medium'
			};
		}

		// Could not detect format
		return {
			valid: false,
			detectedFormat: null,
			expectedFormat: expected,
			confidence: 'high',
			error: `Could not detect format (expected: ${expected})`
		};
	}

	/**
	 * Detect format from buffer using file-type library and manual checks
	 * @param buffer - File buffer
	 * @returns Detected format or null
	 */
	static async detectFormat(buffer: Buffer): Promise<string | null> {
		if (!buffer || buffer.length === 0) {
			return null;
		}

		// Try file-type library first
		try {
			const fileType = await fileTypeFromBuffer(buffer);
			if (fileType) {
				return fileType.ext.toLowerCase();
			}
		} catch {
			// Fall through to manual detection
		}

		// Manual detection
		return this.detectFormatManual(buffer);
	}

	/**
	 * Get signature bytes for a format
	 * @param format - Format name
	 * @returns Signature buffer or null
	 */
	static getSignature(format: string): Buffer | null {
		const sig = MAGIC_SIGNATURES[format.toLowerCase()];
		if (!sig || sig.bytes.length === 0) {
			return null;
		}
		// Return first signature variant
		return Buffer.from(sig.bytes[0]);
	}

	/**
	 * Validate text format by checking UTF-8 encoding
	 */
	private static validateTextFormat(buffer: Buffer, expectedFormat: string): ValidationResult {
		try {
			const text = buffer.toString('utf-8');

			// Check for valid UTF-8 (no replacement characters for invalid sequences)
			const hasInvalidChars = text.includes('\uFFFD');

			if (hasInvalidChars) {
				return {
					valid: false,
					detectedFormat: null,
					expectedFormat: expectedFormat,
					confidence: 'low',
					error: 'Invalid UTF-8 encoding'
				};
			}

			// Basic format-specific checks
			if (expectedFormat === 'json') {
				try {
					JSON.parse(text);
				} catch {
					return {
						valid: false,
						detectedFormat: 'txt',
						expectedFormat: expectedFormat,
						confidence: 'low',
						error: 'Invalid JSON'
					};
				}
			}

			return {
				valid: true,
				detectedFormat: expectedFormat,
				expectedFormat: expectedFormat,
				confidence: 'low'
			};
		} catch {
			return {
				valid: false,
				detectedFormat: null,
				expectedFormat: expectedFormat,
				confidence: 'low',
				error: 'Not valid UTF-8'
			};
		}
	}

	/**
	 * Manual format detection using magic byte signatures
	 */
	private static detectFormatManual(buffer: Buffer): string | null {
		// Check each signature
		for (const [format, sig] of Object.entries(MAGIC_SIGNATURES)) {
			const offset = sig.offset || 0;

			// Check if buffer is long enough
			if (buffer.length < offset + sig.bytes[0].length) {
				continue;
			}

			// Check each signature variant
			for (const sigBytes of sig.bytes) {
				const matches = buffer
					.subarray(offset, offset + sigBytes.length)
					.equals(Buffer.from(sigBytes));

				if (matches) {
					// Handle compound signatures
					if (sig.compound) {
						if (format === 'webp') {
							// Check for WEBP at bytes 8-11
							if (buffer.length >= 12) {
								const webpMarker = buffer.subarray(8, 12).toString('ascii');
								if (webpMarker === 'WEBP') {
									return 'webp';
								}
							}
							continue;
						} else if (format === 'wav') {
							// Check for WAVE at bytes 8-11
							if (buffer.length >= 12) {
								const waveMarker = buffer.subarray(8, 12).toString('ascii');
								if (waveMarker === 'WAVE') {
									return 'wav';
								}
							}
							continue;
						} else if (format === 'opus') {
							// Check for OpusHead at byte 28
							if (buffer.length >= 36) {
								const opusMarker = buffer.subarray(28, 36).toString('ascii');
								if (opusMarker === 'OpusHead') {
									return 'opus';
								}
							}
							continue;
						}
					}

					// Regular signature match
					return format;
				}
			}
		}

		return null;
	}
}
