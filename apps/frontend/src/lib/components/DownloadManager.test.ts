import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import DownloadManager from './DownloadManager.svelte';

// Mock URL.createObjectURL and revokeObjectURL
const mockUrls = new Map<string, string>();
let urlCounter = 0;
vi.stubGlobal('URL', {
	...URL,
	createObjectURL: vi.fn((_blob: Blob) => {
		const url = `blob:mock-${urlCounter++}`;
		mockUrls.set(url, 'mock');
		return url;
	}),
	revokeObjectURL: vi.fn((url: string) => {
		mockUrls.delete(url);
	})
});

function createMockResult(id: string, filename: string, size = 1024) {
	return {
		id,
		outputFile: new Blob([new ArrayBuffer(size)], { type: 'image/png' }),
		filename,
		mimeType: 'image/png'
	};
}

describe('DownloadManager', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockUrls.clear();
		urlCounter = 0;
	});

	it('renders empty state when no results', () => {
		const { container } = render(DownloadManager);
		expect(container.querySelector('.empty-state')).toBeTruthy();
		expect(container.querySelector('.empty-state p')?.textContent).toBe('No converted files yet');
	});

	it('renders download manager header', () => {
		const { container } = render(DownloadManager);
		const header = container.querySelector('.header-left h3');
		expect(header?.textContent).toContain('Download Manager');
	});

	it('renders file items when results are provided', () => {
		const results = [
			createMockResult('1', 'output.png'),
			createMockResult('2', 'output2.jpg', 2048)
		];
		const { container } = render(DownloadManager, { props: { results } });

		const items = container.querySelectorAll('.download-item');
		expect(items).toHaveLength(2);
	});

	it('displays file count in stats', () => {
		const results = [createMockResult('1', 'output.png')];
		const { container } = render(DownloadManager, { props: { results } });

		const stats = container.querySelectorAll('.stat');
		expect(stats[0]?.textContent).toContain('1 file');
	});

	it('displays plural file count', () => {
		const results = [
			createMockResult('1', 'a.png'),
			createMockResult('2', 'b.png')
		];
		const { container } = render(DownloadManager, { props: { results } });

		const stats = container.querySelectorAll('.stat');
		expect(stats[0]?.textContent).toContain('2 files');
	});

	it('shows filter input', () => {
		const results = [createMockResult('1', 'output.png')];
		const { container } = render(DownloadManager, { props: { results } });
		expect(container.querySelector('.filter-input')).toBeTruthy();
	});

	it('shows sort controls', () => {
		const results = [createMockResult('1', 'output.png')];
		const { container } = render(DownloadManager, { props: { results } });
		expect(container.querySelector('.sort-select')).toBeTruthy();
		expect(container.querySelector('.sort-direction')).toBeTruthy();
	});

	it('shows select all button when items exist', () => {
		const results = [createMockResult('1', 'output.png')];
		const { container } = render(DownloadManager, { props: { results } });
		const selectAllBtn = container.querySelector('.btn-control');
		expect(selectAllBtn?.textContent).toContain('Select All');
	});

	it('toggles select all', async () => {
		const results = [
			createMockResult('1', 'a.png'),
			createMockResult('2', 'b.png')
		];
		const { container } = render(DownloadManager, { props: { results } });

		const selectAllBtn = container.querySelector('.btn-control') as HTMLButtonElement;
		await fireEvent.click(selectAllBtn);

		// After select all, checkboxes should be checked
		const checkboxes = container.querySelectorAll('.download-item input[type="checkbox"]');
		checkboxes.forEach(cb => {
			expect((cb as HTMLInputElement).checked).toBe(true);
		});
	});

	it('shows selected count when items are selected', async () => {
		const results = [
			createMockResult('1', 'a.png'),
			createMockResult('2', 'b.png')
		];
		const { container } = render(DownloadManager, { props: { results } });

		// Click select all
		const selectAllBtn = container.querySelector('.btn-control') as HTMLButtonElement;
		await fireEvent.click(selectAllBtn);

		const selectedStat = container.querySelector('.stat.selected');
		expect(selectedStat?.textContent).toContain('2 selected');
	});

	it('shows clear all button', () => {
		const results = [createMockResult('1', 'output.png')];
		const { container } = render(DownloadManager, { props: { results } });

		const buttons = container.querySelectorAll('.btn-control');
		const clearBtn = Array.from(buttons).find(b => b.textContent?.includes('Clear All'));
		expect(clearBtn).toBeTruthy();
	});

	it('dispatches clear event on clear all', async () => {
		const results = [createMockResult('1', 'output.png')];
		const { container, component } = render(DownloadManager, { props: { results } });

		const handler = vi.fn();
		component.$on('clear', handler);

		const buttons = container.querySelectorAll('.btn-control');
		const clearBtn = Array.from(buttons).find(b => b.textContent?.includes('Clear All')) as HTMLButtonElement;
		await fireEvent.click(clearBtn);

		expect(handler).toHaveBeenCalled();
	});

	it('shows download all as ZIP button', () => {
		const results = [createMockResult('1', 'output.png')];
		const { container } = render(DownloadManager, { props: { results } });

		const zipBtn = container.querySelector('.btn-download-all');
		expect(zipBtn?.textContent).toContain('Download All as ZIP');
	});

	it('shows auto-download checkbox', () => {
		const results = [createMockResult('1', 'output.png')];
		const { container } = render(DownloadManager, { props: { results } });

		const autoDownloadLabel = container.querySelector('.auto-download');
		expect(autoDownloadLabel?.textContent).toContain('Auto-download converted files');
	});

	it('displays file names in download items', () => {
		const results = [createMockResult('1', 'my-image.png')];
		const { container } = render(DownloadManager, { props: { results } });

		const fileName = container.querySelector('.download-item .file-name');
		expect(fileName?.textContent).toBe('my-image.png');
	});

	it('creates object URLs for results', () => {
		const results = [createMockResult('1', 'output.png')];
		render(DownloadManager, { props: { results } });

		expect(URL.createObjectURL).toHaveBeenCalled();
	});

	it('has download and remove buttons per item', () => {
		const results = [createMockResult('1', 'output.png')];
		const { container } = render(DownloadManager, { props: { results } });

		const item = container.querySelector('.download-item');
		expect(item?.querySelector('.btn-action.download')).toBeTruthy();
		expect(item?.querySelector('.btn-action.remove')).toBeTruthy();
	});

	it('dispatches remove event when remove button clicked', async () => {
		const results = [createMockResult('1', 'output.png')];
		const { container, component } = render(DownloadManager, { props: { results } });

		const handler = vi.fn();
		component.$on('remove', handler);

		const removeBtn = container.querySelector('.btn-action.remove') as HTMLButtonElement;
		await fireEvent.click(removeBtn);

		expect(handler).toHaveBeenCalled();
	});

	it('dispatches clear event when clearing all items', async () => {
		const results = [createMockResult('1', 'output.png')];
		const { container, component } = render(DownloadManager, { props: { results } });

		const handler = vi.fn();
		component.$on('clear', handler);

		const buttons = container.querySelectorAll('.btn-control');
		const clearBtn = Array.from(buttons).find(b => b.textContent?.includes('Clear All')) as HTMLButtonElement;
		await fireEvent.click(clearBtn);

		expect(handler).toHaveBeenCalled();
	});
});
