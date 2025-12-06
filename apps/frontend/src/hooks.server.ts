import type { Handle } from '@sveltejs/kit';
import { dev } from '$app/environment';

/**
 * Security headers for the application
 * Implements CSP and other security measures
 */
export const handle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);

	// Special handling for worker files to prevent DevTools blocking
	if (event.url.pathname.includes('/workers/') && event.url.pathname.endsWith('.js')) {
		response.headers.set('Content-Type', 'application/javascript; charset=utf-8');
		response.headers.set('X-Content-Type-Options', 'nosniff');
		response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
		// Remove any COEP/COOP headers that might block workers
		response.headers.delete('Cross-Origin-Embedder-Policy');
		response.headers.delete('Cross-Origin-Opener-Policy');
	}

	// In development, add headers to bypass service worker
	if (dev) {
		// Service worker bypass headers (no Clear-Site-Data as it causes issues)
		response.headers.set('Service-Worker-Allowed', '/');
		response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
		response.headers.set('Pragma', 'no-cache');
		response.headers.set('Expires', '0');

		// DISABLE CSP IN DEVELOPMENT to avoid blocking issues
		return response;
	}

	// Cross-Origin Resource Policy
	// Allows resources to be shared cross-origin (needed for CDN assets)
	response.headers.set('Cross-Origin-Resource-Policy', 'cross-origin');

	// Content Security Policy (CSP)
	const csp = [
		// Default source: only allow same-origin
		"default-src 'self'",

		// Scripts: Allow self, inline scripts (for Svelte), and WASM
		"script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' https://unpkg.com https://cdn.jsdelivr.net",

		// Styles: Allow self, inline styles (for Svelte), and Google Fonts
		"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",

		// Images: Allow self, data URIs, and blob URIs (for converted images)
		"img-src 'self' data: blob: https:",

		// Fonts: Allow self and common font CDNs
		"font-src 'self' data: https://fonts.gstatic.com",

		// Connect: Allow same-origin and CDNs for WASM
		"connect-src 'self' https://unpkg.com https://cdn.jsdelivr.net",

		// Media: Allow self and blob URIs (for audio/video)
		"media-src 'self' blob:",

		// Object: Disallow plugins
		"object-src 'none'",

		// Frame ancestors: Prevent clickjacking
		"frame-ancestors 'none'",

		// Base URI: Restrict base tag
		"base-uri 'self'",

		// Form action: Restrict form submissions
		"form-action 'self'",

		// Upgrade insecure requests
		"upgrade-insecure-requests",

		// Worker source: Allow workers from same origin and blob URIs
		"worker-src 'self' blob:",

		// Child source: Allow workers and frames from same origin
		"child-src 'self' blob:",

		// Frame source
		"frame-src 'self' blob:",

		// Manifest source: Allow manifest from same origin
		"manifest-src 'self'"
	].join('; ');

	response.headers.set('Content-Security-Policy', csp);

	// Additional security headers
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('X-XSS-Protection', '1; mode=block');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

	// Strict Transport Security (for production with HTTPS)
	if (event.url.protocol === 'https:') {
		response.headers.set(
			'Strict-Transport-Security',
			'max-age=31536000; includeSubDomains; preload'
		);
	}

	return response;
};
