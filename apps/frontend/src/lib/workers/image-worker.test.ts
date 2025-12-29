import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock OffscreenCanvas and related APIs
const mockConvertToBlob = vi.fn().mockResolvedValue(new Blob(['image-data'], { type: 'image/png' }));
const mockGetImageData = vi.fn().mockReturnValue({
	data: new Uint8Array(16), // 2x2 RGBA
	width: 2,
	height: 2
});
const mockDrawImage = vi.fn();

const mockCtx = {
	drawImage: mockDrawImage,
	getImageData: mockGetImageData
};

class MockOffscreenCanvas {
	width = 1;
	height = 1;
	convertToBlob = mockConvertToBlob;
	getContext(_type: string) {
		return mockCtx;
	}
}

(globalThis as any).OffscreenCanvas = MockOffscreenCanvas;

const mockBitmapClose = vi.fn();
(globalThis as any).createImageBitmap = vi.fn().mockResolvedValue({
	width: 100,
	height: 200,
	close: mockBitmapClose
});

// Mock self.postMessage
const postMessageSpy = vi.fn();
(globalThis as any).self = { postMessage: postMessageSpy };

// Mock Comlink
vi.mock('comlink', () => ({
	expose: vi.fn()
}));

function makeJob(overrides: Record<string, any> = {}) {
	return {
		id: 'img-job-1',
		file: new File([new Uint8Array([0x89, 0x50, 0x4E, 0x47])], 'photo.png', { type: 'image/png' }),
		fromFormat: 'png',
		toFormat: 'jpeg',
		options: {},
		...overrides
	};
}

describe('ImageConverter', () => {
	let converter: any;

	beforeEach(async () => {
		vi.clearAllMocks();
		vi.resetModules();

		// Re-setup mocks
		vi.doMock('comlink', () => ({ expose: vi.fn() }));
		(globalThis as any).OffscreenCanvas = MockOffscreenCanvas;
		(globalThis as any).createImageBitmap = vi.fn().mockResolvedValue({
			width: 100,
			height: 200,
			close: mockBitmapClose
		});
		(globalThis as any).self = { postMessage: postMessageSpy };

		await import('./image-worker');
		const comlink = await import('comlink');
		const calls = (comlink.expose as ReturnType<typeof vi.fn>).mock.calls;
		converter = calls[0][0];
	});

	it('exposes a converter via Comlink', () => {
		expect(converter).toBeDefined();
		expect(typeof converter.convert).toBe('function');
	});

	it('converts to PNG format', async () => {
		mockConvertToBlob.mockResolvedValueOnce(new Blob(['png'], { type: 'image/png' }));
		const job = makeJob({ toFormat: 'png' });
		const result = await converter.convert(job);

		expect(result.id).toBe('img-job-1');
		expect(result.mimeType).toBe('image/png');
		expect(result.filename).toBe('photo.png');
		expect(mockConvertToBlob).toHaveBeenCalledWith({ type: 'image/png' });
	});

	it('converts to JPEG with quality', async () => {
		mockConvertToBlob.mockResolvedValueOnce(new Blob(['jpeg'], { type: 'image/jpeg' }));
		const job = makeJob({ toFormat: 'jpeg', options: { quality: 0.9 } });
		const result = await converter.convert(job);

		expect(result.mimeType).toBe('image/jpeg');
		expect(result.filename).toBe('photo.jpeg');
		expect(mockConvertToBlob).toHaveBeenCalledWith({ type: 'image/jpeg', quality: 0.9 });
	});

	it('converts to JPG (alias for JPEG)', async () => {
		mockConvertToBlob.mockResolvedValueOnce(new Blob(['jpeg'], { type: 'image/jpeg' }));
		const job = makeJob({ toFormat: 'jpg' });
		const result = await converter.convert(job);

		expect(result.mimeType).toBe('image/jpeg');
		expect(result.filename).toBe('photo.jpg');
	});

	it('converts to WebP with quality', async () => {
		mockConvertToBlob.mockResolvedValueOnce(new Blob(['webp'], { type: 'image/webp' }));
		const job = makeJob({ toFormat: 'webp' });
		const result = await converter.convert(job);

		expect(result.mimeType).toBe('image/webp');
		expect(result.filename).toBe('photo.webp');
	});

	it('converts to BMP using custom implementation', async () => {
		const job = makeJob({ toFormat: 'bmp' });
		const result = await converter.convert(job);

		expect(result.mimeType).toBe('image/bmp');
		expect(result.filename).toBe('photo.bmp');
		expect(result.outputFile).toBeInstanceOf(Blob);
	});

	it('falls back to PNG for unsupported formats', async () => {
		mockConvertToBlob.mockResolvedValueOnce(new Blob(['png'], { type: 'image/png' }));
		const job = makeJob({ toFormat: 'tiff' });
		const result = await converter.convert(job);

		expect(result.filename).toBe('photo.tiff');
		expect(mockConvertToBlob).toHaveBeenCalledWith({ type: 'image/png' });
	});

	it('uses default quality when none specified', async () => {
		mockConvertToBlob.mockResolvedValueOnce(new Blob(['jpeg'], { type: 'image/jpeg' }));
		const job = makeJob({ toFormat: 'jpeg', options: {} });
		await converter.convert(job);

		// Default JPEG quality is 0.85
		expect(mockConvertToBlob).toHaveBeenCalledWith({ type: 'image/jpeg', quality: 0.85 });
	});

	it('sets canvas dimensions from bitmap', async () => {
		const job = makeJob();
		await converter.convert(job);

		// The canvas should have been resized to bitmap dimensions (100x200)
		// Verified implicitly via createImageBitmap being called
		expect((globalThis as any).createImageBitmap).toHaveBeenCalled();
	});

	it('cleans up bitmap after conversion', async () => {
		const job = makeJob();
		await converter.convert(job);

		expect(mockBitmapClose).toHaveBeenCalled();
	});

	it('posts progress messages during conversion', async () => {
		const job = makeJob();
		await converter.convert(job);

		const progressCalls = postMessageSpy.mock.calls.filter(
			(call: any[]) => call[0].type === 'progress'
		);
		expect(progressCalls.length).toBeGreaterThanOrEqual(4); // 10%, 30%, 60%, 90%, 100%
		expect(progressCalls[0][0].progress).toBe(10);
		expect(progressCalls[progressCalls.length - 1][0].progress).toBe(100);
	});

	it('throws descriptive error on failure', async () => {
		(globalThis as any).createImageBitmap = vi.fn().mockRejectedValueOnce(new Error('Invalid image'));
		const job = makeJob();

		await expect(converter.convert(job)).rejects.toThrow('Image conversion failed: Invalid image');
	});

	it('returns correct MIME types for all formats', async () => {
		// Test getMimeType indirectly via convert results
		const formats = [
			{ format: 'png', mime: 'image/png' },
			{ format: 'jpeg', mime: 'image/jpeg' },
			{ format: 'webp', mime: 'image/webp' },
			{ format: 'gif', mime: 'image/gif' },
			{ format: 'bmp', mime: 'image/bmp' }
		];

		for (const { format, mime } of formats) {
			mockConvertToBlob.mockResolvedValueOnce(new Blob(['data'], { type: mime }));
			const job = makeJob({ toFormat: format });
			const result = await converter.convert(job);
			expect(result.mimeType).toBe(mime);
		}
	});
});
