import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import FileDropZone from './FileDropZone.svelte';

// Mock file-validation module
vi.mock('$lib/utils/file-validation', () => ({
	validateFileComplete: vi.fn().mockResolvedValue({
		isValid: true,
		typeValidation: { isValid: true }
	}),
	generateAcceptAttribute: vi.fn().mockReturnValue('.png,.jpg,.jpeg')
}));

// Mock conversion-registry
vi.mock('$lib/utils/conversion-registry', () => ({
	formats: [],
	getFormat: vi.fn()
}));

function createFile(name: string, size = 1024, type = 'image/png'): File {
	const buffer = new ArrayBuffer(size);
	return new File([buffer], name, { type });
}

function createDropEvent(files: File[]): DragEvent {
	const event = new Event('drop', { bubbles: true, cancelable: true }) as any;
	Object.defineProperty(event, 'dataTransfer', {
		value: {
			files,
			items: files.map(f => ({ kind: 'file', type: f.type, getAsFile: () => f })),
			types: ['Files']
		}
	});
	return event;
}

describe('FileDropZone', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders drop zone with default content', () => {
		const { getByTestId, getByText } = render(FileDropZone);
		expect(getByTestId('file-drop-zone')).toBeTruthy();
		expect(getByText('Drop files here or click to browse')).toBeTruthy();
		expect(getByText('Supports images, audio, documents, archives, and more')).toBeTruthy();
	});

	it('has correct accessibility attributes', () => {
		const { getByTestId } = render(FileDropZone);
		const zone = getByTestId('file-drop-zone');
		expect(zone.getAttribute('role')).toBe('button');
		expect(zone.getAttribute('tabindex')).toBe('0');
	});

	it('applies dragging class on drag enter', async () => {
		const { getByTestId } = render(FileDropZone);
		const zone = getByTestId('file-drop-zone');

		await fireEvent.dragEnter(zone, {
			dataTransfer: { items: [{}], files: [] }
		});

		expect(zone.classList.contains('dragging')).toBe(true);
	});

	it('removes dragging class on drag leave when counter reaches 0', async () => {
		const { getByTestId } = render(FileDropZone);
		const zone = getByTestId('file-drop-zone');

		await fireEvent.dragEnter(zone, {
			dataTransfer: { items: [{}], files: [] }
		});
		expect(zone.classList.contains('dragging')).toBe(true);

		await fireEvent.dragLeave(zone);
		expect(zone.classList.contains('dragging')).toBe(false);
	});

	it('handles nested drag enter/leave correctly', async () => {
		const { getByTestId } = render(FileDropZone);
		const zone = getByTestId('file-drop-zone');

		await fireEvent.dragEnter(zone, {
			dataTransfer: { items: [{}], files: [] }
		});
		await fireEvent.dragEnter(zone, {
			dataTransfer: { items: [{}], files: [] }
		});

		await fireEvent.dragLeave(zone);
		expect(zone.classList.contains('dragging')).toBe(true);

		await fireEvent.dragLeave(zone);
		expect(zone.classList.contains('dragging')).toBe(false);
	});

	it('dispatches files event on drop with valid files', async () => {
		const { getByTestId, component } = render(FileDropZone);
		const zone = getByTestId('file-drop-zone');

		const handler = vi.fn();
		component.$on('files', handler);

		const file = createFile('test.png');
		zone.dispatchEvent(createDropEvent([file]));

		await vi.waitFor(() => {
			expect(handler).toHaveBeenCalled();
		});
	});

	it('resets dragging state on drop', async () => {
		const { getByTestId } = render(FileDropZone);
		const zone = getByTestId('file-drop-zone');

		await fireEvent.dragEnter(zone, {
			dataTransfer: { items: [{}], files: [] }
		});
		expect(zone.classList.contains('dragging')).toBe(true);

		const file = createFile('test.png');
		await fireEvent.drop(zone, {
			dataTransfer: { files: [file], items: [{ kind: 'file', type: file.type, getAsFile: () => file }] }
		});

		await vi.waitFor(() => {
			expect(zone.classList.contains('dragging')).toBe(false);
		});
	});

	it('dispatches validation-errors for invalid files', async () => {
		const { validateFileComplete } = await import('$lib/utils/file-validation');
		vi.mocked(validateFileComplete).mockResolvedValueOnce({
			isValid: false,
			typeValidation: { isValid: false, reason: 'Unsupported file type', detectedType: 'unknown' }
		} as any);

		const { getByTestId, component } = render(FileDropZone);
		const zone = getByTestId('file-drop-zone');

		const errorHandler = vi.fn();
		component.$on('validation-errors', errorHandler);

		const file = createFile('test.xyz', 1024, 'application/octet-stream');
		zone.dispatchEvent(createDropEvent([file]));

		await vi.waitFor(() => {
			expect(errorHandler).toHaveBeenCalled();
		});
	});

	it('limits to single file when multiple=false', async () => {
		const { getByTestId, component } = render(FileDropZone, {
			props: { multiple: false }
		});
		const zone = getByTestId('file-drop-zone');

		const handler = vi.fn();
		component.$on('files', handler);

		const files = [createFile('a.png'), createFile('b.png')];
		zone.dispatchEvent(createDropEvent(files));

		await vi.waitFor(() => {
			expect(handler).toHaveBeenCalled();
			const detail = handler.mock.calls[0][0].detail;
			expect(detail).toHaveLength(1);
		});
	});

	it('opens file dialog on click', async () => {
		const { getByTestId } = render(FileDropZone);
		const zone = getByTestId('file-drop-zone');
		const input = zone.querySelector('input[type="file"]') as HTMLInputElement;

		const clickSpy = vi.spyOn(input, 'click');
		await fireEvent.click(zone);

		expect(clickSpy).toHaveBeenCalled();
	});

	it('opens file dialog on Enter key', async () => {
		const { getByTestId } = render(FileDropZone);
		const zone = getByTestId('file-drop-zone');
		const input = zone.querySelector('input[type="file"]') as HTMLInputElement;

		const clickSpy = vi.spyOn(input, 'click');
		await fireEvent.keyDown(zone, { key: 'Enter' });

		expect(clickSpy).toHaveBeenCalled();
	});

	it('passes accept attribute to file input', () => {
		const { getByTestId } = render(FileDropZone, {
			props: { accept: '.pdf,.docx' }
		});
		const zone = getByTestId('file-drop-zone');
		const input = zone.querySelector('input[type="file"]') as HTMLInputElement;

		expect(input.getAttribute('accept')).toBe('.pdf,.docx');
	});

	it('passes multiple attribute to file input', () => {
		const { getByTestId } = render(FileDropZone, {
			props: { multiple: false }
		});
		const zone = getByTestId('file-drop-zone');
		const input = zone.querySelector('input[type="file"]') as HTMLInputElement;

		expect(input.multiple).toBe(false);
	});
});
