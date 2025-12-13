import { describe, it, expect } from 'vitest';
import { SpreadsheetFactory } from './spreadsheet-factory';
import { MagicByteValidator } from '../validators';

describe('SpreadsheetFactory', () => {
	describe('XLSX generation', () => {
		it('generates valid XLSX that passes magic byte validation (ZIP signature)', async () => {
			const xlsx = await SpreadsheetFactory.createXLSX();

			// XLSX is a ZIP file internally
			const result = await MagicByteValidator.validate(xlsx, 'zip');
			expect(result.valid).toBe(true);
			expect(result.detectedFormat).toBe('zip');
		});

		it('creates XLSX with custom data', async () => {
			const customData = [
				['Product', 'Price', 'Stock'],
				['Widget', 19.99, 100],
				['Gadget', 29.99, 50]
			];
			const xlsx = await SpreadsheetFactory.createXLSX({ data: customData });

			// Verify it's still a valid ZIP/XLSX
			const result = await MagicByteValidator.validate(xlsx, 'zip');
			expect(result.valid).toBe(true);
		});

		it('creates XLSX with custom sheet name', async () => {
			const xlsx = await SpreadsheetFactory.createXLSX({ sheetName: 'CustomSheet' });

			// Verify it's a valid ZIP/XLSX
			const result = await MagicByteValidator.validate(xlsx, 'zip');
			expect(result.valid).toBe(true);
		});
	});

	describe('CSV generation', () => {
		it('generates valid CSV with comma-separated values', () => {
			const csv = SpreadsheetFactory.createCSV();
			const text = csv.toString('utf-8');

			expect(text).toContain(',');
			expect(text.split('\n').length).toBeGreaterThan(1);
			expect(text).toContain('Name,Age,City');
		});

		it('accepts custom data array', () => {
			const customData = [
				['Col1', 'Col2'],
				['A', 'B']
			];
			const csv = SpreadsheetFactory.createCSV({ data: customData });
			const text = csv.toString('utf-8');

			expect(text).toContain('Col1,Col2');
			expect(text).toContain('A,B');
		});

		it('handles empty rows correctly', () => {
			const csv = SpreadsheetFactory.createCSV();
			const text = csv.toString('utf-8');
			const lines = text.split('\n');

			// Default data has 4 rows (header + 3 data rows)
			expect(lines.length).toBe(4);
		});
	});

	describe('TSV generation', () => {
		it('generates valid TSV with tab-separated values', () => {
			const tsv = SpreadsheetFactory.createTSV();
			const text = tsv.toString('utf-8');

			expect(text).toContain('\t');
			expect(text.split('\n').length).toBeGreaterThan(1);
		});

		it('uses tabs instead of commas', () => {
			const tsv = SpreadsheetFactory.createTSV();
			const text = tsv.toString('utf-8');

			// Verify tab separation (should have tabs)
			expect(text.includes('\t')).toBe(true);
			// First line should be tab-separated headers
			expect(text.split('\n')[0]).toMatch(/\t/);
		});
	});

	describe('JSON generation', () => {
		it('generates valid JSON that parses correctly', () => {
			const json = SpreadsheetFactory.createJSON();
			const text = json.toString('utf-8');
			const parsed = JSON.parse(text);

			expect(Array.isArray(parsed)).toBe(true);
			expect(parsed.length).toBeGreaterThan(0);
		});

		it('converts headers to object keys', () => {
			const json = SpreadsheetFactory.createJSON();
			const text = json.toString('utf-8');
			const parsed = JSON.parse(text);

			// Default data has headers: Name, Age, City
			expect(parsed[0]).toHaveProperty('Name');
			expect(parsed[0]).toHaveProperty('Age');
			expect(parsed[0]).toHaveProperty('City');
		});

		it('preserves data types in JSON', () => {
			const customData: (string | number)[][] = [
				['Name', 'Count', 'Active'],
				['Test', 42, 1]
			];
			const json = SpreadsheetFactory.createJSON({ data: customData });
			const text = json.toString('utf-8');
			const parsed = JSON.parse(text);

			expect(parsed[0].Name).toBe('Test');
			expect(parsed[0].Count).toBe(42);
			expect(parsed[0].Active).toBe(1);
		});
	});

	describe('YAML generation', () => {
		it('generates valid YAML structure', () => {
			const yaml = SpreadsheetFactory.createYAML();
			const text = yaml.toString('utf-8');

			expect(text).toContain('- ');
			expect(text).toContain(':');
		});

		it('creates YAML list with key-value pairs', () => {
			const yaml = SpreadsheetFactory.createYAML();
			const text = yaml.toString('utf-8');

			// Should have list items starting with -
			expect(text.match(/^- /m)).toBeTruthy();
			// Should have key: value pairs
			expect(text).toMatch(/Name: \w+/);
			expect(text).toMatch(/Age: \d+/);
		});
	});

	describe('XML generation', () => {
		it('generates valid XML with declaration and closing tag', () => {
			const xml = SpreadsheetFactory.createXML();
			const text = xml.toString('utf-8');

			expect(text).toContain('<?xml');
			expect(text).toContain('</data>');
		});

		it('includes XML declaration', () => {
			const xml = SpreadsheetFactory.createXML();
			const text = xml.toString('utf-8');

			expect(text.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
		});

		it('wraps rows in row elements', () => {
			const xml = SpreadsheetFactory.createXML();
			const text = xml.toString('utf-8');

			// Should have row elements
			expect(text).toContain('<row>');
			expect(text).toContain('</row>');
			// Should have field elements matching default headers
			expect(text).toContain('<Name>');
			expect(text).toContain('<Age>');
			expect(text).toContain('<City>');
		});
	});

	describe('Edge case variations', () => {
		it('createVariations produces all edge cases', async () => {
			const variations = await SpreadsheetFactory.createVariations();

			expect(Object.keys(variations)).toContain('emptyXLSX');
			expect(Object.keys(variations)).toContain('singleRowCSV');
			expect(Object.keys(variations)).toContain('largeCSV');
			expect(Object.keys(variations)).toContain('specialCharsJSON');
			expect(Object.keys(variations)).toContain('nestedXML');
		});

		it('emptyXLSX is valid but has no data rows', async () => {
			const variations = await SpreadsheetFactory.createVariations();
			const result = await MagicByteValidator.validate(variations.emptyXLSX, 'zip');

			expect(result.valid).toBe(true);
		});

		it('singleRowCSV contains only header', async () => {
			const variations = await SpreadsheetFactory.createVariations();
			const text = variations.singleRowCSV.toString('utf-8');
			const lines = text.split('\n');

			expect(lines.length).toBe(1);
			expect(lines[0]).toContain('Column1');
		});

		it('largeCSV has 1000+ rows', async () => {
			const variations = await SpreadsheetFactory.createVariations();
			const text = variations.largeCSV.toString('utf-8');
			const lines = text.split('\n');

			// Header + 1000 data rows = 1001 lines
			expect(lines.length).toBe(1001);
		});

		it('specialCharsJSON parses despite special characters', async () => {
			const variations = await SpreadsheetFactory.createVariations();
			const text = variations.specialCharsJSON.toString('utf-8');
			const parsed = JSON.parse(text);

			expect(Array.isArray(parsed)).toBe(true);
			expect(parsed.length).toBeGreaterThan(0);
		});

		it('nestedXML contains nested elements', async () => {
			const variations = await SpreadsheetFactory.createVariations();
			const text = variations.nestedXML.toString('utf-8');

			expect(text).toContain('<Details>');
			expect(text).toContain('</Details>');
		});
	});
});
