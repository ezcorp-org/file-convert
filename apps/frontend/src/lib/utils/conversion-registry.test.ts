import { describe, it, expect } from 'vitest';
import {
	formats,
	conversionPaths,
	getFormat,
	getAvailableConversions,
	getConversionPath
} from './conversion-registry';

describe('conversion-registry', () => {
	describe('formats data integrity', () => {
		it('should have unique IDs', () => {
			const ids = formats.map(f => f.id);
			expect(new Set(ids).size).toBe(ids.length);
		});

		it('every format should have non-empty extensions', () => {
			for (const format of formats) {
				expect(format.extensions.length, `${format.id} has no extensions`).toBeGreaterThan(0);
			}
		});

		it('every format should have non-empty mimeTypes', () => {
			for (const format of formats) {
				expect(format.mimeTypes.length, `${format.id} has no mimeTypes`).toBeGreaterThan(0);
			}
		});

		it('no extension should appear in multiple formats', () => {
			const seen = new Map<string, string>();
			for (const format of formats) {
				for (const ext of format.extensions) {
					expect(seen.has(ext), `extension '${ext}' appears in both '${seen.get(ext)}' and '${format.id}'`).toBe(false);
					seen.set(ext, format.id);
				}
			}
		});
	});

	describe('conversionPaths data integrity', () => {
		it('every "from" should reference a valid format ID', () => {
			const ids = new Set(formats.map(f => f.id));
			for (const path of conversionPaths) {
				expect(ids.has(path.from), `'from' value '${path.from}' is not a valid format`).toBe(true);
			}
		});

		it('every "to" should reference a valid format ID', () => {
			const ids = new Set(formats.map(f => f.id));
			for (const path of conversionPaths) {
				expect(ids.has(path.to), `'to' value '${path.to}' is not a valid format`).toBe(true);
			}
		});

		it('should have no duplicate paths', () => {
			const keys = conversionPaths.map(p => `${p.from}->${p.to}`);
			expect(new Set(keys).size).toBe(keys.length);
		});

		it('no path should convert a format to itself', () => {
			for (const path of conversionPaths) {
				expect(path.from === path.to, `self-conversion: ${path.from}->${path.to}`).toBe(false);
			}
		});
	});

	describe('getFormat', () => {
		it('should include the correct icon for each category', () => {
			const expectedIcons: Record<string, string> = {
				image: '🖼️',
				audio: '🎵',
				document: '📄',
				archive: '📦',
				text: '📝',
				spreadsheet: '📊'
			};
			for (const [category, icon] of Object.entries(expectedIcons)) {
				const format = formats.find(f => f.category === category);
				if (format) {
					const result = getFormat(format.id);
					expect(result?.icon, `wrong icon for category '${category}'`).toBe(icon);
				}
			}
		});

		it('should find format by alternate extension (tif -> tiff)', () => {
			const result = getFormat('tif');
			expect(result).toBeDefined();
			expect(result?.id).toBe('tiff');
		});

		it('should find format by alternate extension (yml -> yaml)', () => {
			const result = getFormat('yml');
			expect(result).toBeDefined();
			expect(result?.id).toBe('yaml');
		});

		it('should find format by alternate extension (htm -> html)', () => {
			const result = getFormat('htm');
			expect(result).toBeDefined();
			expect(result?.id).toBe('html');
		});

		it('should return undefined for empty string', () => {
			expect(getFormat('')).toBeUndefined();
		});
	});

	describe('getAvailableConversions', () => {
		it('should accept an array of formats and return union of targets', () => {
			const conversions = getAvailableConversions(['png', 'wav']);
			const ids = conversions.map(c => c.id);
			// Should include image targets (jpeg, webp, tiff, pnm) and audio targets (flac, mp3, ogg, opus)
			expect(ids).toContain('jpeg');
			expect(ids).toContain('flac');
		});

		it('should return empty array for empty string input', () => {
			expect(getAvailableConversions('')).toEqual([]);
		});

		it('should return empty array for empty array input', () => {
			expect(getAvailableConversions([])).toEqual([]);
		});

		it('should return empty array for array of empty strings', () => {
			expect(getAvailableConversions(['', ''])).toEqual([]);
		});

		it('should deduplicate targets when multiple inputs share a target', () => {
			// bmp->png and gif->png both produce 'png'
			const conversions = getAvailableConversions(['bmp', 'gif']);
			const ids = conversions.map(c => c.id);
			const pngCount = ids.filter(id => id === 'png').length;
			expect(pngCount).toBe(1);
		});

		it('should include icons on returned format objects', () => {
			const conversions = getAvailableConversions('png');
			for (const c of conversions) {
				expect((c as any).icon).toBeDefined();
			}
		});

		it('should ignore invalid formats in a mixed array', () => {
			const conversions = getAvailableConversions(['nonexistent', 'png']);
			const ids = conversions.map(c => c.id);
			expect(ids).toContain('jpeg');
		});

		it('should handle all archive conversions', () => {
			const conversions = getAvailableConversions('zip');
			const ids = conversions.map(c => c.id);
			expect(ids).toContain('tar');
			expect(ids).toContain('tgz');
			expect(ids).toContain('7z');
		});

		it('should handle spreadsheet conversions', () => {
			const conversions = getAvailableConversions('xlsx');
			const ids = conversions.map(c => c.id);
			expect(ids).toContain('csv');
			expect(ids).toContain('json');
		});

		it('should handle text conversions', () => {
			const conversions = getAvailableConversions('md');
			const ids = conversions.map(c => c.id);
			expect(ids).toContain('txt');
			expect(ids).toContain('html');
			expect(ids).toContain('pdf');
		});

		it('should handle document conversions', () => {
			const conversions = getAvailableConversions('docx');
			const ids = conversions.map(c => c.id);
			expect(ids).toContain('html');
			expect(ids).toContain('txt');
		});
	});

	describe('getConversionPath', () => {
		it('should return correct converter for each category', () => {
			expect(getConversionPath('png', 'jpeg')?.converter).toBe('image');
			expect(getConversionPath('wav', 'mp3')?.converter).toBe('audio');
			expect(getConversionPath('zip', 'tar')?.converter).toBe('archive');
			expect(getConversionPath('docx', 'html')?.converter).toBe('document');
			expect(getConversionPath('pdf', 'png')?.converter).toBe('pdf');
			expect(getConversionPath('xlsx', 'csv')?.converter).toBe('spreadsheet');
			expect(getConversionPath('txt', 'md')?.converter).toBe('text');
		});

		it('should return undefined for reversed non-existent path', () => {
			// tiff->png doesn't exist
			expect(getConversionPath('tiff', 'png')).toBeUndefined();
		});

		it('should return undefined when both args are empty', () => {
			expect(getConversionPath('', '')).toBeUndefined();
		});
	});
});
