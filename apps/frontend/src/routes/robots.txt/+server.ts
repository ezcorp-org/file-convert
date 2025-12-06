/**
 * Dynamic robots.txt generation for SEO
 * Provides search engine crawling instructions
 */

export const prerender = true;

export async function GET({ url }) {
  // Use production URL during prerendering, dynamic URL at runtime
  // SvelteKit uses 'http://sveltekit-prerender' as placeholder during build
  const baseUrl = url.host === 'sveltekit-prerender'
    ? 'https://file-convert.ezcorp.org'
    : `${url.protocol}//${url.host}`;

  const robotsContent = `# File Conversion Tools - Robots.txt
# Generated automatically for SEO optimization

User-agent: *
Allow: /

# Disallow private/internal pages
Disallow: /api/
Disallow: /_app/

# Disallow test/debug pages
Disallow: /test/
Disallow: /debug/
Disallow: /*.json$
Disallow: /*-test.html
Disallow: /*-fix.html

# Allow conversion tools and main pages
Allow: /convert
Allow: /convert/*
Allow: /guides
Allow: /guides/*
Allow: /tools/*
Allow: /

# Sitemap location
Sitemap: ${baseUrl}/sitemap.xml

# Crawl delay for respectful crawling
Crawl-delay: 1

# Allow all image and media files for SEO
User-agent: Googlebot-Image
Allow: /

User-agent: Googlebot-Video
Allow: /
`;

  return new Response(robotsContent, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
    },
  });
}