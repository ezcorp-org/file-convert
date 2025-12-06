import { json } from '@sveltejs/kit';

// General handler for .well-known requests
// Prevents 404 errors for browser/tool discovery requests
export async function GET() {
	return json({ message: 'Well-known endpoint' }, { status: 200 });
}