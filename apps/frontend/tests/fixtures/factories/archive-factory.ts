import JSZip from 'jszip';
import { gzipSync } from 'zlib';
import { execSync } from 'child_process';

export interface ArchiveEntry {
	name: string;
	content: Buffer | string;
}

export interface ArchiveFixtureOptions {
	entries?: ArchiveEntry[]; // Files to include
	format?: 'zip' | 'tar' | 'tgz' | 'tbz2' | 'txz'; // default: 'zip'
	compression?: 'STORE' | 'DEFLATE'; // ZIP only, default: 'DEFLATE'
}

// Default entries for quick test archive
const DEFAULT_ENTRIES: ArchiveEntry[] = [
	{ name: 'file1.txt', content: 'Content of file 1' },
	{ name: 'file2.txt', content: 'Content of file 2' },
	{ name: 'subfolder/file3.txt', content: 'Content in subfolder' }
];

/**
 * Factory for generating synthetic test archives
 * Supports ZIP, TAR, TGZ, TBZ2, TXZ formats
 */
export class ArchiveFactory {
	/**
	 * Create a ZIP archive
	 * @param options - Archive configuration options
	 * @returns Buffer containing valid ZIP file
	 */
	static async createZIP(options?: ArchiveFixtureOptions): Promise<Buffer> {
		const zip = new JSZip();
		const entries = options?.entries ?? DEFAULT_ENTRIES;
		const compression = options?.compression ?? 'DEFLATE';

		for (const entry of entries) {
			zip.file(entry.name, entry.content, {
				compression: compression
			});
		}

		const buffer = await zip.generateAsync({
			type: 'nodebuffer',
			compression: compression
		});

		return buffer;
	}

	/**
	 * Create a TAR archive (uncompressed)
	 * @param options - Archive configuration options
	 * @returns Buffer containing valid TAR file
	 */
	static createTAR(options?: ArchiveFixtureOptions): Buffer {
		// TAR format: 512-byte header per file + content (padded to 512 bytes)
		const entries = options?.entries ?? DEFAULT_ENTRIES;
		const chunks: Buffer[] = [];

		for (const entry of entries) {
			const content =
				typeof entry.content === 'string'
					? Buffer.from(entry.content, 'utf-8')
					: entry.content;

			// Create TAR header (512 bytes)
			const header = Buffer.alloc(512);

			// File name (0-99)
			header.write(entry.name, 0, Math.min(entry.name.length, 100), 'utf-8');

			// File mode (100-107): 0644 in octal
			header.write('0000644', 100, 7, 'utf-8');

			// UID/GID (108-123): 0
			header.write('0000000', 108, 7, 'utf-8');
			header.write('0000000', 116, 7, 'utf-8');

			// File size (124-135) in octal
			const sizeOctal = content.length.toString(8).padStart(11, '0');
			header.write(sizeOctal, 124, 11, 'utf-8');

			// Mtime (136-147): current time in octal
			const mtime = Math.floor(Date.now() / 1000)
				.toString(8)
				.padStart(11, '0');
			header.write(mtime, 136, 11, 'utf-8');

			// Checksum placeholder (148-155): spaces initially
			header.fill(' ', 148, 156);

			// Type flag (156): '0' for regular file
			header.write('0', 156, 1, 'utf-8');

			// USTAR magic (257-262)
			header.write('ustar', 257, 5, 'utf-8');

			// Calculate and write checksum
			let checksum = 0;
			for (let i = 0; i < 512; i++) {
				checksum += header[i];
			}
			header.write(checksum.toString(8).padStart(6, '0') + '\0 ', 148, 8, 'utf-8');

			chunks.push(header);

			// Add content (padded to 512-byte boundary)
			chunks.push(content);
			const padding = 512 - (content.length % 512);
			if (padding < 512) {
				chunks.push(Buffer.alloc(padding));
			}
		}

		// End of archive: two 512-byte zero blocks
		chunks.push(Buffer.alloc(1024));

		return Buffer.concat(chunks);
	}

	/**
	 * Create a TGZ (gzip-compressed TAR) archive
	 * @param options - Archive configuration options
	 * @returns Buffer containing valid TGZ file
	 */
	static createTGZ(options?: ArchiveFixtureOptions): Buffer {
		const tar = this.createTAR(options);
		return gzipSync(tar);
	}

	/**
	 * Create a TBZ2 (bzip2-compressed TAR) archive
	 * @param options - Archive configuration options
	 * @returns Buffer containing valid TBZ2 file (or gzip fallback if bzip2 unavailable)
	 */
	static createTBZ2(options?: ArchiveFixtureOptions): Buffer {
		const tar = this.createTAR(options);
		try {
			// Try native bzip2 command
			const result = execSync('bzip2 -c', {
				input: tar,
				maxBuffer: 50 * 1024 * 1024
			});
			return result;
		} catch {
			// Fallback: return gzip-compressed tar
			console.warn('bzip2 not available, returning gzip-compressed tar as fallback');
			return gzipSync(tar);
		}
	}

	/**
	 * Create a TXZ (xz-compressed TAR) archive
	 * @param options - Archive configuration options
	 * @returns Buffer containing valid TXZ file (or gzip fallback if xz unavailable)
	 */
	static createTXZ(options?: ArchiveFixtureOptions): Buffer {
		const tar = this.createTAR(options);
		try {
			const result = execSync('xz -c', {
				input: tar,
				maxBuffer: 50 * 1024 * 1024
			});
			return result;
		} catch {
			console.warn('xz not available, returning gzip-compressed tar as fallback');
			return gzipSync(tar);
		}
	}

	/**
	 * Create an archive with the specified format
	 * @param options - Archive configuration options
	 * @returns Buffer containing archive file
	 */
	static async create(options?: ArchiveFixtureOptions): Promise<Buffer> {
		switch (options?.format ?? 'zip') {
			case 'zip':
				return this.createZIP(options);
			case 'tar':
				return Promise.resolve(this.createTAR(options));
			case 'tgz':
				return Promise.resolve(this.createTGZ(options));
			case 'tbz2':
				return Promise.resolve(this.createTBZ2(options));
			case 'txz':
				return Promise.resolve(this.createTXZ(options));
		}
	}

	/**
	 * Convenience method for creating ZIP with file buffers
	 * @param files - Record of filename to buffer
	 * @returns Buffer containing ZIP archive
	 */
	static async createWithFiles(files: Record<string, Buffer>): Promise<Buffer> {
		const entries: ArchiveEntry[] = Object.entries(files).map(([name, content]) => ({
			name,
			content
		}));
		return this.createZIP({ entries });
	}

	/**
	 * Create a set of edge case archives for comprehensive testing
	 * @returns Object with named archive variations
	 */
	static async createVariations(): Promise<Record<string, Buffer>> {
		return {
			emptyZIP: await this.createZIP({ entries: [] }),
			singleFileZIP: await this.createZIP({
				entries: [{ name: 'single.txt', content: 'Single file' }]
			}),
			nestedZIP: await this.createZIP({
				entries: [{ name: 'a/b/c/file.txt', content: 'Deeply nested' }]
			}),
			largeZIP: await this.createZIP({
				entries: Array.from({ length: 100 }, (_, i) => ({
					name: `file${i}.txt`,
					content: `Content ${i}`
				}))
			}),
			storedZIP: await this.createZIP({
				compression: 'STORE'
			}),
			simpleTAR: this.createTAR(),
			simpleTGZ: this.createTGZ(),
			simpleTBZ2: this.createTBZ2(),
			simpleTXZ: this.createTXZ()
		};
	}
}
