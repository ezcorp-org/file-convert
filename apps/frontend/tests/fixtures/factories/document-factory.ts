import PDFDocument from 'pdfkit';

/**
 * Options for creating document fixtures
 */
export interface DocumentFixtureOptions {
	title?: string; // Document title, default: 'Test Document'
	content?: string; // Main text content, default: 'This is test content.'
	paragraphs?: number; // Number of paragraphs for longer docs, default: 1
	format?: 'pdf' | 'txt' | 'html' | 'md'; // default: 'txt'
}

/**
 * Factory for creating synthetic document files for testing
 * Generates PDF, TXT, HTML, MD files programmatically
 */
export class DocumentFactory {
	/**
	 * Create a PDF document
	 * @param options - Configuration options
	 * @returns PDF file buffer
	 */
	static createPDF(options?: DocumentFixtureOptions): Promise<Buffer> {
		return new Promise((resolve, reject) => {
			const doc = new PDFDocument();
			const chunks: Buffer[] = [];

			doc.on('data', (chunk) => chunks.push(chunk));
			doc.on('end', () => resolve(Buffer.concat(chunks)));
			doc.on('error', reject);

			const title = options?.title ?? 'Test Document';
			const content = options?.content ?? 'This is test content.';
			const paragraphs = options?.paragraphs ?? 1;

			// Add title
			doc.fontSize(16).text(title, { underline: true });
			doc.moveDown();

			// Add main content
			doc.fontSize(12).text(content);

			// Add additional paragraphs
			for (let i = 1; i < paragraphs; i++) {
				doc.moveDown();
				doc.text(`Paragraph ${i + 1}: Lorem ipsum dolor sit amet.`);
			}

			doc.end();
		});
	}

	/**
	 * Create a plain text document
	 * @param options - Configuration options
	 * @returns TXT file buffer
	 */
	static createTXT(options?: DocumentFixtureOptions): Buffer {
		const title = options?.title ?? 'Test Document';
		const content = options?.content ?? 'This is test content.';
		const paragraphs = options?.paragraphs ?? 1;

		let text = `${title}\n${'='.repeat(title.length)}\n\n${content}`;

		for (let i = 1; i < paragraphs; i++) {
			text += `\n\nParagraph ${i + 1}: Lorem ipsum dolor sit amet.`;
		}

		return Buffer.from(text, 'utf-8');
	}

	/**
	 * Create an HTML document
	 * @param options - Configuration options
	 * @returns HTML file buffer
	 */
	static createHTML(options?: DocumentFixtureOptions): Buffer {
		const title = options?.title ?? 'Test Document';
		const content = options?.content ?? 'This is test content.';
		const paragraphs = options?.paragraphs ?? 1;

		let html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>${title}</title></head>
<body>
  <h1>${title}</h1>
  <p>${content}</p>`;

		for (let i = 1; i < paragraphs; i++) {
			html += `\n  <p>Paragraph ${i + 1}: Lorem ipsum dolor sit amet.</p>`;
		}

		html += '\n</body>\n</html>';
		return Buffer.from(html, 'utf-8');
	}

	/**
	 * Create a Markdown document
	 * @param options - Configuration options
	 * @returns Markdown file buffer
	 */
	static createMarkdown(options?: DocumentFixtureOptions): Buffer {
		const title = options?.title ?? 'Test Document';
		const content = options?.content ?? 'This is test content.';
		const paragraphs = options?.paragraphs ?? 1;

		let md = `# ${title}\n\n${content}`;

		for (let i = 1; i < paragraphs; i++) {
			md += `\n\nParagraph ${i + 1}: Lorem ipsum dolor sit amet.`;
		}

		return Buffer.from(md, 'utf-8');
	}

	/**
	 * Create a document in the specified format
	 * @param options - Configuration options (format determines output type)
	 * @returns Document file buffer
	 */
	static async create(options?: DocumentFixtureOptions): Promise<Buffer> {
		const format = options?.format ?? 'txt';

		switch (format) {
			case 'pdf':
				return this.createPDF(options);
			case 'txt':
				return this.createTXT(options);
			case 'html':
				return this.createHTML(options);
			case 'md':
				return this.createMarkdown(options);
			default:
				throw new Error(`Unsupported format: ${format}`);
		}
	}

	/**
	 * Create variations of documents for edge case testing
	 * @returns Object with various edge case documents
	 */
	static async createVariations(): Promise<Record<string, Buffer>> {
		return {
			// Empty documents
			emptyPDF: await this.createPDF({ title: '', content: '' }),

			// Text variations
			shortTXT: this.createTXT({ title: 'Short', content: 'One line.' }),
			longTXT: this.createTXT({ title: 'Long Document', content: 'Start', paragraphs: 100 }),

			// HTML variations
			minimalHTML: Buffer.from(
				'<!DOCTYPE html>\n<html lang="en">\n<head><meta charset="UTF-8"></head>\n<body></body>\n</html>',
				'utf-8'
			),
			complexHTML: Buffer.from(
				`<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Complex</title></head>
<body>
  <h1>Complex Document</h1>
  <ul>
    <li>Item 1</li>
    <li>Item 2</li>
  </ul>
  <table>
    <tr><th>Header</th></tr>
    <tr><td>Data</td></tr>
  </table>
  <div>
    <p>Nested <strong>content</strong> with <em>formatting</em>.</p>
  </div>
</body>
</html>`,
				'utf-8'
			),

			// Markdown variations
			minimalMD: Buffer.from('# Heading\n', 'utf-8')
		};
	}
}
