import { writable } from 'svelte/store';

export const page = writable({
	url: new URL('https://fileconvert.com/convert/pdf'),
	params: {},
	route: { id: '' },
	status: 200,
	error: null,
	data: {},
	form: null,
	state: {}
});

export const navigating = writable(null);
export const updated = writable(false);
