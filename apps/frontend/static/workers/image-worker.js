// Initialize Comlink with robust fallback
let Comlink;

// Wrap initialization in async IIFE
(async () => {
	console.log('ImageWorker: Starting initialization...');
	try {
		// Try dynamic import first (may be blocked by extensions)
		Comlink = await import('/lib/comlink.mjs');
		console.log('ImageWorker: Successfully loaded Comlink via import');
	} catch (error) {
		console.warn('ImageWorker: Failed to import Comlink, trying fallback:', error);
		// If import fails, try fetching and evaluating the script
		try {
			const response = await fetch('/lib/comlink.mjs');
			const scriptText = await response.text();
			const moduleExports = {};
			eval(scriptText.replace(/export /g, 'moduleExports.'));
			Comlink = moduleExports;
			console.log('ImageWorker: Successfully loaded Comlink via fetch');
		} catch (fallbackError) {
			console.error('ImageWorker: Failed to load Comlink via fallback, using inline implementation:', fallbackError);
		}
	}
	
	// Continue with initialization after Comlink is loaded
	initializeWorker();
})();

// Function to initialize the worker after Comlink is loaded
function initializeWorker() {
	console.log('ImageWorker: initializeWorker called, Comlink exists:', !!Comlink);
	console.log('ImageWorker: Comlink.expose exists:', !!(Comlink && Comlink.expose));
	
	// Force use of our inline implementation to bypass Comlink issues
	// if (!Comlink || typeof Comlink.expose !== 'function') {
	if (true) { // Force fallback for debugging
		console.warn('ImageWorker: Using inline Comlink fallback implementation (forced for debugging)');
		Comlink = {
			expose: function(obj) {
				self.addEventListener('message', async function(e) {
					console.log('ImageWorker: Received message:', e.data);
					const { id, type, method, args } = e.data;
					
					if (type === 'CALL') {
						try {
							console.log(`ImageWorker: Calling method ${method} with args:`, args);
							if (typeof obj[method] === 'function') {
								const result = await obj[method](...args);
								console.log('ImageWorker: Method completed, sending RESULT:', result);
								self.postMessage({ id, type: 'RESULT', result });
							} else {
								const error = new Error(`Method ${method} not found`);
								console.error('ImageWorker: Method not found error:', error);
								throw error;
							}
						} catch (error) {
							console.error('ImageWorker: Error in message handler:', error);
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
	
	// Create and expose the converter
	console.log('ImageWorker: Creating ImageConverter instance');
	const converter = new ImageConverter();
	
	// Add a raw message listener to see all messages
	self.addEventListener('message', (e) => {
		console.log('ImageWorker: Raw message received:', e.data);
	});
	
	console.log('ImageWorker: Exposing converter via Comlink');
	Comlink.expose(converter);
	console.log('ImageWorker: Worker fully initialized and ready');
}

class ImageConverter {
	constructor() {
		console.log('ImageWorker: ImageConverter constructor called');
		try {
			this.canvas = new OffscreenCanvas(1, 1);
			this.ctx = this.canvas.getContext('2d');
			console.log('ImageWorker: ImageConverter initialized successfully');
		} catch (error) {
			console.error('ImageWorker: Error in ImageConverter constructor:', error);
			throw error;
		}
	}

	async convert(job) {
		try {
			console.log('ImageWorker: Starting conversion for job', job.id, 'from', job.fromFormat, 'to', job.toFormat);
			console.log('ImageWorker: File info', job.file.name, job.file.size, job.file.type);
			
			// Report progress
			self.postMessage({ type: 'progress', id: job.id, progress: 10, message: 'Loading image...' });
			
			// Create blob from file
			const blob = new Blob([await job.file.arrayBuffer()], { type: job.file.type });
			console.log('ImageWorker: Created blob', blob.size, blob.type);
			const bitmap = await createImageBitmap(blob);
			
			self.postMessage({ type: 'progress', id: job.id, progress: 30, message: 'Processing image...' });
			
			// Set canvas dimensions
			this.canvas.width = bitmap.width;
			this.canvas.height = bitmap.height;
			
			// Draw image to canvas
			this.ctx.drawImage(bitmap, 0, 0);
			
			self.postMessage({ type: 'progress', id: job.id, progress: 60, message: 'Converting format...' });
			
			// Get quality setting
			const quality = job.options?.quality || this.getDefaultQuality(job.toFormat);
			
			// Convert to desired format
			let outputBlob;
			const mimeType = this.getMimeType(job.toFormat);
			
			if (job.toFormat === 'png') {
				outputBlob = await this.canvas.convertToBlob({ type: 'image/png' });
			} else if (job.toFormat === 'jpeg' || job.toFormat === 'jpg') {
				outputBlob = await this.canvas.convertToBlob({ type: 'image/jpeg', quality });
			} else if (job.toFormat === 'webp') {
				outputBlob = await this.canvas.convertToBlob({ type: 'image/webp', quality });
			} else if (job.toFormat === 'bmp') {
				// BMP support through Canvas API
				outputBlob = await this.convertToBMP(this.canvas);
			} else {
				// Fallback to PNG for unsupported formats
				outputBlob = await this.canvas.convertToBlob({ type: 'image/png' });
			}
			
			self.postMessage({ type: 'progress', id: job.id, progress: 90, message: 'Finalizing...' });
			
			const filename = this.getOutputFilename(job.file.name, job.toFormat);
			
			// Clean up
			bitmap.close();
			
			self.postMessage({ type: 'progress', id: job.id, progress: 100, message: 'Complete!' });
			
			console.log('ImageWorker: Conversion complete, returning result', filename, outputBlob.size);
			
			return {
				id: job.id,
				outputFile: outputBlob,
				filename: filename,
				mimeType: mimeType
			};
		} catch (error) {
			console.error('ImageWorker: Conversion failed with error:', error);
			console.error('ImageWorker: Error stack:', error.stack);
			throw new Error(`Image conversion failed: ${error.message}`);
		}
	}
	
	async convertToBMP(canvas) {
		// Simple BMP creation (uncompressed)
		const ctx = canvas.getContext('2d');
		const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
		const data = imageData.data;
		
		const width = canvas.width;
		const height = canvas.height;
		const extraBytes = width % 4;
		const rgbSize = height * (3 * width + extraBytes);
		
		const buffer = new ArrayBuffer(54 + rgbSize);
		const view = new DataView(buffer);
		
		// BMP Header
		view.setUint16(0, 0x4D42, false); // 'BM'
		view.setUint32(2, 54 + rgbSize, true); // File size
		view.setUint32(10, 54, true); // Pixel data offset
		
		// DIB Header
		view.setUint32(14, 40, true); // Header size
		view.setUint32(18, width, true);
		view.setUint32(22, height, true);
		view.setUint16(26, 1, true); // Color planes
		view.setUint16(28, 24, true); // Bits per pixel
		view.setUint32(34, rgbSize, true); // Image size
		
		// Pixel data (BGR format, bottom-up)
		let offset = 54;
		for (let y = height - 1; y >= 0; y--) {
			for (let x = 0; x < width; x++) {
				const i = (y * width + x) * 4;
				view.setUint8(offset++, data[i + 2]); // B
				view.setUint8(offset++, data[i + 1]); // G
				view.setUint8(offset++, data[i]); // R
			}
			// Padding
			for (let p = 0; p < extraBytes; p++) {
				view.setUint8(offset++, 0);
			}
		}
		
		return new Blob([buffer], { type: 'image/bmp' });
	}
	
	getDefaultQuality(format) {
		const qualities = {
			'jpeg': 0.85,
			'jpg': 0.85,
			'webp': 0.85
		};
		return qualities[format] || 1.0;
	}
	
	getMimeType(format) {
		const mimeTypes = {
			'png': 'image/png',
			'jpeg': 'image/jpeg',
			'jpg': 'image/jpeg',
			'webp': 'image/webp',
			'gif': 'image/gif',
			'bmp': 'image/bmp',
			'tiff': 'image/tiff',
			'ico': 'image/x-icon'
		};
		return mimeTypes[format] || 'application/octet-stream';
	}
	
	getOutputFilename(inputFilename, toFormat) {
		const baseName = inputFilename.substring(0, inputFilename.lastIndexOf('.'));
		return `${baseName}.${toFormat}`;
	}
}