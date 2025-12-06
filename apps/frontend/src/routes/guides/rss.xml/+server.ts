/**
 * RSS Feed for File Convert Guides
 * Provides syndicated content for automated content distribution
 */

export const prerender = true;

interface GuideItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
}

const guides: GuideItem[] = [
  {
    title: 'How to Maintain Formatting During PDF Conversion',
    link: 'https://file-convert.ezcorp.org/guides/maintain-formatting-pdf-conversion',
    description: 'Learn professional tips to preserve formatting when converting PDFs to Word, Excel, and other formats. Complete guide with troubleshooting steps.',
    pubDate: new Date('2025-09-30').toUTCString()
  },
  {
    title: 'Batch Convert Images to PDF: Complete Guide',
    link: 'https://file-convert.ezcorp.org/guides/batch-convert-images-to-pdf',
    description: 'Convert multiple images to PDF efficiently with our step-by-step guide. Learn best practices for organizing, compressing, and batch processing.',
    pubDate: new Date('2025-09-30').toUTCString()
  },
  {
    title: 'Secure File Conversion Online: Privacy & Security Guide',
    link: 'https://file-convert.ezcorp.org/guides/secure-file-conversion-online',
    description: 'Protect your privacy during file conversions. Learn about browser-local processing, encryption, and security best practices for online converters.',
    pubDate: new Date('2025-09-30').toUTCString()
  },
  {
    title: 'Best PDF to Excel Converter: Features & Comparison Guide',
    link: 'https://file-convert.ezcorp.org/guides/best-pdf-to-excel-converter',
    description: 'Find the best PDF to Excel converter for your needs. Compare features, accuracy, privacy, and pricing of top conversion tools.',
    pubDate: new Date('2025-09-30').toUTCString()
  },
  {
    title: 'Document Conversion for Business Teams: Enterprise Guide',
    link: 'https://file-convert.ezcorp.org/guides/document-conversion-business-teams',
    description: 'Enterprise guide to efficient file conversion workflows. Learn about batch processing, security compliance, and team collaboration.',
    pubDate: new Date('2025-09-30').toUTCString()
  },
  {
    title: 'How to Convert PDF to Word: Complete Step-by-Step Guide',
    link: 'https://file-convert.ezcorp.org/guides/how-to-convert-pdf-to-word',
    description: 'Complete guide to converting PDF files to editable Word documents. Learn about formatting preservation, batch conversion, and common issues.',
    pubDate: new Date('2025-09-30').toUTCString()
  }
];

export async function GET() {
  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>File Convert - Guides & Tutorials</title>
    <link>https://file-convert.ezcorp.org/guides</link>
    <description>File conversion guides, tutorials, and best practices. Learn how to convert PDF, Word, Excel, images, and more with our comprehensive guides.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="https://file-convert.ezcorp.org/guides/rss.xml" rel="self" type="application/rss+xml" />
    ${guides.map(g => `
    <item>
      <title>${escapeXml(g.title)}</title>
      <link>${escapeXml(g.link)}</link>
      <description>${escapeXml(g.description)}</description>
      <pubDate>${g.pubDate}</pubDate>
      <guid isPermaLink="true">${escapeXml(g.link)}</guid>
    </item>`).join('')}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
    }
  });
}

/**
 * Escape XML special characters
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
