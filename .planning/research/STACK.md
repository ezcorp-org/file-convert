# Stack Research: E2E Testing & File Validation

**Domain:** E2E Testing for File Conversion Applications
**Researched:** 2026-01-23
**Confidence:** HIGH

## Executive Summary

For comprehensive E2E testing of file conversions, the 2025-2026 standard stack combines Playwright's built-in capabilities with specialized file validation libraries. The key insight: **validation happens in layers** - magic number detection for file integrity, format-specific parsers for content accuracy, and visual/perceptual comparison for output fidelity.

## Recommended Stack

### Core Testing Framework (Already Established)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Playwright | 1.55.0 | E2E test runner, browser automation | Industry standard for 2026, built-in visual regression via pixelmatch, supports file downloads/uploads, excellent TypeScript support |
| Vitest | 3.2.4 | Unit testing, file parsing validation | Fast, native ESM support, built-in TypeScript, excellent for testing conversion logic in isolation |
| TypeScript | 5.9.2+ | Type safety | Essential for test reliability, prevents runtime errors in test code |

### File Integrity Validation

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| file-type | 20.2.0 | Magic number detection, MIME type validation | EVERY file output validation - verifies file is valid format before content checks |
| pixelmatch | 6.0.0 | Pixel-perfect image comparison | Image conversions - built into Playwright, but can use directly for custom comparisons |
| odiff | 3.1.1 | High-performance image comparison with SIMD | Large image batches, performance-critical tests - 3-10x faster than pixelmatch |

**Confidence:** HIGH - file-type and pixelmatch are industry standards verified via npm and official Playwright docs.

### Format-Specific Parsers

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| pdfjs-dist | 5.4.149 | PDF text extraction, metadata validation | PDF output validation - extract text/metadata to verify conversion accuracy (already in dependencies) |
| pdf-parse | 1.2.0 | Lightweight PDF text extraction | Simple PDF text validation when you don't need rendering |
| sharp | 0.33.5 | Image processing, format conversion, metadata extraction | Image validation - read EXIF, verify dimensions, check color profiles |
| ExcelJS | 4.4.0 | Excel/CSV reading, data validation | Spreadsheet conversions - validate cell data, formulas, formatting |
| jszip | 3.10.1 | ZIP archive reading/validation | Archive validation - verify archive integrity, file count, file names (already in dependencies) |
| papaparse | 5.5.3 | CSV parsing and validation | CSV conversions - validate rows, columns, encoding (already in dependencies) |

**Confidence:** HIGH - All versions verified via npm search and WebSearch. pdfjs-dist, jszip, and papaparse already in project dependencies.

### Comparison & Diffing

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| diff | 7.0.0 | Text comparison, line-by-line diffs | Text file conversions - compare expected vs actual text output |
| Zod | 3.24.1 | Schema validation for structured data | JSON/YAML/XML validation - define expected structure, validate output matches |
| waveform-data.js | 4.5.1 | Audio waveform extraction and comparison | Audio conversions - compare waveform characteristics, detect quality loss |

**Confidence:** MEDIUM - Versions from npm, but audio validation approach less standardized than image/document validation.

### Test Data Generation

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @faker-js/faker | 10.2.0 | Realistic test data generation | Generate synthetic file content - realistic text, names, addresses for document testing |
| canvas | 2.11.2 | Server-side canvas for synthetic image generation | Generate test images programmatically in Node.js environment |

**Confidence:** HIGH - @faker-js/faker v10.2.0 verified via npm (published Jan 2026), standard for 2025-2026.

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Playwright Docker Image | Consistent visual testing environment | Use mcr.microsoft.com/playwright:v1.55.0 - ensures identical font rendering, eliminates OS-specific visual diffs |
| Playwright Trace Viewer | Debug failed tests visually | Built-in, use `trace: 'on-first-retry'` in config |
| Playwright UI Mode | Interactive test development | Run with `--ui` flag, excellent for debugging file upload/download flows |

## Installation

```bash
# File validation core (add to existing Playwright/Vitest setup)
npm install file-type sharp diff zod

# Format-specific parsers (some already installed)
npm install pdf-parse exceljs waveform-data

# Test data generation
npm install -D @faker-js/faker canvas

# Optional: High-performance image comparison
npm install -D odiff
```

**Note:** pdfjs-dist, jszip, and papaparse already in project dependencies - no need to reinstall.

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| pixelmatch | odiff | Large image sets (>100 images), CI performance critical - odiff is 3-10x faster via SIMD |
| pixelmatch | Resemble.js | Need anti-aliasing detection customization - Resemble.js offers more tuning options (but in low-maintenance mode) |
| pdfjs-dist | pdf-parse | Only need raw text extraction, no rendering - pdf-parse is simpler/lighter |
| diff | diff-match-patch | Need line/word/character level diffs with patch generation - Google's diff-match-patch implements Myers algorithm |
| Zod | Joi | Team already uses Joi - Joi has 20.7k stars, mature, but Zod has better TypeScript integration |
| @faker-js/faker | Custom fixtures | Domain-specific formats (e.g., medical records, financial data) - faker is generic, may need custom generators |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| faker (without @faker-js scope) | Unmaintained since 2022, security risks | @faker-js/faker - active fork with 10.x releases |
| Resemble.js | "Ultra low-maintenance mode" per maintainer, updates 1-2x/year | pixelmatch (maintained, built into Playwright) or odiff (high-performance) |
| magic-number npm package | Last published 8 years ago, outdated | file-type (actively maintained, ESM-native) |
| Rolling your own magic number detection | Incomplete format coverage, maintenance burden | file-type (supports 100+ formats, battle-tested) |
| pdf-lib for validation | Designed for PDF creation/modification, overkill for validation | pdfjs-dist for rendering/extraction, pdf-parse for simple text |
| Node.js zlib for ZIP validation | Low-level, error-prone | jszip (already in dependencies, handles edge cases) |

## Stack Patterns by Use Case

### Pattern 1: Image Conversion Validation

```typescript
import { test, expect } from '@playwright/test';
import { fileTypeFromBuffer } from 'file-type';
import sharp from 'sharp';
import pixelmatch from 'pixelmatch';

test('PNG to JPEG conversion produces valid JPEG', async ({ page }) => {
  // 1. Upload PNG, convert to JPEG
  const downloadPromise = page.waitForEvent('download');
  // ... trigger conversion ...
  const download = await downloadPromise;

  // 2. Validate magic number
  const buffer = await download.createReadStream().then(/* buffer conversion */);
  const type = await fileTypeFromBuffer(buffer);
  expect(type?.mime).toBe('image/jpeg');

  // 3. Validate metadata and dimensions
  const metadata = await sharp(buffer).metadata();
  expect(metadata.format).toBe('jpeg');
  expect(metadata.width).toBe(expectedWidth);

  // 4. Visual comparison (if reference exists)
  const referenceBuffer = await fs.readFile('fixtures/expected.jpeg');
  const diff = pixelmatch(
    buffer, referenceBuffer, null,
    metadata.width, metadata.height,
    { threshold: 0.1 }
  );
  expect(diff).toBeLessThan(100); // Allow <100 pixels difference
});
```

**Use when:** Testing image format conversions (PNG, JPEG, WebP, etc.)

### Pattern 2: Document Conversion Validation

```typescript
import { test, expect } from '@playwright/test';
import { fileTypeFromBuffer } from 'file-type';
import * as pdfjsLib from 'pdfjs-dist';
import { z } from 'zod';

test('DOCX to PDF preserves text content', async ({ page }) => {
  // 1. Upload DOCX, convert to PDF
  const downloadPromise = page.waitForEvent('download');
  // ... trigger conversion ...
  const download = await downloadPromise;

  // 2. Validate magic number
  const buffer = await download.createReadStream().then(/* buffer conversion */);
  const type = await fileTypeFromBuffer(buffer);
  expect(type?.mime).toBe('application/pdf');

  // 3. Extract text from PDF
  const doc = await pdfjsLib.getDocument(buffer).promise;
  const page1 = await doc.getPage(1);
  const textContent = await page1.getTextContent();
  const text = textContent.items.map(item => item.str).join(' ');

  // 4. Validate expected content
  expect(text).toContain('Expected Header Text');
  expect(text).toMatch(/Expected Pattern/);
});
```

**Use when:** Testing document conversions (DOCX, PDF, HTML, TXT)

### Pattern 3: Spreadsheet Data Validation

```typescript
import { test, expect } from '@playwright/test';
import { fileTypeFromBuffer } from 'file-type';
import ExcelJS from 'exceljs';
import Papa from 'papaparse';

test('CSV to Excel preserves data structure', async ({ page }) => {
  // 1. Upload CSV, convert to Excel
  const downloadPromise = page.waitForEvent('download');
  // ... trigger conversion ...
  const download = await downloadPromise;

  // 2. Validate magic number
  const buffer = await download.createReadStream().then(/* buffer conversion */);
  const type = await fileTypeFromBuffer(buffer);
  expect(type?.mime).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

  // 3. Parse Excel and validate structure
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const worksheet = workbook.getWorksheet(1);

  // 4. Validate data integrity
  expect(worksheet.rowCount).toBe(expectedRows);
  expect(worksheet.getRow(1).values).toEqual(['Header1', 'Header2', 'Header3']);

  // 5. Compare cell values
  const cell = worksheet.getCell('A2');
  expect(cell.value).toBe(expectedValue);
});
```

**Use when:** Testing spreadsheet conversions (CSV, Excel, TSV)

### Pattern 4: Archive Validation

```typescript
import { test, expect } from '@playwright/test';
import { fileTypeFromBuffer } from 'file-type';
import JSZip from 'jszip';

test('ZIP archive contains expected files', async ({ page }) => {
  // 1. Create/download ZIP
  const downloadPromise = page.waitForEvent('download');
  // ... trigger archive creation ...
  const download = await downloadPromise;

  // 2. Validate magic number
  const buffer = await download.createReadStream().then(/* buffer conversion */);
  const type = await fileTypeFromBuffer(buffer);
  expect(type?.mime).toBe('application/zip');

  // 3. Extract and validate contents
  const zip = await JSZip.loadAsync(buffer);
  const fileNames = Object.keys(zip.files);
  expect(fileNames).toContain('expected-file.txt');

  // 4. Validate individual file content
  const file = await zip.file('expected-file.txt').async('string');
  expect(file).toContain('expected content');
});
```

**Use when:** Testing archive operations (ZIP, TAR, 7Z)

### Pattern 5: Synthetic Test File Generation

```typescript
import { faker } from '@faker-js/faker';
import { createCanvas } from 'canvas';
import sharp from 'sharp';

// Generate realistic test images
function generateTestImage(width: number, height: number): Buffer {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Draw synthetic content
  ctx.fillStyle = faker.color.rgb();
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = 'white';
  ctx.font = '48px Arial';
  ctx.fillText(faker.lorem.words(3), 20, 60);

  return canvas.toBuffer('image/png');
}

// Generate realistic CSV data
function generateTestCSV(rows: number): string {
  const data = [];
  for (let i = 0; i < rows; i++) {
    data.push({
      name: faker.person.fullName(),
      email: faker.internet.email(),
      phone: faker.phone.number(),
      address: faker.location.streetAddress(),
    });
  }
  return Papa.unparse(data);
}
```

**Use when:** Need large volumes of realistic test data, avoid committing large binary fixtures

## Docker Configuration for Visual Consistency

**Critical for visual regression:** Font rendering differs across operating systems. Use Playwright Docker image to ensure consistent screenshots.

```dockerfile
# playwright.config.ts - for CI
export default defineConfig({
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
  },
  // Use docker image version matching Playwright version
  // Image: mcr.microsoft.com/playwright:v1.55.0-noble
});
```

```bash
# Run tests in Docker locally
docker run --rm --network host -v $(pwd):/work -w /work \
  --ipc=host \
  mcr.microsoft.com/playwright:v1.55.0-noble \
  npm run test:e2e
```

**Why `--ipc=host`:** Chromium can run out of memory without it, causing crashes on large file tests.

**Why version matching:** Playwright 1.55.0 in package.json MUST match v1.55.0 in Docker image tag, or browser executables won't be found.

## Version Compatibility Matrix

| Package | Version | Compatible With | Notes |
|---------|---------|-----------------|-------|
| Playwright | 1.55.0 | TypeScript 5.9.2+, Node 20+ | Includes pixelmatch 6.0.0 internally |
| pdfjs-dist | 5.4.149 | Node 20+ | Requires `canvas` peer dependency for Node.js usage |
| sharp | 0.33.5 | Node 20.x+ | Native bindings, prebuilt for common platforms |
| file-type | 20.2.0 | ESM only | Requires `"type": "module"` in package.json (already set) |
| @faker-js/faker | 10.2.0 | Node 20+ | Major version 10 requires Node 20+ |
| ExcelJS | 4.4.0 | Node 14+ | Works with Bun and Node.js |

**Important:** file-type is ESM-only since v17. Project already uses `"type": "module"`, so no changes needed.

## Testing Strategy Recommendations

### Layer 1: File Integrity (Magic Numbers)
- **Tool:** file-type
- **What:** Verify output file has correct magic number/MIME type
- **Why:** Catches corrupt files, wrong format selection
- **Cost:** ~5ms per file

### Layer 2: Structural Validation (Parsers)
- **Tool:** pdfjs-dist, ExcelJS, jszip, papaparse
- **What:** Parse output file, verify structure is valid
- **Why:** Catches malformed files that pass magic number check
- **Cost:** ~50-200ms per file depending on format

### Layer 3: Content Accuracy (Comparison)
- **Tool:** diff, pixelmatch, Zod
- **What:** Compare output content to expected content
- **Why:** Verifies conversion preserved data/visual fidelity
- **Cost:** ~100-500ms per file depending on size

### Layer 4: Metadata Preservation (Format-specific)
- **Tool:** sharp, pdfjs-dist metadata APIs
- **What:** Verify EXIF, author, creation date, etc.
- **Why:** Professional conversions preserve metadata
- **Cost:** ~20-50ms per file

**Recommendation:** Run all 4 layers for critical format pairs (PDF↔DOCX, PNG↔JPEG). Run layers 1-2 only for less critical pairs to keep CI fast.

## Performance Benchmarks

Based on typical file sizes:

| Operation | Library | 1MB Image | 10MB PDF | 100KB CSV | Notes |
|-----------|---------|-----------|----------|-----------|-------|
| Magic number check | file-type | 5ms | 5ms | 5ms | Reads first 4KB only |
| Image comparison | pixelmatch | 150ms | N/A | N/A | 1920x1080 JPEG |
| Image comparison | odiff | 20ms | N/A | N/A | Same image, SIMD enabled |
| PDF text extraction | pdfjs-dist | N/A | 800ms | N/A | 50-page document |
| PDF text extraction | pdf-parse | N/A | 400ms | N/A | Same document, simpler parser |
| Excel parsing | ExcelJS | N/A | N/A | 80ms | 1000 rows, 10 columns |
| CSV parsing | papaparse | N/A | N/A | 30ms | Same data |

**Source:** WebSearch results from performance comparisons, confidence MEDIUM (benchmarks vary by hardware).

**CI Recommendation:** For image-heavy test suites (>50 image comparisons), consider odiff to reduce CI time by 60-80%.

## Real-World File Fixtures

**Problem:** Synthetic test files don't catch edge cases (corrupted headers, unusual encodings, legacy format variants).

**Solution:** Curate real-world file collection:

```
tests/fixtures/
├── images/
│   ├── real-world/         # Downloaded from various sources
│   │   ├── photo-iphone.heic
│   │   ├── screenshot-windows.png
│   │   └── logo-photoshop.psd
│   └── synthetic/          # Generated via faker + canvas
│       └── generated-*.png
├── documents/
│   ├── real-world/
│   │   ├── resume.docx
│   │   ├── invoice.pdf
│   │   └── contract-scanned.pdf
│   └── synthetic/
│       └── generated-*.txt
└── spreadsheets/
    ├── real-world/
    │   ├── financial-report.xlsx
    │   └── data-export.csv
    └── synthetic/
        └── generated-*.csv
```

**Recommendation:** 80% synthetic (fast generation, large volumes) + 20% real-world (edge case coverage).

## Sources

### High Confidence (Context7 / Official Docs)
- [Playwright Visual Comparisons](https://playwright.dev/docs/test-snapshots) - Official docs on pixelmatch integration
- [Playwright Docker](https://playwright.dev/docs/docker) - Official Docker usage guide
- [@faker-js/faker npm](https://www.npmjs.com/package/@faker-js/faker) - Version 10.2.0 confirmed
- [file-type npm](https://www.npmjs.com/package/file-type) - Version 20.2.0 confirmed, ESM requirements
- [pixelmatch npm](https://www.npmjs.com/package/pixelmatch) - Mapbox-maintained, v6.0.0

### Medium Confidence (Multiple WebSearch sources agree)
- [BrowserStack Playwright Best Practices 2026](https://www.browserstack.com/guide/playwright-best-practices) - Visual testing patterns
- [Strapi PDF Parsing Libraries 2025](https://strapi.io/blog/7-best-javascript-pdf-parsing-libraries-nodejs-2025) - pdfjs-dist vs pdf-parse comparison
- [ODiff GitHub](https://github.com/dmtrKovalenko/odiff) - Performance claims for SIMD image comparison
- [ExcelJS npm](https://www.npmjs.com/package/exceljs) - v4.4.0, TypeScript support

### Low Confidence (Single source, needs validation)
- Audio waveform comparison approach - methodology less standardized, recommend validation in implementation phase
- Specific performance benchmarks - vary by hardware, use as estimates only

---

**Stack research for:** E2E Testing & File Validation (File Conversion App)
**Researched:** 2026-01-23
**Next Steps:** Validate audio testing approach with real-world implementation, consider odiff benchmarking for CI optimization
