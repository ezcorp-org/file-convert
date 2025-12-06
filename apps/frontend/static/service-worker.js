// Emergency Service Worker - Version 999
// This version force-replaces any existing service worker and does nothing

const VERSION = 'v999-no-op';
const OLD_CACHES = [
	'file-convert-v1',
	'file-convert-v2', 
	'file-convert-v3'
];

// Install immediately and skip waiting
self.addEventListener('install', (event) => {
	console.log(`[SW ${VERSION}] Installing and force activating`);
	
	// Skip waiting to activate immediately
	self.skipWaiting();
});

// Activate and clean everything
self.addEventListener('activate', (event) => {
	console.log(`[SW ${VERSION}] Activating and cleaning up`);
	
	event.waitUntil(
		(async () => {
			// Delete ALL caches
			const cacheNames = await caches.keys();
			await Promise.all(
				cacheNames.map(cacheName => {
					console.log(`[SW ${VERSION}] Deleting cache: ${cacheName}`);
					return caches.delete(cacheName);
				})
			);
			
			// Take control of all clients immediately
			await self.clients.claim();
			
			// Tell all clients to reload
			const clients = await self.clients.matchAll();
			clients.forEach(client => {
				client.postMessage({ type: 'SW_UPDATED', version: VERSION });
			});
			
			console.log(`[SW ${VERSION}] Cleanup complete`);
		})()
	);
});

// CRITICAL: Do not intercept ANY fetch requests
self.addEventListener('fetch', (event) => {
	// Completely bypass service worker for all requests
	return;
});

// Log any errors
self.addEventListener('error', (event) => {
	console.error(`[SW ${VERSION}] Error:`, event.error);
});

self.addEventListener('unhandledrejection', (event) => {
	console.error(`[SW ${VERSION}] Unhandled rejection:`, event.reason);
});