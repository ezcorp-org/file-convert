import { Page } from '@playwright/test';
import { readFileSync } from 'fs';

export type FileData = {
	name: string;
	mimeType: string;
	buffer: Buffer;
};

export class FileHelper {
	constructor(private readonly page: Page) {}

	/**
	 * Upload a single file to the file input
	 * @param fileData - Either a FileData object with buffer or a string path to file
	 * @returns Count of uploaded files (should be 1)
	 */
	async uploadFile(fileData: FileData | string): Promise<number> {
		const fileInput = this.page.locator('input[type="file"]');

		if (typeof fileData === 'string') {
			// File path provided - use setInputFiles directly
			await fileInput.setInputFiles(fileData);
		} else {
			// Buffer provided - use setInputFiles with buffer
			await fileInput.setInputFiles({
				name: fileData.name,
				mimeType: fileData.mimeType,
				buffer: fileData.buffer
			});
		}

		// Wait for file to appear in the UI using web-first assertion
		await this.page.locator('.file-item').first().waitFor({ state: 'visible' });

		// Return count of uploaded files
		const fileItems = await this.page.locator('.file-item').count();
		return fileItems;
	}

	/**
	 * Upload multiple files at once
	 * @param files - Array of FileData objects or file paths
	 * @returns Count of uploaded files
	 */
	async uploadFiles(files: Array<FileData | string>): Promise<number> {
		const fileInput = this.page.locator('input[type="file"]');

		const fileInputs = files.map(file => {
			if (typeof file === 'string') {
				return file;
			} else {
				return {
					name: file.name,
					mimeType: file.mimeType,
					buffer: file.buffer
				};
			}
		});

		await fileInput.setInputFiles(fileInputs);

		// Wait for at least one file to appear
		await this.page.locator('.file-item').first().waitFor({ state: 'visible' });

		// Return count of uploaded files
		const fileItems = await this.page.locator('.file-item').count();
		return fileItems;
	}

	/**
	 * Create a test file buffer with given content
	 * @param content - File content as string or Buffer
	 * @param name - File name
	 * @param mimeType - MIME type
	 * @returns FileData object
	 */
	createFileData(content: string | Buffer, name: string, mimeType: string): FileData {
		return {
			name,
			mimeType,
			buffer: typeof content === 'string' ? Buffer.from(content, 'utf-8') : content
		};
	}

	/**
	 * Load a file from the filesystem
	 * @param path - Path to file
	 * @param name - Optional override for file name
	 * @param mimeType - MIME type
	 * @returns FileData object
	 */
	loadFile(path: string, name?: string, mimeType?: string): FileData {
		const buffer = readFileSync(path);
		const fileName = name || path.split('/').pop() || 'file';
		const type = mimeType || this.getMimeType(fileName);

		return {
			name: fileName,
			mimeType: type,
			buffer
		};
	}

	/**
	 * Get MIME type from file extension
	 * @param filename - File name with extension
	 * @returns MIME type
	 */
	private getMimeType(filename: string): string {
		const ext = filename.split('.').pop()?.toLowerCase();
		const mimeTypes: Record<string, string> = {
			txt: 'text/plain',
			png: 'image/png',
			jpg: 'image/jpeg',
			jpeg: 'image/jpeg',
			webp: 'image/webp',
			gif: 'image/gif',
			pdf: 'application/pdf',
			csv: 'text/csv',
			json: 'application/json',
			xml: 'application/xml',
			zip: 'application/zip',
			wav: 'audio/wav',
			mp3: 'audio/mpeg'
		};
		return mimeTypes[ext || ''] || 'application/octet-stream';
	}
}
