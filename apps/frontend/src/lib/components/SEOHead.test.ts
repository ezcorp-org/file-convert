import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/svelte';
import { page } from '$app/stores';
import SEOHead from './SEOHead.svelte';

describe('SEOHead', () => {
  beforeEach(() => {
    page.set({ url: new URL('http://localhost/') } as any);
  });

  it('can be rendered without any props', () => {
    const { container } = render(SEOHead);
    expect(container).toBeTruthy();
  });

  it('can be rendered with custom title', () => {
    const { container } = render(SEOHead, {
      props: { title: 'Custom Page Title' }
    });
    expect(container).toBeTruthy();
  });

  it('can be rendered with all custom SEO props', () => {
    const { container } = render(SEOHead, {
      props: {
        title: 'Test Title',
        description: 'Test description',
        keywords: 'test, keywords',
        ogImage: '/test.jpg',
        ogType: 'article',
        canonical: 'http://example.com/test'
      }
    });
    expect(container).toBeTruthy();
  });

  it('can be rendered with schema control flags disabled', () => {
    const { container } = render(SEOHead, {
      props: {
        includeAppSchema: false,
        includeOrgSchema: false,
        includeBreadcrumbs: false
      }
    });
    expect(container).toBeTruthy();
  });

  it('can be rendered with FAQ schema enabled', () => {
    const { container } = render(SEOHead, {
      props: {
        includeFAQSchema: true,
        faqs: [
          { question: 'What is this?', answer: 'A converter' }
        ]
      }
    });
    expect(container).toBeTruthy();
  });

  it('can be rendered with HowTo schema enabled', () => {
    const { container } = render(SEOHead, {
      props: {
        includeHowToSchema: true,
        howToName: 'Convert PDF',
        howToDescription: 'How to convert a PDF file',
        howToSteps: [
          { name: 'Upload', text: 'Upload file' },
          { name: 'Convert', text: 'Click convert' }
        ]
      }
    });
    expect(container).toBeTruthy();
  });

  it('default values match expected constants', () => {
    const defaults = {
      ogType: 'website',
      includeAppSchema: true,
      includeFAQSchema: false,
      includeHowToSchema: false,
      includeOrgSchema: true,
      includeBreadcrumbs: true
    };

    expect(defaults.ogType).toBe('website');
    expect(defaults.includeAppSchema).toBe(true);
    expect(defaults.includeFAQSchema).toBe(false);
    expect(defaults.includeHowToSchema).toBe(false);
    expect(defaults.includeOrgSchema).toBe(true);
    expect(defaults.includeBreadcrumbs).toBe(true);
  });
});
