import ExifReader from 'exifreader';
import { parseBuffer } from 'music-metadata';

export interface ImageMetadata {
	hasExif: boolean;
	hasXmp: boolean;
	hasIptc: boolean;
	// Common EXIF fields
	make?: string; // Camera manufacturer
	model?: string; // Camera model
	dateTime?: string; // Original date/time
	orientation?: number; // Rotation
	width?: number;
	height?: number;
	// GPS data (if present)
	gps?: {
		latitude?: number;
		longitude?: number;
	};
	// All tags for detailed comparison
	rawTags: Record<string, any>;
}

export interface AudioMetadata {
	hasId3?: boolean;
	artist?: string;
	title?: string;
	album?: string;
	year?: string;
	genre?: string;
	rawTags: Record<string, any>;
}

export interface MetadataValidationResult {
	valid: boolean;
	metadata: ImageMetadata | AudioMetadata | null;
	errors: string[];
}

/**
 * Metadata validator for extracting and validating EXIF/XMP/ID3 metadata
 */
export class MetadataValidator {
	/**
	 * Extract image metadata (EXIF/XMP/IPTC) from buffer
	 * @param buffer - Image file buffer
	 * @returns Image metadata
	 */
	static async extractImageMetadata(buffer: Buffer): Promise<ImageMetadata> {
		try {
			const tags = ExifReader.load(buffer, { expanded: true });

			const metadata: ImageMetadata = {
				hasExif: !!tags.exif,
				hasXmp: !!tags.xmp,
				hasIptc: !!tags.iptc,
				rawTags: tags
			};

			// Extract common fields if present
			if (tags.exif) {
				metadata.make = tags.exif.Make?.description;
				metadata.model = tags.exif.Model?.description;
				metadata.dateTime = tags.exif.DateTimeOriginal?.description;
				metadata.orientation = tags.exif.Orientation?.value;
			}

			// Extract dimensions from various sources
			if (tags.file) {
				metadata.width = tags.file['Image Width']?.value;
				metadata.height = tags.file['Image Height']?.value;
			}

			// Extract GPS if present
			if (tags.gps) {
				metadata.gps = {
					latitude: tags.gps.Latitude,
					longitude: tags.gps.Longitude
				};
			}

			return metadata;
		} catch (error) {
			// Return empty metadata if extraction fails (file may not have metadata)
			return {
				hasExif: false,
				hasXmp: false,
				hasIptc: false,
				rawTags: {}
			};
		}
	}

	/**
	 * Validate metadata preservation between original and converted files
	 * @param original - Original file buffer
	 * @param converted - Converted file buffer
	 * @param expectation - Expected metadata behavior ('preserved' | 'stripped' | 'partial')
	 * @returns Validation result
	 */
	static async validateMetadataPreservation(
		original: Buffer,
		converted: Buffer,
		expectation: 'preserved' | 'stripped' | 'partial'
	): Promise<MetadataValidationResult> {
		const originalMeta = await this.extractImageMetadata(original);
		const convertedMeta = await this.extractImageMetadata(converted);

		const errors: string[] = [];

		switch (expectation) {
			case 'preserved':
				// All metadata should be preserved
				if (originalMeta.hasExif && !convertedMeta.hasExif) {
					errors.push('EXIF data lost during conversion');
				}
				if (originalMeta.hasXmp && !convertedMeta.hasXmp) {
					errors.push('XMP data lost during conversion');
				}
				break;

			case 'stripped':
				// Metadata should be removed
				if (convertedMeta.hasExif || convertedMeta.hasXmp) {
					errors.push('Metadata should have been stripped but was preserved');
				}
				break;

			case 'partial':
				// Some metadata may be lost (e.g., JPEG -> PNG)
				// Just verify no errors during extraction
				break;
		}

		return {
			valid: errors.length === 0,
			metadata: convertedMeta,
			errors
		};
	}

	/**
	 * Extract audio metadata (ID3 tags) from buffer
	 * @param buffer - Audio file buffer
	 * @returns Audio metadata
	 */
	static async extractAudioMetadata(buffer: Buffer): Promise<AudioMetadata> {
		try {
			const metadata = await parseBuffer(buffer);

			return {
				hasId3: !!metadata.common,
				artist: metadata.common?.artist,
				title: metadata.common?.title,
				album: metadata.common?.album,
				year: metadata.common?.year?.toString(),
				genre: metadata.common?.genre?.[0],
				rawTags: metadata.common || {}
			};
		} catch {
			return {
				rawTags: {}
			};
		}
	}
}
