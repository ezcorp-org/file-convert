import { test as base, expect } from '@playwright/test';
import { FileHelper } from './file-helpers';
import { DownloadHelper } from './download-helpers';
import { WorkerLifecycle } from './worker-lifecycle';

/**
 * Custom fixtures for file conversion tests
 *
 * Usage:
 * ```typescript
 * import { test, expect } from './fixtures';
 *
 * test('my test', async ({ page, fileHelper, downloadHelper, workerLifecycle }) => {
 *   // All fixtures are automatically available
 *   await fileHelper.uploadFile('test.png');
 *   const result = await downloadHelper.downloadFile('button[download]');
 * });
 * ```
 */
type ConversionFixtures = {
	fileHelper: FileHelper;
	downloadHelper: DownloadHelper;
	workerLifecycle: WorkerLifecycle;
};

export const test = base.extend<ConversionFixtures>({
	/**
	 * File upload helper
	 * Provides utilities for uploading files to the application
	 */
	fileHelper: async ({ page }, use) => {
		const helper = new FileHelper(page);
		await use(helper);
		// No cleanup needed for file helper
	},

	/**
	 * Download helper
	 * Provides race-condition-free download handling
	 * Automatically cleans up downloaded files after test
	 */
	downloadHelper: async ({ page }, use) => {
		const helper = new DownloadHelper(page);
		await use(helper);
		// Cleanup downloaded files
		await helper.cleanup();
	},

	/**
	 * Worker lifecycle manager
	 * Manages Web Worker initialization and cleanup
	 * Automatically terminates workers after test
	 */
	workerLifecycle: async ({ page }, use) => {
		const helper = new WorkerLifecycle(page);
		await use(helper);
		// Terminate all workers
		await helper.terminateAll();
	}
});

// Re-export expect from Playwright
export { expect };

// Export timeout utilities
export { calculateTimeout, applyTimeout, bytesToMB, getComplexityForConversion, createTimeoutConfig } from './timeout-config';
export type { TimeoutConfig, ComplexityLevel } from './timeout-config';

// Export types for use in tests
export type { FileData } from './file-helpers';
export type { WorkerType } from './worker-lifecycle';
