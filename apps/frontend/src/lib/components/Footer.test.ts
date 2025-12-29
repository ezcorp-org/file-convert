import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import Footer from './Footer.svelte';

describe('Footer', () => {
  it('renders the brand name', () => {
    const { container } = render(Footer);
    const heading = container.querySelector('.footer-brand h3');
    expect(heading).toBeTruthy();
    expect(heading!.textContent).toBe('File Convert');
  });

  it('renders the privacy tagline', () => {
    const { container } = render(Footer);
    const tagline = container.querySelector('.footer-tagline');
    expect(tagline).toBeTruthy();
    expect(tagline!.textContent).toContain('Privacy-first file conversion');
    expect(tagline!.textContent).toContain('Your files never leave your device');
  });

  it('renders privacy badges', () => {
    const { container } = render(Footer);
    const badges = container.querySelectorAll('.badge');
    expect(badges).toHaveLength(3);
    const badgeTexts = Array.from(badges).map(b => b.textContent?.trim());
    expect(badgeTexts.some(t => t?.includes('100% Private'))).toBe(true);
    expect(badgeTexts.some(t => t?.includes('No Tracking'))).toBe(true);
    expect(badgeTexts.some(t => t?.includes('GDPR Ready'))).toBe(true);
  });

  it('renders the current year in copyright', () => {
    const { container } = render(Footer);
    const copyright = container.querySelector('.copyright');
    expect(copyright).toBeTruthy();
    const currentYear = new Date().getFullYear().toString();
    expect(copyright!.textContent).toContain(currentYear);
    expect(copyright!.textContent).toContain('File Convert');
  });

  it('renders Product section links', () => {
    const { container } = render(Footer);
    const sections = container.querySelectorAll('.footer-section');
    const productSection = sections[1];
    expect(productSection.querySelector('h4')!.textContent).toBe('Product');
    const links = productSection.querySelectorAll('a');
    expect(links.length).toBeGreaterThanOrEqual(3);
  });

  it('renders Formats section links', () => {
    const { container } = render(Footer);
    const sections = container.querySelectorAll('.footer-section');
    const formatsSection = sections[2];
    expect(formatsSection.querySelector('h4')!.textContent).toBe('Formats');
    const links = formatsSection.querySelectorAll('a');
    expect(links.length).toBe(5);
  });

  it('renders Company section with external links', () => {
    const { container } = render(Footer);
    const sections = container.querySelectorAll('.footer-section');
    const companySection = sections[3];
    expect(companySection.querySelector('h4')!.textContent).toBe('Company');

    const externalLinks = companySection.querySelectorAll('a[target="_blank"]');
    expect(externalLinks.length).toBe(2);
    externalLinks.forEach(link => {
      expect(link.getAttribute('rel')).toBe('noopener');
    });
  });

  it('renders Desktop Pro section with CTA button', () => {
    const { container } = render(Footer);
    const sections = container.querySelectorAll('.footer-section');
    const proSection = sections[4];
    expect(proSection.querySelector('h4')!.textContent).toBe('Get Desktop Pro');
    expect(proSection.querySelector('.btn-cta')).toBeTruthy();
    expect(proSection.querySelector('.btn-cta')!.textContent?.trim()).toBe('Download Desktop Pro');
  });

  it('renders platform icons', () => {
    const { container } = render(Footer);
    const platforms = container.querySelector('.platforms');
    expect(platforms).toBeTruthy();
    expect(platforms!.textContent).toContain('Windows');
    expect(platforms!.textContent).toContain('macOS');
    expect(platforms!.textContent).toContain('Linux');
  });

  it('renders bottom footer links', () => {
    const { container } = render(Footer);
    const footerLinks = container.querySelectorAll('.footer-links a');
    const linkTexts = Array.from(footerLinks).map(l => l.textContent?.trim());
    expect(linkTexts).toContain('Privacy');
    expect(linkTexts).toContain('Terms');
    expect(linkTexts).toContain('Cookies');
    expect(linkTexts).toContain('Security');
  });

  it('renders the "Built with" message', () => {
    const { container } = render(Footer);
    const madeWith = container.querySelector('.made-with');
    expect(madeWith).toBeTruthy();
    expect(madeWith!.textContent).toContain('privacy-conscious users');
  });
});
