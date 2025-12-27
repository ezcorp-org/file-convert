import * as Comlink from 'comlink';
import { OptimizedConverter, MemoryMonitor } from '../converters/optimized-converter.js';

// Worker initialization configuration
const INIT_TIMEOUT = 10000;  // Increased from 5000 - PDF.js is 2-3MB
const RETRY_DELAYS = [500, 1000, 2000];  // Exponential backoff delays
const MAX_RETRIES = 3;

export interface ConversionJob {
	id: string;
	file: File;
	fromFormat: string;
	toFormat: string;
	priority?: number;
	options?: Record<string, any>;
}

export interface ConversionResult {
	id: string;
	outputFile: Blob;
	filename: string;
	mimeType: string;
}

export interface ConversionProgress {
	id?: string;
	status?: 'queued' | 'processing' | 'complete' | 'error';
	progress: number;
	message?: string;
}

export type WorkerApi = {
	convert: (job: ConversionJob) => Promise<ConversionResult>;
};

class WorkerManager {
	private workers: Map<string, Worker> = new Map();
	private workerApis: Map<string, Comlink.Remote<WorkerApi>> = new Map();
	private jobQueue: ConversionJob[] = [];
	private activeJobs: Map<string, ConversionJob> = new Map();
	private maxWorkers = 4;

	private getWorkerPath(type: string): string {
		// For now, keep using the JS files in static folder
		// In production, these would be compiled from TS
		if (type === 'pdf-simple') {
			return '/workers/pdf-simple-worker.js';
		}
		return `/workers/${type}-worker.js`;
	}

	private async getOrCreateWorker(type: string): Promise<Comlink.Remote<WorkerApi>> {
		if (!this.workerApis.has(type)) {
			let lastError: any;

			for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
				try {
					console.log(`Attempting to create ${type} worker (${attempt + 1}/${MAX_RETRIES})`);

					// Apply exponential backoff delay between retries
					if (attempt > 0) {
						const delay = RETRY_DELAYS[attempt - 1] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
						console.log(`Worker init retry ${attempt}/${MAX_RETRIES} for ${type}, waiting ${delay}ms`);
						await new Promise(resolve => setTimeout(resolve, delay));
					}

					// Different workers need different loading strategies
					// In development, prefer classic workers to avoid DevTools 'blocked:devtools' and module loader quirks
					const isDev = typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.DEV;
					let workerOptions: WorkerOptions = {};
					if (!isDev && (type !== 'text' && type !== 'spreadsheet')) {
						workerOptions = { type: 'module' };
					} else {
						workerOptions = { type: 'classic' } as WorkerOptions;
					}
					const worker = new Worker(this.getWorkerPath(type), workerOptions);

					// Test the worker is responsive with increased timeout for large libraries (PDF.js)
					await new Promise((resolve, reject) => {
						const timeout = setTimeout(() => reject(new Error('Worker initialization timeout')), INIT_TIMEOUT);
						worker.addEventListener('error', (e) => {
							clearTimeout(timeout);
							reject(e);
						}, { once: true });

						// Send a ping message to test
						worker.postMessage({ type: 'ping' });

						// Assume it's working if no error after a short delay
						setTimeout(() => {
							clearTimeout(timeout);
							resolve(true);
						}, 1000);
					});

					const api = Comlink.wrap<WorkerApi>(worker);
					this.workers.set(type, worker);
					this.workerApis.set(type, api);
					console.log(`Successfully created ${type} worker`);
					return api;
				} catch (error) {
					lastError = error;
					console.error(`Failed to create ${type} worker (attempt ${attempt + 1}/${MAX_RETRIES}):`, error);

					// Try fallback workers on last attempt
					if (attempt === MAX_RETRIES - 1) {
						if (type === 'document') {
							try {
								console.log('Trying fallback PDF simple worker');
								const worker = new Worker('/workers/pdf-simple-worker.js', { type: 'module' });
								const api = Comlink.wrap<WorkerApi>(worker);
								this.workers.set(type, worker);
								this.workerApis.set(type, api);
								return api;
							} catch (fallbackError) {
								console.error('Fallback worker also failed:', fallbackError);
							}
						}
						throw lastError || new Error(`Failed to initialize ${type} worker after ${MAX_RETRIES} attempts`);
					}
				}
			}
		}
		return this.workerApis.get(type)!;
	}

	async convert(job: ConversionJob, onProgress?: (progress: ConversionProgress) => void): Promise<ConversionResult> {
		// Check memory before starting
		const memoryStatus = MemoryMonitor.getMemoryStatus();
		if (memoryStatus === 'critical') {
			throw new Error('Insufficient memory available. Please close other tabs or applications.');
		}

		// Wait for memory if needed
		if (memoryStatus === 'warning') {
			if (onProgress) {
				onProgress({ id: job.id, status: 'queued', progress: 0, message: 'Waiting for resources...' });
			}
			await MemoryMonitor.waitForMemory(3000);
		}

		// Start performance monitoring for large files
		const isLargeFile = OptimizedConverter.shouldUseOptimizedProcessing(job.file);
		if (isLargeFile) {
			OptimizedConverter.startPerformanceMonitoring(job.id);
			if (onProgress) {
				onProgress({ id: job.id, status: 'processing', progress: 0, message: 'Optimizing for large file...' });
			}
		}

		const converterType = this.getConverterType(job.fromFormat, job.toFormat);
		console.log(`Converting ${job.fromFormat} to ${job.toFormat} using ${converterType} worker`);

		let api: Comlink.Remote<WorkerApi>;

		// Use inline PDF worker for PDF conversions to avoid module loading issues
		if (job.fromFormat === 'pdf') {
			console.log('Using inline PDF worker for conversion');
			try {
				const worker = new Worker('/workers/pdf-worker-inline.js');
				api = Comlink.wrap<WorkerApi>(worker);
				this.workers.set('pdf-inline', worker);
				this.workerApis.set('pdf-inline', api);
			} catch (error) {
				console.error('Failed to create inline PDF worker:', error);
				throw new Error(`Failed to initialize PDF conversion: ${(error as Error).message}`);
			}
		} else {
			try {
				api = await this.getOrCreateWorker(converterType);
			} catch (error) {
				console.error('Worker creation failed:', error);
				throw new Error(`Failed to initialize conversion worker: ${(error as Error).message}`);
			}
		}

		this.activeJobs.set(job.id, job);

		// Set up progress listener for worker messages
		const worker = this.workers.get(converterType) || this.workers.get('pdf-inline');
		let messageHandler: ((event: MessageEvent) => void) | null = null;

		if (worker && onProgress) {
			messageHandler = (event: MessageEvent) => {
				if (event.data.type === 'progress' && event.data.id === job.id) {
					onProgress({
						id: job.id,
						status: 'processing',
						progress: event.data.progress,
						message: event.data.message || 'Processing...'
					});
				}
			};
			worker.addEventListener('message', messageHandler);
		}

		try {
			if (onProgress) {
				onProgress({ id: job.id, status: 'processing', progress: 5, message: 'Starting conversion...' });
			}

			// No timeout - let conversions take as long as needed
			const result = await api.convert(job);

			// Remove message listener
			if (worker && messageHandler) {
				worker.removeEventListener('message', messageHandler);
			}

			// Log performance metrics for large files
			if (isLargeFile) {
				const metrics = OptimizedConverter.endPerformanceMonitoring(job.id, job.file.size);
				if (metrics) {
					console.log(`Performance metrics for ${job.file.name}:`, {
						processingTime: `${(metrics.processingTimeMs || 0) / 1000}s`,
						throughput: `${metrics.throughputMBps?.toFixed(2)} MB/s`,
						memoryUsed: `${metrics.memoryUsageMB?.toFixed(2)} MB`
					});
				}
			}

			if (onProgress) {
				onProgress({ id: job.id, status: 'complete', progress: 100, message: 'Conversion complete!' });
			}

			return result;
		} catch (error) {
			console.error('Conversion failed:', error);
			if (onProgress) {
				onProgress({
					id: job.id,
					status: 'error',
					progress: 0,
					message: (error as Error).message || 'Conversion failed'
				});
			}
			throw error;
		} finally {
			// Clean up message listener if still attached
			if (worker && messageHandler) {
				worker.removeEventListener('message', messageHandler);
			}
			this.activeJobs.delete(job.id);
			// Clean up metrics
			OptimizedConverter.clearMetrics(job.id);
			// Hint for garbage collection
			if (isLargeFile) {
				OptimizedConverter.requestGarbageCollection();
			}
		}
	}

	private getConverterType(from: string, to: string): string {
		const imageFormats = ['png', 'jpeg', 'jpg', 'webp', 'gif', 'bmp', 'tiff', 'ico', 'pnm'];
		const audioFormats = ['wav', 'flac', 'mp3', 'ogg', 'opus'];
		const archiveFormats = ['zip', '7z', 'tar', 'tgz', 'tbz2', 'txz'];
		const documentFormats = ['pdf', 'docx'];
		const spreadsheetFormats = ['xlsx', 'csv', 'tsv'];
		const textFormats = ['txt', 'md', 'yaml', 'yml', 'xml', 'json', 'html'];

		// PDF conversions should always use document worker, even when converting to image
		if (from === 'pdf' || (to === 'pdf' && documentFormats.includes(from))) {
			return 'document';
		}

		// CSV/TSV conversions should use text worker for JSON conversions
		if ((from === 'csv' || from === 'tsv') && (to === 'json' || to === 'yaml')) return 'text';
		if ((from === 'json' || from === 'yaml') && (to === 'csv' || to === 'tsv')) return 'text';

		// Special routing rules for specific conversions
		if (from === 'md' && to === 'html') return 'document';
		if ((from === 'yaml' || from === 'xml') && to === 'json') return 'spreadsheet';

		// Check both from and to formats for other conversions
		if (imageFormats.includes(from) && imageFormats.includes(to)) return 'image';
		if (audioFormats.includes(from) || audioFormats.includes(to)) return 'audio';
		if (archiveFormats.includes(from) || archiveFormats.includes(to)) return 'archive';
		if (documentFormats.includes(from) || documentFormats.includes(to)) return 'document';
		if (spreadsheetFormats.includes(from) || spreadsheetFormats.includes(to)) return 'spreadsheet';

		// Text-based conversions (txt, html, md, json, yaml, xml) - check this last
		if (textFormats.includes(from) || textFormats.includes(to)) {
			return 'text';
		}

		// For image output from non-image sources, use the source's worker
		if (imageFormats.includes(to)) {
			if (documentFormats.includes(from)) return 'document';
			if (spreadsheetFormats.includes(from)) return 'spreadsheet';
		}

		return 'general';
	}

	cancel(jobId: string): boolean {
		if (this.activeJobs.has(jobId)) {
			// TODO: Implement cancellation logic
			return true;
		}
		return false;
	}

	terminate(): void {
		this.workers.forEach(worker => worker.terminate());
		this.workers.clear();
		this.workerApis.clear();
		this.activeJobs.clear();
	}
}

// Create singleton instance only in browser environment
export const getWorkerManager = () => {
	if (typeof window === 'undefined') {
		// Return a dummy object for SSR
		return null;
	}
	// Create singleton on first call
	if (!(window as any).__workerManager) {
		(window as any).__workerManager = new WorkerManager();
	}
	return (window as any).__workerManager as WorkerManager;
};

export const workerManager = typeof window !== 'undefined' ? getWorkerManager() : null;