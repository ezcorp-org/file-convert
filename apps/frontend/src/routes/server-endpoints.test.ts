import { describe, it, expect, vi } from 'vitest';

// Mock @sveltejs/kit json helper
vi.mock('@sveltejs/kit', () => ({
  json: (data: unknown, init?: ResponseInit) =>
    new Response(JSON.stringify(data), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers as Record<string, string>),
      },
    }),
}));

// Helper to create a mock URL object for SvelteKit request events
function mockRequestEvent(urlStr: string) {
  const url = new URL(urlStr);
  return { url } as { url: URL };
}

describe('robots.txt endpoint', () => {
  it('should return correct Content-Type and cache headers', async () => {
    const { GET } = await import('./robots.txt/+server');
    const event = mockRequestEvent('https://example.com/robots.txt');
    const response = await GET(event as any);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/plain');
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=86400');
  });

  it('should include essential robots directives', async () => {
    const { GET } = await import('./robots.txt/+server');
    const event = mockRequestEvent('https://example.com/robots.txt');
    const response = await GET(event as any);
    const body = await response.text();

    expect(body).toContain('User-agent: *');
    expect(body).toContain('Allow: /');
    expect(body).toContain('Disallow: /api/');
    expect(body).toContain('Disallow: /_app/');
    expect(body).toContain('Sitemap: https://example.com/sitemap.xml');
  });

  it('should use production URL when prerendering', async () => {
    const { GET } = await import('./robots.txt/+server');
    const event = mockRequestEvent('http://sveltekit-prerender/robots.txt');
    const response = await GET(event as any);
    const body = await response.text();

    expect(body).toContain('Sitemap: https://file-convert.ezcorp.org/sitemap.xml');
    expect(body).not.toContain('sveltekit-prerender');
  });

  it('should include crawl-delay and bot-specific rules', async () => {
    const { GET } = await import('./robots.txt/+server');
    const event = mockRequestEvent('https://example.com/robots.txt');
    const response = await GET(event as any);
    const body = await response.text();

    expect(body).toContain('Crawl-delay: 1');
    expect(body).toContain('User-agent: Googlebot-Image');
    expect(body).toContain('User-agent: Googlebot-Video');
  });
});

describe('sitemap.xml endpoint', () => {
  it('should return valid XML with correct headers', async () => {
    const { GET } = await import('./sitemap.xml/+server');
    const event = mockRequestEvent('https://example.com/sitemap.xml');
    const response = await GET(event as any);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/xml');
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=3600');
  });

  it('should contain XML declaration and urlset', async () => {
    const { GET } = await import('./sitemap.xml/+server');
    const event = mockRequestEvent('https://example.com/sitemap.xml');
    const response = await GET(event as any);
    const body = await response.text();

    expect(body).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(body).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(body).toContain('</urlset>');
  });

  it('should include main pages with high priority', async () => {
    const { GET } = await import('./sitemap.xml/+server');
    const event = mockRequestEvent('https://example.com/sitemap.xml');
    const response = await GET(event as any);
    const body = await response.text();

    expect(body).toContain('<loc>https://example.com</loc>');
    expect(body).toContain('<loc>https://example.com/convert</loc>');
    expect(body).toContain('<loc>https://example.com/guides</loc>');
    expect(body).toContain('<priority>1.0</priority>');
  });

  it('should include conversion and guide pages', async () => {
    const { GET } = await import('./sitemap.xml/+server');
    const event = mockRequestEvent('https://example.com/sitemap.xml');
    const response = await GET(event as any);
    const body = await response.text();

    expect(body).toContain('<loc>https://example.com/convert/pdf-to-word</loc>');
    expect(body).toContain('<loc>https://example.com/guides/how-to-convert-pdf-to-word</loc>');
    expect(body).toContain('<loc>https://example.com/guides/rss.xml</loc>');
  });

  it('should use production URL when prerendering', async () => {
    const { GET } = await import('./sitemap.xml/+server');
    const event = mockRequestEvent('http://sveltekit-prerender/sitemap.xml');
    const response = await GET(event as any);
    const body = await response.text();

    expect(body).toContain('<loc>https://file-convert.ezcorp.org</loc>');
    expect(body).not.toContain('sveltekit-prerender');
  });

  it('should include lastmod dates in YYYY-MM-DD format', async () => {
    const { GET } = await import('./sitemap.xml/+server');
    const event = mockRequestEvent('https://example.com/sitemap.xml');
    const response = await GET(event as any);
    const body = await response.text();

    const datePattern = /<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/;
    expect(body).toMatch(datePattern);
  });
});

describe('RSS feed endpoint', () => {
  it('should return correct Content-Type and cache headers', async () => {
    const { GET } = await import('./guides/rss.xml/+server');
    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/rss+xml; charset=utf-8');
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=3600');
  });

  it('should contain valid RSS structure', async () => {
    const { GET } = await import('./guides/rss.xml/+server');
    const response = await GET();
    const body = await response.text();

    expect(body).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(body).toContain('<rss version="2.0"');
    expect(body).toContain('xmlns:atom="http://www.w3.org/2005/Atom"');
    expect(body).toContain('<channel>');
    expect(body).toContain('</channel>');
    expect(body).toContain('</rss>');
  });

  it('should contain channel metadata', async () => {
    const { GET } = await import('./guides/rss.xml/+server');
    const response = await GET();
    const body = await response.text();

    expect(body).toContain('<title>File Convert - Guides & Tutorials</title>');
    expect(body).toContain('<link>https://file-convert.ezcorp.org/guides</link>');
    expect(body).toContain('<language>en-us</language>');
    expect(body).toContain('<lastBuildDate>');
  });

  it('should contain guide items with required RSS elements', async () => {
    const { GET } = await import('./guides/rss.xml/+server');
    const response = await GET();
    const body = await response.text();

    expect(body).toContain('<item>');
    expect(body).toContain('<title>How to Convert PDF to Word: Complete Step-by-Step Guide</title>');
    expect(body).toContain('<pubDate>');
    expect(body).toContain('<guid isPermaLink="true">');
  });

  it('should escape XML special characters in content', async () => {
    const { GET } = await import('./guides/rss.xml/+server');
    const response = await GET();
    const body = await response.text();

    // The title "File Convert - Guides & Tutorials" should have & escaped
    expect(body).toContain('&amp;');
    // Should not contain unescaped ampersands in content (except in XML declarations/namespaces)
  });

  it('should include atom self-link', async () => {
    const { GET } = await import('./guides/rss.xml/+server');
    const response = await GET();
    const body = await response.text();

    expect(body).toContain('atom:link href="https://file-convert.ezcorp.org/guides/rss.xml" rel="self"');
  });
});

describe('.well-known endpoint', () => {
  it('should return JSON with 200 status', async () => {
    const { GET } = await import('./.well-known/+server');
    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('application/json');
  });

  it('should return expected message body', async () => {
    const { GET } = await import('./.well-known/+server');
    const response = await GET();
    const body = await response.json();

    expect(body).toEqual({ message: 'Well-known endpoint' });
  });
});

describe('.well-known/appspecific/com.chrome.devtools.json endpoint', () => {
  it('should return JSON with 200 status', async () => {
    const { GET } = await import('./.well-known/appspecific/com.chrome.devtools.json/+server');
    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('application/json');
  });

  it('should return empty JSON object', async () => {
    const { GET } = await import('./.well-known/appspecific/com.chrome.devtools.json/+server');
    const response = await GET();
    const body = await response.json();

    expect(body).toEqual({});
  });
});
