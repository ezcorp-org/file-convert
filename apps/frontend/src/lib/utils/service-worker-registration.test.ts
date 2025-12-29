import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Helper to create a mock registration object
function createMockRegistration(overrides: Record<string, any> = {}) {
	return {
		scope: '/',
		active: null,
		waiting: null,
		installing: null,
		update: vi.fn().mockResolvedValue(undefined),
		unregister: vi.fn().mockResolvedValue(true),
		addEventListener: vi.fn(),
		...overrides
	};
}

// Helper to set up navigator.serviceWorker mock
function setupServiceWorkerMock(overrides: Record<string, any> = {}) {
	const sw = {
		register: vi.fn(),
		getRegistration: vi.fn().mockResolvedValue(undefined),
		getRegistrations: vi.fn().mockResolvedValue([]),
		controller: null,
		addEventListener: vi.fn(),
		...overrides
	};
	Object.defineProperty(navigator, 'serviceWorker', {
		value: sw,
		writable: true,
		configurable: true
	});
	return sw;
}

function removeServiceWorker() {
	// Must delete so that 'serviceWorker' in navigator === false
	delete (navigator as any).serviceWorker;
}

describe('service-worker-registration', () => {
	let originalImportMetaEnv: Record<string, any>;

	beforeEach(() => {
		vi.resetModules();
		originalImportMetaEnv = { ...import.meta.env };
	});

	afterEach(() => {
		vi.restoreAllMocks();
		// Restore env
		Object.keys(import.meta.env).forEach(key => {
			if (!(key in originalImportMetaEnv)) {
				delete (import.meta.env as any)[key];
			}
		});
		Object.assign(import.meta.env, originalImportMetaEnv);
	});

	describe('registerServiceWorker', () => {
		it('should do nothing when serviceWorker is not supported', async () => {
			removeServiceWorker();
			const { registerServiceWorker } = await import('./service-worker-registration');
			// Should not throw
			await registerServiceWorker();
		});

		it('should unregister existing workers in dev mode', async () => {
			const mockReg = createMockRegistration();
			const sw = setupServiceWorkerMock({
				getRegistrations: vi.fn().mockResolvedValue([mockReg])
			});

			// DEV is true in vitest by default
			import.meta.env.DEV = true;
			delete (import.meta.env as any).VITE_ENABLE_SW;

			const { registerServiceWorker } = await import('./service-worker-registration');
			await registerServiceWorker();

			expect(sw.getRegistrations).toHaveBeenCalled();
			expect(mockReg.unregister).toHaveBeenCalled();
		});

		it('should register when VITE_ENABLE_SW is set even in dev', async () => {
			const mockReg = createMockRegistration();
			const sw = setupServiceWorkerMock({
				getRegistration: vi.fn().mockResolvedValue(undefined),
				register: vi.fn().mockResolvedValue(mockReg)
			});

			import.meta.env.DEV = true;
			(import.meta.env as any).VITE_ENABLE_SW = 'true';

			const { registerServiceWorker } = await import('./service-worker-registration');
			await registerServiceWorker();

			expect(sw.register).toHaveBeenCalledWith('/service-worker.js', { scope: '/' });
		});

		it('should update existing registration in production', async () => {
			const existingReg = createMockRegistration();
			const sw = setupServiceWorkerMock({
				getRegistration: vi.fn().mockResolvedValue(existingReg)
			});

			import.meta.env.DEV = false;

			const { registerServiceWorker } = await import('./service-worker-registration');
			await registerServiceWorker();

			expect(existingReg.update).toHaveBeenCalled();
			expect(sw.register).not.toHaveBeenCalled();
		});

		it('should register new worker when none exists in production', async () => {
			const newReg = createMockRegistration();
			const sw = setupServiceWorkerMock({
				getRegistration: vi.fn().mockResolvedValue(undefined),
				register: vi.fn().mockResolvedValue(newReg)
			});

			import.meta.env.DEV = false;

			const { registerServiceWorker } = await import('./service-worker-registration');
			await registerServiceWorker();

			expect(sw.register).toHaveBeenCalledWith('/service-worker.js', { scope: '/' });
			expect(newReg.addEventListener).toHaveBeenCalledWith('updatefound', expect.any(Function));
			expect(sw.addEventListener).toHaveBeenCalledWith('controllerchange', expect.any(Function));
		});

		it('should clean up registrations on registration failure', async () => {
			const mockReg = createMockRegistration();
			setupServiceWorkerMock({
				getRegistration: vi.fn().mockRejectedValue(new Error('fail')),
				getRegistrations: vi.fn().mockResolvedValue([mockReg])
			});

			import.meta.env.DEV = false;

			const { registerServiceWorker } = await import('./service-worker-registration');
			await registerServiceWorker();

			expect(mockReg.unregister).toHaveBeenCalled();
		});

		it('should handle cleanup failure gracefully', async () => {
			setupServiceWorkerMock({
				getRegistration: vi.fn().mockRejectedValue(new Error('fail')),
				getRegistrations: vi.fn().mockRejectedValue(new Error('cleanup fail'))
			});

			import.meta.env.DEV = false;

			const { registerServiceWorker } = await import('./service-worker-registration');
			// Should not throw
			await registerServiceWorker();
		});
	});

	describe('unregisterServiceWorker', () => {
		it('should do nothing when serviceWorker is not supported', async () => {
			removeServiceWorker();
			const { unregisterServiceWorker } = await import('./service-worker-registration');
			await unregisterServiceWorker();
		});

		it('should unregister all registrations and clear caches', async () => {
			const mockReg = createMockRegistration();
			setupServiceWorkerMock({
				getRegistrations: vi.fn().mockResolvedValue([mockReg])
			});

			// Mock caches API
			const mockCaches = {
				keys: vi.fn().mockResolvedValue(['cache-v1', 'cache-v2']),
				delete: vi.fn().mockResolvedValue(true)
			};
			Object.defineProperty(window, 'caches', {
				value: mockCaches,
				writable: true,
				configurable: true
			});

			const { unregisterServiceWorker } = await import('./service-worker-registration');
			await unregisterServiceWorker();

			expect(mockReg.unregister).toHaveBeenCalled();
			expect(mockCaches.keys).toHaveBeenCalled();
			expect(mockCaches.delete).toHaveBeenCalledWith('cache-v1');
			expect(mockCaches.delete).toHaveBeenCalledWith('cache-v2');
		});

		it('should handle errors gracefully', async () => {
			setupServiceWorkerMock({
				getRegistrations: vi.fn().mockRejectedValue(new Error('fail'))
			});

			const { unregisterServiceWorker } = await import('./service-worker-registration');
			// Should not throw
			await unregisterServiceWorker();
		});
	});

	describe('getServiceWorkerStatus', () => {
		it('should return unsupported when serviceWorker not available', async () => {
			removeServiceWorker();
			const { getServiceWorkerStatus } = await import('./service-worker-registration');
			const status = await getServiceWorkerStatus();
			expect(status).toEqual({ supported: false });
		});

		it('should return status with no registrations', async () => {
			setupServiceWorkerMock({
				getRegistrations: vi.fn().mockResolvedValue([]),
				controller: null
			});

			const { getServiceWorkerStatus } = await import('./service-worker-registration');
			const status = await getServiceWorkerStatus();

			expect(status.supported).toBe(true);
			expect(status.registered).toBe(false);
			expect(status.controlled).toBe(false);
			expect(status.registrations).toEqual([]);
		});

		it('should return status with active registration', async () => {
			const reg = {
				scope: '/',
				active: { state: 'activated' },
				waiting: null,
				installing: null
			};
			setupServiceWorkerMock({
				getRegistrations: vi.fn().mockResolvedValue([reg]),
				controller: { scriptURL: '/service-worker.js' }
			});

			const { getServiceWorkerStatus } = await import('./service-worker-registration');
			const status = await getServiceWorkerStatus();

			expect(status.supported).toBe(true);
			expect(status.registered).toBe(true);
			expect(status.controlled).toBe(true);
			expect(status.registrations).toEqual([
				{ scope: '/', active: true, waiting: false, installing: false }
			]);
		});
	});
});
