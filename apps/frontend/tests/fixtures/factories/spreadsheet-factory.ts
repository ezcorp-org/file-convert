import ExcelJS from 'exceljs';

export interface SpreadsheetFixtureOptions {
	rows?: number; // Number of data rows, default: 3
	columns?: number; // Number of columns, default: 3
	headers?: string[]; // Column headers, default: ['A', 'B', 'C']
	data?: (string | number)[][]; // Custom data, overrides rows/columns
	sheetName?: string; // Sheet name, default: 'Sheet1'
}

// Default test data for consistency
const DEFAULT_DATA = [
	['Name', 'Age', 'City'],
	['Alice', 30, 'NYC'],
	['Bob', 25, 'LA'],
	['Charlie', 35, 'Chicago']
];

export class SpreadsheetFactory {
	/**
	 * Create an XLSX file buffer
	 * @param options - Spreadsheet configuration options
	 * @returns Buffer containing XLSX file (ZIP signature)
	 */
	static async createXLSX(options?: SpreadsheetFixtureOptions): Promise<Buffer> {
		const workbook = new ExcelJS.Workbook();
		const sheet = workbook.addWorksheet(options?.sheetName ?? 'Sheet1');

		const data = options?.data ?? DEFAULT_DATA;
		data.forEach((row) => sheet.addRow(row));

		return Buffer.from(await workbook.xlsx.writeBuffer());
	}

	/**
	 * Create a CSV file buffer
	 * @param options - Spreadsheet configuration options
	 * @returns Buffer containing CSV data
	 */
	static createCSV(options?: SpreadsheetFixtureOptions): Buffer {
		const data = options?.data ?? DEFAULT_DATA;
		const csv = data.map((row) => row.join(',')).join('\n');
		return Buffer.from(csv, 'utf-8');
	}

	/**
	 * Create a TSV file buffer
	 * @param options - Spreadsheet configuration options
	 * @returns Buffer containing TSV data
	 */
	static createTSV(options?: SpreadsheetFixtureOptions): Buffer {
		const data = options?.data ?? DEFAULT_DATA;
		const tsv = data.map((row) => row.join('\t')).join('\n');
		return Buffer.from(tsv, 'utf-8');
	}

	/**
	 * Create a JSON file buffer
	 * @param options - Spreadsheet configuration options
	 * @returns Buffer containing JSON data
	 */
	static createJSON(options?: SpreadsheetFixtureOptions): Buffer {
		const data = options?.data ?? DEFAULT_DATA;
		const [headers, ...rows] = data;
		const objects = rows.map((row) =>
			Object.fromEntries(headers.map((h, i) => [h, row[i]]))
		);
		return Buffer.from(JSON.stringify(objects, null, 2), 'utf-8');
	}

	/**
	 * Create a YAML file buffer
	 * @param options - Spreadsheet configuration options
	 * @returns Buffer containing YAML data
	 */
	static createYAML(options?: SpreadsheetFixtureOptions): Buffer {
		const data = options?.data ?? DEFAULT_DATA;
		const [headers, ...rows] = data;
		const objects = rows.map((row) =>
			Object.fromEntries(headers.map((h, i) => [h, row[i]]))
		);
		// Simple YAML generation (no external dep needed for basic cases)
		const yaml = objects
			.map((obj) => '- ' + Object.entries(obj).map(([k, v]) => `${k}: ${v}`).join('\n  '))
			.join('\n');
		return Buffer.from(yaml, 'utf-8');
	}

	/**
	 * Create an XML file buffer
	 * @param options - Spreadsheet configuration options
	 * @returns Buffer containing XML data
	 */
	static createXML(options?: SpreadsheetFixtureOptions): Buffer {
		const data = options?.data ?? DEFAULT_DATA;
		const [headers, ...rows] = data;
		let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<data>\n';
		rows.forEach((row) => {
			xml += '  <row>\n';
			headers.forEach((h, i) => {
				xml += `    <${h}>${row[i]}</${h}>\n`;
			});
			xml += '  </row>\n';
		});
		xml += '</data>';
		return Buffer.from(xml, 'utf-8');
	}

	/**
	 * Create edge case variations for testing
	 * @returns Object with various edge case buffers
	 */
	static async createVariations(): Promise<Record<string, Buffer>> {
		// Empty XLSX with no data rows
		const emptyXLSX = await SpreadsheetFactory.createXLSX({
			data: [['Header1', 'Header2', 'Header3']]
		});

		// Single row CSV (header only)
		const singleRowCSV = SpreadsheetFactory.createCSV({
			data: [['Column1', 'Column2', 'Column3']]
		});

		// Large CSV (1000 rows)
		const largeData = [['ID', 'Name', 'Value']];
		for (let i = 1; i <= 1000; i++) {
			largeData.push([i.toString(), `Item${i}`, (Math.random() * 1000).toFixed(2)]);
		}
		const largeCSV = SpreadsheetFactory.createCSV({ data: largeData });

		// Special characters in JSON
		const specialCharsJSON = SpreadsheetFactory.createJSON({
			data: [
				['Name', 'Description', 'Notes'],
				['Test "Item"', 'Contains, commas', 'Has\nnewlines'],
				['O\'Reilly', 'Apostrophe\'s test', 'Tab\there']
			]
		});

		// Nested XML structure
		const nestedXML = Buffer.from(
			`<?xml version="1.0" encoding="UTF-8"?>
<data>
  <row>
    <Name>Test</Name>
    <Details>
      <Age>30</Age>
      <City>NYC</City>
    </Details>
  </row>
</data>`,
			'utf-8'
		);

		return {
			emptyXLSX,
			singleRowCSV,
			largeCSV,
			specialCharsJSON,
			nestedXML
		};
	}
}
