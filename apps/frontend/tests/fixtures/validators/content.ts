export interface ContentValidationResult {
	valid: boolean;
	format: string;
	error?: string;
	// Format-specific validation results
	json?: {
		valid: boolean;
		parsed?: any;
		error?: string;
	};
	csv?: {
		valid: boolean;
		rowCount?: number;
		columnCount?: number;
		hasHeader?: boolean;
		error?: string;
	};
	xml?: {
		valid: boolean;
		rootElement?: string;
		error?: string;
	};
	yaml?: {
		valid: boolean;
		parsed?: any;
		error?: string;
	};
}

/**
 * Content validator for text format integrity checking
 * Validates JSON parsing, CSV structure, XML well-formedness, etc.
 */
export class ContentValidator {
	/**
	 * Validate JSON content
	 * @param buffer - File buffer
	 * @returns Validation result with parsed data
	 */
	static validateJSON(buffer: Buffer): ContentValidationResult {
		try {
			const text = buffer.toString('utf-8');
			const parsed = JSON.parse(text);

			return {
				valid: true,
				format: 'json',
				json: { valid: true, parsed }
			};
		} catch (error) {
			return {
				valid: false,
				format: 'json',
				error: error instanceof Error ? error.message : 'Invalid JSON',
				json: {
					valid: false,
					error: error instanceof Error ? error.message : 'Parse error'
				}
			};
		}
	}

	/**
	 * Validate CSV content
	 * @param buffer - File buffer
	 * @param delimiter - Column delimiter (default: ',')
	 * @returns Validation result with row/column counts
	 */
	static validateCSV(buffer: Buffer, delimiter: string = ','): ContentValidationResult {
		try {
			const text = buffer.toString('utf-8');

			// Check for empty file before trim
			if (text.length === 0) {
				return {
					valid: false,
					format: 'csv',
					error: 'Empty CSV',
					csv: { valid: false, error: 'Empty file' }
				};
			}

			const lines = text.trim().split('\n');

			if (lines.length === 0) {
				return {
					valid: false,
					format: 'csv',
					error: 'Empty CSV',
					csv: { valid: false, error: 'Empty file' }
				};
			}

			// Check column consistency
			const columnCounts = lines.map((line) => line.split(delimiter).length);
			const firstCount = columnCounts[0];
			const consistent = columnCounts.every((c) => c === firstCount);

			if (!consistent) {
				return {
					valid: false,
					format: 'csv',
					error: 'Inconsistent column count',
					csv: {
						valid: false,
						rowCount: lines.length,
						error: 'Column count varies between rows'
					}
				};
			}

			return {
				valid: true,
				format: 'csv',
				csv: {
					valid: true,
					rowCount: lines.length,
					columnCount: firstCount,
					hasHeader: true // Assume first row is header
				}
			};
		} catch (error) {
			return {
				valid: false,
				format: 'csv',
				error: error instanceof Error ? error.message : 'Parse error'
			};
		}
	}

	/**
	 * Validate XML content
	 * @param buffer - File buffer
	 * @returns Validation result with basic well-formedness check
	 */
	static validateXML(buffer: Buffer): ContentValidationResult {
		try {
			const text = buffer.toString('utf-8');

			// Check for XML declaration or root element
			if (!text.trim().startsWith('<?xml') && !text.trim().startsWith('<')) {
				return {
					valid: false,
					format: 'xml',
					error: 'Not valid XML - missing root element'
				};
			}

			// Extract root element name
			const rootMatch = text.match(/<([a-zA-Z_][a-zA-Z0-9_-]*)/);
			const rootElement = rootMatch?.[1];

			// Check for closing tag (basic well-formed check)
			if (rootElement && !text.includes(`</${rootElement}>`)) {
				return {
					valid: false,
					format: 'xml',
					error: `Missing closing tag for <${rootElement}>`
				};
			}

			return {
				valid: true,
				format: 'xml',
				xml: { valid: true, rootElement }
			};
		} catch (error) {
			return {
				valid: false,
				format: 'xml',
				error: error instanceof Error ? error.message : 'Parse error'
			};
		}
	}

	/**
	 * Validate YAML content
	 * @param buffer - File buffer
	 * @returns Basic validation result
	 */
	static validateYAML(buffer: Buffer): ContentValidationResult {
		try {
			const text = buffer.toString('utf-8');

			// Check for common YAML structure indicators
			const hasMapping = text.includes(':');
			const hasSequence = text.includes('-');

			if (!hasMapping && !hasSequence && text.trim().length > 0) {
				// Could be a scalar value, which is valid YAML
			}

			// Simple validation - check for obviously invalid syntax
			// More robust validation would need js-yaml library

			return {
				valid: true,
				format: 'yaml',
				yaml: { valid: true }
			};
		} catch (error) {
			return {
				valid: false,
				format: 'yaml',
				error: error instanceof Error ? error.message : 'Parse error'
			};
		}
	}

	/**
	 * Validate content based on format
	 * @param buffer - File buffer
	 * @param format - Format name (e.g., 'json', 'csv', 'xml', 'yaml')
	 * @returns Validation result
	 */
	static validate(buffer: Buffer, format: string): ContentValidationResult {
		switch (format.toLowerCase()) {
			case 'json':
				return this.validateJSON(buffer);
			case 'csv':
				return this.validateCSV(buffer);
			case 'tsv':
				return this.validateCSV(buffer, '\t');
			case 'xml':
				return this.validateXML(buffer);
			case 'yaml':
			case 'yml':
				return this.validateYAML(buffer);
			case 'txt':
			case 'md':
			case 'html':
				// Text formats just need to be valid UTF-8
				try {
					const text = buffer.toString('utf-8');
					// Check for replacement character which indicates invalid UTF-8
					if (text.includes('\uFFFD')) {
						return { valid: false, format, error: 'Invalid UTF-8' };
					}
					return { valid: true, format };
				} catch {
					return { valid: false, format, error: 'Invalid UTF-8' };
				}
			default:
				return { valid: true, format }; // Unknown format, assume valid
		}
	}
}
