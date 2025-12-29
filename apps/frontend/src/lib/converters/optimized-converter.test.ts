import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OptimizedConverter, MemoryMonitor } from './optimized-converter';

// Mock file-chunker since it won't be available in test environment
vi.mock('../utils/file-chunker.js', () => ({
  FileChunker: {
    readInChunks: vi.fn(async (file: File, onChunk: Function) => {
      const buffer = await file.arrayBuffer();
      await onChunk(buffer, { chunkIndex: 0, totalChunks: 1, chunkSize: file.size, fileSize: file.size });
    }),
    combineChunks: vi.fn((chunks: ArrayBuffer[], mimeType: string) => new Blob(chunks, { type: mimeType }))
  },
  StreamingFileReader: {
    isStreamingSupported: vi.fn(() => false),
    readFileStream: vi.fn()
  }
}));

describe('OptimizedConverter', () => {
  describe('shouldUseOptimizedProcessing', () => {
    it('should return true for files larger than 10MB', () => {
      const file = new File(['x'], 'large.png', { type: 'image/png' });
      Object.defineProperty(file, 'size', { value: 11 * 1024 * 1024 });
      expect(OptimizedConverter.shouldUseOptimizedProcessing(file)).toBe(true);
    });

    it('should return false for files smaller than 10MB', () => {
      const file = new File(['x'], 'small.png', { type: 'image/png' });
      Object.defineProperty(file, 'size', { value: 5 * 1024 * 1024 });
      expect(OptimizedConverter.shouldUseOptimizedProcessing(file)).toBe(false);
    });

    it('should return false for exactly 10MB', () => {
      const file = new File(['x'], 'exact.png', { type: 'image/png' });
      Object.defineProperty(file, 'size', { value: 10 * 1024 * 1024 });
      expect(OptimizedConverter.shouldUseOptimizedProcessing(file)).toBe(false);
    });
  });

  describe('performance monitoring', () => {
    beforeEach(() => {
      vi.spyOn(performance, 'now')
        .mockReturnValueOnce(1000) // startPerformanceMonitoring
        .mockReturnValueOnce(2000); // endPerformanceMonitoring
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should track start and end times', () => {
      OptimizedConverter.startPerformanceMonitoring('test-job');
      const metrics = OptimizedConverter.endPerformanceMonitoring('test-job', 1024 * 1024);

      expect(metrics).toBeDefined();
      expect(metrics!.startTime).toBe(1000);
      expect(metrics!.endTime).toBe(2000);
      expect(metrics!.processingTimeMs).toBe(1000);
    });

    it('should calculate throughput in MB/s', () => {
      OptimizedConverter.startPerformanceMonitoring('throughput-job');
      const fileSizeBytes = 10 * 1024 * 1024; // 10MB
      const metrics = OptimizedConverter.endPerformanceMonitoring('throughput-job', fileSizeBytes);

      expect(metrics!.throughputMBps).toBe(10); // 10MB in 1 second
    });

    it('should return undefined for unknown job', () => {
      const metrics = OptimizedConverter.endPerformanceMonitoring('unknown-job', 1024);
      expect(metrics).toBeUndefined();
    });
  });

  describe('clearMetrics', () => {
    it('should remove metrics for a job', () => {
      vi.spyOn(performance, 'now').mockReturnValue(1000);
      OptimizedConverter.startPerformanceMonitoring('clear-job');
      OptimizedConverter.clearMetrics('clear-job');
      const metrics = OptimizedConverter.endPerformanceMonitoring('clear-job', 1024);
      expect(metrics).toBeUndefined();
      vi.restoreAllMocks();
    });
  });

  describe('requestGarbageCollection', () => {
    it('should call gc if available', () => {
      const gcFn = vi.fn();
      (globalThis as any).gc = gcFn;
      OptimizedConverter.requestGarbageCollection();
      expect(gcFn).toHaveBeenCalled();
      delete (globalThis as any).gc;
    });

    it('should not throw if gc is unavailable', () => {
      delete (globalThis as any).gc;
      expect(() => OptimizedConverter.requestGarbageCollection()).not.toThrow();
    });
  });

  describe('processInChunks', () => {
    it('should process file through chunk processor', async () => {
      const { FileChunker } = await import('../utils/file-chunker.js');
      const file = new File(['hello world'], 'test.txt', { type: 'text/plain' });
      const processor = vi.fn(async (chunk: ArrayBuffer) => chunk);

      const result = await OptimizedConverter.processInChunks(file, processor);

      expect(FileChunker.readInChunks).toHaveBeenCalled();
      expect(result).toBeInstanceOf(Blob);
    });

    it('should report progress', async () => {
      const file = new File(['data'], 'test.txt', { type: 'text/plain' });
      const processor = vi.fn(async (chunk: ArrayBuffer) => chunk);
      const onProgress = vi.fn();

      await OptimizedConverter.processInChunks(file, processor, onProgress);

      expect(onProgress).toHaveBeenCalledWith(100);
    });
  });

  describe('processWithStreaming', () => {
    it('should throw if streaming is not supported', async () => {
      const file = new File(['data'], 'test.txt', { type: 'text/plain' });
      const processor = vi.fn(async (chunk: Uint8Array) => chunk);

      await expect(
        OptimizedConverter.processWithStreaming(file, processor)
      ).rejects.toThrow('Streaming not supported');
    });
  });
});

describe('MemoryMonitor', () => {
  describe('getMemoryUsagePercentage', () => {
    it('should return 0.5 as default when performance.memory unavailable', () => {
      // jsdom doesn't have performance.memory
      expect(MemoryMonitor.getMemoryUsagePercentage()).toBe(0.5);
    });
  });

  describe('isMemorySafe', () => {
    it('should return true when usage is below warning threshold', () => {
      // Default 0.5 is below 0.7 warning threshold
      expect(MemoryMonitor.isMemorySafe()).toBe(true);
    });
  });

  describe('getMemoryStatus', () => {
    it('should return safe when usage is below warning threshold', () => {
      // Default is 0.5 which is below 0.7
      expect(MemoryMonitor.getMemoryStatus()).toBe('safe');
    });
  });

  describe('waitForMemory', () => {
    it('should resolve immediately when memory is safe', async () => {
      await expect(MemoryMonitor.waitForMemory(1000)).resolves.toBeUndefined();
    });
  });
});
