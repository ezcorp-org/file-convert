/**
 * Service Worker Registration Utility
 * Handles registration, updates, and error recovery
 */

export async function registerServiceWorker() {
	if (!('serviceWorker' in navigator)) {
		console.log('[SW] Service Workers not supported');
		return;
	}

	// Only register in production or if explicitly enabled
	const shouldRegister = !import.meta.env.DEV || import.meta.env.VITE_ENABLE_SW;
	
	if (!shouldRegister) {
		console.log('[SW] Service Worker disabled in development');
		// Unregister any existing service workers in dev
		const registrations = await navigator.serviceWorker.getRegistrations();
		for (const registration of registrations) {
			await registration.unregister();
			console.log('[SW] Unregistered existing service worker');
		}
		return;
	}

	try {
		// Check for existing registration
		const existingReg = await navigator.serviceWorker.getRegistration('/');
		
		if (existingReg) {
			console.log('[SW] Existing registration found, updating...');
			existingReg.update();
		} else {
			// Register new service worker
			const registration = await navigator.serviceWorker.register('/service-worker.js', {
				scope: '/'
			});
			
			console.log('[SW] Registration successful:', registration.scope);
			
			// Handle updates
			registration.addEventListener('updatefound', () => {
				const newWorker = registration.installing;
				if (newWorker) {
					newWorker.addEventListener('statechange', () => {
						if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
							console.log('[SW] New content available, refresh to update');
							// Could show a notification to the user here
						}
					});
				}
			});
		}
		
		// Handle controller change (new SW activated)
		navigator.serviceWorker.addEventListener('controllerchange', () => {
			console.log('[SW] Controller changed, new service worker active');
		});
		
	} catch (error) {
		console.error('[SW] Registration failed:', error);
		
		// Try to recover by unregistering and cleaning up
		try {
			const registrations = await navigator.serviceWorker.getRegistrations();
			for (const registration of registrations) {
				await registration.unregister();
			}
			console.log('[SW] Cleaned up failed registrations');
		} catch (cleanupError) {
			console.error('[SW] Cleanup failed:', cleanupError);
		}
	}
}

export async function unregisterServiceWorker() {
	if (!('serviceWorker' in navigator)) {
		return;
	}
	
	try {
		const registrations = await navigator.serviceWorker.getRegistrations();
		for (const registration of registrations) {
			const success = await registration.unregister();
			console.log('[SW] Unregistration', success ? 'successful' : 'failed');
		}
		
		// Clear all caches
		if ('caches' in window) {
			const cacheNames = await caches.keys();
			await Promise.all(
				cacheNames.map(cacheName => {
					console.log('[SW] Deleting cache:', cacheName);
					return caches.delete(cacheName);
				})
			);
		}
	} catch (error) {
		console.error('[SW] Unregistration error:', error);
	}
}

// Utility to check SW status
export async function getServiceWorkerStatus() {
	if (!('serviceWorker' in navigator)) {
		return { supported: false };
	}
	
	const registrations = await navigator.serviceWorker.getRegistrations();
	const controller = navigator.serviceWorker.controller;
	
	return {
		supported: true,
		registered: registrations.length > 0,
		controlled: !!controller,
		registrations: registrations.map(reg => ({
			scope: reg.scope,
			active: !!reg.active,
			waiting: !!reg.waiting,
			installing: !!reg.installing
		}))
	};
}