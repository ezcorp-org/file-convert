// Spreadsheet Worker - handles XLSX, CSV, TSV conversions
(function() {
	// Respond to ping immediately
	self.addEventListener('message', function(e) {
		if (e.data.type === 'ping') {
			self.postMessage({ type: 'ready' });
		}
	});
	
	// Inline Comlink implementation for maximum compatibility
	console.warn('SpreadsheetWorker: Using inline Comlink fallback implementation (forced for debugging)');
	const Comlink = {
		expose: function(obj) {
			self.addEventListener('message', async function(e) {
				console.log('SpreadsheetWorker: Received message:', e.data);
				const { id, type, method, args } = e.data;
				
				if (type === 'ping') {
					self.postMessage({ type: 'ready' });
					return;
				}
				
				if (type === 'CALL') {
					try {
						console.log(`SpreadsheetWorker: Calling method ${method} with args:`, args);
						if (typeof obj[method] === 'function') {
							const result = await obj[method](...args);
							console.log('SpreadsheetWorker: Method completed, sending RESULT:', result);
							self.postMessage({ id, type: 'RESULT', result });
						} else {
							const error = new Error(`Method ${method} not found`);
							console.error('SpreadsheetWorker: Method not found error:', error);
							throw error;
						}
					} catch (error) {
						console.error('SpreadsheetWorker: Error in message handler:', error);
						self.postMessage({ 
							id, 
							type: 'ERROR', 
							error: { 
								message: error.message, 
								stack: error.stack,
								name: error.name 
							}
						});
					}
				}
			});
		}
	};

	// Lazy load SheetJS when needed
	let XLSX = null;
	
	async function loadXLSX() {
		if (XLSX) return XLSX;
		
		try {
			// Try to load SheetJS from CDN
			const response = await fetch('https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js');
			const scriptText = await response.text();
			eval(scriptText);
			XLSX = self.XLSX;
			console.log('SheetJS loaded successfully');
			return XLSX;
		} catch (error) {
			console.error('Failed to load SheetJS:', error);
			throw new Error('Could not load spreadsheet library');
		}
	}

	class SpreadsheetConverter {
		async convert(job) {
			try {
				self.postMessage({ type: 'progress', id: job.id, progress: 10, message: 'Loading spreadsheet...' });
				
				// Route to appropriate converter
				if (job.fromFormat === 'xlsx') {
					return await this.convertFromXLSX(job);
				} else if (job.toFormat === 'xlsx') {
					return await this.convertToXLSX(job);
				} else if (job.fromFormat === 'csv' && job.toFormat === 'tsv') {
					return await this.csvToTsv(job);
				} else if (job.fromFormat === 'tsv' && job.toFormat === 'csv') {
					return await this.tsvToCsv(job);
				} else if (job.fromFormat === 'csv' && job.toFormat === 'json') {
					return await this.csvToJson(job);
				} else if (job.fromFormat === 'csv' && job.toFormat === 'txt') {
					return await this.csvToTxt(job);
				} else if (job.fromFormat === 'json' && job.toFormat === 'csv') {
					return await this.jsonToCsv(job);
				} else {
					throw new Error(`Unsupported conversion: ${job.fromFormat} to ${job.toFormat}`);
				}
			} catch (error) {
				throw new Error(`Spreadsheet conversion failed: ${error.message}`);
			}
		}
		
		async convertFromXLSX(job) {
			// Load SheetJS
			await loadXLSX();
			
			self.postMessage({ type: 'progress', id: job.id, progress: 20, message: 'Reading Excel file...' });
			
			const arrayBuffer = await job.file.arrayBuffer();
			const workbook = XLSX.read(arrayBuffer, { type: 'array' });
			
			self.postMessage({ type: 'progress', id: job.id, progress: 50, message: 'Converting...' });
			
			let outputData;
			let mimeType;
			let extension = job.toFormat;
			
			if (job.toFormat === 'csv') {
				// Convert first sheet to CSV
				const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
				outputData = XLSX.utils.sheet_to_csv(firstSheet);
				mimeType = 'text/csv';
			} else if (job.toFormat === 'json') {
				// Convert all sheets to JSON
				const result = {};
				workbook.SheetNames.forEach(sheetName => {
					result[sheetName] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
				});
				outputData = JSON.stringify(result, null, 2);
				mimeType = 'application/json';
			} else {
				throw new Error(`Unsupported output format: ${job.toFormat}`);
			}
			
			self.postMessage({ type: 'progress', id: job.id, progress: 80, message: 'Creating output file...' });
			
			const blob = new Blob([outputData], { type: mimeType });
			const filename = this.getOutputFilename(job.file.name, extension);
			
			self.postMessage({ type: 'progress', id: job.id, progress: 100, message: 'Complete!' });
			
			return {
				id: job.id,
				outputFile: blob,
				filename: filename,
				mimeType: mimeType
			};
		}
		
		async convertToXLSX(job) {
			// Load SheetJS
			await loadXLSX();
			
			self.postMessage({ type: 'progress', id: job.id, progress: 20, message: 'Reading file...' });
			
			const text = await job.file.text();
			let workbook;
			
			self.postMessage({ type: 'progress', id: job.id, progress: 50, message: 'Creating Excel file...' });
			
			if (job.fromFormat === 'csv') {
				// Parse CSV and create workbook
				const worksheet = XLSX.utils.aoa_to_sheet(this.parseCSV(text));
				workbook = XLSX.utils.book_new();
				XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
			} else if (job.fromFormat === 'json') {
				// Parse JSON and create workbook
				const data = JSON.parse(text);
				workbook = XLSX.utils.book_new();
				
				if (Array.isArray(data)) {
					// Single sheet from array
					const worksheet = XLSX.utils.json_to_sheet(data);
					XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
				} else if (typeof data === 'object') {
					// Multiple sheets from object
					Object.keys(data).forEach(sheetName => {
						const sheetData = data[sheetName];
						if (Array.isArray(sheetData)) {
							const worksheet = XLSX.utils.json_to_sheet(sheetData);
							XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
						}
					});
				}
			} else {
				throw new Error(`Unsupported conversion: ${job.fromFormat} to XLSX`);
			}
			
			self.postMessage({ type: 'progress', id: job.id, progress: 80, message: 'Writing Excel file...' });
			
			// Write workbook to array buffer
			const arrayBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
			const blob = new Blob([arrayBuffer], { 
				type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
			});
			
			const filename = this.getOutputFilename(job.file.name, 'xlsx');
			
			self.postMessage({ type: 'progress', id: job.id, progress: 100, message: 'Complete!' });
			
			return {
				id: job.id,
				outputFile: blob,
				filename: filename,
				mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
			};
		}
		
		// Simple CSV parser
		parseCSV(text) {
			const rows = [];
			const lines = text.split('\n');
			
			for (const line of lines) {
				if (line.trim()) {
					rows.push(this.parseCSVLine(line));
				}
			}
			
			return rows;
		}
		
		parseCSVLine(line) {
			const result = [];
			let current = '';
			let inQuotes = false;
			
			for (let i = 0; i < line.length; i++) {
				const char = line[i];
				if (char === '"') {
					if (inQuotes && line[i + 1] === '"') {
						current += '"';
						i++; // Skip next quote
					} else {
						inQuotes = !inQuotes;
					}
				} else if (char === ',' && !inQuotes) {
					result.push(current);
					current = '';
				} else {
					current += char;
				}
			}
			result.push(current);
			return result;
		}
		
		// CSV to TSV converter (without SheetJS)
		async csvToTsv(job) {
			self.postMessage({ type: 'progress', id: job.id, progress: 20, message: 'Reading CSV...' });
			
			const text = await job.file.text();
			const rows = this.parseCSV(text);
			
			self.postMessage({ type: 'progress', id: job.id, progress: 50, message: 'Converting to TSV...' });
			
			const tsv = rows.map(row => row.join('\t')).join('\n');
			
			self.postMessage({ type: 'progress', id: job.id, progress: 80, message: 'Creating file...' });
			
			const blob = new Blob([tsv], { type: 'text/tab-separated-values' });
			const filename = this.getOutputFilename(job.file.name, 'tsv');
			
			self.postMessage({ type: 'progress', id: job.id, progress: 100, message: 'Complete!' });
			
			return {
				id: job.id,
				outputFile: blob,
				filename: filename,
				mimeType: 'text/tab-separated-values'
			};
		}
		
		// TSV to CSV converter (without SheetJS)
		async tsvToCsv(job) {
			self.postMessage({ type: 'progress', id: job.id, progress: 20, message: 'Reading TSV...' });
			
			const text = await job.file.text();
			const lines = text.split('\n');
			
			self.postMessage({ type: 'progress', id: job.id, progress: 50, message: 'Converting to CSV...' });
			
			const csv = lines.map(line => {
				const values = line.split('\t');
				return values.map(value => {
					// Quote values that contain commas, quotes, or newlines
					if (value.includes(',') || value.includes('"') || value.includes('\n')) {
						return `"${value.replace(/"/g, '""')}"`;
					}
					return value;
				}).join(',');
			}).join('\n');
			
			self.postMessage({ type: 'progress', id: job.id, progress: 80, message: 'Creating file...' });
			
			const blob = new Blob([csv], { type: 'text/csv' });
			const filename = this.getOutputFilename(job.file.name, 'csv');
			
			self.postMessage({ type: 'progress', id: job.id, progress: 100, message: 'Complete!' });
			
			return {
				id: job.id,
				outputFile: blob,
				filename: filename,
				mimeType: 'text/csv'
			};
		}
		
		// CSV to JSON converter
		async csvToJson(job) {
			self.postMessage({ type: 'progress', id: job.id, progress: 20, message: 'Reading CSV...' });
			
			const text = await job.file.text();
			const rows = this.parseCSV(text);
			
			if (rows.length === 0) {
				throw new Error('CSV file is empty');
			}
			
			self.postMessage({ type: 'progress', id: job.id, progress: 50, message: 'Converting to JSON...' });
			
			// Use first row as headers
			const headers = rows[0];
			const data = rows.slice(1).map(row => {
				const obj = {};
				headers.forEach((header, index) => {
					obj[header] = row[index] || '';
				});
				return obj;
			});
			
			const jsonString = JSON.stringify(data, null, 2);
			
			self.postMessage({ type: 'progress', id: job.id, progress: 80, message: 'Creating file...' });
			
			const blob = new Blob([jsonString], { type: 'application/json' });
			const filename = this.getOutputFilename(job.file.name, 'json');
			
			self.postMessage({ type: 'progress', id: job.id, progress: 100, message: 'Complete!' });
			
			return {
				id: job.id,
				outputFile: blob,
				filename: filename,
				mimeType: 'application/json'
			};
		}
		
		// CSV to TXT converter
		async csvToTxt(job) {
			self.postMessage({ type: 'progress', id: job.id, progress: 20, message: 'Reading CSV...' });
			
			const text = await job.file.text();
			const rows = this.parseCSV(text);
			
			self.postMessage({ type: 'progress', id: job.id, progress: 50, message: 'Converting to text...' });
			
			// Convert to plain text with tab-separated values for better readability
			const txtContent = rows.map(row => row.join('\t')).join('\n');
			
			self.postMessage({ type: 'progress', id: job.id, progress: 80, message: 'Creating file...' });
			
			const blob = new Blob([txtContent], { type: 'text/plain' });
			const filename = this.getOutputFilename(job.file.name, 'txt');
			
			self.postMessage({ type: 'progress', id: job.id, progress: 100, message: 'Complete!' });
			
			return {
				id: job.id,
				outputFile: blob,
				filename: filename,
				mimeType: 'text/plain'
			};
		}
		
		// JSON to CSV converter
		async jsonToCsv(job) {
			self.postMessage({ type: 'progress', id: job.id, progress: 20, message: 'Reading JSON...' });
			
			const text = await job.file.text();
			let data;
			
			try {
				data = JSON.parse(text);
			} catch (error) {
				throw new Error('Invalid JSON format');
			}
			
			self.postMessage({ type: 'progress', id: job.id, progress: 50, message: 'Converting to CSV...' });
			
			// Handle different JSON structures
			let rows = [];
			
			if (Array.isArray(data)) {
				// JSON array - convert directly
				if (data.length === 0) {
					throw new Error('JSON array is empty');
				}
				
				// Extract headers from first object
				const headers = Object.keys(data[0]);
				rows.push(headers);
				
				// Convert each object to row
				data.forEach(obj => {
					const row = headers.map(header => {
						const value = obj[header];
						return value != null ? String(value) : '';
					});
					rows.push(row);
				});
				
			} else if (typeof data === 'object' && data !== null) {
				// JSON object - treat as single row or multiple sheets
				const keys = Object.keys(data);
				
				// Check if it's a multi-sheet structure (all values are arrays)
				const isMultiSheet = keys.every(key => Array.isArray(data[key]));
				
				if (isMultiSheet && keys.length > 0) {
					// Use first sheet for CSV conversion
					const firstSheetKey = keys[0];
					const sheetData = data[firstSheetKey];
					
					if (sheetData.length === 0) {
						throw new Error('First sheet is empty');
					}
					
					const headers = Object.keys(sheetData[0]);
					rows.push(headers);
					
					sheetData.forEach(obj => {
						const row = headers.map(header => {
							const value = obj[header];
							return value != null ? String(value) : '';
						});
						rows.push(row);
					});
				} else {
					// Single object - convert to single row CSV
					const headers = keys;
					const values = keys.map(key => {
						const value = data[key];
						return value != null ? String(value) : '';
					});
					
					rows.push(headers);
					rows.push(values);
				}
			} else {
				throw new Error('JSON must be an object or array');
			}
			
			// Convert rows to CSV format with proper escaping
			const csv = rows.map(row => {
				return row.map(value => {
					// Quote values that contain commas, quotes, or newlines
					if (value.includes(',') || value.includes('"') || value.includes('\n')) {
						return `"${value.replace(/"/g, '""')}"`;
					}
					return value;
				}).join(',');
			}).join('\n');
			
			self.postMessage({ type: 'progress', id: job.id, progress: 80, message: 'Creating file...' });
			
			const blob = new Blob([csv], { type: 'text/csv' });
			const filename = this.getOutputFilename(job.file.name, 'csv');
			
			self.postMessage({ type: 'progress', id: job.id, progress: 100, message: 'Complete!' });
			
			return {
				id: job.id,
				outputFile: blob,
				filename: filename,
				mimeType: 'text/csv'
			};
		}
		
		getOutputFilename(inputFilename, toFormat) {
			const baseName = inputFilename.substring(0, inputFilename.lastIndexOf('.'));
			return `${baseName}.${toFormat}`;
		}
	}

	// Expose the converter
	const converter = new SpreadsheetConverter();
	Comlink.expose(converter);
})();