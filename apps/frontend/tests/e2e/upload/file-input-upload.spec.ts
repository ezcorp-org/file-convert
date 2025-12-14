import {
	test,
	expect,
	ImageFactory,
	AudioFactory,
	DocumentFactory,
	SpreadsheetFactory,
	ArchiveFactory
} from '../../fixtures';

test.describe('File Input Upload', () => {
	test.describe('Image Formats', () => {
		const IMAGE_TYPES = [
			{
				type: 'image/png',
				ext: 'png',
				factory: () => ImageFactory.createPNG({ width: 100, height: 100 })
			},
			{
				type: 'image/jpeg',
				ext: 'jpg',
				factory: () => ImageFactory.createJPEG({ width: 100, height: 100 })
			},
			{
				type: 'image/webp',
				ext: 'webp',
				factory: () => ImageFactory.createWebP({ width: 100, height: 100 })
			},
			{
				type: 'image/gif',
				ext: 'gif',
				factory: () => ImageFactory.create({ format: 'gif', width: 100, height: 100 })
			},
			{
				type: 'image/tiff',
				ext: 'tiff',
				factory: () => ImageFactory.create({ format: 'tiff', width: 100, height: 100 })
			}
		];

		for (const { type, ext, factory } of IMAGE_TYPES) {
			test(`uploads ${ext.toUpperCase()} via file input`, async ({ page, fileHelper }) => {
				const buffer = await factory();
				const fileData = fileHelper.createFileData(buffer, `test.${ext}`, type);

				await page.goto('/convert');
				await page.waitForLoadState('networkidle');

				const count = await fileHelper.uploadFile(fileData);
				expect(count).toBe(1);

				await expect(page.locator('.file-item')).toContainText(`test.${ext}`);
				await expect(
					page.locator('.configure-section, .format-options')
				).toBeVisible();
			});
		}
	});

	test.describe('Audio Formats', () => {
		test('uploads WAV via file input', async ({ page, fileHelper }) => {
			const buffer = await AudioFactory.createWAV({ duration: 0.5 });
			const fileData = fileHelper.createFileData(buffer, 'test.wav', 'audio/wav');

			await page.goto('/convert');
			await page.waitForLoadState('networkidle');

			const count = await fileHelper.uploadFile(fileData);
			expect(count).toBe(1);

			await expect(page.locator('.file-item')).toContainText('test.wav');
		});
	});

	test.describe('Document Formats', () => {
		const DOC_TYPES = [
			{
				type: 'application/pdf',
				ext: 'pdf',
				factory: () => DocumentFactory.createPDF()
			},
			{
				type: 'text/html',
				ext: 'html',
				factory: () => DocumentFactory.createHTML()
			},
			{
				type: 'text/markdown',
				ext: 'md',
				factory: () => DocumentFactory.createMarkdown()
			}
		];

		for (const { type, ext, factory } of DOC_TYPES) {
			test(`uploads ${ext.toUpperCase()} via file input`, async ({ page, fileHelper }) => {
				const buffer = await factory();
				const fileData = fileHelper.createFileData(buffer, `test.${ext}`, type);

				await page.goto('/convert');
				await page.waitForLoadState('networkidle');

				const count = await fileHelper.uploadFile(fileData);
				expect(count).toBe(1);

				await expect(page.locator('.file-item')).toContainText(`test.${ext}`);
			});
		}
	});

	test.describe('Spreadsheet Formats', () => {
		test.skip('uploads CSV via file input', async ({ page, fileHelper }) => {
			// SKIP: Spreadsheet worker UI support not yet fully implemented
			const buffer = await SpreadsheetFactory.createCSV();
			const fileData = fileHelper.createFileData(buffer, 'test.csv', 'text/csv');

			await page.goto('/convert');
			const count = await fileHelper.uploadFile(fileData);
			expect(count).toBe(1);
		});

		test.skip('uploads XLSX via file input', async ({ page, fileHelper }) => {
			// SKIP: Spreadsheet worker UI support not yet fully implemented
			const buffer = await SpreadsheetFactory.createXLSX();
			const fileData = fileHelper.createFileData(
				buffer,
				'test.xlsx',
				'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
			);

			await page.goto('/convert');
			const count = await fileHelper.uploadFile(fileData);
			expect(count).toBe(1);
		});
	});

	test.describe('Archive Formats', () => {
		test.skip('uploads ZIP via file input', async ({ page, fileHelper }) => {
			// SKIP: Archive format UI support not yet implemented
			// This test validates the file can be created and uploaded when support is added
			const buffer = await ArchiveFactory.createZIP();
			const fileData = fileHelper.createFileData(buffer, 'test.zip', 'application/zip');

			await page.goto('/convert');
			const count = await fileHelper.uploadFile(fileData);
			expect(count).toBe(1);
		});
	});
});
