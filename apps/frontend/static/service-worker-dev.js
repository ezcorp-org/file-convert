// Development Service Worker - Does nothing, just prevents errors
// This file is used in development to prevent service worker errors

self.addEventListener('install', (event) => {
	console.log('[Dev SW] Installing (no-op)');
	self.skipWaiting();
});

self.addEventListener('activate', (event) => {
	console.log('[Dev SW] Activating (no-op)');
	self.clients.claim();
});

// Do NOT intercept any fetch requests in development
self.addEventListener('fetch', (event) => {
	// Let the browser handle all requests normally
	return;
});