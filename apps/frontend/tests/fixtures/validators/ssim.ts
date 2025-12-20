import sharp from 'sharp';
import { ssim } from 'ssim.js';

export interface SSIMResult {
	valid: boolean;
	score: number;
	threshold: number;
	dimensions: { width: number; height: number };
}

/**
 * SSIM (Structural Similarity Index) validator for image quality comparison
 * Measures perceptual similarity between images (0=different, 1=identical)
 */
export class SSIMValidator {
	/**
	 * Compare two images and return SSIM score
	 * @param img1 - First image buffer
	 * @param img2 - Second image buffer
	 * @returns SSIM score between 0 (different) and 1 (identical)
	 */
	static async compareImages(img1: Buffer, img2: Buffer): Promise<number> {
		// Get metadata from first image
		const metadata1 = await sharp(img1).metadata();
		const metadata2 = await sharp(img2).metadata();

		if (!metadata1.width || !metadata1.height || !metadata2.width || !metadata2.height) {
			throw new Error('Images have no dimensions');
		}

		// Normalize both images to same dimensions
		// Resize second image to match first if needed
		const targetWidth = metadata1.width;
		const targetHeight = metadata1.height;

		let normalized1 = img1;
		let normalized2 = img2;

		// Resize second image if dimensions differ
		if (metadata2.width !== targetWidth || metadata2.height !== targetHeight) {
			normalized2 = await sharp(img2)
				.resize(targetWidth, targetHeight, { fit: 'fill' })
				.toBuffer();
		}

		// Convert both to raw RGBA pixel data
		const raw1 = await sharp(normalized1).ensureAlpha().raw().toBuffer();
		const raw2 = await sharp(normalized2).ensureAlpha().raw().toBuffer();

		// Create ImageData objects for SSIM calculation
		const imageData1 = {
			data: new Uint8ClampedArray(raw1),
			width: targetWidth,
			height: targetHeight
		};

		const imageData2 = {
			data: new Uint8ClampedArray(raw2),
			width: targetWidth,
			height: targetHeight
		};

		// Calculate SSIM
		const { mssim } = ssim(imageData1, imageData2);

		return mssim;
	}

	/**
	 * Validate visual fidelity between original and converted image
	 * @param original - Original image buffer
	 * @param converted - Converted image buffer
	 * @param threshold - Minimum acceptable SSIM score (0-1)
	 * @returns Validation result with SSIM score and pass/fail
	 */
	static async validateVisualFidelity(
		original: Buffer,
		converted: Buffer,
		threshold: number
	): Promise<SSIMResult> {
		const score = await this.compareImages(original, converted);
		const metadata = await sharp(original).metadata();

		return {
			valid: score >= threshold,
			score,
			threshold,
			dimensions: {
				width: metadata.width || 0,
				height: metadata.height || 0
			}
		};
	}
}

/**
 * Convenience function for comparing two images
 * @param img1 - First image buffer
 * @param img2 - Second image buffer
 * @returns SSIM score between 0 and 1
 */
export async function compareImages(img1: Buffer, img2: Buffer): Promise<number> {
	return SSIMValidator.compareImages(img1, img2);
}
