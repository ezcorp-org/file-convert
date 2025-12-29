import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import Header from './Header.svelte';
import { page } from '$app/stores';

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    page.set({ url: new URL('http://localhost/') } as any);
  });

  it('renders the logo with text "File Convert"', () => {
    const { container } = render(Header);
    const logoText = container.querySelector('.logo-text');
    expect(logoText).toBeTruthy();
    expect(logoText!.textContent).toBe('File Convert');
  });

  it('renders the logo link pointing to /', () => {
    const { container } = render(Header);
    const logoLink = container.querySelector('a.logo') as HTMLAnchorElement;
    expect(logoLink).toBeTruthy();
    expect(logoLink.getAttribute('href')).toBe('/');
  });

  it('renders all navigation items', () => {
    const { container } = render(Header);
    const navLinks = container.querySelectorAll('.nav-links a');
    expect(navLinks).toHaveLength(4);
    expect(navLinks[0].textContent?.trim()).toBe('Convert');
    expect(navLinks[1].textContent?.trim()).toBe('Features');
    expect(navLinks[2].textContent?.trim()).toBe('FAQ');
    expect(navLinks[3].textContent?.trim()).toBe('Get Started');
  });

  it('renders "Convert Files" CTA button', () => {
    const { container } = render(Header);
    const ctaBtn = container.querySelector('.nav-actions .btn-primary');
    expect(ctaBtn).toBeTruthy();
    expect(ctaBtn!.textContent?.trim()).toBe('Convert Files');
    expect(ctaBtn!.getAttribute('href')).toBe('/convert');
  });

  it('renders mobile menu toggle button with aria attributes', () => {
    const { container } = render(Header);
    const toggle = container.querySelector('[data-testid="mobile-menu-button"]');
    expect(toggle).toBeTruthy();
    expect(toggle!.getAttribute('aria-label')).toBe('Toggle mobile menu');
  });

  it('does not show mobile menu by default', () => {
    const { container } = render(Header);
    expect(container.querySelector('[data-testid="mobile-menu"]')).toBeNull();
  });

  it('toggles mobile menu when button is clicked', async () => {
    const { container } = render(Header);
    const toggle = container.querySelector('[data-testid="mobile-menu-button"]')!;

    await fireEvent.click(toggle);
    expect(container.querySelector('[data-testid="mobile-menu"]')).toBeTruthy();

    await fireEvent.click(toggle);
    expect(container.querySelector('[data-testid="mobile-menu"]')).toBeNull();
  });

  it('mobile menu contains all nav items plus CTA', async () => {
    const { container } = render(Header);
    const toggle = container.querySelector('[data-testid="mobile-menu-button"]')!;
    await fireEvent.click(toggle);

    const menuItems = container.querySelector('[data-testid="mobile-menu-items"]');
    expect(menuItems).toBeTruthy();
    const links = menuItems!.querySelectorAll('a');
    // 4 nav items + 1 CTA button
    expect(links).toHaveLength(5);
  });

  it('sets aria-expanded on mobile menu toggle', async () => {
    const { container } = render(Header);
    const toggle = container.querySelector('[data-testid="mobile-menu-button"]')!;

    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    await fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
  });

  it('marks Convert nav item as active when on /convert page', () => {
    page.set({ url: new URL('http://localhost/convert') } as any);
    const { container } = render(Header);

    const navLinks = container.querySelectorAll('.nav-links a');
    const convertLink = navLinks[0];
    expect(convertLink.classList.contains('active')).toBe(true);
  });
});
