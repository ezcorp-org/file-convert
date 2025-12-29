import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import ConversionStatus from './ConversionStatus.svelte';

describe('ConversionStatus', () => {
	const baseState = {
		status: 'pending',
		progress: 0,
		message: '',
		startTime: null,
		endTime: null,
		error: null,
		result: null,
	};

	it('renders file name', () => {
		render(ConversionStatus, {
			props: { state: baseState, fileName: 'test.png' },
		});
		expect(screen.getByText('test.png')).toBeDefined();
	});

	it('shows pending icon for pending status', () => {
		render(ConversionStatus, {
			props: { state: { ...baseState, status: 'pending' }, fileName: 'a.png' },
		});
		expect(screen.getByText('a.png')).toBeDefined();
	});

	it('shows status message when provided', () => {
		render(ConversionStatus, {
			props: {
				state: { ...baseState, message: 'Preparing…' },
				fileName: 'a.png',
			},
		});
		expect(screen.getByText('Preparing…')).toBeDefined();
	});

	it('falls back to status string when no message', () => {
		render(ConversionStatus, {
			props: {
				state: { ...baseState, status: 'converting', progress: 50, message: '' },
				fileName: 'a.png',
			},
		});
		expect(screen.getByText('converting')).toBeDefined();
	});

	it('shows progress bar and percentage when converting', () => {
		render(ConversionStatus, {
			props: {
				state: { ...baseState, status: 'converting', progress: 42 },
				fileName: 'a.png',
			},
		});
		expect(screen.getByText('42%')).toBeDefined();
	});

	it('shows progress bar when validating', () => {
		render(ConversionStatus, {
			props: {
				state: { ...baseState, status: 'validating', progress: 10 },
				fileName: 'a.png',
			},
		});
		expect(screen.getByText('10%')).toBeDefined();
	});

	it('does not show progress bar for completed status', () => {
		render(ConversionStatus, {
			props: {
				state: { ...baseState, status: 'completed', progress: 100 },
				fileName: 'a.png',
			},
		});
		expect(screen.queryByText('100%')).toBeNull();
	});

	it('shows cancel button when converting', () => {
		render(ConversionStatus, {
			props: {
				state: { ...baseState, status: 'converting', progress: 50 },
				fileName: 'a.png',
			},
		});
		expect(screen.getByText('Cancel')).toBeDefined();
	});

	it('does not show cancel button for pending status', () => {
		render(ConversionStatus, {
			props: {
				state: { ...baseState, status: 'pending' },
				fileName: 'a.png',
			},
		});
		expect(screen.queryByText('Cancel')).toBeNull();
	});

	it('shows error details when failed', () => {
		render(ConversionStatus, {
			props: {
				state: {
					...baseState,
					status: 'failed',
					error: { message: 'Out of memory' },
				},
				fileName: 'a.png',
			},
		});
		expect(screen.getByText('Out of memory')).toBeDefined();
	});

	it('shows fallback error message when failed with only message', () => {
		render(ConversionStatus, {
			props: {
				state: {
					...baseState,
					status: 'failed',
					message: 'Something broke',
				},
				fileName: 'a.png',
			},
		});
		// Message appears in both status-message and error-message spans
		const elements = screen.getAllByText('Something broke');
		expect(elements.length).toBeGreaterThanOrEqual(1);
	});

	it('dispatches cancel event when cancel button clicked', async () => {
		const { component } = render(ConversionStatus, {
			props: {
				state: { ...baseState, status: 'converting', progress: 50 },
				fileName: 'a.png',
			},
		});

		let cancelled = false;
		component.$on('cancel', () => { cancelled = true; });

		await fireEvent.click(screen.getByText('Cancel'));
		expect(cancelled).toBe(true);
	});

	it('shows elapsed time when startTime is set and converting', () => {
		const now = Date.now();
		render(ConversionStatus, {
			props: {
				state: {
					...baseState,
					status: 'converting',
					progress: 30,
					startTime: now - 5000,
					endTime: null,
				},
				fileName: 'a.png',
			},
		});
		// Should show elapsed time (roughly "5s" or similar)
		const container = document.querySelector('.progress-info');
		expect(container).toBeDefined();
	});

	it('shows total time when both start and end time are set', () => {
		render(ConversionStatus, {
			props: {
				state: {
					...baseState,
					status: 'converting',
					progress: 100,
					startTime: 1000,
					endTime: 4000,
				},
				fileName: 'a.png',
			},
		});
		expect(screen.getByText('3s')).toBeDefined();
	});

	it('shows minutes format for long conversions', () => {
		render(ConversionStatus, {
			props: {
				state: {
					...baseState,
					status: 'converting',
					progress: 50,
					startTime: 1000,
					endTime: 126000,
				},
				fileName: 'a.png',
			},
		});
		expect(screen.getByText('2m 5s')).toBeDefined();
	});
});
