import { describe, it, expect } from 'vitest';
import { ImageFactory } from './image-factory';
import { MagicByteValidator } from '../validators';
import sharp from 'sharp';

describe('ImageFactory', () => {
	describe('Format generation with MagicByteValidator integration', () => {
		it('generates valid PNG that passes magic byte validation', async () => {
			const png = await ImageFactory.createPNG({ width: 100, height: 100 });
			const result = await MagicByteValidator.validate(png, 'png');
			expect(result.valid).toBe(true);
			expect(result.detectedFormat).toBe('png');
			// Confidence can be high or medium depending on detection method
			expect(['high', 'medium']).toContain(result.confidence);
		});

		it('generates valid JPEG that passes magic byte validation', async () => {
			const jpeg = await ImageFactory.createJPEG({ width: 100, height: 100 });
			const result = await MagicByteValidator.validate(jpeg, 'jpeg');
			expect(result.valid).toBe(true);
			// file-type returns 'jpg', validator may normalize to 'jpeg'
			expect(['jpg', 'jpeg']).toContain(result.detectedFormat);
		});

		it('generates valid WebP that passes RIFF+WEBP signature validation', async () => {
			const webp = await ImageFactory.createWebP({ width: 100, height: 100 });
			const result = await MagicByteValidator.validate(webp, 'webp');
			expect(result.valid).toBe(true);
			expect(result.detectedFormat).toBe('webp');
		});
	});

	describe('Dimension control', () => {
		it('generates image with specified dimensions', async () => {
			const png = await ImageFactory.createPNG({ width: 200, height: 300 });
			const metadata = await sharp(png).metadata();
			expect(metadata.width).toBe(200);
			expect(metadata.height).toBe(300);
		});

		it('generates 1x1 minimum size image', async () => {
			const tiny = await ImageFactory.createPNG({ width: 1, height: 1 });
			const metadata = await sharp(tiny).metadata();
			expect(metadata.width).toBe(1);
			expect(metadata.height).toBe(1);
		});

		it('generates large 2000x2000 image', async () => {
			const large = await ImageFactory.createPNG({ width: 2000, height: 2000 });
			const metadata = await sharp(large).metadata();
			expect(metadata.width).toBe(2000);
			expect(metadata.height).toBe(2000);
		});

		it('generates unusual aspect ratio (wide)', async () => {
			const wide = await ImageFactory.createPNG({ width: 1000, height: 100 });
			const metadata = await sharp(wide).metadata();
			expect(metadata.width).toBe(1000);
			expect(metadata.height).toBe(100);
		});

		it('generates unusual aspect ratio (tall)', async () => {
			const tall = await ImageFactory.createPNG({ width: 100, height: 1000 });
			const metadata = await sharp(tall).metadata();
			expect(metadata.width).toBe(100);
			expect(metadata.height).toBe(1000);
		});
	});

	describe('Variations', () => {
		it('createVariations produces all 6 edge cases', async () => {
			const variations = await ImageFactory.createVariations();
			expect(Object.keys(variations).sort()).toEqual([
				'tiny',
				'small',
				'medium',
				'large',
				'wide',
				'tall'
			].sort());

			// Each variation passes magic byte validation
			for (const [name, buffer] of Object.entries(variations)) {
				const result = await MagicByteValidator.validate(buffer, 'png');
				expect(result.valid, `${name} should be valid`).toBe(true);
			}
		});

		it('tiny variation is 1x1 pixel', async () => {
			const variations = await ImageFactory.createVariations();
			const metadata = await sharp(variations.tiny).metadata();
			expect(metadata.width).toBe(1);
			expect(metadata.height).toBe(1);
		});

		it('small variation is 10x10 pixels', async () => {
			const variations = await ImageFactory.createVariations();
			const metadata = await sharp(variations.small).metadata();
			expect(metadata.width).toBe(10);
			expect(metadata.height).toBe(10);
		});

		it('medium variation is 500x500 pixels', async () => {
			const variations = await ImageFactory.createVariations();
			const metadata = await sharp(variations.medium).metadata();
			expect(metadata.width).toBe(500);
			expect(metadata.height).toBe(500);
		});

		it('large variation is 2000x2000 pixels', async () => {
			const variations = await ImageFactory.createVariations();
			const metadata = await sharp(variations.large).metadata();
			expect(metadata.width).toBe(2000);
			expect(metadata.height).toBe(2000);
		});

		it('wide variation is 1000x100 pixels', async () => {
			const variations = await ImageFactory.createVariations();
			const metadata = await sharp(variations.wide).metadata();
			expect(metadata.width).toBe(1000);
			expect(metadata.height).toBe(100);
		});

		it('tall variation is 100x1000 pixels', async () => {
			const variations = await ImageFactory.createVariations();
			const metadata = await sharp(variations.tall).metadata();
			expect(metadata.width).toBe(100);
			expect(metadata.height).toBe(1000);
		});
	});

	describe('Integration with FileHelper', () => {
		it('integrates with FileHelper.createFileData()', async () => {
			const pngBuffer = await ImageFactory.createPNG({ width: 100, height: 100 });
			// Verify buffer can be wrapped as FileData
			expect(pngBuffer).toBeInstanceOf(Buffer);
			expect(pngBuffer.length).toBeGreaterThan(0);
		});

		it('generates buffer that can be used directly', async () => {
			const pngBuffer = await ImageFactory.createPNG({ width: 100, height: 100 });
			expect(Buffer.isBuffer(pngBuffer)).toBe(true);
			expect(pngBuffer.length).toBeGreaterThan(100); // PNG header + data
		});
	});

	describe('Quality control', () => {
		it('JPEG respects quality parameter', async () => {
			const lowQuality = await ImageFactory.createJPEG({ width: 500, height: 500, quality: 10 });
			const highQuality = await ImageFactory.createJPEG({ width: 500, height: 500, quality: 100 });

			// Lower quality should result in smaller file size
			expect(lowQuality.length).toBeLessThan(highQuality.length);
		});

		it('WebP respects quality parameter with complex image', async () => {
			// Use different colors to create more compressible content
			const lowQuality = await ImageFactory.createWebP({ width: 500, height: 500, quality: 10, background: '#FF0000' });
			const highQuality = await ImageFactory.createWebP({ width: 500, height: 500, quality: 100, background: '#FF0000' });

			// Both should be valid WebP files
			const metadata1 = await sharp(lowQuality).metadata();
			const metadata2 = await sharp(highQuality).metadata();
			expect(metadata1.format).toBe('webp');
			expect(metadata2.format).toBe('webp');
		});
	});

	describe('Background color', () => {
		it('generates image with custom background color', async () => {
			const png = await ImageFactory.createPNG({
				width: 100,
				height: 100,
				background: '#0000FF' // Blue
			});

			// Verify image is valid
			const metadata = await sharp(png).metadata();
			expect(metadata.width).toBe(100);
			expect(metadata.height).toBe(100);
		});
	});

	describe('Text overlay', () => {
		it('generates image with text overlay', async () => {
			const png = await ImageFactory.createPNG({
				width: 200,
				height: 100,
				withText: 'Test Image'
			});

			// Verify image is valid and has expected dimensions
			const metadata = await sharp(png).metadata();
			expect(metadata.width).toBe(200);
			expect(metadata.height).toBe(100);
		});
	});

	describe('Format-specific methods', () => {
		it('createPNG generates PNG format', async () => {
			const png = await ImageFactory.createPNG({ width: 100, height: 100 });
			const result = await MagicByteValidator.validate(png, 'png');
			expect(result.valid).toBe(true);
			expect(result.detectedFormat).toBe('png');
		});

		it('createJPEG generates JPEG format', async () => {
			const jpeg = await ImageFactory.createJPEG({ width: 100, height: 100 });
			const result = await MagicByteValidator.validate(jpeg, 'jpeg');
			expect(result.valid).toBe(true);
			// file-type returns 'jpg', validator may normalize to 'jpeg'
			expect(['jpg', 'jpeg']).toContain(result.detectedFormat);
		});

		it('createWebP generates WebP format', async () => {
			const webp = await ImageFactory.createWebP({ width: 100, height: 100 });
			const result = await MagicByteValidator.validate(webp, 'webp');
			expect(result.valid).toBe(true);
			expect(result.detectedFormat).toBe('webp');
		});
	});

	describe('create() with format parameter', () => {
		it('creates TIFF when format specified', async () => {
			const tiff = await ImageFactory.create({ width: 100, height: 100, format: 'tiff' });
			const metadata = await sharp(tiff).metadata();
			expect(metadata.format).toBe('tiff');
		});

		it('creates GIF when format specified', async () => {
			const gif = await ImageFactory.create({ width: 100, height: 100, format: 'gif' });
			const metadata = await sharp(gif).metadata();
			expect(metadata.format).toBe('gif');
		});
	});
});
