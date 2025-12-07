import { Page, Download } from '@playwright/test';
import { readFileSync, unlinkSync, existsSync } from 'fs';

export class DownloadHelper {
	private downloads: Download[] = [];
	private downloadPaths: string[] = [];

	constructor(private readonly page: Page) {}

	/**
	 * Download a file by clicking a trigger element
	 * CRITICAL: Uses promise-before-click pattern to prevent race conditions
	 *
	 * @param triggerSelector - CSS selector for element that triggers download
	 * @returns Download metadata and buffer
	 */
	async downloadFile(triggerSelector: string): Promise<{ filename: string; buffer: Buffer }> {
		// CRITICAL: Set up download promise BEFORE clicking
		// This prevents race conditions where download starts before we're listening
		const downloadPromise = this.page.waitForEvent('download');

		// Click the trigger element
		await this.page.locator(triggerSelector).click();

		// Wait for download to complete
		const download = await downloadPromise;
		this.downloads.push(download);

		// Get suggested filename
		const filename = download.suggestedFilename();

		// Save to temporary location and read buffer
		const path = await download.path();
		if (!path) {
			throw new Error('Download path is null - download may have failed');
		}

		this.downloadPaths.push(path);
		const buffer = readFileSync(path);

		return { filename, buffer };
	}

	/**
	 * Download file and save to specific path
	 * @param triggerSelector - CSS selector for element that triggers download
	 * @param savePath - Path to save downloaded file
	 * @returns Download metadata
	 */
	async downloadAndSave(
		triggerSelector: string,
		savePath: string
	): Promise<{ filename: string; path: string }> {
		// CRITICAL: Promise before click pattern
		const downloadPromise = this.page.waitForEvent('download');
		await this.page.locator(triggerSelector).click();
		const download = await downloadPromise;

		this.downloads.push(download);
		const filename = download.suggestedFilename();

		// Save to specified path
		await download.saveAs(savePath);
		this.downloadPaths.push(savePath);

		return { filename, path: savePath };
	}

	/**
	 * Validate file extension matches expected
	 * @param filename - Downloaded filename
	 * @param expected - Expected extension (e.g., 'png', 'pdf')
	 * @returns True if extension matches
	 */
	validateExtension(filename: string, expected: string): boolean {
		const ext = filename.split('.').pop()?.toLowerCase();
		const expectedExt = expected.toLowerCase().replace(/^\./, '');
		return ext === expectedExt;
	}

	/**
	 * Validate MIME type from buffer content
	 * @param buffer - File buffer
	 * @param expectedType - Expected MIME type or file signature
	 * @returns True if type matches
	 */
	validateMimeType(buffer: Buffer, expectedType: string): boolean {
		// Check file signatures (magic numbers)
		const signatures: Record<string, Buffer> = {
			png: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
			jpeg: Buffer.from([0xff, 0xd8, 0xff]),
			pdf: Buffer.from([0x25, 0x50, 0x44, 0x46]),
			zip: Buffer.from([0x50, 0x4b, 0x03, 0x04]),
			gif: Buffer.from([0x47, 0x49, 0x46, 0x38])
		};

		const type = expectedType.toLowerCase();
		const signature = signatures[type];

		if (signature) {
			return buffer.subarray(0, signature.length).equals(signature);
		}

		// For text-based files, just check it's valid UTF-8
		if (['txt', 'csv', 'json', 'xml', 'html'].includes(type)) {
			try {
				buffer.toString('utf-8');
				return true;
			} catch {
				return false;
			}
		}

		return true; // Unknown type, assume valid
	}

	/**
	 * Get file size in bytes
	 * @param buffer - File buffer
	 * @returns Size in bytes
	 */
	getFileSize(buffer: Buffer): number {
		return buffer.length;
	}

	/**
	 * Clean up downloaded files
	 * Called automatically in fixture teardown
	 */
	async cleanup(): Promise<void> {
		// Delete downloaded files
		for (const path of this.downloadPaths) {
			try {
				if (existsSync(path)) {
					unlinkSync(path);
				}
			} catch (error) {
				// Ignore cleanup errors
				console.warn(`Failed to clean up download: ${path}`, error);
			}
		}

		// Delete downloads through Playwright API
		for (const download of this.downloads) {
			try {
				await download.delete();
			} catch (error) {
				// Ignore cleanup errors
				console.warn('Failed to delete download', error);
			}
		}

		this.downloads = [];
		this.downloadPaths = [];
	}
}
