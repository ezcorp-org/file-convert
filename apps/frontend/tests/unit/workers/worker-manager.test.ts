/**
 * Comprehensive unit tests for WorkerManager
 *
 * Tests cover:
 * - Worker creation and caching (getOrCreateWorker)
 * - Converter type routing (getConverterType)
 * - Conversion flow with progress reporting
 * - Error handling and retry logic
 * - Memory monitoring integration
 * - Job lifecycle (active jobs, cleanup)
 * - Singleton pattern (getWorkerManager)
 * - Worker termination
 * - Cancel functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// --- Mocks ---

// Mock Worker
class MockWorker {
	url: string;
	options: WorkerOptions;
	listeners: Map<string, Set<EventListenerOrEventListenerObject>> = new Map();
	terminated = false;

	constructor(url: string, options?: WorkerOptions) {
		this.url = url;
		this.options = options || {};
		MockWorker.instances.push(this);
	}

	postMessage(_data: any) {}

	addEventListener(event: string, handler: EventListenerOrEventListenerObject, _options?: any) {
		if (!this.listeners.has(event)) this.listeners.set(event, new Set());
		this.listeners.get(event)!.add(handler);
	}

	removeEventListener(event: string, handler: EventListenerOrEventListenerObject) {
		this.listeners.get(event)?.delete(handler);
	}

	terminate() {
		this.terminated = true;
	}

	// Test helper: fire an event
	fireEvent(event: string, data: any) {
		for (const handler of this.listeners.get(event) || []) {
			if (typeof handler === 'function') handler(data);
			else handler.handleEvent(data);
		}
	}

	static instances: MockWorker[] = [];
	static reset() {
		MockWorker.instances = [];
	}
}

// Mock Comlink
const mockConvert = vi.fn();
const mockComlinkWrap = vi.fn(() => ({ convert: mockConvert }));

vi.mock('comlink', () => ({
	wrap: (...args: any[]) => mockComlinkWrap(...args),
}));

// Mock optimized-converter
const mockGetMemoryStatus = vi.fn().mockReturnValue('safe');
const mockWaitForMemory = vi.fn().mockResolvedValue(undefined);
const mockShouldUseOptimizedProcessing = vi.fn().mockReturnValue(false);
const mockStartPerformanceMonitoring = vi.fn();
const mockEndPerformanceMonitoring = vi.fn().mockReturnValue(null);
const mockClearMetrics = vi.fn();
const mockRequestGarbageCollection = vi.fn();

vi.mock('$lib/converters/optimized-converter', () => ({
	OptimizedConverter: {
		shouldUseOptimizedProcessing: (...args: any[]) => mockShouldUseOptimizedProcessing(...args),
		startPerformanceMonitoring: (...args: any[]) => mockStartPerformanceMonitoring(...args),
		endPerformanceMonitoring: (...args: any[]) => mockEndPerformanceMonitoring(...args),
		clearMetrics: (...args: any[]) => mockClearMetrics(...args),
		requestGarbageCollection: () => mockRequestGarbageCollection(),
	},
	MemoryMonitor: {
		getMemoryStatus: () => mockGetMemoryStatus(),
		waitForMemory: (...args: any[]) => mockWaitForMemory(...args),
	},
}));

// Stub global Worker
vi.stubGlobal('Worker', MockWorker);

// Helper to create a fresh WorkerManager instance via the module
async function createManager() {
	// Clear module cache so each test gets a fresh singleton
	vi.resetModules();

	// Re-stub Worker after resetModules
	vi.stubGlobal('Worker', MockWorker);

	const mod = await import('$lib/workers/worker-manager');
	// getWorkerManager creates a singleton on window
	delete (window as any).__workerManager;
	const manager = mod.getWorkerManager()!;
	return { manager, mod };
}

function makeJob(overrides: Partial<import('$lib/workers/worker-manager').ConversionJob> = {}): import('$lib/workers/worker-manager').ConversionJob {
	return {
		id: 'test-job-1',
		file: new File(['hello'], 'test.png', { type: 'image/png' }),
		fromFormat: 'png',
		toFormat: 'webp',
		...overrides,
	};
}

/**
 * Run an async operation while advancing fake timers to unblock setTimeout-based waits.
 * The worker init has a 1000ms setTimeout that needs to fire.
 */
async function withTimerAdvance<T>(promise: Promise<T>, ms = 1500): Promise<T> {
	// Advance timers in a loop to handle nested timeouts
	const advancing = (async () => {
		for (let elapsed = 0; elapsed < ms; elapsed += 100) {
			await vi.advanceTimersByTimeAsync(100);
		}
	})();
	const result = await promise;
	await advancing;
	return result;
}

// --- Tests ---

describe('WorkerManager', () => {
	beforeEach(() => {
		MockWorker.reset();
		vi.useFakeTimers();
		mockConvert.mockReset();
		mockComlinkWrap.mockClear();
		mockGetMemoryStatus.mockReturnValue('safe');
		mockShouldUseOptimizedProcessing.mockReturnValue(false);
		mockEndPerformanceMonitoring.mockReturnValue(null);
		mockClearMetrics.mockReset();
		mockRequestGarbageCollection.mockReset();
		mockStartPerformanceMonitoring.mockReset();
		mockWaitForMemory.mockReset().mockResolvedValue(undefined);
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	// ---- getConverterType routing ----

	describe('converter type routing', () => {
		let manager: any;

		beforeEach(async () => {
			({ manager } = await createManager());
		});

		it('routes image-to-image conversions to image worker', async () => {
			mockConvert.mockResolvedValue({ id: '1', outputFile: new Blob(), filename: 'out.webp', mimeType: 'image/webp' });

			await withTimerAdvance(manager.convert(makeJob({ id: '1', fromFormat: 'png', toFormat: 'webp' })));

			const workerUrl = MockWorker.instances[0].url;
			expect(workerUrl).toBe('/workers/image-worker.js');
		});

		it('routes audio conversions to audio worker', async () => {
			mockConvert.mockResolvedValue({ id: '2', outputFile: new Blob(), filename: 'out.mp3', mimeType: 'audio/mpeg' });
			await withTimerAdvance(manager.convert(makeJob({ id: '2', fromFormat: 'wav', toFormat: 'mp3' })));

			const workerUrl = MockWorker.instances[0].url;
			expect(workerUrl).toBe('/workers/audio-worker.js');
		});

		it('routes archive conversions to archive worker', async () => {
			mockConvert.mockResolvedValue({ id: '3', outputFile: new Blob(), filename: 'out.zip', mimeType: 'application/zip' });
			await withTimerAdvance(manager.convert(makeJob({ id: '3', fromFormat: 'tar', toFormat: 'zip' })));

			const workerUrl = MockWorker.instances[0].url;
			expect(workerUrl).toBe('/workers/archive-worker.js');
		});

		it('routes pdf source to inline PDF worker', async () => {
			mockConvert.mockResolvedValue({ id: '4', outputFile: new Blob(), filename: 'out.png', mimeType: 'image/png' });
			// PDF source bypasses getOrCreateWorker, no timer advance needed
			await manager.convert(makeJob({ id: '4', fromFormat: 'pdf', toFormat: 'png' }));

			const workerUrl = MockWorker.instances[0].url;
			expect(workerUrl).toBe('/workers/pdf-worker-inline.js');
		});

		it('routes spreadsheet conversions to spreadsheet worker', async () => {
			mockConvert.mockResolvedValue({ id: '5', outputFile: new Blob(), filename: 'out.csv', mimeType: 'text/csv' });
			await withTimerAdvance(manager.convert(makeJob({ id: '5', fromFormat: 'xlsx', toFormat: 'csv' })));

			const workerUrl = MockWorker.instances[0].url;
			expect(workerUrl).toBe('/workers/spreadsheet-worker.js');
		});

		it('routes text conversions to text worker', async () => {
			mockConvert.mockResolvedValue({ id: '6', outputFile: new Blob(), filename: 'out.txt', mimeType: 'text/plain' });
			await withTimerAdvance(manager.convert(makeJob({ id: '6', fromFormat: 'md', toFormat: 'txt' })));

			const workerUrl = MockWorker.instances[0].url;
			expect(workerUrl).toBe('/workers/text-worker.js');
		});

		it('routes csv-to-json to text worker', async () => {
			mockConvert.mockResolvedValue({ id: '7', outputFile: new Blob(), filename: 'out.json', mimeType: 'application/json' });
			await withTimerAdvance(manager.convert(makeJob({ id: '7', fromFormat: 'csv', toFormat: 'json' })));

			const workerUrl = MockWorker.instances[0].url;
			expect(workerUrl).toBe('/workers/text-worker.js');
		});

		it('routes yaml-to-json to spreadsheet worker', async () => {
			mockConvert.mockResolvedValue({ id: '8', outputFile: new Blob(), filename: 'out.json', mimeType: 'application/json' });
			await withTimerAdvance(manager.convert(makeJob({ id: '8', fromFormat: 'yaml', toFormat: 'json' })));

			const workerUrl = MockWorker.instances[0].url;
			expect(workerUrl).toBe('/workers/spreadsheet-worker.js');
		});

		it('routes md-to-html to document worker', async () => {
			mockConvert.mockResolvedValue({ id: '9', outputFile: new Blob(), filename: 'out.html', mimeType: 'text/html' });
			await withTimerAdvance(manager.convert(makeJob({ id: '9', fromFormat: 'md', toFormat: 'html' })));

			const workerUrl = MockWorker.instances[0].url;
			expect(workerUrl).toBe('/workers/document-worker.js');
		});
	});

	// ---- Worker creation and caching ----

	describe('worker creation and caching', () => {
		it('reuses existing worker for same type', async () => {
			const { manager } = await createManager();
			mockConvert.mockResolvedValue({ id: '1', outputFile: new Blob(), filename: 'out.webp', mimeType: 'image/webp' });

			await withTimerAdvance(manager.convert(makeJob({ id: '1', fromFormat: 'png', toFormat: 'webp' })));
			await withTimerAdvance(manager.convert(makeJob({ id: '2', fromFormat: 'jpg', toFormat: 'webp' })));

			// Only one image worker should have been created
			const imageWorkers = MockWorker.instances.filter(w => w.url === '/workers/image-worker.js');
			expect(imageWorkers).toHaveLength(1);
		});

		it('creates separate workers for different types', async () => {
			const { manager } = await createManager();
			mockConvert.mockResolvedValue({ id: 'x', outputFile: new Blob(), filename: 'out', mimeType: 'x' });

			await withTimerAdvance(manager.convert(makeJob({ id: '1', fromFormat: 'png', toFormat: 'webp' })));
			await withTimerAdvance(manager.convert(makeJob({ id: '2', fromFormat: 'wav', toFormat: 'mp3' })));

			const urls = MockWorker.instances.map(w => w.url);
			expect(urls).toContain('/workers/image-worker.js');
			expect(urls).toContain('/workers/audio-worker.js');
		});
	});

	// ---- Conversion flow ----

	describe('conversion flow', () => {
		it('calls api.convert with the job and returns result', async () => {
			const { manager } = await createManager();
			const expectedResult = { id: 'j1', outputFile: new Blob(['data']), filename: 'out.webp', mimeType: 'image/webp' };
			mockConvert.mockResolvedValue(expectedResult);

			const job = makeJob({ id: 'j1' });
			const result = await withTimerAdvance(manager.convert(job));

			expect(mockConvert).toHaveBeenCalledWith(job);
			expect(result).toEqual(expectedResult);
		});

		it('reports progress callbacks during conversion', async () => {
			const { manager } = await createManager();
			mockConvert.mockResolvedValue({ id: 'p1', outputFile: new Blob(), filename: 'out.webp', mimeType: 'image/webp' });

			const progressUpdates: any[] = [];
			const onProgress = vi.fn((p: any) => progressUpdates.push(p));

			await withTimerAdvance(manager.convert(makeJob({ id: 'p1' }), onProgress));

			expect(onProgress).toHaveBeenCalled();
			const statuses = progressUpdates.map(p => p.status);
			expect(statuses).toContain('processing');
			expect(statuses).toContain('complete');

			const complete = progressUpdates.find(p => p.status === 'complete');
			expect(complete?.progress).toBe(100);
		});

		it('cleans up active job after successful conversion', async () => {
			const { manager } = await createManager();
			mockConvert.mockResolvedValue({ id: 'c1', outputFile: new Blob(), filename: 'out.webp', mimeType: 'image/webp' });

			await withTimerAdvance(manager.convert(makeJob({ id: 'c1' })));

			// cancel returns false when no active job
			expect(manager.cancel('c1')).toBe(false);
		});

		it('cleans up active job after failed conversion', async () => {
			const { manager } = await createManager();
			mockConvert.mockRejectedValue(new Error('conversion failed'));

			await expect(withTimerAdvance(manager.convert(makeJob({ id: 'f1' })))).rejects.toThrow('conversion failed');

			expect(manager.cancel('f1')).toBe(false);
		});

		it('always calls clearMetrics in finally block', async () => {
			const { manager } = await createManager();
			mockConvert.mockResolvedValue({ id: 'm1', outputFile: new Blob(), filename: 'out.webp', mimeType: 'image/webp' });

			await withTimerAdvance(manager.convert(makeJob({ id: 'm1' })));
			expect(mockClearMetrics).toHaveBeenCalledWith('m1');
		});
	});

	// ---- Memory monitoring ----

	describe('memory monitoring', () => {
		it('throws when memory status is critical', async () => {
			const { manager } = await createManager();
			mockGetMemoryStatus.mockReturnValue('critical');

			await expect(manager.convert(makeJob({ id: 'mem1' }))).rejects.toThrow('Insufficient memory');
		});

		it('waits for memory when status is warning', async () => {
			const { manager } = await createManager();
			mockGetMemoryStatus.mockReturnValue('warning');
			mockConvert.mockResolvedValue({ id: 'mem2', outputFile: new Blob(), filename: 'out.webp', mimeType: 'image/webp' });

			const onProgress = vi.fn();
			await withTimerAdvance(manager.convert(makeJob({ id: 'mem2' }), onProgress));

			expect(mockWaitForMemory).toHaveBeenCalledWith(3000);
			const queuedUpdate = onProgress.mock.calls.find((c: any[]) => c[0].status === 'queued');
			expect(queuedUpdate).toBeDefined();
		});

		it('proceeds normally when memory is safe', async () => {
			const { manager } = await createManager();
			mockGetMemoryStatus.mockReturnValue('safe');
			mockConvert.mockResolvedValue({ id: 'mem3', outputFile: new Blob(), filename: 'out.webp', mimeType: 'image/webp' });

			await withTimerAdvance(manager.convert(makeJob({ id: 'mem3' })));
			expect(mockWaitForMemory).not.toHaveBeenCalled();
		});
	});

	// ---- Large file handling ----

	describe('large file handling', () => {
		it('starts performance monitoring for large files', async () => {
			const { manager } = await createManager();
			mockShouldUseOptimizedProcessing.mockReturnValue(true);
			mockEndPerformanceMonitoring.mockReturnValue({ processingTimeMs: 1000, throughputMBps: 5, memoryUsageMB: 50 });
			mockConvert.mockResolvedValue({ id: 'lf1', outputFile: new Blob(), filename: 'out.webp', mimeType: 'image/webp' });

			await withTimerAdvance(manager.convert(makeJob({ id: 'lf1' })));

			expect(mockStartPerformanceMonitoring).toHaveBeenCalledWith('lf1');
			expect(mockEndPerformanceMonitoring).toHaveBeenCalled();
		});

		it('requests garbage collection for large files', async () => {
			const { manager } = await createManager();
			mockShouldUseOptimizedProcessing.mockReturnValue(true);
			mockConvert.mockResolvedValue({ id: 'lf2', outputFile: new Blob(), filename: 'out.webp', mimeType: 'image/webp' });

			await withTimerAdvance(manager.convert(makeJob({ id: 'lf2' })));

			expect(mockRequestGarbageCollection).toHaveBeenCalled();
		});

		it('reports optimizing progress for large files', async () => {
			const { manager } = await createManager();
			mockShouldUseOptimizedProcessing.mockReturnValue(true);
			mockConvert.mockResolvedValue({ id: 'lf3', outputFile: new Blob(), filename: 'out.webp', mimeType: 'image/webp' });

			const onProgress = vi.fn();
			await withTimerAdvance(manager.convert(makeJob({ id: 'lf3' }), onProgress));

			const optimizing = onProgress.mock.calls.find((c: any[]) => c[0].message?.includes('Optimizing'));
			expect(optimizing).toBeDefined();
		});
	});

	// ---- Error handling ----

	describe('error handling', () => {
		it('reports error progress on conversion failure', async () => {
			const { manager } = await createManager();
			mockConvert.mockRejectedValue(new Error('Worker crashed'));

			const onProgress = vi.fn();
			await expect(withTimerAdvance(manager.convert(makeJob({ id: 'e1' }), onProgress))).rejects.toThrow('Worker crashed');

			const errorUpdate = onProgress.mock.calls.find((c: any[]) => c[0].status === 'error');
			expect(errorUpdate).toBeDefined();
			expect(errorUpdate![0].progress).toBe(0);
			expect(errorUpdate![0].message).toBe('Worker crashed');
		});

		it('wraps worker creation failure in descriptive error', async () => {
			const { manager } = await createManager();

			vi.stubGlobal('Worker', class FailingWorker {
				constructor() {
					throw new Error('Network error');
				}
			});

			// Needs timer advance for retry delays
			await expect(
				withTimerAdvance(
					manager.convert(makeJob({ id: 'e2', fromFormat: 'wav', toFormat: 'mp3' })),
					15000 // enough for 3 retries with exponential backoff
				)
			).rejects.toThrow('Failed to initialize conversion worker');
		});

		it('wraps PDF inline worker creation failure', async () => {
			const { manager } = await createManager();

			vi.stubGlobal('Worker', class FailingWorker {
				constructor() {
					throw new Error('Script load error');
				}
			});

			await expect(
				manager.convert(makeJob({ id: 'e3', fromFormat: 'pdf', toFormat: 'png' }))
			).rejects.toThrow('Failed to initialize PDF conversion');
		});
	});

	// ---- Cancel ----

	describe('cancel', () => {
		it('returns true for active job', async () => {
			const { manager } = await createManager();

			// Make convert hang so the job stays active
			let resolveConvert: any;
			mockConvert.mockReturnValue(new Promise(r => { resolveConvert = r; }));

			// Start convert but don't await it fully yet
			const convertPromise = withTimerAdvance(manager.convert(makeJob({ id: 'cancel1' })));

			// Advance timers to get past worker init
			await vi.advanceTimersByTimeAsync(1500);

			// Job is now active
			expect(manager.cancel('cancel1')).toBe(true);

			// Clean up
			resolveConvert({ id: 'cancel1', outputFile: new Blob(), filename: 'out.webp', mimeType: 'image/webp' });
			await convertPromise;
		});

		it('returns false for non-existent job', async () => {
			const { manager } = await createManager();
			expect(manager.cancel('nonexistent')).toBe(false);
		});
	});

	// ---- Terminate ----

	describe('terminate', () => {
		it('terminates all workers and clears state', async () => {
			const { manager } = await createManager();
			mockConvert.mockResolvedValue({ id: 't1', outputFile: new Blob(), filename: 'out.webp', mimeType: 'image/webp' });

			await withTimerAdvance(manager.convert(makeJob({ id: 't1', fromFormat: 'png', toFormat: 'webp' })));

			const workersBefore = [...MockWorker.instances];
			expect(workersBefore.length).toBeGreaterThan(0);

			manager.terminate();

			for (const w of workersBefore) {
				expect(w.terminated).toBe(true);
			}

			// After terminate, new conversions should create new workers
			MockWorker.reset();
			vi.stubGlobal('Worker', MockWorker);
			await withTimerAdvance(manager.convert(makeJob({ id: 't2', fromFormat: 'png', toFormat: 'webp' })));
			expect(MockWorker.instances.length).toBeGreaterThan(0);
		});
	});

	// ---- Singleton pattern ----

	describe('getWorkerManager singleton', () => {
		it('returns null in SSR (no window)', async () => {
			vi.resetModules();
			const originalWindow = globalThis.window;
			// @ts-ignore
			delete globalThis.window;

			const mod = await import('$lib/workers/worker-manager');
			expect(mod.getWorkerManager()).toBeNull();

			globalThis.window = originalWindow;
		});

		it('returns same instance on repeated calls', async () => {
			const { mod } = await createManager();
			const a = mod.getWorkerManager();
			const b = mod.getWorkerManager();
			expect(a).toBe(b);
		});
	});

	// ---- Worker progress messages ----

	describe('worker progress messages', () => {
		it('forwards worker progress messages to onProgress callback', async () => {
			const { manager } = await createManager();

			let resolveConvert: any;
			mockConvert.mockReturnValue(new Promise(r => { resolveConvert = r; }));

			const onProgress = vi.fn();
			const convertPromise = withTimerAdvance(manager.convert(makeJob({ id: 'wp1', fromFormat: 'png', toFormat: 'webp' }), onProgress));

			// Advance past worker init
			await vi.advanceTimersByTimeAsync(1500);

			// Find the worker and fire a progress event
			const worker = MockWorker.instances.find(w => w.url === '/workers/image-worker.js');
			expect(worker).toBeDefined();

			worker!.fireEvent('message', { data: { type: 'progress', id: 'wp1', progress: 50, message: 'Half done' } });

			resolveConvert({ id: 'wp1', outputFile: new Blob(), filename: 'out.webp', mimeType: 'image/webp' });
			await convertPromise;

			const progressCall = onProgress.mock.calls.find((c: any[]) => c[0].progress === 50);
			expect(progressCall).toBeDefined();
			expect(progressCall![0].message).toBe('Half done');
		});

		it('ignores progress messages for different job ids', async () => {
			const { manager } = await createManager();

			let resolveConvert: any;
			mockConvert.mockReturnValue(new Promise(r => { resolveConvert = r; }));

			const onProgress = vi.fn();
			const convertPromise = withTimerAdvance(manager.convert(makeJob({ id: 'wp2', fromFormat: 'png', toFormat: 'webp' }), onProgress));

			await vi.advanceTimersByTimeAsync(1500);

			const worker = MockWorker.instances.find(w => w.url === '/workers/image-worker.js');
			worker!.fireEvent('message', { data: { type: 'progress', id: 'other-job', progress: 50, message: 'Wrong job' } });

			resolveConvert({ id: 'wp2', outputFile: new Blob(), filename: 'out.webp', mimeType: 'image/webp' });
			await convertPromise;

			const wrongCall = onProgress.mock.calls.find((c: any[]) => c[0].message === 'Wrong job');
			expect(wrongCall).toBeUndefined();
		});

		it('removes message listener after conversion completes', async () => {
			const { manager } = await createManager();
			mockConvert.mockResolvedValue({ id: 'wp3', outputFile: new Blob(), filename: 'out.webp', mimeType: 'image/webp' });

			const onProgress = vi.fn();
			await withTimerAdvance(manager.convert(makeJob({ id: 'wp3', fromFormat: 'png', toFormat: 'webp' }), onProgress));

			const worker = MockWorker.instances.find(w => w.url === '/workers/image-worker.js');
			const messageListeners = worker!.listeners.get('message');
			expect(messageListeners?.size ?? 0).toBe(0);
		});
	});

	// ---- Worker path generation / fallback ----

	describe('worker fallback for document type', () => {
		it('falls back to pdf-simple-worker on document worker failure', async () => {
			const { manager } = await createManager();

			vi.stubGlobal('Worker', class ConditionalWorker extends MockWorker {
				constructor(url: string, options?: WorkerOptions) {
					super(url, options);
					if (url.includes('document-worker')) {
						throw new Error('document worker failed');
					}
				}
			});

			mockConvert.mockResolvedValue({ id: 'ps1', outputFile: new Blob(), filename: 'out.txt', mimeType: 'text/plain' });

			// docx->pdf uses 'document' converter type
			await withTimerAdvance(
				manager.convert(makeJob({ id: 'ps1', fromFormat: 'docx', toFormat: 'pdf' })),
				15000
			);

			const pdfSimpleWorker = MockWorker.instances.find(w => w.url === '/workers/pdf-simple-worker.js');
			expect(pdfSimpleWorker).toBeDefined();
		});
	});
});
