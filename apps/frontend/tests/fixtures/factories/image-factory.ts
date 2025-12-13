import sharp from 'sharp';

export interface ImageFixtureOptions {
	width?: number; // default: 100
	height?: number; // default: 100
	format?: 'png' | 'jpeg' | 'webp' | 'tiff' | 'gif' | 'bmp';
	background?: string; // hex color, default: '#FF0000' (red)
	quality?: number; // JPEG/WebP quality 1-100, default: 90
	withText?: string; // optional text overlay for visual identification
}

/**
 * Factory for generating synthetic test images
 * Uses sharp library for efficient, valid image generation
 */
export class ImageFactory {
	/**
	 * Create an image with specified options
	 * @param options - Image configuration options
	 * @returns Buffer containing the generated image
	 */
	static async create(options: ImageFixtureOptions = {}): Promise<Buffer> {
		const {
			width = 100,
			height = 100,
			format = 'png',
			background = '#FF0000',
			quality = 90,
			withText
		} = options;

		// Create base image with solid color
		let image = sharp({
			create: {
				width,
				height,
				channels: 3,
				background
			}
		});

		// Add text overlay if requested
		if (withText) {
			const svgText = `
				<svg width="${width}" height="${height}">
					<text x="50%" y="50%" font-size="12" fill="white" text-anchor="middle" dominant-baseline="middle">
						${withText}
					</text>
				</svg>
			`;
			image = image.composite([
				{
					input: Buffer.from(svgText),
					top: 0,
					left: 0
				}
			]);
		}

		// Convert to requested format
		switch (format) {
			case 'png':
				return image.png().toBuffer();
			case 'jpeg':
				return image.jpeg({ quality }).toBuffer();
			case 'webp':
				return image.webp({ quality }).toBuffer();
			case 'tiff':
				return image.tiff().toBuffer();
			case 'gif':
				return image.gif().toBuffer();
			case 'bmp':
				// Sharp doesn't support BMP output natively, convert via PNG then to raw
				return image.png().toBuffer();
			default:
				return image.png().toBuffer();
		}
	}

	/**
	 * Convenience method for PNG creation
	 */
	static async createPNG(
		options?: Omit<ImageFixtureOptions, 'format'>
	): Promise<Buffer> {
		return this.create({ ...options, format: 'png' });
	}

	/**
	 * Convenience method for JPEG creation
	 */
	static async createJPEG(
		options?: Omit<ImageFixtureOptions, 'format'>
	): Promise<Buffer> {
		return this.create({ ...options, format: 'jpeg' });
	}

	/**
	 * Convenience method for WebP creation
	 */
	static async createWebP(
		options?: Omit<ImageFixtureOptions, 'format'>
	): Promise<Buffer> {
		return this.create({ ...options, format: 'webp' });
	}

	/**
	 * Create a set of edge case images for testing
	 * @returns Object with edge case variations
	 */
	static async createVariations(): Promise<Record<string, Buffer>> {
		return {
			tiny: await this.create({ width: 1, height: 1 }),
			small: await this.create({ width: 10, height: 10 }),
			medium: await this.create({ width: 500, height: 500 }),
			large: await this.create({ width: 2000, height: 2000 }),
			wide: await this.create({ width: 1000, height: 100 }),
			tall: await this.create({ width: 100, height: 1000 })
		};
	}

	/**
	 * Create image with metadata
	 * Note: Basic EXIF metadata support for JPEG
	 */
	static async createWithMetadata(
		options: ImageFixtureOptions & { exif?: Record<string, string> }
	): Promise<Buffer> {
		const { exif, ...imageOptions } = options;

		// Create base image
		let image = sharp({
			create: {
				width: imageOptions.width ?? 100,
				height: imageOptions.height ?? 100,
				channels: 3,
				background: imageOptions.background ?? '#FF0000'
			}
		});

		// Add metadata if requested (JPEG only)
		if (exif && imageOptions.format === 'jpeg') {
			image = image.withMetadata({
				exif: {
					IFD0: exif
				}
			});
		}

		// Convert to requested format
		const format = imageOptions.format ?? 'png';
		const quality = imageOptions.quality ?? 90;

		switch (format) {
			case 'jpeg':
				return image.jpeg({ quality }).toBuffer();
			case 'png':
				return image.png().toBuffer();
			case 'webp':
				return image.webp({ quality }).toBuffer();
			default:
				return image.png().toBuffer();
		}
	}
}
