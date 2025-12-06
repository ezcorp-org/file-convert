/// <reference lib="webworker" />
import * as Comlink from 'comlink';
import * as fflate from 'fflate';
import type { ConversionJob, ConversionResult, ProgressMessage, WorkerApi } from '../types/worker-types';

declare const self: DedicatedWorkerGlobalScope;

type FileMap = Record<string, Uint8Array>;

class ArchiveConverter implements WorkerApi {
	async convert(job: ConversionJob): Promise<ConversionResult> {
		try {
			this.postProgress(job.id, 10, 'Reading archive...');
			
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
			throw new Error(`Archive conversion failed: ${(error as Error).message}`);
		}
	}
	
	private postProgress(id: string, progress: number, message: string): void {
		const msg: ProgressMessage = { type: 'progress', id, progress, message };
		self.postMessage(msg);
	}
	
	private async recompressZip(job: ConversionJob, data: Uint8Array): Promise<ConversionResult> {
		this.postProgress(job.id, 30, 'Decompressing...');
		
		// Decompress ZIP
		const decompressed = fflate.unzipSync(data);
		
		this.postProgress(job.id, 60, 'Recompressing...');
		
		// Recompress with specified level
		const level = job.options?.compressionLevel || 6;
		const compressed = fflate.zipSync(decompressed, { level });
		
		this.postProgress(job.id, 90, 'Finalizing...');
		
		const blob = new Blob([compressed], { type: 'application/zip' });
		const filename = this.getOutputFilename(job.file.name, 'zip');
		
		return {
			id: job.id,
			outputFile: blob,
			filename: filename,
			mimeType: 'application/zip'
		};
	}
	
	private async convertFromZip(job: ConversionJob, data: Uint8Array): Promise<ConversionResult> {
		this.postProgress(job.id, 30, 'Extracting files...');
		
		// Decompress ZIP
		const files = fflate.unzipSync(data);
		
		this.postProgress(job.id, 60, 'Creating archive...');
		
		let outputData: Uint8Array;
		let mimeType: string;
		
		if (job.toFormat === 'tar') {
			outputData = this.createTar(files);
			mimeType = 'application/x-tar';
		} else if (job.toFormat === 'tgz') {
			const tarData = this.createTar(files);
			outputData = fflate.gzipSync(tarData, { level: 6 });
			mimeType = 'application/gzip';
		} else {
			throw new Error(`Unsupported output format: ${job.toFormat}`);
		}
		
		this.postProgress(job.id, 90, 'Finalizing...');
		
		const blob = new Blob([outputData], { type: mimeType });
		const filename = this.getOutputFilename(job.file.name, job.toFormat);
		
		return {
			id: job.id,
			outputFile: blob,
			filename: filename,
			mimeType: mimeType
		};
	}
	
	private async convertToZip(job: ConversionJob, data: Uint8Array): Promise<ConversionResult> {
		this.postProgress(job.id, 30, 'Processing archive...');
		
		let files: FileMap = {};
		
		if (job.fromFormat === 'tar') {
			files = this.extractTar(data);
		} else if (job.fromFormat === 'tgz') {
			const gunzipped = fflate.gunzipSync(data);
			files = this.extractTar(gunzipped);
		} else {
			// Single file to ZIP
			files[job.file.name] = data;
		}
		
		this.postProgress(job.id, 60, 'Creating ZIP...');
		
		const level = job.options?.compressionLevel || 6;
		const compressed = fflate.zipSync(files, { level });
		
		this.postProgress(job.id, 90, 'Finalizing...');
		
		const blob = new Blob([compressed], { type: 'application/zip' });
		const filename = this.getOutputFilename(job.file.name, 'zip');
		
		return {
			id: job.id,
			outputFile: blob,
			filename: filename,
			mimeType: 'application/zip'
		};
	}
	
	private createTar(files: FileMap): Uint8Array {
		// Simple TAR creation (uncompressed)
		const encoder = new TextEncoder();
		const blocks: Uint8Array[] = [];
		
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
	
	private extractTar(data: Uint8Array): FileMap {
		const files: FileMap = {};
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
	
	private getOutputFilename(inputFilename: string, toFormat: string): string {
		const baseName = inputFilename.substring(0, inputFilename.lastIndexOf('.'));
		// Handle compound extensions
		if (baseName.endsWith('.tar')) {
			return baseName.substring(0, baseName.lastIndexOf('.')) + '.' + toFormat;
		}
		return `${baseName}.${toFormat}`;
	}
}

const converter = new ArchiveConverter();
Comlink.expose(converter);