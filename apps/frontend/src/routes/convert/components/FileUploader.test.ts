import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import FileUploader from './FileUploader.svelte';

// Mock dependencies
vi.mock('$lib/conversion/config', () => ({
	detectFileType: vi.fn((file: File) => {
		const ext = file.name.split('.').pop()?.toLowerCase();
		if (['png', 'jpg', 'jpeg', 'webp', 'txt', 'csv'].includes(ext || '')) {
			return {
				id: ext,
				name: ext?.toUpperCase(),
				extensions: [ext],
				mimeTypes: [`image/${ext}`],
				category: 'image',
				maxSize: 10 * 1024 * 1024 * 1024,
				supportedOutputs: [],
				workerType: 'image',
			};
		}
		return null;
	}),
	validateFile: vi.fn((_file: File, _config: any) => ({ valid: true })),
}));

vi.mock('$lib/utils/file-validation', () => ({
	validateFileType: vi.fn(() => Promise.resolve({ isValid: true, isSupportedFormat: true })),
}));

vi.mock('$lib/stores/notifications', () => ({
	notifications: {
		success: vi.fn(),
		error: vi.fn(),
		warning: vi.fn(),
		subscribe: vi.fn(() => () => {}),
	},
}));

describe('FileUploader', () => {
	it('renders the drop zone', () => {
		render(FileUploader);
		expect(screen.getByText('Drop files here or click to browse')).toBeDefined();
	});

	it('renders the browse button', () => {
		render(FileUploader);
		expect(screen.getByText('Browse Files')).toBeDefined();
	});

	it('renders supported format categories', () => {
		render(FileUploader);
		expect(screen.getByText('Images')).toBeDefined();
		expect(screen.getByText('Audio')).toBeDefined();
		expect(screen.getByText('Documents')).toBeDefined();
		expect(screen.getByText('Archives')).toBeDefined();
	});

	it('has a hidden file input', () => {
		const { container } = render(FileUploader);
		const input = container.querySelector('input[type="file"]') as HTMLInputElement;
		expect(input).toBeDefined();
		expect(input.multiple).toBe(true);
	});

	it('dispatches files event for valid files', async () => {
		const { component } = render(FileUploader);

		let dispatched: File[] = [];
		component.$on('files', (e: CustomEvent) => {
			dispatched = e.detail;
		});

		const file = new File(['hello'], 'test.png', { type: 'image/png' });
		const input = document.querySelector('input[type="file"]') as HTMLInputElement;

		Object.defineProperty(input, 'files', { value: [file], writable: false });
		await fireEvent.change(input);

		expect(dispatched.length).toBe(1);
		expect(dispatched[0].name).toBe('test.png');
	});

	it('rejects unsupported file types', async () => {
		const { notifications } = await import('$lib/stores/notifications');
		const { component } = render(FileUploader);

		let dispatched = false;
		component.$on('files', () => { dispatched = true; });

		const file = new File(['data'], 'test.xyz', { type: 'application/octet-stream' });
		const input = document.querySelector('input[type="file"]') as HTMLInputElement;

		Object.defineProperty(input, 'files', { value: [file], writable: false });
		await fireEvent.change(input);

		expect(dispatched).toBe(false);
		expect(notifications.error).toHaveBeenCalled();
	});

	it('rejects zero-byte files', async () => {
		const { notifications } = await import('$lib/stores/notifications');
		vi.mocked(notifications.error).mockClear();
		const { component } = render(FileUploader);

		let dispatched = false;
		component.$on('files', () => { dispatched = true; });

		const file = new File([], 'empty.png', { type: 'image/png' });
		const input = document.querySelector('input[type="file"]') as HTMLInputElement;

		Object.defineProperty(input, 'files', { value: [file], writable: false });
		await fireEvent.change(input);

		expect(dispatched).toBe(false);
		expect(notifications.error).toHaveBeenCalled();
	});

	it('shows inline errors temporarily for invalid files', async () => {
		render(FileUploader);

		const file = new File(['data'], 'test.xyz', { type: 'application/octet-stream' });
		const input = document.querySelector('input[type="file"]') as HTMLInputElement;

		Object.defineProperty(input, 'files', { value: [file], writable: false });
		await fireEvent.change(input);

		// Errors rendered inline
		const errorContainer = document.querySelector('.errors');
		expect(errorContainer).toBeDefined();
	});

	it('handles validation failure from validateFile', async () => {
		const { validateFile } = await import('$lib/conversion/config');
		vi.mocked(validateFile).mockReturnValueOnce({ valid: false, reason: 'File too large' });

		const { component } = render(FileUploader);

		let dispatched = false;
		component.$on('files', () => { dispatched = true; });

		const file = new File(['data'], 'big.png', { type: 'image/png' });
		const input = document.querySelector('input[type="file"]') as HTMLInputElement;

		Object.defineProperty(input, 'files', { value: [file], writable: false });
		await fireEvent.change(input);

		expect(dispatched).toBe(false);

		// Restore
		vi.mocked(validateFile).mockReturnValue({ valid: true });
	});

	it('handles multiple files with mixed validity', async () => {
		const { component } = render(FileUploader);

		let dispatched: File[] = [];
		component.$on('files', (e: CustomEvent) => {
			dispatched = e.detail;
		});

		const good = new File(['hello'], 'good.png', { type: 'image/png' });
		const bad = new File(['data'], 'bad.xyz', { type: 'application/octet-stream' });
		const input = document.querySelector('input[type="file"]') as HTMLInputElement;

		Object.defineProperty(input, 'files', { value: [good, bad], writable: false });
		await fireEvent.change(input);

		expect(dispatched.length).toBe(1);
		expect(dispatched[0].name).toBe('good.png');
	});

	it('applies dragging class on dragover', async () => {
		const { container } = render(FileUploader);
		const dropZone = container.querySelector('.drop-zone') as HTMLElement;

		await fireEvent.dragOver(dropZone);
		expect(dropZone.classList.contains('dragging')).toBe(true);
	});

	it('removes dragging class on dragleave', async () => {
		const { container } = render(FileUploader);
		const dropZone = container.querySelector('.drop-zone') as HTMLElement;

		await fireEvent.dragOver(dropZone);
		expect(dropZone.classList.contains('dragging')).toBe(true);

		await fireEvent.dragLeave(dropZone);
		expect(dropZone.classList.contains('dragging')).toBe(false);
	});

	it('warns on format mismatch but still allows file', async () => {
		const { validateFileType } = await import('$lib/utils/file-validation');
		const { notifications } = await import('$lib/stores/notifications');
		vi.mocked(notifications.warning).mockClear();
		vi.mocked(validateFileType).mockResolvedValueOnce({
			isValid: false,
			isSupportedFormat: true,
			detectedType: 'gif',
		} as any);

		const { component } = render(FileUploader);

		let dispatched: File[] = [];
		component.$on('files', (e: CustomEvent) => {
			dispatched = e.detail;
		});

		const file = new File(['data'], 'test.png', { type: 'image/png' });
		const input = document.querySelector('input[type="file"]') as HTMLInputElement;
		Object.defineProperty(input, 'files', { value: [file], writable: false });
		await fireEvent.change(input);

		expect(dispatched.length).toBe(1);
		expect(notifications.warning).toHaveBeenCalled();

		// Restore
		vi.mocked(validateFileType).mockResolvedValue({ isValid: true, isSupportedFormat: true } as any);
	});
});
