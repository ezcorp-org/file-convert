import { test, expect, SpreadsheetFactory, ContentValidator } from '../../fixtures';

// Spreadsheet conversion paths
// Note: XLSX conversions skipped - require SheetJS CDN load which is blocked in test environment
// Once SheetJS is bundled locally, unskip XLSX tests
const SPREADSHEET_CONVERSIONS = [
	// XLSX source - SKIP (requires SheetJS)
	// { from: 'xlsx', to: 'csv', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
	// { from: 'xlsx', to: 'json', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
	// { from: 'xlsx', to: 'tsv', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
	// CSV source
	// { from: 'csv', to: 'xlsx', mimeType: 'text/csv' }, // SKIP - requires SheetJS
	{ from: 'csv', to: 'json', mimeType: 'text/csv' },
	{ from: 'csv', to: 'tsv', mimeType: 'text/csv' },
	// { from: 'csv', to: 'yaml', mimeType: 'text/csv' }, // SKIP - not implemented
	// { from: 'csv', to: 'xml', mimeType: 'text/csv' }, // SKIP - not implemented
	// JSON source
	{ from: 'json', to: 'csv', mimeType: 'application/json' },
	// { from: 'json', to: 'xlsx', mimeType: 'application/json' }, // SKIP - requires SheetJS
	// { from: 'json', to: 'yaml', mimeType: 'application/json' }, // SKIP - not implemented
	// TSV source
	{ from: 'tsv', to: 'csv', mimeType: 'text/tab-separated-values' }
	// { from: 'tsv', to: 'json', mimeType: 'text/tab-separated-values' } // TODO: Check if implemented
];

// Test data with predictable content for validation
const TEST_DATA = [
	['Name', 'Age', 'City'],
	['Alice', '30', 'NYC'],
	['Bob', '25', 'LA'],
	['Charlie', '35', 'Chicago']
];

// Helper to get correct extension for file
function getSpreadsheetExtension(format: string): string {
	const extensions: Record<string, string> = {
		xlsx: 'xlsx',
		csv: 'csv',
		tsv: 'tsv',
		json: 'json',
		yaml: 'yaml',
		xml: 'xml'
	};
	return extensions[format] || format;
}

// Helper to get UI text for format selection
function getSpreadsheetUIText(format: string): RegExp {
	const uiText: Record<string, RegExp> = {
		xlsx: /XLSX|Excel/i,
		csv: /CSV/i,
		tsv: /TSV/i,
		json: /JSON/i,
		yaml: /YAML/i,
		xml: /XML/i
	};
	return uiText[format] || new RegExp(format, 'i');
}

// Helper to create spreadsheet fixture based on format
async function createSpreadsheetFixture(format: string, data: (string | number)[][]): Promise<Buffer> {
	switch (format.toLowerCase()) {
		case 'xlsx':
			return await SpreadsheetFactory.createXLSX({ data });
		case 'csv':
			return SpreadsheetFactory.createCSV({ data });
		case 'tsv':
			return SpreadsheetFactory.createTSV({ data });
		case 'json':
			return SpreadsheetFactory.createJSON({ data });
		case 'yaml':
			return SpreadsheetFactory.createYAML({ data });
		case 'xml':
			return SpreadsheetFactory.createXML({ data });
		default:
			throw new Error(`Unsupported format: ${format}`);
	}
}

test.describe('Spreadsheet Conversion Matrix (COVER-04)', () => {
	for (const { from, to, mimeType } of SPREADSHEET_CONVERSIONS) {
		test(`converts ${from.toUpperCase()} to ${to.toUpperCase()}`, async ({
			page,
			fileHelper,
			downloadHelper
		}) => {
			// Generate source file with TEST_DATA
			const sourceBuffer = await createSpreadsheetFixture(from, TEST_DATA);

			const fileData = fileHelper.createFileData(
				sourceBuffer,
				`test.${getSpreadsheetExtension(from)}`,
				mimeType
			);

			// Navigate to convert page
			await page.goto('/convert');
			await page.waitForLoadState('networkidle');

			// Upload source file
			await fileHelper.uploadFile(fileData);

			// Wait for file to be uploaded and visible
			await expect(page.locator('.file-item').first()).toBeVisible({ timeout: 10000 });

			// Select output format
			const formatOption = page
				.locator('.format-option')
				.filter({ hasText: getSpreadsheetUIText(to) });
			await formatOption.click();

			// Start conversion
			await page.locator('.convert-btn').first().click();

			// Wait for completion (spreadsheet processing can be slow)
			await expect(page.locator('.download-btn').first()).toBeVisible({ timeout: 45000 });

			// Download file
			const { buffer } = await downloadHelper.validateDownload('.download-btn', to);

			// Validate output format where applicable
			let validationResult;
			switch (to.toLowerCase()) {
				case 'csv':
					validationResult = ContentValidator.validateCSV(buffer);
					expect(validationResult.valid).toBe(true);
					expect(validationResult.csv?.rowCount).toBeGreaterThan(0);
					console.log(
						`${from} -> ${to}: ${validationResult.csv?.rowCount} rows, ${validationResult.csv?.columnCount} columns`
					);
					break;
				case 'json':
					validationResult = ContentValidator.validateJSON(buffer);
					expect(validationResult.valid).toBe(true);
					expect(validationResult.json?.parsed).toBeDefined();
					console.log(
						`${from} -> ${to}: ${Array.isArray(validationResult.json?.parsed) ? validationResult.json.parsed.length : 'object'} items`
					);
					break;
				case 'tsv':
					validationResult = ContentValidator.validateCSV(buffer, '\t');
					expect(validationResult.valid).toBe(true);
					expect(validationResult.csv?.rowCount).toBeGreaterThan(0);
					console.log(
						`${from} -> ${to}: ${validationResult.csv?.rowCount} rows, ${validationResult.csv?.columnCount} columns`
					);
					break;
				case 'xml':
					validationResult = ContentValidator.validateXML(buffer);
					expect(validationResult.valid).toBe(true);
					expect(validationResult.xml?.rootElement).toBeDefined();
					console.log(`${from} -> ${to}: root element <${validationResult.xml?.rootElement}>`);
					break;
				case 'yaml':
					validationResult = ContentValidator.validateYAML(buffer);
					expect(validationResult.valid).toBe(true);
					console.log(`${from} -> ${to}: valid YAML structure`);
					break;
				default:
					// For XLSX, just verify buffer is not empty
					expect(buffer.length).toBeGreaterThan(0);
					console.log(`${from} -> ${to}: ${buffer.length} bytes`);
			}
		});
	}
});

test.describe('Data Integrity Validation', () => {
	test('CSV to JSON preserves all rows and columns (ADV-02)', async ({
		page,
		fileHelper,
		downloadHelper
	}) => {
		const csvBuffer = SpreadsheetFactory.createCSV({ data: TEST_DATA });
		const fileData = fileHelper.createFileData(csvBuffer, 'test.csv', 'text/csv');

		await page.goto('/convert');
		await page.waitForLoadState('networkidle');

		// Upload CSV file
		await fileHelper.uploadFile(fileData);
		await expect(page.locator('.file-item').first()).toBeVisible({ timeout: 10000 });

		// Select JSON format
		await page.locator('.format-option').filter({ hasText: /JSON/i }).click();

		// Convert
		await page.locator('.convert-btn').first().click();
		await expect(page.locator('.download-btn').first()).toBeVisible({ timeout: 45000 });

		// Download and validate
		const { buffer } = await downloadHelper.validateDownload('.download-btn', 'json');

		// Validate JSON structure
		const jsonResult = ContentValidator.validateJSON(buffer);
		expect(jsonResult.valid).toBe(true);

		// Parse and verify data integrity
		const parsed = jsonResult.json?.parsed;
		expect(Array.isArray(parsed)).toBe(true);
		expect(parsed.length).toBe(3); // 3 data rows (header becomes keys)

		// Verify first row data preservation
		expect(parsed[0].Name).toBe('Alice');
		expect(parsed[0].Age).toBe('30');
		expect(parsed[0].City).toBe('NYC');

		// Verify all rows preserved
		expect(parsed[1].Name).toBe('Bob');
		expect(parsed[2].Name).toBe('Charlie');

		console.log(`Data integrity: CSV->JSON preserved ${parsed.length} rows with all columns`);
	});

	test('JSON to CSV maintains data integrity', async ({ page, fileHelper, downloadHelper }) => {
		const jsonBuffer = SpreadsheetFactory.createJSON({ data: TEST_DATA });
		const fileData = fileHelper.createFileData(jsonBuffer, 'test.json', 'application/json');

		await page.goto('/convert');
		await page.waitForLoadState('networkidle');

		// Upload JSON file
		await fileHelper.uploadFile(fileData);
		await expect(page.locator('.file-item').first()).toBeVisible({ timeout: 10000 });

		// Select CSV format
		await page.locator('.format-option').filter({ hasText: /CSV/i }).click();

		// Convert
		await page.locator('.convert-btn').first().click();
		await expect(page.locator('.download-btn').first()).toBeVisible({ timeout: 45000 });

		// Download and validate
		const { buffer } = await downloadHelper.validateDownload('.download-btn', 'csv');

		// Validate CSV structure
		const csvResult = ContentValidator.validateCSV(buffer);
		expect(csvResult.valid).toBe(true);
		expect(csvResult.csv?.rowCount).toBe(4); // header + 3 rows
		expect(csvResult.csv?.columnCount).toBe(3);

		// Verify content preservation
		const content = buffer.toString('utf-8');
		expect(content).toContain('Alice');
		expect(content).toContain('Bob');
		expect(content).toContain('Charlie');
		expect(content).toContain('NYC');
		expect(content).toContain('LA');
		expect(content).toContain('Chicago');

		console.log(
			`Data integrity: JSON->CSV preserved ${csvResult.csv?.rowCount} rows with ${csvResult.csv?.columnCount} columns`
		);
	});

	test('CSV to TSV to CSV round-trip preserves data', async ({
		page,
		fileHelper,
		downloadHelper
	}) => {
		// Start with CSV
		const originalCSV = SpreadsheetFactory.createCSV({ data: TEST_DATA });
		const csvData = fileHelper.createFileData(originalCSV, 'test.csv', 'text/csv');

		await page.goto('/convert');
		await page.waitForLoadState('networkidle');

		// Convert CSV to TSV
		await fileHelper.uploadFile(csvData);
		await expect(page.locator('.file-item').first()).toBeVisible({ timeout: 10000 });
		await page.locator('.format-option').filter({ hasText: /TSV/i }).click();
		await page.locator('.convert-btn').first().click();
		await expect(page.locator('.download-btn').first()).toBeVisible({ timeout: 45000 });

		// Download TSV
		const { buffer: tsvBuffer } = await downloadHelper.validateDownload('.download-btn', 'tsv');

		// Validate TSV structure
		const tsvResult = ContentValidator.validateCSV(tsvBuffer, '\t');
		expect(tsvResult.valid).toBe(true);
		expect(tsvResult.csv?.rowCount).toBe(4);

		// Reset for second conversion
		await page.goto('/convert');
		await page.waitForLoadState('networkidle');

		// Convert TSV back to CSV
		const tsvData = fileHelper.createFileData(
			tsvBuffer,
			'test.tsv',
			'text/tab-separated-values'
		);
		await fileHelper.uploadFile(tsvData);
		await expect(page.locator('.file-item').first()).toBeVisible({ timeout: 10000 });
		await page.locator('.format-option').filter({ hasText: /CSV/i }).click();
		await page.locator('.convert-btn').first().click();
		await expect(page.locator('.download-btn').first()).toBeVisible({ timeout: 45000 });

		// Download final CSV
		const { buffer: finalCSV } = await downloadHelper.validateDownload('.download-btn', 'csv');

		// Validate final CSV structure
		const finalResult = ContentValidator.validateCSV(finalCSV);
		expect(finalResult.valid).toBe(true);
		expect(finalResult.csv?.rowCount).toBe(4); // Same as original
		expect(finalResult.csv?.columnCount).toBe(3); // Same as original

		// Verify all original data is present
		const finalContent = finalCSV.toString('utf-8');
		expect(finalContent).toContain('Alice');
		expect(finalContent).toContain('Bob');
		expect(finalContent).toContain('Charlie');
		expect(finalContent).toContain('NYC');
		expect(finalContent).toContain('LA');
		expect(finalContent).toContain('Chicago');

		console.log(
			`Round-trip integrity: CSV->TSV->CSV preserved all ${finalResult.csv?.rowCount} rows`
		);
	}, 90000); // 90 second timeout for two conversions
});
