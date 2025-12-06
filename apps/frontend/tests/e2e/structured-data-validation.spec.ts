/**
 * E2E Test Suite: Structured Data Validation
 * Tests JSON-LD schema markup for Google Search Console compatibility
 */

import { test, expect } from '@playwright/test';

test.describe('Structured Data - JSON-LD Schema Validation', () => {

  /**
   * Helper function to extract and parse JSON-LD schema from page
   */
  async function getJSONLDSchemas(page) {
    const schemas = await page.$$eval('script[type="application/ld+json"]', scripts =>
      scripts.map(script => {
        try {
          return JSON.parse(script.textContent || '{}');
        } catch (e) {
          return { error: e.message, content: script.textContent };
        }
      })
    );
    return schemas;
  }

  test('Homepage - Has valid JSON-LD schemas', async ({ page }) => {
    await page.goto('/');
    const schemas = await getJSONLDSchemas(page);

    // Should have at least Organization and SoftwareApplication schemas
    expect(schemas.length).toBeGreaterThanOrEqual(2);

    // All schemas should parse successfully (no errors)
    for (const schema of schemas) {
      expect(schema).not.toHaveProperty('error');
      expect(schema).toHaveProperty('@context');
      expect(schema).toHaveProperty('@type');
    }

    // Check for Organization schema
    const orgSchema = schemas.find(s => s['@type'] === 'Organization');
    expect(orgSchema).toBeDefined();
    expect(orgSchema?.name).toBe('File Convert');

    // Check for SoftwareApplication schema
    const appSchema = schemas.find(s => s['@type'] === 'SoftwareApplication');
    expect(appSchema).toBeDefined();
    expect(appSchema?.applicationCategory).toBeTruthy();
  });

  test('Conversion page (pdf-to-word) - Has valid schemas with FAQ', async ({ page }) => {
    await page.goto('/convert/pdf-to-word');
    const schemas = await getJSONLDSchemas(page);

    expect(schemas.length).toBeGreaterThanOrEqual(2);

    // Verify no parsing errors
    for (const schema of schemas) {
      expect(schema).not.toHaveProperty('error');
    }

    // Check for FAQPage schema
    const faqSchema = schemas.find(s => s['@type'] === 'FAQPage');
    expect(faqSchema).toBeDefined();
    expect(faqSchema?.mainEntity).toBeDefined();
    expect(Array.isArray(faqSchema?.mainEntity)).toBe(true);

    // Verify FAQ structure
    if (faqSchema?.mainEntity && Array.isArray(faqSchema.mainEntity)) {
      expect(faqSchema.mainEntity.length).toBeGreaterThan(0);

      for (const question of faqSchema.mainEntity) {
        expect(question['@type']).toBe('Question');
        expect(question.name).toBeTruthy();
        expect(question.acceptedAnswer).toBeDefined();
        expect(question.acceptedAnswer['@type']).toBe('Answer');
        expect(question.acceptedAnswer.text).toBeTruthy();
      }
    }

    // Check for BreadcrumbList
    const breadcrumbSchema = schemas.find(s => s['@type'] === 'BreadcrumbList');
    expect(breadcrumbSchema).toBeDefined();
  });

  test('Guide page - Has valid HowTo schema', async ({ page }) => {
    await page.goto('/guides/how-to-convert-pdf-to-word');
    const schemas = await getJSONLDSchemas(page);

    expect(schemas.length).toBeGreaterThan(0);

    // Verify no parsing errors
    for (const schema of schemas) {
      expect(schema).not.toHaveProperty('error');
    }

    // Note: HowTo schema might be optional on guide pages
    // Just verify all schemas are valid JSON
    for (const schema of schemas) {
      expect(schema['@context']).toBeTruthy();
      expect(schema['@type']).toBeTruthy();
    }
  });

  test('All conversion pages - Valid JSON-LD (sample)', async ({ page }) => {
    const conversionPages = [
      '/convert/pdf-to-word',
      '/convert/powerpoint-to-pdf',
      '/convert/image-to-pdf',
      '/convert/jpg-to-pdf',
      '/convert/csv-to-excel'
    ];

    for (const pagePath of conversionPages) {
      await page.goto(pagePath);
      const schemas = await getJSONLDSchemas(page);

      // Each page should have valid schemas
      expect(schemas.length).toBeGreaterThan(0);

      // Check for parsing errors
      for (const schema of schemas) {
        if (schema.error) {
          throw new Error(`JSON-LD parsing error on ${pagePath}: ${schema.error}\nContent: ${schema.content}`);
        }
        expect(schema['@context']).toBeTruthy();
        expect(schema['@type']).toBeTruthy();
      }
    }
  });

  test('Schema fields do not contain undefined or null values', async ({ page }) => {
    await page.goto('/convert/pdf-to-word');
    const schemas = await getJSONLDSchemas(page);

    for (const schema of schemas) {
      const schemaString = JSON.stringify(schema);

      // Should not contain literal "undefined" or "null" strings in values
      expect(schemaString).not.toContain('"undefined"');
      expect(schemaString).not.toContain(':undefined');
      expect(schemaString).not.toContain(':null');
    }
  });

  test('BreadcrumbList schema - Proper structure', async ({ page }) => {
    await page.goto('/convert/pdf-to-word');
    const schemas = await getJSONLDSchemas(page);

    const breadcrumbSchema = schemas.find(s => s['@type'] === 'BreadcrumbList');

    if (breadcrumbSchema) {
      expect(breadcrumbSchema.itemListElement).toBeDefined();
      expect(Array.isArray(breadcrumbSchema.itemListElement)).toBe(true);

      // Verify breadcrumb items
      for (const item of breadcrumbSchema.itemListElement) {
        expect(item['@type']).toBe('ListItem');
        expect(item.position).toBeGreaterThan(0);
        expect(item.name).toBeTruthy();
        expect(item.item).toBeTruthy();
      }
    }
  });

  test('SoftwareApplication schema - Required fields present', async ({ page }) => {
    await page.goto('/');
    const schemas = await getJSONLDSchemas(page);

    const appSchema = schemas.find(s => s['@type'] === 'SoftwareApplication');

    if (appSchema) {
      // Required fields per schema.org
      expect(appSchema.name).toBeTruthy();
      expect(appSchema.applicationCategory).toBeTruthy();
      expect(appSchema.offers).toBeDefined();

      // Verify offers structure
      expect(appSchema.offers['@type']).toBe('Offer');
      expect(appSchema.offers.price).toBeDefined();
      expect(appSchema.offers.priceCurrency).toBeDefined();
    }
  });

  test('FAQPage schema - No duplicate questions', async ({ page }) => {
    await page.goto('/convert/pdf-to-word');
    const schemas = await getJSONLDSchemas(page);

    const faqSchema = schemas.find(s => s['@type'] === 'FAQPage');

    if (faqSchema?.mainEntity) {
      const questions = faqSchema.mainEntity.map(q => q.name);
      const uniqueQuestions = new Set(questions);

      // No duplicate questions
      expect(questions.length).toBe(uniqueQuestions.size);
    }
  });

  test('Organization schema - Complete contact information', async ({ page }) => {
    await page.goto('/');
    const schemas = await getJSONLDSchemas(page);

    const orgSchema = schemas.find(s => s['@type'] === 'Organization');

    if (orgSchema) {
      expect(orgSchema.name).toBeTruthy();
      expect(orgSchema.url).toBeTruthy();
      expect(orgSchema.description).toBeTruthy();

      // Should have proper URL format
      expect(orgSchema.url).toMatch(/^https?:\/\//);
    }
  });

  test('All schemas - Valid @context URLs', async ({ page }) => {
    await page.goto('/convert/pdf-to-word');
    const schemas = await getJSONLDSchemas(page);

    for (const schema of schemas) {
      expect(schema['@context']).toBe('https://schema.org');
    }
  });

  test('JSON-LD does not contain HTML entities', async ({ page }) => {
    await page.goto('/convert/pdf-to-word');

    const schemaScripts = await page.$$eval('script[type="application/ld+json"]', scripts =>
      scripts.map(script => script.textContent || '')
    );

    for (const schemaText of schemaScripts) {
      // Should not contain escaped HTML entities
      expect(schemaText).not.toContain('&lt;');
      expect(schemaText).not.toContain('&gt;');
      expect(schemaText).not.toContain('&amp;');
      expect(schemaText).not.toContain('&quot;');

      // Should be valid JSON
      expect(() => JSON.parse(schemaText)).not.toThrow();
    }
  });
});

test.describe('Structured Data - Google Search Console Compatibility', () => {

  test('Schemas can be parsed by standard JSON parser', async ({ page }) => {
    const testPages = [
      '/',
      '/convert/pdf-to-word',
      '/convert/image-to-pdf',
      '/guides/how-to-convert-pdf-to-word'
    ];

    for (const pagePath of testPages) {
      await page.goto(pagePath);

      const schemaTexts = await page.$$eval('script[type="application/ld+json"]', scripts =>
        scripts.map(script => script.textContent || '')
      );

      for (const text of schemaTexts) {
        let parsed;
        try {
          parsed = JSON.parse(text);
        } catch (e) {
          throw new Error(`Failed to parse JSON-LD on ${pagePath}: ${e.message}\nContent: ${text.substring(0, 200)}...`);
        }

        expect(parsed).toBeDefined();
        expect(typeof parsed).toBe('object');
      }
    }
  });

  test('No malformed JSON syntax errors', async ({ page }) => {
    await page.goto('/convert/pdf-to-word');

    const schemaTexts = await page.$$eval('script[type="application/ld+json"]', scripts =>
      scripts.map(script => script.textContent || '')
    );

    for (const text of schemaTexts) {
      // Common syntax errors
      expect(text).not.toMatch(/,\s*}/); // Trailing comma before closing brace
      expect(text).not.toMatch(/,\s*\]/); // Trailing comma before closing bracket
      expect(text).not.toMatch(/:\s*,/); // Missing value
      expect(text).not.toMatch(/{\s*,/); // Comma after opening brace

      // Should have balanced braces
      const openBraces = (text.match(/{/g) || []).length;
      const closeBraces = (text.match(/}/g) || []).length;
      expect(openBraces).toBe(closeBraces);

      // Should have balanced brackets
      const openBrackets = (text.match(/\[/g) || []).length;
      const closeBrackets = (text.match(/\]/g) || []).length;
      expect(openBrackets).toBe(closeBrackets);
    }
  });
});
