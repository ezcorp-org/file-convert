import { FileChunker, StreamingFileReader } from '../utils/file-chunker.js';
import type { ConversionJob, ConversionResult, ConversionProgress } from '$lib/workers/worker-manager';

/**
 * Performance metrics for monitoring conversion performance
 */
export interface PerformanceMetrics {
	startTime: number;
	endTime?: number;
	memoryUsageMB?: number;
	processingTimeMs?: number;
	throughputMBps?: number;
}

/**
 * Optimized converter with performance enhancements
 */
export class OptimizedConverter {
	private static readonly LARGE_FILE_THRESHOLD = 10 * 1024 * 1024; // 10MB
	private static performanceMetrics = new Map<string, PerformanceMetrics>();
	
	/**
	 * Check if file should use optimized processing
	 */
	static shouldUseOptimizedProcessing(file: File): boolean {
		return file.size > this.LARGE_FILE_THRESHOLD;
	}
	
	/**
	 * Get memory usage (if available)
	 */
	private static getMemoryUsage(): number | undefined {
		if (typeof performance !== 'undefined' && 'memory' in performance) {
			const memInfo = (performance as any).memory;
			if (memInfo && memInfo.usedJSHeapSize) {
				return memInfo.usedJSHeapSize / (1024 * 1024); // Convert to MB
			}
		}
		return undefined;
	}
	
	/**
	 * Start performance monitoring
	 */
	static startPerformanceMonitoring(jobId: string): void {
		this.performanceMetrics.set(jobId, {
			startTime: performance.now(),
			memoryUsageMB: this.getMemoryUsage()
		});
	}
	
	/**
	 * End performance monitoring and calculate metrics
	 */
	static endPerformanceMonitoring(jobId: string, fileSize: number): PerformanceMetrics | undefined {
		const metrics = this.performanceMetrics.get(jobId);
		if (!metrics) return undefined;
		
		metrics.endTime = performance.now();
		metrics.processingTimeMs = metrics.endTime - metrics.startTime;
		
		// Calculate throughput
		const fileSizeMB = fileSize / (1024 * 1024);
		const processingTimeSec = metrics.processingTimeMs / 1000;
		metrics.throughputMBps = fileSizeMB / processingTimeSec;
		
		// Update memory usage
		const currentMemory = this.getMemoryUsage();
		if (currentMemory && metrics.memoryUsageMB) {
			metrics.memoryUsageMB = currentMemory - metrics.memoryUsageMB;
		}
		
		return metrics;
	}
	
	/**
	 * Optimize image conversion for large files
	 */
	static async optimizeImageConversion(
		file: File,
		targetFormat: string,
		onProgress?: (progress: number) => void
	): Promise<Blob> {
		// For very large images, consider resizing first
		const MAX_DIMENSION = 4096;
		
		return new Promise(async (resolve, reject) => {
			try {
				const bitmap = await createImageBitmap(file);
				
				// Calculate optimal dimensions
				let width = bitmap.width;
				let height = bitmap.height;
				
				if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
					const scale = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
					width = Math.floor(width * scale);
					height = Math.floor(height * scale);
					
					if (onProgress) onProgress(20);
				}
				
				// Create canvas with optimal size
				const canvas = new OffscreenCanvas(width, height);
				const ctx = canvas.getContext('2d');
				
				if (!ctx) {
					throw new Error('Failed to get canvas context');
				}
				
				// Draw with optimal settings
				ctx.imageSmoothingEnabled = true;
				ctx.imageSmoothingQuality = 'high';
				ctx.drawImage(bitmap, 0, 0, width, height);
				
				if (onProgress) onProgress(60);
				
				// Convert with optimal quality settings
				const quality = this.getOptimalQuality(targetFormat, file.size);
				const mimeType = this.getMimeType(targetFormat);
				
				const blob = await canvas.convertToBlob({
					type: mimeType,
					quality
				});
				
				if (onProgress) onProgress(100);
				
				// Clean up
				bitmap.close();
				
				resolve(blob);
			} catch (error) {
				reject(error);
			}
		});
	}
	
	/**
	 * Get optimal quality based on format and file size
	 */
	private static getOptimalQuality(format: string, fileSize: number): number {
		const isLargeFile = fileSize > 5 * 1024 * 1024; // 5MB
		
		switch (format.toLowerCase()) {
			case 'jpeg':
			case 'jpg':
				return isLargeFile ? 0.8 : 0.85;
			case 'webp':
				return isLargeFile ? 0.8 : 0.9;
			default:
				return 0.9;
		}
	}
	
	/**
	 * Get MIME type for format
	 */
	private static getMimeType(format: string): string {
		const mimeTypes: Record<string, string> = {
			'png': 'image/png',
			'jpeg': 'image/jpeg',
			'jpg': 'image/jpeg',
			'webp': 'image/webp',
			'bmp': 'image/bmp'
		};
		return mimeTypes[format.toLowerCase()] || 'image/png';
	}
	
	/**
	 * Process file in chunks for memory efficiency
	 */
	static async processInChunks(
		file: File,
		processor: (chunk: ArrayBuffer) => Promise<ArrayBuffer>,
		onProgress?: (progress: number) => void
	): Promise<Blob> {
		const chunks: ArrayBuffer[] = [];
		let processedChunks = 0;
		
		await FileChunker.readInChunks(
			file,
			async (chunk, metadata) => {
				const processed = await processor(chunk);
				chunks.push(processed);
				
				processedChunks++;
				if (onProgress) {
					const progress = (processedChunks / metadata.totalChunks) * 100;
					onProgress(progress);
				}
			}
		);
		
		return FileChunker.combineChunks(chunks, file.type);
	}
	
	/**
	 * Use streaming for supported formats
	 */
	static async processWithStreaming(
		file: File,
		processor: (chunk: Uint8Array) => Promise<Uint8Array>,
		onProgress?: (progress: number) => void
	): Promise<Blob> {
		if (!StreamingFileReader.isStreamingSupported()) {
			throw new Error('Streaming not supported');
		}
		
		const chunks: Uint8Array[] = [];
		
		await StreamingFileReader.readFileStream(
			file,
			async (chunk) => {
				const processed = await processor(chunk);
				chunks.push(processed);
			},
			onProgress
		);
		
		return new Blob(chunks as BlobPart[], { type: file.type });
	}
	
	/**
	 * Garbage collection hint
	 */
	static requestGarbageCollection(): void {
		// This is a hint to the browser - actual GC is not guaranteed
		if (typeof (globalThis as any).gc === 'function') {
			(globalThis as any).gc();
		}
	}
	
	/**
	 * Clear performance metrics for a job
	 */
	static clearMetrics(jobId: string): void {
		this.performanceMetrics.delete(jobId);
	}
}

/**
 * Memory monitor to prevent OOM errors
 */
export class MemoryMonitor {
	private static readonly WARNING_THRESHOLD = 0.7; // 70% memory usage
	private static readonly CRITICAL_THRESHOLD = 0.85; // 85% memory usage
	
	/**
	 * Check if memory usage is safe
	 */
	static isMemorySafe(): boolean {
		const usage = this.getMemoryUsagePercentage();
		return usage < this.WARNING_THRESHOLD;
	}
	
	/**
	 * Get current memory usage percentage
	 */
	static getMemoryUsagePercentage(): number {
		if (typeof performance !== 'undefined' && 'memory' in performance) {
			const memInfo = (performance as any).memory;
			if (memInfo && memInfo.jsHeapSizeLimit && memInfo.usedJSHeapSize) {
				return memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit;
			}
		}
		return 0.5; // Conservative default
	}
	
	/**
	 * Wait for memory to be available
	 */
	static async waitForMemory(timeoutMs: number = 5000): Promise<void> {
		const startTime = Date.now();
		
		while (!this.isMemorySafe()) {
			if (Date.now() - startTime > timeoutMs) {
				throw new Error('Memory timeout - system under high memory pressure');
			}
			
			// Request GC and wait
			OptimizedConverter.requestGarbageCollection();
			await new Promise(resolve => setTimeout(resolve, 100));
		}
	}
	
	/**
	 * Get memory status
	 */
	static getMemoryStatus(): 'safe' | 'warning' | 'critical' {
		const usage = this.getMemoryUsagePercentage();
		
		if (usage >= this.CRITICAL_THRESHOLD) return 'critical';
		if (usage >= this.WARNING_THRESHOLD) return 'warning';
		return 'safe';
	}
}