import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import ConversionOptions from './ConversionOptions.svelte';

// Mock getConversionOptions to return controlled data
vi.mock('$lib/conversion/config', () => ({
	getConversionOptions: vi.fn((from: string, to: string) => {
		if (from === 'png' && to === 'webp') {
			return [
				{
					id: 'quality',
					name: 'Quality',
					description: 'Output quality (1-100)',
					type: 'number',
					default: 80,
				},
				{
					id: 'lossless',
					name: 'Lossless',
					description: 'Use lossless compression',
					type: 'boolean',
					default: false,
				},
				{
					id: 'resize',
					name: 'Resize Mode',
					description: 'How to resize the image',
					type: 'select',
					default: 'none',
					options: [
						{ value: 'none', label: 'No resize' },
						{ value: 'fit', label: 'Fit to size' },
						{ value: 'fill', label: 'Fill size' },
					],
				},
				{
					id: 'comment',
					name: 'Comment',
					description: 'Metadata comment',
					type: 'string',
					default: '',
				},
			];
		}
		return [];
	}),
}));

describe('ConversionOptions', () => {
	it('renders options heading when options exist', () => {
		render(ConversionOptions, {
			props: { sourceFormat: 'png', targetFormat: 'webp', options: {} },
		});
		expect(screen.getByText('Conversion Options')).toBeDefined();
	});

	it('renders nothing when no options available', () => {
		const { container } = render(ConversionOptions, {
			props: { sourceFormat: 'txt', targetFormat: 'md', options: {} },
		});
		expect(container.querySelector('.conversion-options')).toBeNull();
	});

	it('renders number input for number-type options', () => {
		render(ConversionOptions, {
			props: { sourceFormat: 'png', targetFormat: 'webp', options: {} },
		});
		expect(screen.getByText('Quality')).toBeDefined();
		const input = screen.getByLabelText('Quality') as HTMLInputElement;
		expect(input.type).toBe('number');
		expect(input.value).toBe('80');
	});

	it('renders checkbox for boolean-type options', () => {
		render(ConversionOptions, {
			props: { sourceFormat: 'png', targetFormat: 'webp', options: {} },
		});
		expect(screen.getByText('Lossless')).toBeDefined();
		const checkbox = screen.getByLabelText('Lossless') as HTMLInputElement;
		expect(checkbox.type).toBe('checkbox');
		expect(checkbox.checked).toBe(false);
	});

	it('renders select for select-type options', () => {
		render(ConversionOptions, {
			props: { sourceFormat: 'png', targetFormat: 'webp', options: {} },
		});
		expect(screen.getByText('Resize Mode')).toBeDefined();
		const select = screen.getByLabelText('Resize Mode') as HTMLSelectElement;
		expect(select.tagName).toBe('SELECT');
		expect(select.options.length).toBe(3);
	});

	it('renders text input for string-type options', () => {
		render(ConversionOptions, {
			props: { sourceFormat: 'png', targetFormat: 'webp', options: {} },
		});
		expect(screen.getByText('Comment')).toBeDefined();
		const input = screen.getByLabelText('Comment') as HTMLInputElement;
		expect(input.type).toBe('text');
	});

	it('shows descriptions for options', () => {
		render(ConversionOptions, {
			props: { sourceFormat: 'png', targetFormat: 'webp', options: {} },
		});
		expect(screen.getByText('Output quality (1-100)')).toBeDefined();
		expect(screen.getByText('Use lossless compression')).toBeDefined();
	});

	it('uses provided option values over defaults', () => {
		render(ConversionOptions, {
			props: {
				sourceFormat: 'png',
				targetFormat: 'webp',
				options: { quality: 95, lossless: true },
			},
		});
		const qualityInput = screen.getByLabelText('Quality') as HTMLInputElement;
		expect(qualityInput.value).toBe('95');
		const losslessInput = screen.getByLabelText('Lossless') as HTMLInputElement;
		expect(losslessInput.checked).toBe(true);
	});

	it('updates options on number input change', async () => {
		const opts: Record<string, any> = {};
		render(ConversionOptions, {
			props: { sourceFormat: 'png', targetFormat: 'webp', options: opts },
		});
		const input = screen.getByLabelText('Quality') as HTMLInputElement;
		await fireEvent.input(input, { target: { value: '50' } });
		expect(opts.quality).toBe(50);
	});

	it('updates options on checkbox change', async () => {
		const opts: Record<string, any> = {};
		render(ConversionOptions, {
			props: { sourceFormat: 'png', targetFormat: 'webp', options: opts },
		});
		const checkbox = screen.getByLabelText('Lossless') as HTMLInputElement;
		await fireEvent.click(checkbox);
		expect(opts.lossless).toBe(true);
	});

	it('updates options on select change', async () => {
		const opts: Record<string, any> = {};
		render(ConversionOptions, {
			props: { sourceFormat: 'png', targetFormat: 'webp', options: opts },
		});
		const select = screen.getByLabelText('Resize Mode') as HTMLSelectElement;
		await fireEvent.change(select, { target: { value: 'fit' } });
		expect(opts.resize).toBe('fit');
	});
});
