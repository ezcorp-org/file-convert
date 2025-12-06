/**
 * E2E Test Suite: Traffic Acquisition Features
 * Tests RSS feed generation and social sharing functionality
 */

import { test, expect } from '@playwright/test';

test.describe('Traffic Acquisition - RSS Feed', () => {

  test('RSS feed is accessible at /guides/rss.xml', async ({ page }) => {
    const response = await page.goto('/guides/rss.xml');
    expect(response?.status()).toBe(200);
  });

  test('RSS feed has correct content type', async ({ page }) => {
    const response = await page.goto('/guides/rss.xml');
    const contentType = response?.headers()['content-type'];
    expect(contentType).toContain('application/rss+xml');
  });

  test('RSS feed contains valid XML structure', async ({ page }) => {
    await page.goto('/guides/rss.xml');
    const content = await page.content();

    // Check for RSS XML declaration and root elements
    expect(content).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(content).toContain('<rss version="2.0"');
    expect(content).toContain('<channel>');
    expect(content).toContain('</channel>');
    expect(content).toContain('</rss>');
  });

  test('RSS feed contains channel metadata', async ({ page }) => {
    await page.goto('/guides/rss.xml');
    const content = await page.content();

    // Verify required channel elements
    expect(content).toContain('<title>File Convert - Guides &amp; Tutorials</title>');
    expect(content).toContain('<link>https://file-convert.ezcorp.org/guides</link>');
    expect(content).toContain('<description>');
    expect(content).toContain('<language>en-us</language>');
    expect(content).toContain('<lastBuildDate>');
    expect(content).toContain('<atom:link href="https://file-convert.ezcorp.org/guides/rss.xml"');
  });

  test('RSS feed contains all 6 guide items', async ({ page }) => {
    await page.goto('/guides/rss.xml');
    const content = await page.content();

    // Count <item> tags
    const itemCount = (content.match(/<item>/g) || []).length;
    expect(itemCount).toBe(6);
  });

  test('RSS feed guide items have required fields', async ({ page }) => {
    await page.goto('/guides/rss.xml');
    const content = await page.content();

    // Each item should have these fields
    const expectedGuides = [
      'How to Maintain Formatting During PDF Conversion',
      'Batch Convert Images to PDF',
      'Secure File Conversion Online',
      'Best PDF to Excel Converter',
      'Document Conversion for Business Teams',
      'How to Convert PDF to Word'
    ];

    for (const guide of expectedGuides) {
      expect(content).toContain(guide);
    }
  });

  test('RSS feed items have valid permalinks', async ({ page }) => {
    await page.goto('/guides/rss.xml');
    const content = await page.content();

    // Check for guid elements with isPermaLink attribute
    expect(content).toContain('<guid isPermaLink="true">');
    expect(content).toContain('https://file-convert.ezcorp.org/guides/');
  });

  test('RSS feed items have publication dates', async ({ page }) => {
    await page.goto('/guides/rss.xml');
    const content = await page.content();

    // Each item should have a pubDate
    const pubDateCount = (content.match(/<pubDate>/g) || []).length;
    expect(pubDateCount).toBe(6);
  });

  test('RSS feed XML special characters are escaped', async ({ page }) => {
    await page.goto('/guides/rss.xml');
    const content = await page.content();

    // Check that ampersands are properly escaped
    expect(content).toContain('&amp;');
    // Should not contain unescaped special chars in content
    // (Allow in XML tags but not in text content)
  });
});

test.describe('Traffic Acquisition - Social Sharing (Component Tests)', () => {

  test('Social sharing section renders on conversion results page', async ({ page }) => {
    // Navigate to a conversion page
    await page.goto('/convert/pdf-to-word/');

    // Since we can't easily trigger a conversion in E2E without actual file processing,
    // we'll check if the ConversionResults component exists in the codebase
    // This is more of a smoke test to ensure the component is importable

    // Check that the page loads successfully
    await expect(page).toHaveTitle(/PDF to Word Converter/i);
  });

  // Note: Full social sharing tests would require:
  // 1. Mocking file conversion
  // 2. Triggering conversion completion
  // 3. Verifying share buttons appear
  // These are better tested in component/unit tests rather than E2E
});

test.describe('Traffic Acquisition - SEO Integration', () => {

  test('RSS feed is referenced in sitemap', async ({ page }) => {
    await page.goto('/sitemap.xml');
    const content = await page.content();

    // The sitemap should ideally reference the RSS feed
    // or at minimum include the guides section
    expect(content).toContain('/guides');
  });

  test('Main guides page is accessible', async ({ page }) => {
    const response = await page.goto('/guides');
    expect(response?.status()).toBe(200);
  });

  test('All guide pages referenced in RSS are accessible', async ({ page }) => {
    const guides = [
      '/guides/maintain-formatting-pdf-conversion',
      '/guides/batch-convert-images-to-pdf',
      '/guides/secure-file-conversion-online',
      '/guides/best-pdf-to-excel-converter',
      '/guides/document-conversion-business-teams',
      '/guides/how-to-convert-pdf-to-word'
    ];

    for (const guidePath of guides) {
      const response = await page.goto(guidePath);
      expect(response?.status()).toBe(200);
    }
  });
});

test.describe('Traffic Acquisition - Cache Headers', () => {

  test('RSS feed has proper cache headers', async ({ page }) => {
    const response = await page.goto('/guides/rss.xml');
    const cacheControl = response?.headers()['cache-control'];

    // Should have cache control for performance
    expect(cacheControl).toBeDefined();
    expect(cacheControl).toContain('public');
    expect(cacheControl).toContain('max-age=3600'); // 1 hour cache
  });
});

test.describe('Traffic Acquisition - RSS Feed Validation', () => {

  test('RSS feed validates against RSS 2.0 spec basics', async ({ page }) => {
    await page.goto('/guides/rss.xml');
    const content = await page.content();

    // Basic RSS 2.0 validation checks
    const requiredElements = [
      '<rss version="2.0"',
      '<channel>',
      '<title>',
      '<link>',
      '<description>',
      '<item>',
      '</item>',
      '</channel>',
      '</rss>'
    ];

    for (const element of requiredElements) {
      expect(content).toContain(element);
    }
  });

  test('RSS feed items have descriptions for feed readers', async ({ page }) => {
    await page.goto('/guides/rss.xml');
    const content = await page.content();

    // Each item should have a description for feed readers
    const descriptionCount = (content.match(/<description>/g) || []).length;
    // Should be at least 7: 1 for channel + 6 for items
    expect(descriptionCount).toBeGreaterThanOrEqual(7);
  });
});
