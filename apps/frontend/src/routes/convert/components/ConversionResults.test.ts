import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import ConversionResults from './ConversionResults.svelte';

// Mock notifications store
vi.mock('$lib/stores/notifications', () => ({
	notifications: {
		success: vi.fn(),
		error: vi.fn(),
		warning: vi.fn(),
		subscribe: vi.fn(() => () => {}),
	},
}));

// Mock formatFileSize
vi.mock('$lib/conversion/config', () => ({
	formatFileSize: (bytes: number) => {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
	},
}));

describe('ConversionResults', () => {
	const completedConversion = {
		id: 'conv-1',
		status: 'completed',
		result: {
			filename: 'output.webp',
			data: new Uint8Array([1, 2, 3]),
			metadata: { outputSize: 2048 },
		},
	};

	const failedConversion = {
		id: 'conv-2',
		status: 'failed',
		error: { message: 'Conversion timed out' },
	};

	it('renders successful conversion results', () => {
		render(ConversionResults, {
			props: {
				conversions: [completedConversion],
				fileNames: new Map(),
			},
		});
		expect(screen.getByText('output.webp')).toBeDefined();
		expect(screen.getByText('Successful Conversions (1)')).toBeDefined();
	});

	it('shows file size for completed conversions', () => {
		render(ConversionResults, {
			props: {
				conversions: [completedConversion],
				fileNames: new Map(),
			},
		});
		expect(screen.getByText('2 KB')).toBeDefined();
	});

	it('shows download button for completed conversions', () => {
		render(ConversionResults, {
			props: {
				conversions: [completedConversion],
				fileNames: new Map(),
			},
		});
		expect(screen.getByText('Download')).toBeDefined();
	});

	it('dispatches download event when download clicked', async () => {
		const { component } = render(ConversionResults, {
			props: {
				conversions: [completedConversion],
				fileNames: new Map(),
			},
		});

		let downloadState: any = null;
		component.$on('download', (e: CustomEvent) => {
			downloadState = e.detail;
		});

		await fireEvent.click(screen.getByText('Download'));
		expect(downloadState).toEqual(completedConversion);
	});

	it('renders failed conversion results', () => {
		render(ConversionResults, {
			props: {
				conversions: [failedConversion],
				fileNames: new Map([['conv-2', 'broken.png']]),
			},
		});
		expect(screen.getByText('Failed Conversions (1)')).toBeDefined();
		expect(screen.getByText('broken.png')).toBeDefined();
		expect(screen.getByText('Conversion timed out')).toBeDefined();
	});

	it('shows "Unknown file" when fileName not in map', () => {
		render(ConversionResults, {
			props: {
				conversions: [failedConversion],
				fileNames: new Map(),
			},
		});
		expect(screen.getByText('Unknown file')).toBeDefined();
	});

	it('shows Download All button when multiple successful conversions', () => {
		const conv2 = {
			...completedConversion,
			id: 'conv-3',
			result: {
				...completedConversion.result,
				filename: 'output2.webp',
			},
		};
		render(ConversionResults, {
			props: {
				conversions: [completedConversion, conv2],
				fileNames: new Map(),
			},
		});
		expect(screen.getByText('Download All')).toBeDefined();
	});

	it('dispatches download for all completed files when Download All clicked', async () => {
		vi.useFakeTimers();

		const completedConversions = Array.from({ length: 15 }, (_, i) => ({
			id: `conv-${i}`,
			status: 'completed',
			result: {
				filename: `output-${i}.webp`,
				data: new Uint8Array([1, 2, 3]),
				metadata: { outputSize: 1024 },
			},
		}));

		const { component } = render(ConversionResults, {
			props: {
				conversions: completedConversions,
				fileNames: new Map(),
			},
		});

		const downloadedStates: any[] = [];
		component.$on('download', (e: CustomEvent) => {
			downloadedStates.push(e.detail);
		});

		await fireEvent.click(screen.getByText('Download All'));

		// Advance past all staggered timeouts (15 files * 150ms)
		await vi.advanceTimersByTimeAsync(15 * 150 + 200);

		expect(downloadedStates).toHaveLength(15);

		// Verify every file was included
		const downloadedIds = downloadedStates.map(s => s.id);
		completedConversions.forEach(conv => {
			expect(downloadedIds).toContain(conv.id);
		});

		vi.useRealTimers();
	});

	it('does not show Download All for single conversion', () => {
		render(ConversionResults, {
			props: {
				conversions: [completedConversion],
				fileNames: new Map(),
			},
		});
		expect(screen.queryByText('Download All')).toBeNull();
	});

	it('renders both successful and failed sections together', () => {
		render(ConversionResults, {
			props: {
				conversions: [completedConversion, failedConversion],
				fileNames: new Map([['conv-2', 'broken.png']]),
			},
		});
		expect(screen.getByText('Successful Conversions (1)')).toBeDefined();
		expect(screen.getByText('Failed Conversions (1)')).toBeDefined();
	});

	it('renders nothing when no conversions provided', () => {
		const { container } = render(ConversionResults, {
			props: {
				conversions: [],
				fileNames: new Map(),
			},
		});
		expect(container.querySelector('.results-section')).toBeNull();
	});

	it('shows share section when there are successful conversions', () => {
		render(ConversionResults, {
			props: {
				conversions: [completedConversion],
				fileNames: new Map(),
			},
		});
		expect(screen.getByText('Share on Twitter')).toBeDefined();
		expect(screen.getByText('Share on LinkedIn')).toBeDefined();
		expect(screen.getByText('Copy Link')).toBeDefined();
	});

	it('shows Unknown size when outputSize not in metadata', () => {
		const noSizeConversion = {
			...completedConversion,
			result: {
				...completedConversion.result,
				metadata: {},
			},
		};
		render(ConversionResults, {
			props: {
				conversions: [noSizeConversion],
				fileNames: new Map(),
			},
		});
		expect(screen.getByText('Unknown size')).toBeDefined();
	});
});
