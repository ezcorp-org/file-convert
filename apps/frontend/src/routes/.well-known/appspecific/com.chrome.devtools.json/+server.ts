import { json } from '@sveltejs/kit';

// Chrome DevTools requests this file to detect app-specific debugging capabilities
// We'll return an empty response to prevent 404 errors in development
export async function GET() {
	return json({});
}