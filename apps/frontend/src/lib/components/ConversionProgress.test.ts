import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import ConversionProgress from './ConversionProgress.svelte';

describe('ConversionProgress', () => {
	const defaultProps = {
		progress: { progress: 50, message: 'Converting...' },
		fileName: 'test-image.png',
		fromFormat: 'png',
		toFormat: 'jpeg'
	};

	it('renders with basic props', () => {
		const { container } = render(ConversionProgress, { props: defaultProps });
		expect(container.querySelector('.progress-container')).toBeTruthy();
	});

	it('displays the file name', () => {
		const { container } = render(ConversionProgress, { props: defaultProps });
		const fileNameEl = container.querySelector('.file-name');
		expect(fileNameEl?.textContent).toContain('test-image.png');
	});

	it('displays the target format in uppercase', () => {
		const { container } = render(ConversionProgress, { props: defaultProps });
		const toFormatEl = container.querySelector('.to-format');
		expect(toFormatEl?.textContent).toBe('JPEG');
	});

	it('displays progress percentage', () => {
		const { container } = render(ConversionProgress, { props: defaultProps });
		const percentage = container.querySelector('.progress-percentage');
		expect(percentage?.textContent?.trim()).toBe('50%');
	});

	it('sets progress bar width based on progress value', () => {
		const { container } = render(ConversionProgress, { props: defaultProps });
		const bar = container.querySelector('.progress-bar') as HTMLElement;
		expect(bar.style.width).toBe('50%');
	});

	it('clamps progress to 0-100 range', () => {
		const { container } = render(ConversionProgress, {
			props: { ...defaultProps, progress: { progress: 150, message: '' } }
		});
		const bar = container.querySelector('.progress-bar') as HTMLElement;
		expect(bar.style.width).toBe('100%');

		const percentage = container.querySelector('.progress-percentage');
		expect(percentage?.textContent?.trim()).toBe('100%');
	});

	it('clamps negative progress to 0', () => {
		const { container } = render(ConversionProgress, {
			props: { ...defaultProps, progress: { progress: -10, message: '' } }
		});
		const bar = container.querySelector('.progress-bar') as HTMLElement;
		expect(bar.style.width).toBe('0%');
	});

	it('adds complete class when progress is 100', () => {
		const { container } = render(ConversionProgress, {
			props: { ...defaultProps, progress: { progress: 100, message: 'Done!' } }
		});
		expect(container.querySelector('.progress-container.complete')).toBeTruthy();
	});

	it('does not add complete class when progress < 100', () => {
		const { container } = render(ConversionProgress, { props: defaultProps });
		expect(container.querySelector('.progress-container.complete')).toBeNull();
	});

	it('displays progress message when provided', () => {
		const { container } = render(ConversionProgress, { props: defaultProps });
		const message = container.querySelector('.message-text');
		expect(message?.textContent).toBe('Converting...');
	});

	it('hides progress message section when no message', () => {
		const { container } = render(ConversionProgress, {
			props: { ...defaultProps, progress: { progress: 50 } }
		});
		expect(container.querySelector('.progress-message')).toBeNull();
	});

	it('shows check icon when complete', () => {
		const { container } = render(ConversionProgress, {
			props: { ...defaultProps, progress: { progress: 100, message: 'Done!' } }
		});
		const statusIcon = container.querySelector('.status-icon');
		expect(statusIcon).toBeTruthy();
	});

	it('shows spinner icon when in progress', () => {
		const { container } = render(ConversionProgress, { props: defaultProps });
		const spinner = container.querySelector('.status-spinner');
		expect(spinner).toBeTruthy();
	});

	it('displays conversion arrow between formats', () => {
		const { container } = render(ConversionProgress, { props: defaultProps });
		const arrow = container.querySelector('.conversion-arrow');
		expect(arrow?.textContent).toContain('\u2192');
	});
});
