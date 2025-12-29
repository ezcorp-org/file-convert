import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import Notification from './Notification.svelte';

describe('Notification', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders with a message', () => {
    const { container } = render(Notification, { props: { message: 'Hello world' } });
    const msg = container.querySelector('.notification__message');
    expect(msg).toBeTruthy();
    expect(msg!.textContent).toBe('Hello world');
  });

  it('renders with detail text when provided', () => {
    const { container } = render(Notification, {
      props: { message: 'Error occurred', detail: 'File too large' }
    });
    const detail = container.querySelector('.notification__detail');
    expect(detail).toBeTruthy();
    expect(detail!.textContent).toBe('File too large');
  });

  it('does not render detail when not provided', () => {
    const { container } = render(Notification, { props: { message: 'No detail' } });
    expect(container.querySelector('.notification__detail')).toBeNull();
  });

  it('defaults to info type', () => {
    const { container } = render(Notification, { props: { message: 'Info' } });
    expect(container.querySelector('.notification--info')).toBeTruthy();
  });

  it('renders error type with correct class', () => {
    const { container } = render(Notification, {
      props: { message: 'Error', type: 'error' }
    });
    expect(container.querySelector('.notification--error')).toBeTruthy();
  });

  it('renders warning type with correct class', () => {
    const { container } = render(Notification, {
      props: { message: 'Warning', type: 'warning' }
    });
    expect(container.querySelector('.notification--warning')).toBeTruthy();
  });

  it('renders success type with correct class', () => {
    const { container } = render(Notification, {
      props: { message: 'Success', type: 'success' }
    });
    expect(container.querySelector('.notification--success')).toBeTruthy();
  });

  it('shows correct icon for each type', () => {
    const types = [
      { type: 'error', icon: '❌' },
      { type: 'warning', icon: '⚠️' },
      { type: 'success', icon: '✅' },
      { type: 'info', icon: 'ℹ️' }
    ] as const;

    for (const { type, icon } of types) {
      const { container } = render(Notification, {
        props: { message: 'Test', type }
      });
      const iconEl = container.querySelector('.notification__icon');
      expect(iconEl!.textContent?.trim()).toBe(icon);
    }
  });

  it('renders a close button with accessible label', () => {
    const { container } = render(Notification, { props: { message: 'Test' } });
    const closeBtn = container.querySelector('.notification__close');
    expect(closeBtn).toBeTruthy();
    expect(closeBtn!.getAttribute('aria-label')).toBe('Close notification');
  });

  it('dispatches close event when close button is clicked', async () => {
    const { container, component } = render(Notification, { props: { message: 'Test' } });
    const closeHandler = vi.fn();
    component.$on('close', closeHandler);

    const closeBtn = container.querySelector('.notification__close')!;
    await fireEvent.click(closeBtn);

    // close dispatches after 300ms setTimeout
    await vi.waitFor(() => {
      expect(closeHandler).toHaveBeenCalledTimes(1);
    }, { timeout: 500 });
  });

  it('hides notification after close button click', async () => {
    const { container } = render(Notification, { props: { message: 'Test' } });

    expect(container.querySelector('.notification')).toBeTruthy();

    const closeBtn = container.querySelector('.notification__close')!;
    await fireEvent.click(closeBtn);

    // Component sets visible=false immediately
    await vi.waitFor(() => {
      expect(container.querySelector('.notification')).toBeNull();
    }, { timeout: 100 });
  });

  it('renders timer bar when autoClose is true', () => {
    const { container } = render(Notification, {
      props: { message: 'Auto', autoClose: true, duration: 3000 }
    });
    const timer = container.querySelector('.notification__timer');
    expect(timer).toBeTruthy();
    expect(timer!.getAttribute('style')).toContain('3000ms');
  });

  it('does not render timer bar when autoClose is false', () => {
    const { container } = render(Notification, {
      props: { message: 'Manual', autoClose: false }
    });
    expect(container.querySelector('.notification__timer')).toBeNull();
  });

  it('adds auto-close class when autoClose is true', () => {
    const { container } = render(Notification, {
      props: { message: 'Auto', autoClose: true }
    });
    expect(container.querySelector('.auto-close')).toBeTruthy();
  });
});
