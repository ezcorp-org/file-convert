import { describe, it, expect } from 'vitest';
import { FileChunker, StreamingFileReader } from './file-chunker';

function createMockFile(size: number, name = 'test.bin', type = 'application/octet-stream'): File {
	const buffer = new ArrayBuffer(size);
	const view = new Uint8Array(buffer);
	for (let i = 0; i < size; i++) {
		view[i] = i % 256;
	}
	return new File([buffer], name, { type });
}

describe('FileChunker', () => {
	describe('getOptimalChunkSize', () => {
		it('should return file size for files under 10MB', () => {
			const size = 5 * 1024 * 1024; // 5MB
			expect(FileChunker.getOptimalChunkSize(size)).toBe(size);
		});

		it('should return default chunk size for files between 10MB and 50MB', () => {
			const size = 30 * 1024 * 1024; // 30MB
			expect(FileChunker.getOptimalChunkSize(size)).toBe(2 * 1024 * 1024); // 2MB default
		});

		it('should cap chunk size at MAX_CHUNK_SIZE for very large files', () => {
			const size = 500 * 1024 * 1024; // 500MB
			const chunkSize = FileChunker.getOptimalChunkSize(size);
			expect(chunkSize).toBeLessThanOrEqual(10 * 1024 * 1024); // 10MB max
		});

		it('should return at least DEFAULT_CHUNK_SIZE for large files', () => {
			const size = 60 * 1024 * 1024; // 60MB
			const chunkSize = FileChunker.getOptimalChunkSize(size);
			expect(chunkSize).toBeGreaterThanOrEqual(2 * 1024 * 1024); // 2MB default
		});

		it('should return file size for zero-length file', () => {
			expect(FileChunker.getOptimalChunkSize(0)).toBe(0);
		});
	});

	describe('readInChunks', () => {
		it('should read a small file as a single chunk', async () => {
			const file = createMockFile(100);
			const chunks: ArrayBuffer[] = [];
			const metadatas: any[] = [];

			await FileChunker.readInChunks(file, async (chunk, metadata) => {
				chunks.push(chunk);
				metadatas.push(metadata);
			});

			expect(chunks).toHaveLength(1);
			expect(metadatas[0].chunkIndex).toBe(0);
			expect(metadatas[0].totalChunks).toBe(1);
			expect(metadatas[0].fileSize).toBe(100);
			expect(metadatas[0].chunkSize).toBe(100);
		});

		it('should split file into multiple chunks with explicit chunk size', async () => {
			const file = createMockFile(1000);
			const chunks: ArrayBuffer[] = [];

			await FileChunker.readInChunks(file, async (chunk) => {
				chunks.push(chunk);
			}, undefined, 400);

			expect(chunks).toHaveLength(3); // 400 + 400 + 200
			expect(chunks[0].byteLength).toBe(400);
			expect(chunks[1].byteLength).toBe(400);
			expect(chunks[2].byteLength).toBe(200);
		});

		it('should report progress', async () => {
			const file = createMockFile(1000);
			const progressValues: number[] = [];

			await FileChunker.readInChunks(
				file,
				async () => {},
				(progress) => progressValues.push(progress),
				500
			);

			expect(progressValues).toHaveLength(2);
			expect(progressValues[0]).toBeCloseTo(50);
			expect(progressValues[1]).toBeCloseTo(100);
		});

		it('should handle empty file', async () => {
			const file = createMockFile(0);
			const chunks: ArrayBuffer[] = [];

			await FileChunker.readInChunks(file, async (chunk) => {
				chunks.push(chunk);
			}, undefined, 100);

			// Math.ceil(0 / 100) = 0, so no chunks
			expect(chunks).toHaveLength(0);
		});
	});

	describe('streamFile', () => {
		it('should yield all chunks with progress', async () => {
			const file = createMockFile(1000);
			const results: { data: ArrayBuffer; progress: number }[] = [];

			for await (const chunk of FileChunker.streamFile(file, 400)) {
				results.push(chunk);
			}

			expect(results).toHaveLength(3);
			expect(results[0].data.byteLength).toBe(400);
			expect(results[2].progress).toBeCloseTo(100);
		});

		it('should yield nothing for empty file', async () => {
			const file = createMockFile(0);
			const results: any[] = [];

			for await (const chunk of FileChunker.streamFile(file, 100)) {
				results.push(chunk);
			}

			expect(results).toHaveLength(0);
		});
	});

	describe('combineChunks', () => {
		it('should combine chunks into a blob with correct type', () => {
			const chunk1 = new ArrayBuffer(10);
			const chunk2 = new ArrayBuffer(20);
			const blob = FileChunker.combineChunks([chunk1, chunk2], 'image/png');

			expect(blob.size).toBe(30);
			expect(blob.type).toBe('image/png');
		});

		it('should handle empty array', () => {
			const blob = FileChunker.combineChunks([], 'text/plain');
			expect(blob.size).toBe(0);
		});
	});

	describe('calculateChecksum', () => {
		it('should return a hex string', async () => {
			const buffer = new ArrayBuffer(16);
			new Uint8Array(buffer).set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);

			const checksum = await FileChunker.calculateChecksum(buffer);
			expect(checksum).toMatch(/^[0-9a-f]+$/);
		});

		it('should produce consistent checksums for same data', async () => {
			const buffer1 = new Uint8Array([10, 20, 30]).buffer;
			const buffer2 = new Uint8Array([10, 20, 30]).buffer;

			const c1 = await FileChunker.calculateChecksum(buffer1);
			const c2 = await FileChunker.calculateChecksum(buffer2);
			expect(c1).toBe(c2);
		});

		it('should produce different checksums for different data', async () => {
			const buffer1 = new Uint8Array([1, 2, 3]).buffer;
			const buffer2 = new Uint8Array([4, 5, 6]).buffer;

			const c1 = await FileChunker.calculateChecksum(buffer1);
			const c2 = await FileChunker.calculateChecksum(buffer2);
			expect(c1).not.toBe(c2);
		});

		it('should handle empty buffer', async () => {
			const buffer = new ArrayBuffer(0);
			const checksum = await FileChunker.calculateChecksum(buffer);
			expect(checksum).toBe('0');
		});
	});
});

describe('StreamingFileReader', () => {
	describe('isStreamingSupported', () => {
		it('should return a boolean', () => {
			const result = StreamingFileReader.isStreamingSupported();
			expect(typeof result).toBe('boolean');
		});
	});
});
