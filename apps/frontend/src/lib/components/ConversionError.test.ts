import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import ConversionError from './ConversionError.svelte';

describe('ConversionError', () => {
	const defaultProps = {
		fileName: 'document.pdf',
		fromFormat: 'pdf',
		toFormat: 'docx',
		error: 'Conversion failed unexpectedly',
		jobId: 'job-123'
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders error container', () => {
		const { container } = render(ConversionError, { props: defaultProps });
		expect(container.querySelector('.error-container')).toBeTruthy();
	});

	it('displays the file name', () => {
		const { container } = render(ConversionError, { props: defaultProps });
		const fileName = container.querySelector('.file-name');
		expect(fileName?.textContent).toBe('document.pdf');
	});

	it('displays default error title for generic errors', () => {
		const { container } = render(ConversionError, { props: defaultProps });
		const title = container.querySelector('.error-title');
		expect(title?.textContent).toBe('Conversion failed');
	});

	it('displays memory error message for OOM errors', () => {
		const { container } = render(ConversionError, {
			props: { ...defaultProps, error: 'Out of memory error' }
		});
		const title = container.querySelector('.error-title');
		expect(title?.textContent).toBe('File too large');
	});

	it('displays format not supported message for unsupported errors', () => {
		const { container } = render(ConversionError, {
			props: { ...defaultProps, error: 'Format not supported for this conversion' }
		});
		const title = container.querySelector('.error-title');
		expect(title?.textContent).toBe('Format not supported');
	});

	it('displays corrupt file message', () => {
		const { container } = render(ConversionError, {
			props: { ...defaultProps, error: 'File appears to be corrupt or malformed' }
		});
		const title = container.querySelector('.error-title');
		expect(title?.textContent).toBe('File appears corrupted');
	});

	it('displays timeout message', () => {
		const { container } = render(ConversionError, {
			props: { ...defaultProps, error: 'Operation timeout exceeded' }
		});
		const title = container.querySelector('.error-title');
		expect(title?.textContent).toBe('Conversion timed out');
	});

	it('displays network error message', () => {
		const { container } = render(ConversionError, {
			props: { ...defaultProps, error: 'Network error: failed to fetch resource' }
		});
		const title = container.querySelector('.error-title');
		expect(title?.textContent).toBe('Network error');
	});

	it('handles empty error string gracefully', () => {
		const { container } = render(ConversionError, {
			props: { ...defaultProps, error: '' }
		});
		const title = container.querySelector('.error-title');
		expect(title?.textContent).toBe('Conversion failed');
	});

	it('displays suggestions list', () => {
		const { container } = render(ConversionError, { props: defaultProps });
		const suggestions = container.querySelectorAll('.suggestions li');
		expect(suggestions.length).toBeGreaterThan(0);
	});

	it('shows technical details in collapsed section', () => {
		const { container } = render(ConversionError, { props: defaultProps });
		const details = container.querySelector('.technical-details');
		expect(details).toBeTruthy();
		const code = container.querySelector('.technical-details code');
		expect(code?.textContent).toBe('Conversion failed unexpectedly');
	});

	it('dispatches retry event with job info on retry click', async () => {
		const { container, component } = render(ConversionError, { props: defaultProps });
		const handler = vi.fn();
		component.$on('retry', handler);

		const retryBtn = container.querySelector('.retry-btn') as HTMLButtonElement;
		await fireEvent.click(retryBtn);

		expect(handler).toHaveBeenCalled();
		const detail = handler.mock.calls[0][0].detail;
		expect(detail).toEqual({
			jobId: 'job-123',
			fileName: 'document.pdf',
			fromFormat: 'pdf',
			toFormat: 'docx'
		});
	});

	it('dispatches dismiss event with job id on dismiss click', async () => {
		const { container, component } = render(ConversionError, { props: defaultProps });
		const handler = vi.fn();
		component.$on('dismiss', handler);

		const dismissBtn = container.querySelector('.dismiss-btn') as HTMLButtonElement;
		await fireEvent.click(dismissBtn);

		expect(handler).toHaveBeenCalled();
		expect(handler.mock.calls[0][0].detail).toEqual({ jobId: 'job-123' });
	});

	it('renders retry and dismiss buttons', () => {
		const { container } = render(ConversionError, { props: defaultProps });
		expect(container.querySelector('.retry-btn')).toBeTruthy();
		expect(container.querySelector('.dismiss-btn')).toBeTruthy();
	});

	it('includes format info in unsupported error description', () => {
		const { container } = render(ConversionError, {
			props: { ...defaultProps, error: 'unsupported conversion' }
		});
		const description = container.querySelector('.error-description');
		expect(description?.textContent).toContain('PDF');
		expect(description?.textContent).toContain('DOCX');
	});
});
