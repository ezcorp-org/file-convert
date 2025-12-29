import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import BatchConversionPanel from './BatchConversionPanel.svelte';

function createFile(name: string, size = 1024, type = 'image/png'): File {
	return new File([new ArrayBuffer(size)], name, { type });
}

describe('BatchConversionPanel', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders batch panel', () => {
		const { container } = render(BatchConversionPanel);
		expect(container.querySelector('.batch-panel')).toBeTruthy();
	});

	it('displays header title', () => {
		const { container } = render(BatchConversionPanel);
		const header = container.querySelector('.batch-header h3');
		expect(header?.textContent).toBe('Batch Conversion Manager');
	});

	it('shows file count in stats', () => {
		const files = [createFile('a.png'), createFile('b.jpg')];
		const { container } = render(BatchConversionPanel, { props: { files } });

		const stats = container.querySelectorAll('.stat');
		expect(stats[0]?.textContent).toContain('2 files');
	});

	it('shows singular file count for 1 file', () => {
		const files = [createFile('a.png')];
		const { container } = render(BatchConversionPanel, { props: { files } });

		const stats = container.querySelectorAll('.stat');
		expect(stats[0]?.textContent).toContain('1 file');
		expect(stats[0]?.textContent).not.toContain('files');
	});

	it('groups files by extension', () => {
		const files = [
			createFile('a.png'),
			createFile('b.png'),
			createFile('c.jpg')
		];
		const { container } = render(BatchConversionPanel, { props: { files } });

		const groups = container.querySelectorAll('.format-group');
		expect(groups).toHaveLength(2);

		const badges = container.querySelectorAll('.format-badge');
		const badgeTexts = Array.from(badges).map(b => b.textContent);
		expect(badgeTexts).toContain('PNG');
		expect(badgeTexts).toContain('JPG');
	});

	it('shows select all button', () => {
		const files = [createFile('a.png')];
		const { container } = render(BatchConversionPanel, { props: { files } });

		const selectAllBtn = container.querySelector('.btn-small');
		expect(selectAllBtn?.textContent).toContain('Select All');
	});

	it('selects all files on select all click', async () => {
		const files = [createFile('a.png'), createFile('b.jpg')];
		const { container } = render(BatchConversionPanel, { props: { files } });

		const selectAllBtn = container.querySelector('.btn-small') as HTMLButtonElement;
		await fireEvent.click(selectAllBtn);

		const checkboxes = container.querySelectorAll('.file-row input[type="checkbox"]');
		checkboxes.forEach(cb => {
			expect((cb as HTMLInputElement).checked).toBe(true);
		});
	});

	it('shows conversion settings when files are selected', async () => {
		const files = [createFile('a.png')];
		const { container } = render(BatchConversionPanel, { props: { files } });

		// No settings initially
		expect(container.querySelector('.conversion-settings')).toBeNull();

		// Select all
		const selectAllBtn = container.querySelector('.btn-small') as HTMLButtonElement;
		await fireEvent.click(selectAllBtn);

		// Settings should appear
		expect(container.querySelector('.conversion-settings')).toBeTruthy();
	});

	it('shows output format dropdown in settings', async () => {
		const files = [createFile('a.png')];
		const { container } = render(BatchConversionPanel, { props: { files } });

		const selectAllBtn = container.querySelector('.btn-small') as HTMLButtonElement;
		await fireEvent.click(selectAllBtn);

		expect(container.querySelector('#output-format')).toBeTruthy();
	});

	it('shows naming pattern dropdown', async () => {
		const files = [createFile('a.png')];
		const { container } = render(BatchConversionPanel, { props: { files } });

		const selectAllBtn = container.querySelector('.btn-small') as HTMLButtonElement;
		await fireEvent.click(selectAllBtn);

		expect(container.querySelector('#naming')).toBeTruthy();
	});

	it('shows preserve metadata checkbox', async () => {
		const files = [createFile('a.png')];
		const { container } = render(BatchConversionPanel, { props: { files } });

		const selectAllBtn = container.querySelector('.btn-small') as HTMLButtonElement;
		await fireEvent.click(selectAllBtn);

		const labels = container.querySelectorAll('.setting-group label');
		const metadataLabel = Array.from(labels).find(l => l.textContent?.includes('Preserve metadata'));
		expect(metadataLabel).toBeTruthy();
	});

	it('shows ZIP archive checkbox', async () => {
		const files = [createFile('a.png')];
		const { container } = render(BatchConversionPanel, { props: { files } });

		const selectAllBtn = container.querySelector('.btn-small') as HTMLButtonElement;
		await fireEvent.click(selectAllBtn);

		const labels = container.querySelectorAll('.setting-group label');
		const zipLabel = Array.from(labels).find(l => l.textContent?.includes('Download as ZIP'));
		expect(zipLabel).toBeTruthy();
	});

	it('convert button is disabled without output format', async () => {
		const files = [createFile('a.png')];
		const { container } = render(BatchConversionPanel, { props: { files } });

		const selectAllBtn = container.querySelector('.btn-small') as HTMLButtonElement;
		await fireEvent.click(selectAllBtn);

		const convertBtn = container.querySelector('.btn-primary') as HTMLButtonElement;
		expect(convertBtn.disabled).toBe(true);
	});

	it('convert button shows converting state', async () => {
		const files = [createFile('a.png')];
		const { container } = render(BatchConversionPanel, {
			props: { files, isConverting: true }
		});

		const selectAllBtn = container.querySelector('.btn-small') as HTMLButtonElement;
		await fireEvent.click(selectAllBtn);

		const convertBtn = container.querySelector('.btn-primary') as HTMLButtonElement;
		expect(convertBtn.textContent).toContain('Converting...');
		expect(convertBtn.disabled).toBe(true);
	});

	it('shows selected count in stats when files selected', async () => {
		const files = [createFile('a.png'), createFile('b.jpg')];
		const { container } = render(BatchConversionPanel, { props: { files } });

		const selectAllBtn = container.querySelector('.btn-small') as HTMLButtonElement;
		await fireEvent.click(selectAllBtn);

		const selectedStat = container.querySelector('.stat.selected');
		expect(selectedStat?.textContent).toContain('2 selected');
	});

	it('shows remove selected button when files are selected', async () => {
		const files = [createFile('a.png')];
		const { container } = render(BatchConversionPanel, { props: { files } });

		const selectAllBtn = container.querySelector('.btn-small') as HTMLButtonElement;
		await fireEvent.click(selectAllBtn);

		const dangerBtn = container.querySelector('.btn-small.danger');
		expect(dangerBtn?.textContent).toContain('Remove Selected');
	});

	it('dispatches remove-files event on remove selected', async () => {
		const files = [createFile('a.png')];
		const { container, component } = render(BatchConversionPanel, { props: { files } });

		const handler = vi.fn();
		component.$on('remove-files', handler);

		// Select all
		const selectAllBtn = container.querySelector('.btn-small') as HTMLButtonElement;
		await fireEvent.click(selectAllBtn);

		// Click remove
		const dangerBtn = container.querySelector('.btn-small.danger') as HTMLButtonElement;
		await fireEvent.click(dangerBtn);

		expect(handler).toHaveBeenCalled();
	});

	it('shows select/deselect buttons per format group', () => {
		const files = [createFile('a.png')];
		const { container } = render(BatchConversionPanel, { props: { files } });

		const groupActions = container.querySelector('.group-actions');
		const buttons = groupActions?.querySelectorAll('.btn-tiny');
		expect(buttons).toHaveLength(2);
		expect(buttons?.[0]?.textContent).toContain('Select');
		expect(buttons?.[1]?.textContent).toContain('Deselect');
	});

	it('displays file names in file rows', () => {
		const files = [createFile('my-photo.png')];
		const { container } = render(BatchConversionPanel, { props: { files } });

		const fileName = container.querySelector('.file-name');
		expect(fileName?.textContent?.trim()).toBe('my-photo.png');
	});

	it('toggles individual file selection', async () => {
		const files = [createFile('a.png'), createFile('b.png')];
		const { container } = render(BatchConversionPanel, { props: { files } });

		const checkboxes = container.querySelectorAll('.file-row input[type="checkbox"]');
		await fireEvent.change(checkboxes[0]);

		expect((checkboxes[0] as HTMLInputElement).checked).toBe(true);
		expect((checkboxes[1] as HTMLInputElement).checked).toBe(false);
	});

	it('renders with empty files array', () => {
		const { container } = render(BatchConversionPanel, { props: { files: [] } });
		expect(container.querySelector('.batch-panel')).toBeTruthy();
		expect(container.querySelectorAll('.format-group')).toHaveLength(0);
	});
});
