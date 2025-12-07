import { Page } from '@playwright/test';

export type WorkerType = 'image' | 'audio' | 'document' | 'spreadsheet' | 'archive' | 'text';

export class WorkerLifecycle {
	private activeWorkers: Set<WorkerType> = new Set();

	constructor(private readonly page: Page) {}

	/**
	 * Wait for a worker to be ready
	 * Waits for both worker script to load AND worker to initialize in the page
	 *
	 * @param workerType - Type of worker to wait for
	 * @param timeout - Optional timeout in milliseconds (default 5000ms)
	 */
	async waitForWorkerReady(workerType: WorkerType, timeout: number = 5000): Promise<void> {
		this.activeWorkers.add(workerType);

		try {
			await Promise.all([
				// Wait for worker script to be requested/loaded
				this.page.waitForResponse(
					(response) => response.url().includes(`${workerType}-worker.js`),
					{ timeout }
				),

				// Wait for worker manager to initialize the worker
				this.page.waitForFunction(
					(type) => {
						// Check if worker manager exists and has initialized this worker type
						const manager = (window as any).__workerManager;
						if (!manager) return false;

						// WorkerManager stores workers in a private Map, but we can check if conversion works
						// by seeing if the worker type is recognized
						return typeof manager.convert === 'function';
					},
					workerType,
					{ timeout }
				)
			]);

			console.log(`Worker ${workerType} is ready`);
		} catch (error) {
			console.error(`Failed to initialize ${workerType} worker:`, error);
			throw error;
		}
	}

	/**
	 * Wait for worker manager to be available
	 * @param timeout - Optional timeout in milliseconds (default 5000ms)
	 */
	async waitForWorkerManager(timeout: number = 5000): Promise<void> {
		await this.page.waitForFunction(
			() => {
				return typeof (window as any).__workerManager !== 'undefined';
			},
			{ timeout }
		);
	}

	/**
	 * Check if a worker is ready without waiting
	 * @param workerType - Type of worker to check
	 * @returns True if worker is ready
	 */
	async isWorkerReady(workerType: WorkerType): Promise<boolean> {
		return await this.page.evaluate((type) => {
			const manager = (window as any).__workerManager;
			if (!manager) return false;
			return typeof manager.convert === 'function';
		}, workerType);
	}

	/**
	 * Terminate all active workers
	 * Called automatically in fixture teardown
	 */
	async terminateAll(): Promise<void> {
		if (this.activeWorkers.size === 0) {
			return;
		}

		try {
			// Call terminate on the worker manager
			await this.page.evaluate(() => {
				const manager = (window as any).__workerManager;
				if (manager && typeof manager.terminate === 'function') {
					manager.terminate();
					console.log('All workers terminated');
				}
			});

			console.log(`Terminated ${this.activeWorkers.size} worker(s)`);
		} catch (error) {
			// Ignore termination errors (page may be closed)
			console.warn('Failed to terminate workers:', error);
		} finally {
			this.activeWorkers.clear();
		}
	}

	/**
	 * Get count of active workers
	 * @returns Number of active workers
	 */
	getActiveWorkerCount(): number {
		return this.activeWorkers.size;
	}

	/**
	 * Wait for a conversion job to complete
	 * Useful for waiting for worker processing
	 *
	 * @param timeout - Optional timeout in milliseconds (default 30000ms)
	 */
	async waitForConversionComplete(timeout: number = 30000): Promise<void> {
		// Wait for conversion complete indicator
		// This could be a success message, download button, or progress indicator at 100%
		await Promise.race([
			this.page.waitForSelector('[data-testid="conversion-complete"]', { timeout }),
			this.page.waitForSelector('.conversion-success', { timeout }),
			this.page.waitForSelector('button:has-text("Download")', { timeout })
		]);
	}

	/**
	 * Wait for conversion to fail with an error
	 * @param timeout - Optional timeout in milliseconds (default 10000ms)
	 */
	async waitForConversionError(timeout: number = 10000): Promise<void> {
		await Promise.race([
			this.page.waitForSelector('[data-testid="conversion-error"]', { timeout }),
			this.page.waitForSelector('.conversion-error', { timeout }),
			this.page.waitForSelector('.error-message', { timeout })
		]);
	}
}
