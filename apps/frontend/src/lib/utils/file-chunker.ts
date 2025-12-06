/**
 * File chunking utilities for handling large files efficiently
 */

export interface ChunkMetadata {
	chunkIndex: number;
	totalChunks: number;
	chunkSize: number;
	fileSize: number;
	checksum?: string;
}

export class FileChunker {
	private static readonly DEFAULT_CHUNK_SIZE = 1024 * 1024 * 2; // 2MB chunks
	private static readonly MAX_CHUNK_SIZE = 1024 * 1024 * 10; // 10MB max
	private static readonly MIN_CHUNK_SIZE = 1024 * 256; // 256KB min
	
	/**
	 * Determine optimal chunk size based on file size and available memory
	 */
	static getOptimalChunkSize(fileSize: number): number {
		// Estimate available memory (conservative approach)
		const estimatedMemory = this.getEstimatedAvailableMemory();
		
		// Use smaller chunks for limited memory
		if (estimatedMemory < 500 * 1024 * 1024) { // Less than 500MB
			return this.MIN_CHUNK_SIZE;
		}
		
		// Calculate based on file size
		if (fileSize < 10 * 1024 * 1024) { // Less than 10MB
			return fileSize; // Process in one chunk
		} else if (fileSize < 50 * 1024 * 1024) { // Less than 50MB
			return this.DEFAULT_CHUNK_SIZE;
		} else {
			// For larger files, use bigger chunks but respect max size
			const idealChunkSize = Math.ceil(fileSize / 20); // Aim for ~20 chunks
			return Math.min(this.MAX_CHUNK_SIZE, Math.max(this.DEFAULT_CHUNK_SIZE, idealChunkSize));
		}
	}
	
	/**
	 * Estimate available memory (conservative)
	 */
	private static getEstimatedAvailableMemory(): number {
		if (typeof performance !== 'undefined' && 'memory' in performance) {
			const memInfo = (performance as any).memory;
			if (memInfo && memInfo.jsHeapSizeLimit && memInfo.usedJSHeapSize) {
				return memInfo.jsHeapSizeLimit - memInfo.usedJSHeapSize;
			}
		}
		// Default conservative estimate
		return 1024 * 1024 * 1024; // 1GB
	}
	
	/**
	 * Read file in chunks with progress callback
	 */
	static async readInChunks(
		file: File,
		onChunk: (chunk: ArrayBuffer, metadata: ChunkMetadata) => Promise<void>,
		onProgress?: (progress: number) => void,
		chunkSize?: number
	): Promise<void> {
		const actualChunkSize = chunkSize || this.getOptimalChunkSize(file.size);
		const totalChunks = Math.ceil(file.size / actualChunkSize);
		
		for (let i = 0; i < totalChunks; i++) {
			const start = i * actualChunkSize;
			const end = Math.min(start + actualChunkSize, file.size);
			const chunk = file.slice(start, end);
			
			const arrayBuffer = await chunk.arrayBuffer();
			
			const metadata: ChunkMetadata = {
				chunkIndex: i,
				totalChunks,
				chunkSize: end - start,
				fileSize: file.size
			};
			
			await onChunk(arrayBuffer, metadata);
			
			if (onProgress) {
				const progress = ((i + 1) / totalChunks) * 100;
				onProgress(progress);
			}
		}
	}
	
	/**
	 * Process file with streaming (for formats that support it)
	 */
	static async* streamFile(
		file: File,
		chunkSize?: number
	): AsyncGenerator<{ data: ArrayBuffer; progress: number }> {
		const actualChunkSize = chunkSize || this.getOptimalChunkSize(file.size);
		const totalChunks = Math.ceil(file.size / actualChunkSize);
		
		for (let i = 0; i < totalChunks; i++) {
			const start = i * actualChunkSize;
			const end = Math.min(start + actualChunkSize, file.size);
			const chunk = file.slice(start, end);
			
			const data = await chunk.arrayBuffer();
			const progress = ((i + 1) / totalChunks) * 100;
			
			yield { data, progress };
		}
	}
	
	/**
	 * Combine chunks back into a single blob
	 */
	static combineChunks(chunks: ArrayBuffer[], mimeType: string): Blob {
		return new Blob(chunks, { type: mimeType });
	}
	
	/**
	 * Calculate simple checksum for verification
	 */
	static async calculateChecksum(data: ArrayBuffer): Promise<string> {
		const view = new Uint8Array(data);
		let hash = 0;
		
		for (let i = 0; i < view.length; i++) {
			hash = ((hash << 5) - hash) + view[i];
			hash = hash & hash; // Convert to 32-bit integer
		}
		
		return Math.abs(hash).toString(16);
	}
}

/**
 * Memory-efficient file reader using streams API (where available)
 */
export class StreamingFileReader {
	/**
	 * Check if Streams API is available
	 */
	static isStreamingSupported(): boolean {
		return typeof ReadableStream !== 'undefined' && 
		       typeof File.prototype.stream === 'function';
	}
	
	/**
	 * Read file using Streams API for better memory efficiency
	 */
	static async readFileStream(
		file: File,
		onData: (chunk: Uint8Array) => Promise<void>,
		onProgress?: (progress: number) => void
	): Promise<void> {
		if (!this.isStreamingSupported()) {
			throw new Error('Streaming not supported in this browser');
		}
		
		const stream = file.stream();
		const reader = stream.getReader();
		
		let bytesRead = 0;
		const totalSize = file.size;
		
		try {
			while (true) {
				const { done, value } = await reader.read();
				
				if (done) break;
				
				await onData(value);
				
				bytesRead += value.length;
				if (onProgress) {
					const progress = (bytesRead / totalSize) * 100;
					onProgress(progress);
				}
			}
		} finally {
			reader.releaseLock();
		}
	}
}

/**
 * Web Worker pool for parallel processing
 */
export class WorkerPool {
	private workers: Worker[] = [];
	private queue: Array<() => void> = [];
	private activeWorkers = 0;
	
	constructor(
		private workerScript: string,
		private maxWorkers: number = navigator.hardwareConcurrency || 4
	) {
		this.initializeWorkers();
	}
	
	private initializeWorkers(): void {
		for (let i = 0; i < this.maxWorkers; i++) {
			const worker = new Worker(this.workerScript);
			this.workers.push(worker);
		}
	}
	
	async execute<T>(task: any): Promise<T> {
		return new Promise((resolve, reject) => {
			const executeTask = () => {
				const worker = this.workers.pop();
				if (!worker) {
					this.queue.push(executeTask);
					return;
				}
				
				this.activeWorkers++;
				
				const handleMessage = (event: MessageEvent) => {
					worker.removeEventListener('message', handleMessage);
					worker.removeEventListener('error', handleError);
					
					this.workers.push(worker);
					this.activeWorkers--;
					
					// Process queue
					if (this.queue.length > 0) {
						const next = this.queue.shift();
						next?.();
					}
					
					resolve(event.data);
				};
				
				const handleError = (error: ErrorEvent) => {
					worker.removeEventListener('message', handleMessage);
					worker.removeEventListener('error', handleError);
					
					this.workers.push(worker);
					this.activeWorkers--;
					
					// Process queue
					if (this.queue.length > 0) {
						const next = this.queue.shift();
						next?.();
					}
					
					reject(error);
				};
				
				worker.addEventListener('message', handleMessage);
				worker.addEventListener('error', handleError);
				worker.postMessage(task);
			};
			
			executeTask();
		});
	}
	
	terminate(): void {
		this.workers.forEach(worker => worker.terminate());
		this.workers = [];
		this.queue = [];
	}
}