// Text Worker - handles text, markdown, HTML, JSON, YAML, XML conversions
(function() {
	// Respond to ping immediately
	self.addEventListener('message', function(e) {
		if (e.data.type === 'ping') {
			self.postMessage({ type: 'ready' });
		}
	});
	
	// Inline Comlink implementation for maximum compatibility
	console.warn('TextWorker: Using inline Comlink fallback implementation (forced for debugging)');
	const Comlink = {
		expose: function(obj) {
			self.addEventListener('message', async function(e) {
				console.log('TextWorker: Received message:', e.data);
				const { id, type, method, args } = e.data;
				
				if (type === 'ping') {
					self.postMessage({ type: 'ready' });
					return;
				}
				
				if (type === 'CALL') {
					try {
						console.log(`TextWorker: Calling method ${method} with args:`, args);
						if (typeof obj[method] === 'function') {
							const result = await obj[method](...args);
							console.log('TextWorker: Method completed, sending RESULT:', result);
							self.postMessage({ id, type: 'RESULT', result });
						} else {
							const error = new Error(`Method ${method} not found`);
							console.error('TextWorker: Method not found error:', error);
							throw error;
						}
					} catch (error) {
						console.error('TextWorker: Error in message handler:', error);
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

	class TextConverter {
		async convert(job) {
			try {
				self.postMessage({ type: 'progress', id: job.id, progress: 10, message: 'Reading file...' });
				
				const text = await job.file.text();
				
				self.postMessage({ type: 'progress', id: job.id, progress: 30, message: 'Converting...' });
				
				let outputText;
				let mimeType;
				
				// Route to appropriate converter based on formats
				const conversion = `${job.fromFormat}_to_${job.toFormat}`;
				
				switch(conversion) {
					case 'txt_to_html':
						outputText = this.textToHtml(text);
						mimeType = 'text/html';
						break;
					case 'txt_to_md':
						outputText = this.textToMarkdown(text);
						mimeType = 'text/markdown';
						break;
					case 'md_to_html':
						outputText = this.markdownToHtml(text);
						mimeType = 'text/html';
						break;
					case 'md_to_txt':
						outputText = this.markdownToText(text);
						mimeType = 'text/plain';
						break;
					case 'html_to_md':
						outputText = this.htmlToMarkdown(text);
						mimeType = 'text/markdown';
						break;
					case 'html_to_txt':
						outputText = this.htmlToText(text);
						mimeType = 'text/plain';
						break;
					case 'xml_to_json':
						outputText = this.xmlToJson(text);
						mimeType = 'application/json';
						break;
					case 'json_to_yaml':
						outputText = this.jsonToYaml(text);
						mimeType = 'text/yaml';
						break;
					case 'yaml_to_json':
						outputText = this.yamlToJson(text);
						mimeType = 'application/json';
						break;
					case 'csv_to_json':
						outputText = this.csvToJson(text);
						mimeType = 'application/json';
						break;
					case 'json_to_csv':
						outputText = this.jsonToCsv(text);
						mimeType = 'text/csv';
						break;
					case 'csv_to_tsv':
						outputText = this.csvToTsv(text);
						mimeType = 'text/tab-separated-values';
						break;
					case 'tsv_to_csv':
						outputText = this.tsvToCsv(text);
						mimeType = 'text/csv';
						break;
					case 'csv_to_txt':
						outputText = this.csvToText(text);
						mimeType = 'text/plain';
						break;
					case 'txt_to_csv':
						outputText = this.textToCsv(text);
						mimeType = 'text/csv';
						break;
					case 'json_to_txt':
						outputText = this.jsonToText(text);
						mimeType = 'text/plain';
						break;
					case 'txt_to_json':
						outputText = this.textToJson(text);
						mimeType = 'application/json';
						break;
					default:
						throw new Error(`Conversion from ${job.fromFormat} to ${job.toFormat} not supported`);
				}
				
				self.postMessage({ type: 'progress', id: job.id, progress: 80, message: 'Creating file...' });
				
				const blob = new Blob([outputText], { type: mimeType });
				const filename = this.getOutputFilename(job.file.name, job.toFormat);
				
				self.postMessage({ type: 'progress', id: job.id, progress: 100, message: 'Complete!' });
				
				return {
					id: job.id,
					outputFile: blob,
					filename: filename,
					mimeType: mimeType
				};
			} catch (error) {
				throw new Error(`Text conversion failed: ${error.message}`);
			}
		}
		
		// Simple CSV to JSON converter
		csvToJson(csv) {
			const lines = csv.trim().split('\n');
			if (lines.length === 0) return '[]';
			
			const headers = this.parseCSVLine(lines[0]);
			const result = [];
			
			for (let i = 1; i < lines.length; i++) {
				const values = this.parseCSVLine(lines[i]);
				if (values.length === headers.length) {
					const obj = {};
					headers.forEach((header, index) => {
						obj[header] = values[index];
					});
					result.push(obj);
				}
			}
			
			return JSON.stringify(result, null, 2);
		}
		
		// Helper to parse CSV line
		parseCSVLine(line) {
			const result = [];
			let current = '';
			let inQuotes = false;
			
			for (let i = 0; i < line.length; i++) {
				const char = line[i];
				if (char === '"') {
					inQuotes = !inQuotes;
				} else if (char === ',' && !inQuotes) {
					result.push(current.trim());
					current = '';
				} else {
					current += char;
				}
			}
			result.push(current.trim());
			return result;
		}
		
		// JSON to CSV converter
		jsonToCsv(jsonText) {
			try {
				const data = JSON.parse(jsonText);
				if (!Array.isArray(data) || data.length === 0) return '';
				
				// Get all unique keys from all objects
				const keys = [...new Set(data.flatMap(obj => Object.keys(obj)))];
				
				// Create CSV header
				const csv = [keys.join(',')];
				
				// Add data rows
				for (const obj of data) {
					const row = keys.map(key => {
						const value = obj[key] || '';
						// Quote values that contain commas, quotes, or newlines
						if (String(value).includes(',') || String(value).includes('"') || String(value).includes('\n')) {
							return `"${String(value).replace(/"/g, '""')}"`;
						}
						return String(value);
					});
					csv.push(row.join(','));
				}
				
				return csv.join('\n');
			} catch (e) {
				throw new Error('Invalid JSON data');
			}
		}
		
		// CSV to TSV converter
		csvToTsv(csv) {
			const lines = csv.split('\n');
			return lines.map(line => {
				const values = this.parseCSVLine(line);
				return values.join('\t');
			}).join('\n');
		}
		
		// TSV to CSV converter
		tsvToCsv(tsv) {
			const lines = tsv.split('\n');
			return lines.map(line => {
				const values = line.split('\t');
				return values.map(value => {
					if (value.includes(',') || value.includes('"') || value.includes('\n')) {
						return `"${value.replace(/"/g, '""')}"`;
					}
					return value;
				}).join(',');
			}).join('\n');
		}
		
		// Simple YAML to JSON converter (basic implementation)
		yamlToJson(yamlText) {
			// Very basic YAML parsing - handles simple key-value pairs
			const lines = yamlText.split('\n');
			const result = {};
			let currentIndent = 0;
			let currentObj = result;
			const stack = [result];
			
			for (const line of lines) {
				if (line.trim() === '' || line.trim().startsWith('#')) continue;
				
				const indent = line.search(/\S/);
				const content = line.trim();
				
				if (content.includes(':')) {
					const [key, ...valueParts] = content.split(':');
					const value = valueParts.join(':').trim();
					
					if (value) {
						currentObj[key.trim()] = value.replace(/^['"]|['"]$/g, '');
					} else {
						currentObj[key.trim()] = {};
					}
				}
			}
			
			return JSON.stringify(result, null, 2);
		}
		
		// JSON to YAML converter (basic implementation)
		jsonToYaml(jsonText) {
			try {
				const data = JSON.parse(jsonText);
				return this.objectToYaml(data, 0);
			} catch (e) {
				throw new Error('Invalid JSON data');
			}
		}
		
		objectToYaml(obj, indent) {
			let yaml = '';
			const spaces = '  '.repeat(indent);
			
			for (const [key, value] of Object.entries(obj)) {
				if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
					yaml += `${spaces}${key}:\n${this.objectToYaml(value, indent + 1)}`;
				} else if (Array.isArray(value)) {
					yaml += `${spaces}${key}:\n`;
					for (const item of value) {
						if (typeof item === 'object') {
							yaml += `${spaces}- \n${this.objectToYaml(item, indent + 2)}`;
						} else {
							yaml += `${spaces}- ${item}\n`;
						}
					}
				} else {
					yaml += `${spaces}${key}: ${value}\n`;
				}
			}
			
			return yaml;
		}
		
		// Markdown to HTML converter
		markdownToHtml(markdown) {
			let html = markdown;
			
			// Headers
			html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
			html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
			html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
			
			// Bold
			html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
			html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
			
			// Italic
			html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
			html = html.replace(/_(.+?)_/g, '<em>$1</em>');
			
			// Links
			html = html.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2">$1</a>');
			
			// Code blocks
			html = html.replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>');
			
			// Inline code
			html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
			
			// Line breaks
			html = html.replace(/\n/g, '<br>\n');
			
			// Wrap in basic HTML structure
			return `<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<style>
		body { font-family: -apple-system, sans-serif; line-height: 1.6; padding: 20px; max-width: 800px; margin: 0 auto; }
		code { background: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
		pre { background: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto; }
	</style>
</head>
<body>
${html}
</body>
</html>`;
		}
		
		// HTML to Markdown converter
		htmlToMarkdown(html) {
			let markdown = html;
			
			// Remove HTML structure tags
			markdown = markdown.replace(/<\/?html[^>]*>/gi, '');
			markdown = markdown.replace(/<\/?head[^>]*>/gi, '');
			markdown = markdown.replace(/<\/?body[^>]*>/gi, '');
			markdown = markdown.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
			markdown = markdown.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
			
			// Headers
			markdown = markdown.replace(/<h1[^>]*>(.+?)<\/h1>/gi, '# $1\n');
			markdown = markdown.replace(/<h2[^>]*>(.+?)<\/h2>/gi, '## $1\n');
			markdown = markdown.replace(/<h3[^>]*>(.+?)<\/h3>/gi, '### $1\n');
			
			// Bold
			markdown = markdown.replace(/<strong[^>]*>(.+?)<\/strong>/gi, '**$1**');
			markdown = markdown.replace(/<b[^>]*>(.+?)<\/b>/gi, '**$1**');
			
			// Italic
			markdown = markdown.replace(/<em[^>]*>(.+?)<\/em>/gi, '*$1*');
			markdown = markdown.replace(/<i[^>]*>(.+?)<\/i>/gi, '*$1*');
			
			// Links
			markdown = markdown.replace(/<a[^>]*href="([^"]*)"[^>]*>(.+?)<\/a>/gi, '[$2]($1)');
			
			// Code
			markdown = markdown.replace(/<code[^>]*>(.+?)<\/code>/gi, '`$1`');
			markdown = markdown.replace(/<pre[^>]*>(.+?)<\/pre>/gis, '```\n$1\n```');
			
			// Line breaks and paragraphs
			markdown = markdown.replace(/<br[^>]*>/gi, '\n');
			markdown = markdown.replace(/<p[^>]*>/gi, '\n');
			markdown = markdown.replace(/<\/p>/gi, '\n');
			
			// Clean up
			markdown = markdown.replace(/<[^>]+>/g, '');
			markdown = markdown.trim();
			
			return markdown;
		}
		
		// Simple XML to JSON converter
		xmlToJson(xml) {
			// Basic XML parsing - creates a simple JSON representation
			const parser = new DOMParser();
			const doc = parser.parseFromString(xml, 'text/xml');
			
			function xmlNodeToJson(node) {
				const obj = {};
				
				// Attributes
				if (node.attributes && node.attributes.length > 0) {
					obj['@attributes'] = {};
					for (let i = 0; i < node.attributes.length; i++) {
						const attr = node.attributes[i];
						obj['@attributes'][attr.name] = attr.value;
					}
				}
				
				// Children
				if (node.hasChildNodes()) {
					for (let i = 0; i < node.childNodes.length; i++) {
						const child = node.childNodes[i];
						
						if (child.nodeType === 1) { // Element node
							if (!obj[child.nodeName]) {
								obj[child.nodeName] = xmlNodeToJson(child);
							} else {
								if (!Array.isArray(obj[child.nodeName])) {
									obj[child.nodeName] = [obj[child.nodeName]];
								}
								obj[child.nodeName].push(xmlNodeToJson(child));
							}
						} else if (child.nodeType === 3) { // Text node
							const text = child.nodeValue.trim();
							if (text) {
								obj['#text'] = text;
							}
						}
					}
				}
				
				return obj;
			}
			
			const result = xmlNodeToJson(doc.documentElement);
			return JSON.stringify({ [doc.documentElement.nodeName]: result }, null, 2);
		}
		
		// Text to Markdown converter
		textToMarkdown(text) {
			let md = text;
			
			// Convert URLs to markdown links
			md = md.replace(/(https?:\/\/[^\s]+)/g, '[$1]($1)');
			
			// Convert lines that look like headers
			md = md.replace(/^([A-Z][A-Z\s]+)$/gm, '# $1');
			
			// Convert bullet points
			md = md.replace(/^[\*\-•]\s+/gm, '- ');
			
			// Convert numbered lists
			md = md.replace(/^(\d+)[\.)\]]\s+/gm, '$1. ');
			
			return md;
		}
		
		// Text to HTML converter
		textToHtml(text) {
			// Convert plain text to HTML
			let html = '<!DOCTYPE html>\n<html>\n<head>\n<meta charset="UTF-8">\n<title>Converted Document</title>\n</head>\n<body>\n';
			
			// Escape HTML special characters
			text = text.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;')
				.replace(/"/g, '&quot;')
				.replace(/'/g, '&#039;');
			
			// Convert URLs to links
			text = text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1">$1</a>');
			
			// Convert line breaks to paragraphs
			const paragraphs = text.split(/\n\n+/);
			html += paragraphs.map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('\n');
			
			html += '\n</body>\n</html>';
			return html;
		}
		
		// Markdown to plain text converter
		markdownToText(markdown) {
			let text = markdown;
			
			// Remove headers
			text = text.replace(/^#{1,6}\s+/gm, '');
			
			// Remove emphasis
			text = text.replace(/[*_]{1,2}([^*_]+)[*_]{1,2}/g, '$1');
			
			// Remove links but keep text
			text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
			
			// Remove images
			text = text.replace(/!\[[^\]]*\]\([^)]+\)/g, '');
			
			// Remove code blocks
			text = text.replace(/```[\s\S]*?```/g, '');
			text = text.replace(/`([^`]+)`/g, '$1');
			
			return text.trim();
		}
		
		// HTML to plain text converter
		htmlToText(html) {
			// Convert HTML to plain text (DOMParser not available in Web Worker)
			let text = html;

			// Remove script and style tags with their content
			text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
			text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

			// Convert common block-level tags to newlines
			text = text.replace(/<br\s*\/?>/gi, '\n');
			text = text.replace(/<\/p>/gi, '\n\n');
			text = text.replace(/<\/div>/gi, '\n');
			text = text.replace(/<\/h[1-6]>/gi, '\n\n');
			text = text.replace(/<\/tr>/gi, '\n');
			text = text.replace(/<\/li>/gi, '\n');

			// Add list prefixes
			text = text.replace(/<li[^>]*>/gi, '- ');

			// Remove all remaining HTML tags
			text = text.replace(/<[^>]+>/g, '');

			// Decode common HTML entities
			text = text.replace(/&nbsp;/g, ' ');
			text = text.replace(/&amp;/g, '&');
			text = text.replace(/&lt;/g, '<');
			text = text.replace(/&gt;/g, '>');
			text = text.replace(/&quot;/g, '"');
			text = text.replace(/&#039;/g, "'");
			text = text.replace(/&apos;/g, "'");

			// Normalize whitespace
			text = text.replace(/\n{3,}/g, '\n\n');  // Max 2 consecutive newlines
			text = text.replace(/[ \t]+/g, ' ');      // Collapse spaces/tabs
			text = text.replace(/^\s+|\s+$/gm, '');   // Trim lines

			return text.trim();
		}
		
		// Additional conversion methods
		csvToText(csv) {
			const lines = csv.split('\n');
			return lines.map(line => {
				const values = this.parseCSVLine(line);
				return values.join('\t'); // Tab-separated for readability
			}).join('\n');
		}

		textToCsv(text) {
			const lines = text.split('\n').filter(line => line.trim());
			// Simple heuristic: if lines contain tabs, assume tab-separated; otherwise comma-separated
			return lines.map(line => {
				const values = line.includes('\t') ? line.split('\t') : line.split(',');
				return values.map(value => {
					const trimmed = value.trim();
					if (trimmed.includes(',') || trimmed.includes('"') || trimmed.includes('\n')) {
						return `"${trimmed.replace(/"/g, '""')}"`;
					}
					return trimmed;
				}).join(',');
			}).join('\n');
		}

		jsonToText(jsonText) {
			try {
				const data = JSON.parse(jsonText);
				if (Array.isArray(data)) {
					// Convert array to readable text
					return data.map((item, index) => {
						if (typeof item === 'object') {
							return `Item ${index + 1}:\n${this.objectToText(item, 1)}`;
						}
						return `${index + 1}. ${item}`;
					}).join('\n\n');
				} else if (typeof data === 'object') {
					return this.objectToText(data, 0);
				}
				return String(data);
			} catch (e) {
				throw new Error('Invalid JSON data');
			}
		}

		objectToText(obj, indent = 0) {
			const spaces = '  '.repeat(indent);
			let text = '';
			for (const [key, value] of Object.entries(obj)) {
				if (typeof value === 'object' && value !== null) {
					text += `${spaces}${key}:\n${this.objectToText(value, indent + 1)}\n`;
				} else {
					text += `${spaces}${key}: ${value}\n`;
				}
			}
			return text;
		}

		textToJson(text) {
			// Simple text to JSON conversion - creates a basic structure
			const lines = text.split('\n').filter(line => line.trim());
			const result = {
				content: lines,
				lineCount: lines.length,
				wordCount: lines.join(' ').split(/\s+/).length
			};
			return JSON.stringify(result, null, 2);
		}

		getOutputFilename(inputFilename, toFormat) {
			const baseName = inputFilename.substring(0, inputFilename.lastIndexOf('.'));
			return `${baseName}.${toFormat}`;
		}
	}

	// Expose the converter
	const converter = new TextConverter();
	Comlink.expose(converter);
})();