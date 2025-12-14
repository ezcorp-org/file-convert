import { test, expect, ImageFactory } from '../../fixtures';

test.describe('Drag and Drop Upload', () => {
	test('uploads PNG via drag-and-drop', async ({ page }) => {
		const pngBuffer = await ImageFactory.createPNG({ width: 100, height: 100 });

		await page.goto('/convert');
		await page.waitForLoadState('networkidle');

		// Create DataTransfer in browser context
		const dataTransfer = await page.evaluateHandle(
			(bufferArray) => {
				const dt = new DataTransfer();
				const file = new File([new Uint8Array(bufferArray)], 'dropped.png', {
					type: 'image/png'
				});
				dt.items.add(file);
				return dt;
			},
			[...pngBuffer]
		);

		// Find drop zone and dispatch drop event
		const dropZone = page.locator('.drop-zone');
		await dropZone.dispatchEvent('drop', { dataTransfer });

		// Verify file appeared
		await expect(page.locator('.file-item')).toContainText('dropped.png');
		await expect(page.locator('.configure-section, .format-options')).toBeVisible();
	});

	test('uploads JPEG via drag-and-drop', async ({ page }) => {
		const jpegBuffer = await ImageFactory.createJPEG({ width: 100, height: 100 });

		await page.goto('/convert');
		await page.waitForLoadState('networkidle');

		const dataTransfer = await page.evaluateHandle(
			(bufferArray) => {
				const dt = new DataTransfer();
				const file = new File([new Uint8Array(bufferArray)], 'dropped.jpg', {
					type: 'image/jpeg'
				});
				dt.items.add(file);
				return dt;
			},
			[...jpegBuffer]
		);

		const dropZone = page.locator('.drop-zone');
		await dropZone.dispatchEvent('drop', { dataTransfer });

		await expect(page.locator('.file-item')).toContainText('dropped.jpg');
		await expect(page.locator('.configure-section, .format-options')).toBeVisible();
	});

	test('uploads multiple files via drag-and-drop', async ({ page }) => {
		const png1 = await ImageFactory.createPNG({ width: 100, height: 100, background: '#FF0000' });
		const png2 = await ImageFactory.createPNG({ width: 100, height: 100, background: '#00FF00' });
		const png3 = await ImageFactory.createPNG({ width: 100, height: 100, background: '#0000FF' });

		await page.goto('/convert');
		await page.waitForLoadState('networkidle');

		const dataTransfer = await page.evaluateHandle(
			(buffers) => {
				const dt = new DataTransfer();
				buffers.forEach((bufferArray, index) => {
					const file = new File([new Uint8Array(bufferArray)], `image${index + 1}.png`, {
						type: 'image/png'
					});
					dt.items.add(file);
				});
				return dt;
			},
			[[...png1], [...png2], [...png3]]
		);

		const dropZone = page.locator('.drop-zone');
		await dropZone.dispatchEvent('drop', { dataTransfer });

		// Verify all 3 files appeared
		await expect(page.locator('.file-item')).toHaveCount(3);
		await expect(page.locator('.file-item').nth(0)).toContainText('image1.png');
		await expect(page.locator('.file-item').nth(1)).toContainText('image2.png');
		await expect(page.locator('.file-item').nth(2)).toContainText('image3.png');
	});
});
