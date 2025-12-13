import { describe, it, expect } from 'vitest';
import { ContentValidator } from './content';

describe('ContentValidator', () => {
	describe('validateJSON', () => {
		it('should pass for valid JSON', () => {
			const buffer = Buffer.from('{"name": "test", "value": 123}');

			const result = ContentValidator.validateJSON(buffer);

			expect(result.valid).toBe(true);
			expect(result.format).toBe('json');
			expect(result.json?.valid).toBe(true);
			expect(result.json?.parsed).toEqual({ name: 'test', value: 123 });
		});

		it('should fail for invalid JSON', () => {
			const buffer = Buffer.from('{"name": "test", invalid}');

			const result = ContentValidator.validateJSON(buffer);

			expect(result.valid).toBe(false);
			expect(result.format).toBe('json');
			expect(result.json?.valid).toBe(false);
			expect(result.json?.error).toBeDefined();
			expect(result.error).toBeDefined();
		});

		it('should handle empty JSON objects', () => {
			const buffer = Buffer.from('{}');

			const result = ContentValidator.validateJSON(buffer);

			expect(result.valid).toBe(true);
			expect(result.json?.parsed).toEqual({});
		});
	});

	describe('validateCSV', () => {
		it('should pass for CSV with consistent columns', () => {
			const buffer = Buffer.from('Name,Age,City\nAlice,30,NYC\nBob,25,LA');

			const result = ContentValidator.validateCSV(buffer);

			expect(result.valid).toBe(true);
			expect(result.format).toBe('csv');
			expect(result.csv?.valid).toBe(true);
			expect(result.csv?.rowCount).toBe(3);
			expect(result.csv?.columnCount).toBe(3);
			expect(result.csv?.hasHeader).toBe(true);
		});

		it('should fail for CSV with inconsistent columns', () => {
			const buffer = Buffer.from('Name,Age,City\nAlice,30\nBob,25,LA,Extra');

			const result = ContentValidator.validateCSV(buffer);

			expect(result.valid).toBe(false);
			expect(result.format).toBe('csv');
			expect(result.csv?.valid).toBe(false);
			expect(result.csv?.error).toContain('Column count varies');
		});

		it('should fail for empty CSV', () => {
			const buffer = Buffer.from('');

			const result = ContentValidator.validateCSV(buffer);

			expect(result.valid).toBe(false);
			expect(result.csv?.error).toContain('Empty');
		});

		it('should handle TSV with tab delimiter', () => {
			const buffer = Buffer.from('Name\tAge\tCity\nAlice\t30\tNYC\nBob\t25\tLA');

			const result = ContentValidator.validateCSV(buffer, '\t');

			expect(result.valid).toBe(true);
			expect(result.csv?.columnCount).toBe(3);
		});
	});

	describe('validateXML', () => {
		it('should pass for valid XML', () => {
			const buffer = Buffer.from('<root><item>test</item></root>');

			const result = ContentValidator.validateXML(buffer);

			expect(result.valid).toBe(true);
			expect(result.format).toBe('xml');
			expect(result.xml?.valid).toBe(true);
			expect(result.xml?.rootElement).toBe('root');
		});

		it('should pass for XML with declaration', () => {
			const buffer = Buffer.from('<?xml version="1.0"?><root><item>test</item></root>');

			const result = ContentValidator.validateXML(buffer);

			expect(result.valid).toBe(true);
			expect(result.xml?.rootElement).toBe('root');
		});

		it('should fail for malformed XML (missing closing tag)', () => {
			const buffer = Buffer.from('<root><item>test</item>');

			const result = ContentValidator.validateXML(buffer);

			expect(result.valid).toBe(false);
			expect(result.error).toContain('Missing closing tag');
		});

		it('should fail for non-XML content', () => {
			const buffer = Buffer.from('not xml at all');

			const result = ContentValidator.validateXML(buffer);

			expect(result.valid).toBe(false);
			expect(result.error).toContain('missing root element');
		});
	});

	describe('validateYAML', () => {
		it('should pass for valid YAML mapping', () => {
			const buffer = Buffer.from('name: test\nvalue: 123');

			const result = ContentValidator.validateYAML(buffer);

			expect(result.valid).toBe(true);
			expect(result.format).toBe('yaml');
			expect(result.yaml?.valid).toBe(true);
		});

		it('should pass for valid YAML sequence', () => {
			const buffer = Buffer.from('- item1\n- item2\n- item3');

			const result = ContentValidator.validateYAML(buffer);

			expect(result.valid).toBe(true);
			expect(result.yaml?.valid).toBe(true);
		});

		it('should pass for scalar YAML', () => {
			const buffer = Buffer.from('simple string');

			const result = ContentValidator.validateYAML(buffer);

			expect(result.valid).toBe(true);
		});
	});

	describe('validate', () => {
		it('should dispatch to JSON validator', () => {
			const buffer = Buffer.from('{"test": true}');

			const result = ContentValidator.validate(buffer, 'json');

			expect(result.valid).toBe(true);
			expect(result.format).toBe('json');
		});

		it('should dispatch to CSV validator', () => {
			const buffer = Buffer.from('a,b,c\n1,2,3');

			const result = ContentValidator.validate(buffer, 'csv');

			expect(result.valid).toBe(true);
			expect(result.format).toBe('csv');
		});

		it('should dispatch to TSV validator for tsv format', () => {
			const buffer = Buffer.from('a\tb\tc\n1\t2\t3');

			const result = ContentValidator.validate(buffer, 'tsv');

			expect(result.valid).toBe(true);
			expect(result.format).toBe('csv'); // TSV uses CSV validator
		});

		it('should dispatch to XML validator', () => {
			const buffer = Buffer.from('<root></root>');

			const result = ContentValidator.validate(buffer, 'xml');

			expect(result.valid).toBe(true);
			expect(result.format).toBe('xml');
		});

		it('should dispatch to YAML validator for yaml', () => {
			const buffer = Buffer.from('key: value');

			const result = ContentValidator.validate(buffer, 'yaml');

			expect(result.valid).toBe(true);
			expect(result.format).toBe('yaml');
		});

		it('should dispatch to YAML validator for yml', () => {
			const buffer = Buffer.from('key: value');

			const result = ContentValidator.validate(buffer, 'yml');

			expect(result.valid).toBe(true);
			expect(result.format).toBe('yaml');
		});

		it('should validate UTF-8 for text formats', () => {
			const buffer = Buffer.from('plain text content');

			const result = ContentValidator.validate(buffer, 'txt');

			expect(result.valid).toBe(true);
			expect(result.format).toBe('txt');
		});

		it('should fail for invalid UTF-8 in text format', () => {
			// Create a buffer with invalid UTF-8 sequence
			const buffer = Buffer.from([0xff, 0xfe, 0xfd]);

			const result = ContentValidator.validate(buffer, 'txt');

			expect(result.valid).toBe(false);
			expect(result.error).toContain('Invalid UTF-8');
		});

		it('should pass unknown formats through', () => {
			const buffer = Buffer.from('any content');

			const result = ContentValidator.validate(buffer, 'unknown');

			expect(result.valid).toBe(true);
			expect(result.format).toBe('unknown');
		});
	});
});
