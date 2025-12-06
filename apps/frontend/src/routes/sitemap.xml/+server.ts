/**
 * Dynamic XML Sitemap Generation for SEO
 * Automatically generates sitemap for Google Search Console submission
 */

export const prerender = true;

interface SitemapUrl {
  loc: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: string;
}

/**
 * Generate sitemap URLs for all conversion tools and pages
 */
function generateSitemapUrls(baseUrl: string): SitemapUrl[] {
  const currentDate = new Date().toISOString().split('T')[0];
  const urls: SitemapUrl[] = [];

  // Main pages - high priority
  const mainPages = [
    { path: '', priority: '1.0', changefreq: 'daily' as const },
    { path: '/convert', priority: '1.0', changefreq: 'daily' as const },
    { path: '/guides', priority: '0.8', changefreq: 'weekly' as const },
  ];

  mainPages.forEach(page => {
    urls.push({
      loc: `${baseUrl}${page.path}`,
      lastmod: currentDate,
      changefreq: page.changefreq,
      priority: page.priority
    });
  });

  // Conversion tool pages - only include pages that actually exist
  const conversionPages = [
    // Tier 1 - High Priority SEO Pages
    { path: '/convert/pdf-to-word', priority: '0.9' },
    { path: '/convert/word-to-pdf', priority: '0.9' },
    { path: '/convert/excel-to-pdf', priority: '0.9' },
    { path: '/convert/pdf-to-excel', priority: '0.9' },
    { path: '/convert/powerpoint-to-pdf', priority: '0.9' },
    { path: '/convert/image-to-pdf', priority: '0.9' },

    // Tier 2 - Secondary SEO Pages
    { path: '/convert/jpg-to-pdf', priority: '0.8' },
    { path: '/convert/pdf-to-jpg', priority: '0.8' },
    { path: '/convert/png-to-pdf', priority: '0.8' },
    { path: '/convert/docx-to-pdf', priority: '0.8' },
    { path: '/convert/excel-to-word', priority: '0.8' },
    { path: '/convert/csv-to-excel', priority: '0.8' },
  ];

  conversionPages.forEach(page => {
    urls.push({
      loc: `${baseUrl}${page.path}`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: page.priority
    });
  });

  // Guide pages for SEO content
  const guidePages = [
    { path: '/guides/how-to-convert-pdf-to-word', priority: '0.7' },
    { path: '/guides/maintain-formatting-pdf-conversion', priority: '0.7' },
    { path: '/guides/batch-convert-images-to-pdf', priority: '0.7' },
    { path: '/guides/secure-file-conversion-online', priority: '0.7' },
    { path: '/guides/best-pdf-to-excel-converter', priority: '0.7' },
    { path: '/guides/document-conversion-business-teams', priority: '0.7' },
  ];

  guidePages.forEach(guide => {
    urls.push({
      loc: `${baseUrl}${guide.path}`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: guide.priority
    });
  });

  // RSS Feed
  urls.push({
    loc: `${baseUrl}/guides/rss.xml`,
    lastmod: currentDate,
    changefreq: 'weekly',
    priority: '0.6'
  });

  return urls;
}

/**
 * Generate XML sitemap content
 */
function generateXmlSitemap(urls: SitemapUrl[]): string {
  const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';
  const urlsetOpen = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
  const urlsetClose = '</urlset>';

  const urlEntries = urls.map(url => `
  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('');

  return `${xmlHeader}
${urlsetOpen}${urlEntries}
${urlsetClose}`;
}

export async function GET({ url }) {
  // Use production URL during prerendering, dynamic URL at runtime
  // SvelteKit uses 'http://sveltekit-prerender' as placeholder during build
  const baseUrl = url.host === 'sveltekit-prerender'
    ? 'https://file-convert.ezcorp.org'
    : `${url.protocol}//${url.host}`;

  const sitemapUrls = generateSitemapUrls(baseUrl);
  const xmlContent = generateXmlSitemap(sitemapUrls);

  return new Response(xmlContent, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    },
  });
}