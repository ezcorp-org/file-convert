/// <reference lib="webworker" />
import * as Comlink from 'comlink';
import type { ConversionJob, ConversionResult, ProgressMessage, WorkerApi } from '../types/worker-types';

declare const self: DedicatedWorkerGlobalScope;

class ImageConverter implements WorkerApi {
	private canvas: OffscreenCanvas;
	private ctx: OffscreenCanvasRenderingContext2D;

	constructor() {
		this.canvas = new OffscreenCanvas(1, 1);
		this.ctx = this.canvas.getContext('2d')!;
	}

	async convert(job: ConversionJob): Promise<ConversionResult> {
		try {
			// Report progress
			this.postProgress(job.id, 10, 'Loading image...');
			
			// Create blob from file
			const blob = new Blob([await job.file.arrayBuffer()], { type: job.file.type });
			const bitmap = await createImageBitmap(blob);
			
			this.postProgress(job.id, 30, 'Processing image...');
			
			// Set canvas dimensions
			this.canvas.width = bitmap.width;
			this.canvas.height = bitmap.height;
			
			// Draw image to canvas
			this.ctx.drawImage(bitmap, 0, 0);
			
			this.postProgress(job.id, 60, 'Converting format...');
			
			// Get quality setting
			const quality = job.options?.quality || this.getDefaultQuality(job.toFormat);
			
			// Convert to desired format
			let outputBlob: Blob;
			const mimeType = this.getMimeType(job.toFormat);
			
			if (job.toFormat === 'png') {
				outputBlob = await this.canvas.convertToBlob({ type: 'image/png' });
			} else if (job.toFormat === 'jpeg' || job.toFormat === 'jpg') {
				outputBlob = await this.canvas.convertToBlob({ type: 'image/jpeg', quality });
			} else if (job.toFormat === 'webp') {
				outputBlob = await this.canvas.convertToBlob({ type: 'image/webp', quality });
			} else if (job.toFormat === 'bmp') {
				// BMP support through custom implementation
				outputBlob = await this.convertToBMP(this.canvas);
			} else {
				// Fallback to PNG for unsupported formats
				outputBlob = await this.canvas.convertToBlob({ type: 'image/png' });
			}
			
			this.postProgress(job.id, 90, 'Finalizing...');
			
			const filename = this.getOutputFilename(job.file.name, job.toFormat);
			
			// Clean up
			bitmap.close();
			
			this.postProgress(job.id, 100, 'Complete!');
			
			return {
				id: job.id,
				outputFile: outputBlob,
				filename: filename,
				mimeType: mimeType
			};
		} catch (error) {
			throw new Error(`Image conversion failed: ${(error as Error).message}`);
		}
	}
	
	private postProgress(id: string, progress: number, message: string): void {
		const msg: ProgressMessage = { type: 'progress', id, progress, message };
		self.postMessage(msg);
	}
	
	private async convertToBMP(canvas: OffscreenCanvas): Promise<Blob> {
		// Simple BMP creation (uncompressed)
		const ctx = canvas.getContext('2d')!;
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
	
	private getDefaultQuality(format: string): number {
		const qualities: Record<string, number> = {
			'jpeg': 0.85,
			'jpg': 0.85,
			'webp': 0.85
		};
		return qualities[format] || 1.0;
	}
	
	private getMimeType(format: string): string {
		const mimeTypes: Record<string, string> = {
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
	
	private getOutputFilename(inputFilename: string, toFormat: string): string {
		const baseName = inputFilename.substring(0, inputFilename.lastIndexOf('.'));
		return `${baseName}.${toFormat}`;
	}
}

const converter = new ImageConverter();
Comlink.expose(converter);