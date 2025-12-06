// Load fflate via importScripts to avoid top-level await issues
importScripts('https://unpkg.com/fflate@0.8.2/umd/index.js');

class ArchiveConverter {
	async convert(job) {
		try {
			self.postMessage({ type: 'progress', id: job.id, progress: 10, message: 'Reading archive...' });
			
			const arrayBuffer = await job.file.arrayBuffer();
			const uint8Array = new Uint8Array(arrayBuffer);
			
			if (job.fromFormat === 'zip' && job.toFormat === 'zip') {
				// Recompress ZIP with different settings
				return await this.recompressZip(job, uint8Array);
			} else if (job.fromFormat === 'zip') {
				// Extract and repackage
				return await this.convertFromZip(job, uint8Array);
			} else if (job.toFormat === 'zip') {
				// Convert to ZIP
				return await this.convertToZip(job, uint8Array);
			} else {
				throw new Error(`Conversion from ${job.fromFormat} to ${job.toFormat} not yet supported`);
			}
		} catch (error) {
			throw new Error(`Archive conversion failed: ${error.message}`);
		}
	}
	
	async recompressZip(job, data) {
		self.postMessage({ type: 'progress', id: job.id, progress: 30, message: 'Decompressing...' });
		
		// Decompress ZIP
		const decompressed = self.fflate.unzipSync(data);
		
		self.postMessage({ type: 'progress', id: job.id, progress: 60, message: 'Recompressing...' });
		
		// Recompress with specified level
		const level = job.options?.compressionLevel || 6;
		const compressed = self.fflate.zipSync(decompressed, { level });
		
		self.postMessage({ type: 'progress', id: job.id, progress: 90, message: 'Finalizing...' });
		
		const blob = new Blob([compressed], { type: 'application/zip' });
		const filename = this.getOutputFilename(job.file.name, 'zip');
		
		return {
			id: job.id,
			outputFile: blob,
			filename: filename,
			mimeType: 'application/zip'
		};
	}
	
	async convertFromZip(job, data) {
		self.postMessage({ type: 'progress', id: job.id, progress: 30, message: 'Extracting files...' });
		
		// Decompress ZIP
		const files = self.fflate.unzipSync(data);
		
		self.postMessage({ type: 'progress', id: job.id, progress: 60, message: 'Creating archive...' });
		
		let outputData;
		let mimeType;
		
		if (job.toFormat === 'tar') {
			outputData = this.createTar(files);
			mimeType = 'application/x-tar';
		} else if (job.toFormat === 'tgz') {
			const tarData = this.createTar(files);
			outputData = self.fflate.gzipSync(tarData, { level: 6 });
			mimeType = 'application/gzip';
		} else {
			throw new Error(`Unsupported output format: ${job.toFormat}`);
		}
		
		self.postMessage({ type: 'progress', id: job.id, progress: 90, message: 'Finalizing...' });
		
		const blob = new Blob([outputData], { type: mimeType });
		const filename = this.getOutputFilename(job.file.name, job.toFormat);
		
		return {
			id: job.id,
			outputFile: blob,
			filename: filename,
			mimeType: mimeType
		};
	}
	
	async convertToZip(job, data) {
		self.postMessage({ type: 'progress', id: job.id, progress: 30, message: 'Processing archive...' });
		
		let files = {};
		
		if (job.fromFormat === 'tar') {
			files = this.extractTar(data);
		} else if (job.fromFormat === 'tgz') {
			const gunzipped = self.fflate.gunzipSync(data);
			files = this.extractTar(gunzipped);
		} else {
			// Single file to ZIP
			files[job.file.name] = data;
		}
		
		self.postMessage({ type: 'progress', id: job.id, progress: 60, message: 'Creating ZIP...' });
		
		const level = job.options?.compressionLevel || 6;
		const compressed = self.fflate.zipSync(files, { level });
		
		self.postMessage({ type: 'progress', id: job.id, progress: 90, message: 'Finalizing...' });
		
		const blob = new Blob([compressed], { type: 'application/zip' });
		const filename = this.getOutputFilename(job.file.name, 'zip');
		
		return {
			id: job.id,
			outputFile: blob,
			filename: filename,
			mimeType: 'application/zip'
		};
	}
	
	createTar(files) {
		// Simple TAR creation (uncompressed)
		const encoder = new TextEncoder();
		const blocks = [];
		
		for (const [path, data] of Object.entries(files)) {
			// TAR header (512 bytes)
			const header = new Uint8Array(512);
			
			// File name (100 bytes max)
			const nameBytes = encoder.encode(path);
			header.set(nameBytes.slice(0, 100), 0);
			
			// File mode (octal)
			header.set(encoder.encode('0000644'), 100);
			
			// File size (octal)
			const size = data.length;
			const sizeOctal = size.toString(8).padStart(11, '0');
			header.set(encoder.encode(sizeOctal), 124);
			
			// Checksum placeholder
			header.set(encoder.encode('        '), 148);
			
			// Type flag (regular file)
			header[156] = 48; // '0'
			
			// Calculate checksum
			let checksum = 0;
			for (let i = 0; i < 512; i++) {
				checksum += header[i];
			}
			const checksumOctal = checksum.toString(8).padStart(6, '0');
			header.set(encoder.encode(checksumOctal), 148);
			
			blocks.push(header);
			blocks.push(data);
			
			// Padding to 512-byte boundary
			const padding = 512 - (data.length % 512);
			if (padding < 512) {
				blocks.push(new Uint8Array(padding));
			}
		}
		
		// End of archive marker (two 512-byte blocks of zeros)
		blocks.push(new Uint8Array(1024));
		
		// Combine all blocks
		const totalSize = blocks.reduce((sum, block) => sum + block.length, 0);
		const result = new Uint8Array(totalSize);
		let offset = 0;
		for (const block of blocks) {
			result.set(block, offset);
			offset += block.length;
		}
		
		return result;
	}
	
	extractTar(data) {
		const files = {};
		const decoder = new TextDecoder();
		let offset = 0;
		
		while (offset < data.length - 1024) {
			// Read header
			const header = data.slice(offset, offset + 512);
			
			// Check for end of archive
			if (header[0] === 0) break;
			
			// Extract file name
			const nameEnd = header.indexOf(0);
			const name = decoder.decode(header.slice(0, nameEnd));
			
			// Extract file size
			const sizeOctal = decoder.decode(header.slice(124, 135)).trim();
			const size = parseInt(sizeOctal, 8);
			
			// Extract file data
			offset += 512;
			files[name] = data.slice(offset, offset + size);
			
			// Move to next header
			offset += size;
			if (offset % 512 !== 0) {
				offset += 512 - (offset % 512);
			}
		}
		
		return files;
	}
	
	getOutputFilename(inputFilename, toFormat) {
		const baseName = inputFilename.substring(0, inputFilename.lastIndexOf('.'));
		// Handle compound extensions
		if (baseName.endsWith('.tar')) {
			return baseName.substring(0, baseName.lastIndexOf('.')) + '.' + toFormat;
		}
		return `${baseName}.${toFormat}`;
	}
}

const converter = new ArchiveConverter();

// Add compatibility layer for both Comlink and standard message format
console.warn('ArchiveWorker: Using inline Comlink fallback implementation (forced for debugging)');
self.addEventListener('message', async function(e) {
	console.log('ArchiveWorker: Received message:', e.data);
	const { id, type, method, args, job } = e.data;
	
	if (type === 'ping') {
		self.postMessage({ type: 'ready' });
		return;
	}
	
	// Handle Comlink format
	if (type === 'CALL' && method === 'convert') {
		try {
			console.log(`ArchiveWorker: Calling method ${method} with args:`, args);
			const result = await converter.convert(args[0]); // First argument is the job
			console.log('ArchiveWorker: Method completed, sending RESULT:', result);
			self.postMessage({ id, type: 'RESULT', result });
		} catch (error) {
			console.error('ArchiveWorker: Error in message handler:', error);
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
		return;
	}
	
	// Handle legacy format
	if (type === 'convert' && job) {
		try {
			const result = await converter.convert(job);
			self.postMessage({ 
				type: 'complete', 
				id: job.id, 
				result 
			});
		} catch (error) {
			console.error('Archive conversion error:', error);
			self.postMessage({ 
				type: 'error', 
				id: job.id, 
				error: error.message || 'Archive conversion failed'
			});
		}
	}
});

// Worker is ready