import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Comlink before importing
vi.mock('comlink', () => ({
	expose: vi.fn()
}));

// Mock fflate
vi.mock('fflate', () => ({
	unzipSync: vi.fn((data: Uint8Array) => ({
		'file1.txt': new Uint8Array([72, 101, 108, 108, 111]),
		'file2.txt': new Uint8Array([87, 111, 114, 108, 100])
	})),
	zipSync: vi.fn((_files: any, _opts?: any) => new Uint8Array([80, 75, 3, 4, 0, 0])),
	gzipSync: vi.fn((data: Uint8Array) => new Uint8Array([31, 139, ...data])),
	gunzipSync: vi.fn((data: Uint8Array) => data.slice(2))
}));

// Mock self.postMessage for worker global
const postMessageSpy = vi.fn();
(globalThis as any).self = { postMessage: postMessageSpy };

// Now import (the module runs Comlink.expose at module level)
import * as Comlink from 'comlink';

// Extract the exposed converter from the Comlink.expose mock
function getConverter() {
	const exposeCalls = (Comlink.expose as ReturnType<typeof vi.fn>).mock.calls;
	expect(exposeCalls.length).toBeGreaterThan(0);
	return exposeCalls[0][0];
}

function makeJob(overrides: Record<string, any> = {}) {
	const content = new Uint8Array([80, 75, 3, 4]); // ZIP magic bytes
	return {
		id: 'test-job-1',
		file: new File([content], 'test.zip', { type: 'application/zip' }),
		fromFormat: 'zip',
		toFormat: 'tar',
		options: {},
		...overrides
	};
}

describe('ArchiveConverter', () => {
	let converter: any;

	beforeEach(async () => {
		vi.clearAllMocks();
		// Re-import to get fresh module
		vi.resetModules();

		// Re-setup mocks after reset
		vi.doMock('comlink', () => ({ expose: vi.fn() }));
		vi.doMock('fflate', () => ({
			unzipSync: vi.fn(() => ({
				'file1.txt': new Uint8Array([72, 101, 108, 108, 111])
			})),
			zipSync: vi.fn(() => new Uint8Array([80, 75, 3, 4, 0, 0])),
			gzipSync: vi.fn((data: Uint8Array) => new Uint8Array([31, 139, ...data])),
			gunzipSync: vi.fn((data: Uint8Array) => data.slice(2))
		}));
		(globalThis as any).self = { postMessage: postMessageSpy };

		const mod = await import('./archive-worker');
		const comlink = await import('comlink');
		const calls = (comlink.expose as ReturnType<typeof vi.fn>).mock.calls;
		converter = calls[0][0];
	});

	it('exposes a converter via Comlink', async () => {
		expect(converter).toBeDefined();
		expect(typeof converter.convert).toBe('function');
	});

	it('converts zip to tar', async () => {
		const job = makeJob({ fromFormat: 'zip', toFormat: 'tar' });
		const result = await converter.convert(job);

		expect(result.id).toBe('test-job-1');
		expect(result.mimeType).toBe('application/x-tar');
		expect(result.filename).toBe('test.tar');
		expect(result.outputFile).toBeInstanceOf(Blob);
	});

	it('converts zip to tgz', async () => {
		const job = makeJob({ fromFormat: 'zip', toFormat: 'tgz' });
		const result = await converter.convert(job);

		expect(result.id).toBe('test-job-1');
		expect(result.mimeType).toBe('application/gzip');
		expect(result.filename).toBe('test.tgz');
	});

	it('recompresses zip to zip', async () => {
		const job = makeJob({ fromFormat: 'zip', toFormat: 'zip', options: { compressionLevel: 9 } });
		const result = await converter.convert(job);

		expect(result.id).toBe('test-job-1');
		expect(result.mimeType).toBe('application/zip');
		expect(result.filename).toBe('test.zip');
	});

	it('converts tar to zip', async () => {
		const tarContent = new Uint8Array(1024); // minimal tar-like data
		const job = makeJob({
			file: new File([tarContent], 'archive.tar', { type: 'application/x-tar' }),
			fromFormat: 'tar',
			toFormat: 'zip'
		});
		const result = await converter.convert(job);

		expect(result.mimeType).toBe('application/zip');
		expect(result.filename).toBe('archive.zip');
	});

	it('converts tgz to zip', async () => {
		const tgzContent = new Uint8Array([31, 139, 0, 0]);
		const job = makeJob({
			file: new File([tgzContent], 'archive.tgz', { type: 'application/gzip' }),
			fromFormat: 'tgz',
			toFormat: 'zip'
		});
		const result = await converter.convert(job);

		expect(result.mimeType).toBe('application/zip');
		expect(result.filename).toBe('archive.zip');
	});

	it('handles single file to zip conversion', async () => {
		const job = makeJob({
			file: new File([new Uint8Array([1, 2, 3])], 'readme.txt', { type: 'text/plain' }),
			fromFormat: 'txt',
			toFormat: 'zip'
		});
		const result = await converter.convert(job);

		expect(result.mimeType).toBe('application/zip');
		expect(result.filename).toBe('readme.zip');
	});

	it('throws on unsupported conversion from zip', async () => {
		const job = makeJob({ fromFormat: 'zip', toFormat: 'rar' });
		await expect(converter.convert(job)).rejects.toThrow('Archive conversion failed');
	});

	it('throws on unsupported conversion between non-zip formats', async () => {
		const job = makeJob({ fromFormat: 'rar', toFormat: 'tar' });
		await expect(converter.convert(job)).rejects.toThrow('Archive conversion failed');
	});

	it('posts progress messages during conversion', async () => {
		const job = makeJob({ fromFormat: 'zip', toFormat: 'tar' });
		await converter.convert(job);

		const progressCalls = postMessageSpy.mock.calls.filter(
			(call: any[]) => call[0].type === 'progress'
		);
		expect(progressCalls.length).toBeGreaterThan(0);
		expect(progressCalls[0][0]).toMatchObject({
			type: 'progress',
			id: 'test-job-1'
		});
	});

	it('handles compound extensions like .tar.gz', async () => {
		const job = makeJob({
			file: new File([new Uint8Array([80, 75])], 'archive.tar.gz', { type: 'application/gzip' }),
			fromFormat: 'zip',
			toFormat: 'tar'
		});
		const result = await converter.convert(job);
		// getOutputFilename strips .tar compound extension
		expect(result.filename).toBe('archive.tar');
	});
});
