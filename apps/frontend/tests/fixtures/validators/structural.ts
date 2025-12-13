import sharp from 'sharp';
import { parseBuffer } from 'music-metadata';
import JSZip from 'jszip';

export interface StructuralValidationResult {
	valid: boolean;
	format: string;
	error?: string;
	metadata?: {
		// Image metadata
		width?: number;
		height?: number;
		channels?: number;
		// Audio metadata
		duration?: number;
		sampleRate?: number;
		bitrate?: number;
		// Archive metadata
		fileCount?: number;
		files?: string[];
		totalSize?: number;
	};
}

/**
 * Structural validator for deep file integrity checking
 * Goes beyond magic bytes to verify files can be parsed/opened correctly
 */
export class StructuralValidator {
	/**
	 * Validate image structure using sharp parser
	 * @param buffer - Image file buffer
	 * @returns Validation result with image metadata
	 */
	static async validateImage(buffer: Buffer): Promise<StructuralValidationResult> {
		try {
			const metadata = await sharp(buffer).metadata();

			if (!metadata.width || !metadata.height) {
				return {
					valid: false,
					format: metadata.format || 'unknown',
					error: 'Image has no dimensions'
				};
			}

			return {
				valid: true,
				format: metadata.format || 'unknown',
				metadata: {
					width: metadata.width,
					height: metadata.height,
					channels: metadata.channels
				}
			};
		} catch (error) {
			return {
				valid: false,
				format: 'unknown',
				error: error instanceof Error ? error.message : 'Unknown error'
			};
		}
	}

	/**
	 * Validate audio structure using music-metadata parser
	 * @param buffer - Audio file buffer
	 * @returns Validation result with audio metadata
	 */
	static async validateAudio(buffer: Buffer): Promise<StructuralValidationResult> {
		try {
			const metadata = await parseBuffer(buffer);

			if (!metadata.format.duration || metadata.format.duration <= 0) {
				return {
					valid: false,
					format: metadata.format.container || 'unknown',
					error: 'Audio has no duration'
				};
			}

			return {
				valid: true,
				format: metadata.format.container || 'unknown',
				metadata: {
					duration: metadata.format.duration,
					sampleRate: metadata.format.sampleRate,
					channels: metadata.format.numberOfChannels,
					bitrate: metadata.format.bitrate
				}
			};
		} catch (error) {
			return {
				valid: false,
				format: 'unknown',
				error: error instanceof Error ? error.message : 'Unknown error'
			};
		}
	}

	/**
	 * Validate archive structure using JSZip parser
	 * @param buffer - Archive file buffer
	 * @returns Validation result with archive metadata
	 */
	static async validateArchive(buffer: Buffer): Promise<StructuralValidationResult> {
		try {
			const zip = await JSZip.loadAsync(buffer);
			const files = Object.keys(zip.files);

			return {
				valid: true,
				format: 'zip',
				metadata: {
					fileCount: files.length,
					files: files,
					totalSize: buffer.length
				}
			};
		} catch (error) {
			return {
				valid: false,
				format: 'zip',
				error: error instanceof Error ? error.message : 'Invalid archive'
			};
		}
	}

	/**
	 * Validate file structure based on expected format
	 * Dispatches to appropriate validator
	 * @param buffer - File buffer
	 * @param expectedFormat - Expected format (e.g., 'png', 'wav', 'zip')
	 * @returns Validation result
	 */
	static async validate(
		buffer: Buffer,
		expectedFormat: string
	): Promise<StructuralValidationResult> {
		const imageFormats = ['png', 'jpeg', 'jpg', 'webp', 'tiff', 'bmp', 'gif'];
		const audioFormats = ['wav', 'flac', 'mp3', 'ogg', 'opus'];
		const archiveFormats = ['zip', '7z', 'tar', 'tgz', 'tbz2', 'txz'];

		if (imageFormats.includes(expectedFormat)) {
			return this.validateImage(buffer);
		}
		if (audioFormats.includes(expectedFormat)) {
			return this.validateAudio(buffer);
		}
		if (archiveFormats.includes(expectedFormat)) {
			return this.validateArchive(buffer);
		}

		// Text formats - just check non-empty
		return {
			valid: buffer.length > 0,
			format: expectedFormat,
			metadata: {}
		};
	}
}
