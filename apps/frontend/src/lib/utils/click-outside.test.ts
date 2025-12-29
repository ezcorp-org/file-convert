import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { clickOutside } from './click-outside';

describe('clickOutside', () => {
	let container: HTMLDivElement;
	let target: HTMLDivElement;
	let outside: HTMLDivElement;

	beforeEach(() => {
		container = document.createElement('div');
		target = document.createElement('div');
		outside = document.createElement('div');
		container.appendChild(target);
		container.appendChild(outside);
		document.body.appendChild(container);
	});

	afterEach(() => {
		document.body.removeChild(container);
	});

	it('should call handler when clicking outside the element', () => {
		const handler = vi.fn();
		clickOutside(target, handler);

		outside.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		expect(handler).toHaveBeenCalledOnce();
	});

	it('should not call handler when clicking inside the element', () => {
		const handler = vi.fn();
		clickOutside(target, handler);

		target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		expect(handler).not.toHaveBeenCalled();
	});

	it('should not call handler when clicking a child of the element', () => {
		const handler = vi.fn();
		const child = document.createElement('span');
		target.appendChild(child);
		clickOutside(target, handler);

		child.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		expect(handler).not.toHaveBeenCalled();
	});

	it('should remove listener on destroy', () => {
		const handler = vi.fn();
		const action = clickOutside(target, handler);

		action.destroy();
		outside.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		expect(handler).not.toHaveBeenCalled();
	});

	it('should handle undefined handler gracefully', () => {
		const action = clickOutside(target);

		expect(() => {
			outside.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		}).not.toThrow();

		action.destroy();
	});
});
