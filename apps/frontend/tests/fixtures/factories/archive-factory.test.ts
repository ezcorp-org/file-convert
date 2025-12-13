import { describe, it, expect } from 'vitest';
import { ArchiveFactory } from './archive-factory';
import { MagicByteValidator } from '../validators';
import JSZip from 'jszip';

describe('ArchiveFactory', () => {
	describe('ZIP creation', () => {
		it('generates valid ZIP file with correct magic bytes', async () => {
			const zip = await ArchiveFactory.createZIP();

			// Verify ZIP magic bytes (PK signature)
			const magicResult = await MagicByteValidator.validate(zip, 'zip');
			expect(magicResult.valid).toBe(true);
			expect(magicResult.detectedFormat).toBe('zip');
		});

		it('creates ZIP with default entries that can be extracted', async () => {
			const zip = await ArchiveFactory.createZIP();

			// Extract and verify contents
			const jszip = await JSZip.loadAsync(zip);
			const files = Object.keys(jszip.files);

			expect(files).toContain('file1.txt');
			expect(files).toContain('file2.txt');
			expect(files).toContain('subfolder/file3.txt');

			// Verify content of first file
			const file1 = await jszip.file('file1.txt')?.async('string');
			expect(file1).toBe('Content of file 1');
		});

		it('creates ZIP with custom entries', async () => {
			const zip = await ArchiveFactory.createZIP({
				entries: [
					{ name: 'custom.txt', content: 'Custom content' },
					{ name: 'test/nested.txt', content: 'Nested content' }
				]
			});

			const jszip = await JSZip.loadAsync(zip);
			const files = Object.keys(jszip.files);

			expect(files).toContain('custom.txt');
			expect(files).toContain('test/nested.txt');

			const customFile = await jszip.file('custom.txt')?.async('string');
			expect(customFile).toBe('Custom content');
		});

		it('creates ZIP with STORE compression (no compression)', async () => {
			const zip = await ArchiveFactory.createZIP({
				compression: 'STORE'
			});

			// Should still be a valid ZIP
			const magicResult = await MagicByteValidator.validate(zip, 'zip');
			expect(magicResult.valid).toBe(true);

			// Should be extractable
			const jszip = await JSZip.loadAsync(zip);
			const files = Object.keys(jszip.files);
			expect(files.length).toBeGreaterThan(0);
		});

		it('creates nested folder structure', async () => {
			const zip = await ArchiveFactory.createZIP({
				entries: [{ name: 'a/b/c/file.txt', content: 'Deeply nested' }]
			});

			const jszip = await JSZip.loadAsync(zip);
			const deepFile = await jszip.file('a/b/c/file.txt')?.async('string');
			expect(deepFile).toBe('Deeply nested');
		});
	});

	describe('TAR creation', () => {
		it('generates valid TAR file with ustar magic', () => {
			const tar = ArchiveFactory.createTAR();

			// Verify 'ustar' magic at byte 257
			const ustarMagic = tar.subarray(257, 262).toString('ascii');
			expect(ustarMagic).toBe('ustar');
		});

		it('creates TAR with default entries', () => {
			const tar = ArchiveFactory.createTAR();

			// TAR should contain file headers with names
			const tarString = tar.toString('ascii');
			expect(tarString).toContain('file1.txt');
			expect(tarString).toContain('file2.txt');
			expect(tarString).toContain('subfolder/file3.txt');
		});

		it('creates TAR with custom entries', () => {
			const tar = ArchiveFactory.createTAR({
				entries: [{ name: 'test.txt', content: 'Test content' }]
			});

			const tarString = tar.toString('ascii');
			expect(tarString).toContain('test.txt');
			expect(tarString).toContain('Test content');
		});
	});

	describe('TGZ creation', () => {
		it('generates gzip-compressed TAR with correct magic bytes', async () => {
			const tgz = ArchiveFactory.createTGZ();

			// Verify GZIP magic bytes [0x1f, 0x8b]
			expect(tgz[0]).toBe(0x1f);
			expect(tgz[1]).toBe(0x8b);

			// Verify format detection (TGZ is detected as gzip by file-type)
			const detectedFormat = await MagicByteValidator.detectFormat(tgz);
			expect(detectedFormat).toBe('gz');
		});

		it('creates TGZ smaller than uncompressed TAR', () => {
			const tar = ArchiveFactory.createTAR();
			const tgz = ArchiveFactory.createTGZ();

			// Compressed should be smaller (or at worst, similar size for tiny files)
			expect(tgz.length).toBeLessThanOrEqual(tar.length);
		});
	});

	describe('TBZ2 creation', () => {
		it('generates bzip2-compressed TAR or fallback', async () => {
			const tbz2 = ArchiveFactory.createTBZ2();

			// Should have either bzip2 magic [0x42, 0x5a, 0x68] or gzip magic [0x1f, 0x8b] (fallback)
			const isBzip2 = tbz2[0] === 0x42 && tbz2[1] === 0x5a && tbz2[2] === 0x68;
			const isGzip = tbz2[0] === 0x1f && tbz2[1] === 0x8b;

			expect(isBzip2 || isGzip).toBe(true);
		});
	});

	describe('TXZ creation', () => {
		it('generates xz-compressed TAR or fallback', async () => {
			const txz = ArchiveFactory.createTXZ();

			// Should have either xz magic [0xfd, 0x37, 0x7a, 0x58, 0x5a, 0x00] or gzip magic (fallback)
			const isXz =
				txz[0] === 0xfd &&
				txz[1] === 0x37 &&
				txz[2] === 0x7a &&
				txz[3] === 0x58 &&
				txz[4] === 0x5a &&
				txz[5] === 0x00;
			const isGzip = txz[0] === 0x1f && txz[1] === 0x8b;

			expect(isXz || isGzip).toBe(true);
		});
	});

	describe('createWithFiles convenience method', () => {
		it('creates ZIP from file buffers', async () => {
			const files = {
				'readme.txt': Buffer.from('README content'),
				'data.json': Buffer.from('{"key": "value"}')
			};

			const zip = await ArchiveFactory.createWithFiles(files);

			const jszip = await JSZip.loadAsync(zip);
			const fileList = Object.keys(jszip.files);

			expect(fileList).toContain('readme.txt');
			expect(fileList).toContain('data.json');

			const readme = await jszip.file('readme.txt')?.async('string');
			expect(readme).toBe('README content');
		});
	});

	describe('createVariations', () => {
		it('generates all archive variations', async () => {
			const variations = await ArchiveFactory.createVariations();

			expect(variations.emptyZIP).toBeDefined();
			expect(variations.singleFileZIP).toBeDefined();
			expect(variations.nestedZIP).toBeDefined();
			expect(variations.largeZIP).toBeDefined();
			expect(variations.storedZIP).toBeDefined();
			expect(variations.simpleTAR).toBeDefined();
			expect(variations.simpleTGZ).toBeDefined();
			expect(variations.simpleTBZ2).toBeDefined();
			expect(variations.simpleTXZ).toBeDefined();
		});

		it('emptyZIP has no files', async () => {
			const variations = await ArchiveFactory.createVariations();
			const jszip = await JSZip.loadAsync(variations.emptyZIP);
			const files = Object.keys(jszip.files);

			expect(files.length).toBe(0);
		});

		it('singleFileZIP has exactly one file', async () => {
			const variations = await ArchiveFactory.createVariations();
			const jszip = await JSZip.loadAsync(variations.singleFileZIP);
			const files = Object.keys(jszip.files);

			expect(files.length).toBe(1);
			expect(files[0]).toBe('single.txt');
		});

		it('largeZIP has 100 files', async () => {
			const variations = await ArchiveFactory.createVariations();
			const jszip = await JSZip.loadAsync(variations.largeZIP);
			const files = Object.keys(jszip.files);

			expect(files.length).toBe(100);
		});

		it('all variations are valid files', async () => {
			const variations = await ArchiveFactory.createVariations();

			// ZIP variations should be valid ZIPs
			for (const key of [
				'emptyZIP',
				'singleFileZIP',
				'nestedZIP',
				'largeZIP',
				'storedZIP'
			]) {
				const magicResult = await MagicByteValidator.validate(
					variations[key],
					'zip'
				);
				expect(magicResult.valid).toBe(true);
			}

			// TAR should have ustar magic
			const tar = variations.simpleTAR;
			const ustarMagic = tar.subarray(257, 262).toString('ascii');
			expect(ustarMagic).toBe('ustar');

			// Compressed TARs should have appropriate magic bytes
			expect(variations.simpleTGZ[0]).toBe(0x1f);
			expect(variations.simpleTGZ[1]).toBe(0x8b);
		});
	});
});
