import { describe, it, expect } from 'vitest';
import { validateFileType, validateFileComplete, generateAcceptAttribute, validateTextFormat } from './file-validation';

function createFile(name: string, content: Uint8Array | string = '', type = ''): File {
	const data = typeof content === 'string' ? new TextEncoder().encode(content) : content;
	return new File([data], name, { type });
}

function pngBytes(): Uint8Array {
	return new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, ...new Array(100).fill(0)]);
}

function jpegBytes(): Uint8Array {
	return new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, ...new Array(100).fill(0)]);
}

function pdfBytes(): Uint8Array {
	return new Uint8Array([0x25, 0x50, 0x44, 0x46, ...new Array(100).fill(0)]);
}

function gifBytes(): Uint8Array {
	// GIF89a
	return new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, ...new Array(100).fill(0)]);
}

describe('validateFileType', () => {
	describe('extension validation', () => {
		it('should reject files without an extension', async () => {
			const file = createFile('noextension', 'data');
			const result = await validateFileType(file);
			expect(result.isValid).toBe(false);
			expect(result.reason).toBe('File must have an extension');
			expect(result.isSupportedFormat).toBe(false);
		});

		it('should reject unsupported extensions', async () => {
			const file = createFile('test.xyz', 'data');
			const result = await validateFileType(file);
			expect(result.isValid).toBe(false);
			expect(result.reason).toContain('.xyz');
			expect(result.isSupportedFormat).toBe(false);
		});

		it('should accept supported extensions with valid signatures', async () => {
			const file = createFile('image.png', pngBytes(), 'image/png');
			const result = await validateFileType(file);
			expect(result.isValid).toBe(true);
			expect(result.isSupportedFormat).toBe(true);
		});
	});

	describe('MIME type validation', () => {
		it('should accept files with matching MIME type', async () => {
			const file = createFile('photo.jpg', jpegBytes(), 'image/jpeg');
			const result = await validateFileType(file);
			expect(result.isValid).toBe(true);
		});

		it('should accept files with empty MIME type (browser may not set it)', async () => {
			const file = createFile('photo.png', pngBytes(), '');
			const result = await validateFileType(file);
			expect(result.isValid).toBe(true);
		});

		it('should reject files with category-mismatched MIME type for large files', async () => {
			// An audio MIME type on a .png file (large enough to trigger check)
			const file = createFile('fake.png', new Uint8Array(200), 'audio/mpeg');
			const result = await validateFileType(file);
			expect(result.isValid).toBe(false);
			expect(result.reason).toContain('audio');
		});

		it('should be lenient with MIME mismatch for small files (<=10 bytes)', async () => {
			const file = createFile('tiny.png', new Uint8Array(5), 'audio/mpeg');
			const result = await validateFileType(file);
			// Small files skip signature check and are lenient on MIME
			expect(result.isValid).toBe(true);
		});
	});

	describe('magic number / signature validation', () => {
		it('should accept PNG with valid signature', async () => {
			const file = createFile('test.png', pngBytes(), 'image/png');
			const result = await validateFileType(file);
			expect(result.isValid).toBe(true);
		});

		it('should accept JPEG with valid signature', async () => {
			const file = createFile('test.jpg', jpegBytes(), 'image/jpeg');
			const result = await validateFileType(file);
			expect(result.isValid).toBe(true);
		});

		it('should accept PDF with valid signature', async () => {
			const file = createFile('test.pdf', pdfBytes(), 'application/pdf');
			const result = await validateFileType(file);
			expect(result.isValid).toBe(true);
		});

		it('should accept GIF with valid signature', async () => {
			const file = createFile('test.gif', gifBytes(), 'image/gif');
			const result = await validateFileType(file);
			expect(result.isValid).toBe(true);
		});

		it('should reject file with wrong magic numbers', async () => {
			// random bytes that don't match PNG signature
			const badBytes = new Uint8Array([0x00, 0x00, 0x00, 0x00, ...new Array(100).fill(0)]);
			const file = createFile('fake.png', badBytes, 'image/png');
			const result = await validateFileType(file);
			expect(result.isValid).toBe(false);
			expect(result.reason).toContain("doesn't match");
			expect(result.isSupportedFormat).toBe(true);
		});

		it('should skip signature check for very small files (<=10 bytes)', async () => {
			const file = createFile('small.png', new Uint8Array(5), 'image/png');
			const result = await validateFileType(file);
			expect(result.isValid).toBe(true);
		});
	});

	describe('text format validation', () => {
		it('should accept valid JSON content', async () => {
			const content = JSON.stringify({ key: 'value' });
			const bigContent = content + ' '.repeat(100); // ensure > 10 bytes
			const file = createFile('data.json', bigContent, 'application/json');
			const result = await validateFileType(file);
			expect(result.isValid).toBe(true);
		});

		it('should reject invalid JSON content', async () => {
			const content = 'not valid json { broken' + ' '.repeat(100);
			const file = createFile('data.json', content, 'application/json');
			const result = await validateFileType(file);
			expect(result.isValid).toBe(false);
			expect(result.reason).toContain('JSON');
		});

		it('should accept valid CSV content', async () => {
			const content = 'name,age,city\nAlice,30,NYC\nBob,25,LA\n' + ' '.repeat(100);
			const file = createFile('data.csv', content, 'text/csv');
			const result = await validateFileType(file);
			expect(result.isValid).toBe(true);
		});

		it('should accept valid YAML content', async () => {
			const content = 'name: test\nversion: 1.0\n' + ' '.repeat(100);
			const file = createFile('config.yaml', content, 'text/yaml');
			const result = await validateFileType(file);
			expect(result.isValid).toBe(true);
		});

		it('should accept plain text files with content', async () => {
			const content = 'Hello world this is a text file with enough content to exceed ten bytes';
			const file = createFile('readme.txt', content, 'text/plain');
			const result = await validateFileType(file);
			expect(result.isValid).toBe(true);
		});
	});
});

describe('validateFileComplete', () => {
	it('should return isValid true for valid files', async () => {
		const file = createFile('test.png', pngBytes(), 'image/png');
		const result = await validateFileComplete(file);
		expect(result.isValid).toBe(true);
		expect(result.typeValidation.isValid).toBe(true);
	});

	it('should return isValid false for invalid files', async () => {
		const file = createFile('noext', 'data');
		const result = await validateFileComplete(file);
		expect(result.isValid).toBe(false);
	});
});

describe('generateAcceptAttribute', () => {
	it('should return a non-empty string with extensions and MIME types', () => {
		const accept = generateAcceptAttribute();
		expect(accept.length).toBeGreaterThan(0);
		expect(accept).toContain('.png');
		expect(accept).toContain('image/png');
	});

	it('should filter by category', () => {
		const accept = generateAcceptAttribute('image');
		expect(accept).toContain('.png');
		expect(accept).not.toContain('.mp3');
		expect(accept).not.toContain('.pdf');
	});

	it('should return audio formats when filtered', () => {
		const accept = generateAcceptAttribute('audio');
		expect(accept).toContain('.wav');
		expect(accept).toContain('.mp3');
		expect(accept).not.toContain('.png');
	});

	it('should not contain duplicates', () => {
		const accept = generateAcceptAttribute();
		const parts = accept.split(',');
		const unique = new Set(parts);
		expect(parts.length).toBe(unique.size);
	});
});

describe('validateTextFormat', () => {
	it('should validate JSON', async () => {
		const valid = createFile('t.json', '{"a":1}');
		const invalid = createFile('t.json', '{broken');
		expect(await validateTextFormat(valid, 'json')).toBe(true);
		expect(await validateTextFormat(invalid, 'json')).toBe(false);
	});

	it('should reject empty JSON', async () => {
		const file = createFile('t.json', '   ');
		expect(await validateTextFormat(file, 'json')).toBe(false);
	});

	it('should validate CSV with consistent columns', async () => {
		const valid = createFile('t.csv', 'a,b,c\n1,2,3');
		const invalid = createFile('t.csv', 'a,b,c\n1,2');
		expect(await validateTextFormat(valid, 'csv')).toBe(true);
		expect(await validateTextFormat(invalid, 'csv')).toBe(false);
	});

	it('should handle CSV with quoted fields containing commas', async () => {
		const file = createFile('t.csv', '"a,b",c\n"d,e",f');
		expect(await validateTextFormat(file, 'csv')).toBe(true);
	});

	it('should reject empty CSV', async () => {
		const file = createFile('t.csv', '');
		expect(await validateTextFormat(file, 'csv')).toBe(false);
	});

	it('should validate TSV with consistent columns', async () => {
		const valid = createFile('t.tsv', 'a\tb\tc\n1\t2\t3');
		const invalid = createFile('t.tsv', 'a\tb\tc\n1\t2');
		expect(await validateTextFormat(valid, 'tsv')).toBe(true);
		expect(await validateTextFormat(invalid, 'tsv')).toBe(false);
	});

	it('should validate YAML', async () => {
		const valid = createFile('t.yaml', 'key: value\nother: 123');
		const empty = createFile('t.yaml', '');
		expect(await validateTextFormat(valid, 'yaml')).toBe(true);
		expect(await validateTextFormat(empty, 'yaml')).toBe(false);
	});

	it('should accept YAML alias yml', async () => {
		const file = createFile('t.yml', 'name: test');
		expect(await validateTextFormat(file, 'yml')).toBe(true);
	});

	it('should accept txt/md/html/xml with any non-empty content', async () => {
		for (const fmt of ['txt', 'md', 'html', 'xml']) {
			const file = createFile(`t.${fmt}`, 'content');
			expect(await validateTextFormat(file, fmt)).toBe(true);
		}
	});

	it('should return true for unknown formats', async () => {
		const file = createFile('t.foo', 'anything');
		expect(await validateTextFormat(file, 'foo')).toBe(true);
	});
});
