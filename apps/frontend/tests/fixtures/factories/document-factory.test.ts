import { describe, it, expect } from 'vitest';
import { DocumentFactory } from './document-factory';
import { MagicByteValidator } from '../validators';

describe('DocumentFactory', () => {
	describe('PDF generation', () => {
		it('generates valid PDF that passes magic byte validation', async () => {
			const pdf = await DocumentFactory.createPDF({ title: 'Test' });
			const result = await MagicByteValidator.validate(pdf, 'pdf');
			expect(result.valid).toBe(true);
			expect(result.detectedFormat).toBe('pdf');
		});

		it('includes custom title and content', async () => {
			const pdf = await DocumentFactory.createPDF({
				title: 'Custom Title',
				content: 'Custom content here'
			});
			expect(pdf.length).toBeGreaterThan(0);
			// PDF is binary, but we can check it starts with %PDF
			const header = pdf.toString('ascii', 0, 4);
			expect(header).toBe('%PDF');
		});

		it('generates multi-paragraph documents', async () => {
			const pdf = await DocumentFactory.createPDF({ paragraphs: 5 });
			expect(pdf.length).toBeGreaterThan(0);
		});
	});

	describe('TXT generation', () => {
		it('generates valid UTF-8 text', () => {
			const txt = DocumentFactory.createTXT({
				title: 'Hello',
				content: 'World'
			});
			const text = txt.toString('utf-8');
			expect(text).toContain('Hello');
			expect(text).toContain('World');
			expect(text).toContain('====='); // Title underline
		});

		it('supports multiple paragraphs', () => {
			const txt = DocumentFactory.createTXT({
				title: 'Test',
				content: 'Start',
				paragraphs: 3
			});
			const text = txt.toString('utf-8');
			expect(text).toContain('Start');
			expect(text).toContain('Paragraph 2');
			expect(text).toContain('Paragraph 3');
		});

		it('uses defaults when no options provided', () => {
			const txt = DocumentFactory.createTXT();
			const text = txt.toString('utf-8');
			expect(text).toContain('Test Document');
			expect(text).toContain('This is test content.');
		});
	});

	describe('HTML generation', () => {
		it('generates valid HTML5', () => {
			const html = DocumentFactory.createHTML({ title: 'Test' });
			const text = html.toString('utf-8');
			expect(text).toContain('<!DOCTYPE html>');
			expect(text).toContain('</html>');
			expect(text).toContain('<h1>Test</h1>');
		});

		it('includes UTF-8 charset declaration', () => {
			const html = DocumentFactory.createHTML();
			const text = html.toString('utf-8');
			expect(text).toContain('<meta charset="UTF-8">');
		});

		it('supports multiple paragraphs', () => {
			const html = DocumentFactory.createHTML({
				title: 'Multi',
				content: 'First',
				paragraphs: 3
			});
			const text = html.toString('utf-8');
			expect(text).toContain('<p>First</p>');
			expect(text).toContain('<p>Paragraph 2');
			expect(text).toContain('<p>Paragraph 3');
		});
	});

	describe('Markdown generation', () => {
		it('generates valid Markdown', () => {
			const md = DocumentFactory.createMarkdown({ title: 'Test' });
			const text = md.toString('utf-8');
			expect(text.startsWith('# Test')).toBe(true);
		});

		it('includes content after title', () => {
			const md = DocumentFactory.createMarkdown({
				title: 'Title',
				content: 'Content here'
			});
			const text = md.toString('utf-8');
			expect(text).toContain('# Title');
			expect(text).toContain('Content here');
		});

		it('supports multiple paragraphs', () => {
			const md = DocumentFactory.createMarkdown({ paragraphs: 4 });
			const text = md.toString('utf-8');
			expect(text).toContain('Paragraph 2');
			expect(text).toContain('Paragraph 4');
		});
	});

	describe('create() convenience method', () => {
		it('creates PDF when format=pdf', async () => {
			const result = await DocumentFactory.create({ format: 'pdf' });
			const header = result.toString('ascii', 0, 4);
			expect(header).toBe('%PDF');
		});

		it('creates TXT when format=txt', async () => {
			const result = await DocumentFactory.create({ format: 'txt' });
			const text = result.toString('utf-8');
			expect(text).toContain('Test Document');
		});

		it('creates HTML when format=html', async () => {
			const result = await DocumentFactory.create({ format: 'html' });
			const text = result.toString('utf-8');
			expect(text).toContain('<!DOCTYPE html>');
		});

		it('creates Markdown when format=md', async () => {
			const result = await DocumentFactory.create({ format: 'md' });
			const text = result.toString('utf-8');
			expect(text.startsWith('# Test Document')).toBe(true);
		});

		it('defaults to TXT when no format specified', async () => {
			const result = await DocumentFactory.create();
			const text = result.toString('utf-8');
			expect(text).toContain('Test Document');
			expect(text).toContain('====');
		});
	});

	describe('createVariations()', () => {
		it('produces all edge cases', async () => {
			const variations = await DocumentFactory.createVariations();
			expect(Object.keys(variations)).toContain('emptyPDF');
			expect(Object.keys(variations)).toContain('shortTXT');
			expect(Object.keys(variations)).toContain('longTXT');
			expect(Object.keys(variations)).toContain('minimalHTML');
			expect(Object.keys(variations)).toContain('complexHTML');
			expect(Object.keys(variations)).toContain('minimalMD');
		});

		it('empty PDF is valid', async () => {
			const variations = await DocumentFactory.createVariations();
			const result = await MagicByteValidator.validate(variations.emptyPDF, 'pdf');
			expect(result.valid).toBe(true);
		});

		it('longTXT has multiple paragraphs', async () => {
			const variations = await DocumentFactory.createVariations();
			const text = variations.longTXT.toString('utf-8');
			expect(text).toContain('Paragraph 10');
			expect(text).toContain('Paragraph 50');
			expect(text).toContain('Paragraph 100');
		});

		it('shortTXT is minimal', async () => {
			const variations = await DocumentFactory.createVariations();
			const text = variations.shortTXT.toString('utf-8');
			expect(text).toContain('Short');
			expect(text).toContain('One line.');
			expect(text.length).toBeLessThan(100);
		});

		it('complexHTML has nested elements', async () => {
			const variations = await DocumentFactory.createVariations();
			const text = variations.complexHTML.toString('utf-8');
			expect(text).toContain('<ul>');
			expect(text).toContain('<table>');
			expect(text).toContain('<strong>');
			expect(text).toContain('<em>');
		});

		it('minimalHTML is bare bones', async () => {
			const variations = await DocumentFactory.createVariations();
			const text = variations.minimalHTML.toString('utf-8');
			expect(text).toContain('<!DOCTYPE html>');
			expect(text).toContain('<body></body>');
		});

		it('minimalMD is just a heading', async () => {
			const variations = await DocumentFactory.createVariations();
			const text = variations.minimalMD.toString('utf-8');
			expect(text).toBe('# Heading\n');
		});
	});
});
