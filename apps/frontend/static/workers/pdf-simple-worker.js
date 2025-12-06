// Initialize Comlink with robust fallback
let Comlink;

// Wrap initialization in async IIFE
(async () => {
	try {
		// Try dynamic import first (may be blocked by extensions)
		Comlink = await import('/lib/comlink.mjs');
	} catch (error) {
		console.warn('Failed to import Comlink, trying fallback:', error);
		// If import fails, try fetching and evaluating the script
		try {
			const response = await fetch('/lib/comlink.mjs');
			const scriptText = await response.text();
			const moduleExports = {};
			eval(scriptText.replace(/export /g, 'moduleExports.'));
			Comlink = moduleExports;
		} catch (fallbackError) {
			console.error('Failed to load Comlink via fallback, using inline implementation:', fallbackError);
		}
	}
	
	// Continue with initialization after Comlink is loaded
	initializeWorker();
})();

// Function to initialize the worker after Comlink is loaded
function initializeWorker() {
	// Inline Comlink fallback if all loading methods fail
	if (!Comlink || typeof Comlink.expose !== 'function') {
	console.warn('Using inline Comlink fallback implementation');
	Comlink = {
		expose: function(obj) {
			self.addEventListener('message', async function(e) {
				const { id, type, method, args } = e.data;
				
				if (type === 'CALL') {
					try {
						if (typeof obj[method] === 'function') {
							const result = await obj[method](...args);
							self.postMessage({ id, type: 'RESULT', result });
						} else {
							throw new Error(`Method ${method} not found`);
						}
					} catch (error) {
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
}

class SimplePDFConverter {
	async convert(job) {
		try {
			self.postMessage({ type: 'progress', id: job.id, progress: 10, message: 'Processing PDF...' });
			
			if (job.toFormat === 'txt') {
				// For text extraction, we need PDF.js
				// Return a simple message for now
				const message = `PDF to text conversion requires PDF.js library.
				
This is a placeholder conversion.
Original file: ${job.file.name}
Size: ${job.file.size} bytes

To enable full PDF support, please use the desktop version or enable cross-origin resource sharing.`;
				
				const blob = new Blob([message], { type: 'text/plain' });
				const filename = this.getOutputFilename(job.file.name, 'txt');
				
				self.postMessage({ type: 'progress', id: job.id, progress: 100, message: 'Complete!' });
				
				return {
					id: job.id,
					outputFile: blob,
					filename: filename,
					mimeType: 'text/plain'
				};
			} else if (job.toFormat === 'png' || job.toFormat === 'jpeg' || job.toFormat === 'jpg') {
				// For image conversion, we'll create a placeholder
				// In production, you'd use a server-side API or bundled PDF.js
				return await this.createPlaceholderImage(job);
			}
			
			throw new Error(`Unsupported conversion: PDF to ${job.toFormat}`);
		} catch (error) {
			throw new Error(`PDF conversion failed: ${error.message}`);
		}
	}
	
	async createPlaceholderImage(job) {
		self.postMessage({ type: 'progress', id: job.id, progress: 30, message: 'Creating preview...' });
		
		// Create a canvas with placeholder content
		const canvas = new OffscreenCanvas(800, 600);
		const ctx = canvas.getContext('2d');
		
		// White background
		ctx.fillStyle = 'white';
		ctx.fillRect(0, 0, 800, 600);
		
		// Border
		ctx.strokeStyle = '#e5e5e5';
		ctx.lineWidth = 2;
		ctx.strokeRect(10, 10, 780, 580);
		
		// Title
		ctx.fillStyle = '#333';
		ctx.font = 'bold 24px sans-serif';
		ctx.textAlign = 'center';
		ctx.fillText('PDF Preview', 400, 50);
		
		// File info
		ctx.font = '16px sans-serif';
		ctx.fillStyle = '#666';
		ctx.fillText(`File: ${job.file.name}`, 400, 100);
		ctx.fillText(`Size: ${(job.file.size / 1024).toFixed(2)} KB`, 400, 130);
		
		// Message
		ctx.font = '14px sans-serif';
		ctx.fillStyle = '#999';
		const message = [
			'Full PDF rendering requires additional libraries.',
			'For complete PDF support, please:',
			'1. Use the desktop version of this application',
			'2. Or configure your browser to allow cross-origin resources',
			'3. Or use a server-side conversion API'
		];
		
		message.forEach((line, i) => {
			ctx.fillText(line, 400, 200 + (i * 25));
		});
		
		// Add PDF icon
		ctx.font = '72px sans-serif';
		ctx.fillStyle = '#ddd';
		ctx.fillText('📄', 400, 400);
		
		self.postMessage({ type: 'progress', id: job.id, progress: 70, message: 'Converting to image...' });
		
		let blob;
		let mimeType;
		
		if (job.toFormat === 'png') {
			blob = await canvas.convertToBlob({ type: 'image/png' });
			mimeType = 'image/png';
		} else {
			blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.9 });
			mimeType = 'image/jpeg';
		}
		
		const filename = this.getOutputFilename(job.file.name, job.toFormat);
		
		self.postMessage({ type: 'progress', id: job.id, progress: 100, message: 'Complete!' });
		
		return {
			id: job.id,
			outputFile: blob,
			filename: filename,
			mimeType: mimeType
		};
	}
	
	getOutputFilename(inputFilename, toFormat) {
		const baseName = inputFilename.substring(0, inputFilename.lastIndexOf('.'));
		return `${baseName}.${toFormat}`;
	}
}

	const converter = new SimplePDFConverter();
	Comlink.expose(converter);
}