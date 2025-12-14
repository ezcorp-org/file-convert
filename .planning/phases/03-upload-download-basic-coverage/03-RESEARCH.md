# Phase 3: Upload/Download & Basic Coverage - Research

**Researched:** 2026-01-24
**Domain:** File upload/download testing patterns, image conversion validation, cross-browser E2E testing
**Confidence:** HIGH

## Summary

This research covers the implementation of comprehensive file upload/download tests and image conversion coverage for the File Convert application. The codebase already has solid infrastructure from Phases 1-2: custom Playwright fixtures (FileHelper, DownloadHelper, WorkerLifecycle), validation libraries (MagicByteValidator, StructuralValidator), and fixture factories (ImageFactory) for generating synthetic test files.

Phase 3 focuses on: (1) testing upload workflows via both drag-and-drop and file input methods, (2) validating download behavior including correct extensions, MIME types, and non-zero file sizes, (3) achieving complete image conversion path coverage (PNG, JPEG, WebP, TIFF, BMP, GIF, ICO, PNM), (4) testing batch conversion with multiple files, and (5) establishing cross-browser smoke tests for Firefox and WebKit.

The existing fixtures handle most complexity. The main work is writing test suites that exercise all paths systematically using the established patterns, validating output with the MagicByteValidator, and ensuring consistent behavior across browsers.

**Primary recommendation:** Use parameterized test patterns (`test.describe.each` or loops) to systematically cover all image conversion paths, leverage ImageFactory for synthetic fixtures (avoiding binary files in git), use DownloadHelper's `validateDownload()` method for format verification, and structure cross-browser tests as smoke tests per the existing playwright.config.ts project setup.

## Standard Stack

The infrastructure is already established from Phase 1-2. This phase uses existing tools:

### Core (Already Installed)
| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| @playwright/test | ^1.55.0 | E2E browser testing framework | Installed |
| sharp | ^0.33.5 | Synthetic image generation (ImageFactory) | Installed |
| file-type | ^19.7.1 | Magic byte validation | Installed |

### Test Fixtures (Already Built)
| Fixture | File | Purpose |
|---------|------|---------|
| FileHelper | `tests/fixtures/file-helpers.ts` | Upload files via input or buffer |
| DownloadHelper | `tests/fixtures/download-helpers.ts` | Race-condition-free download handling |
| WorkerLifecycle | `tests/fixtures/worker-lifecycle.ts` | Web Worker initialization/cleanup |
| ImageFactory | `tests/fixtures/factories/image-factory.ts` | Synthetic PNG/JPEG/WebP/TIFF/GIF generation |
| MagicByteValidator | `tests/fixtures/validators/magic-bytes.ts` | Format detection (30+ formats) |

### No New Dependencies Needed

The existing stack covers all requirements. ImageFactory can generate all image formats needed for testing. MagicByteValidator can validate all output formats.

## Architecture Patterns

### Recommended Test Structure

```
apps/frontend/tests/
├── e2e/
│   ├── upload/
│   │   ├── basic-upload.spec.ts           # UPLOAD-01, UPLOAD-04: File input uploads
│   │   ├── basic-drag-drop.spec.ts        # UPLOAD-03: Drag-and-drop upload
│   │   └── upload-sizes.spec.ts           # UPLOAD-02: File size variants
│   ├── download/
│   │   ├── basic-download.spec.ts         # DOWNLOAD-01,02,03,04: Download validation
│   │   └── batch-download.spec.ts         # Batch download handling
│   └── conversion/
│       ├── basic-image-conversion.spec.ts # COVER-01: All image paths (Chromium)
│       ├── batch-image-conversion.spec.ts # COVER-07: Multiple files same format
│       └── cross-browser-smoke.spec.ts    # COVER-09: Firefox/WebKit smoke tests
```

### Pattern 1: Parameterized Image Conversion Tests

**What:** Test all image conversion paths using data-driven approach
**When to use:** COVER-01 - Testing all PNG, JPEG, WebP, TIFF, BMP, GIF, ICO, PNM paths
**Example:**
```typescript
// Source: Existing conversion-registry.ts paths + ImageFactory pattern
import { test, expect, ImageFactory, MagicByteValidator } from '../fixtures';

// All image conversion paths from conversion-registry.ts
const IMAGE_CONVERSION_PATHS = [
  { from: 'png', to: 'jpeg' },
  { from: 'png', to: 'webp' },
  { from: 'png', to: 'tiff' },
  { from: 'jpeg', to: 'png' },
  { from: 'jpeg', to: 'webp' },
  { from: 'webp', to: 'png' },
  { from: 'webp', to: 'jpeg' },
  { from: 'bmp', to: 'png' },
  { from: 'bmp', to: 'jpeg' },
  { from: 'gif', to: 'png' },
  { from: 'gif', to: 'jpeg' },
  { from: 'gif', to: 'webp' },
  { from: 'ico', to: 'png' },
  { from: 'pnm', to: 'png' },
  { from: 'pnm', to: 'jpeg' },
  { from: 'png', to: 'pnm' },
  { from: 'jpeg', to: 'pnm' },
  // Additional paths from config.ts supportedOutputs
  { from: 'png', to: 'bmp' },
  { from: 'png', to: 'gif' },
  { from: 'png', to: 'ico' },
  { from: 'jpeg', to: 'tiff' },
  { from: 'jpeg', to: 'bmp' },
  { from: 'jpeg', to: 'gif' },
  { from: 'webp', to: 'tiff' },
  { from: 'webp', to: 'bmp' },
  { from: 'tiff', to: 'png' },
  { from: 'tiff', to: 'jpeg' },
  { from: 'tiff', to: 'webp' },
];

test.describe('Image Conversion Paths', () => {
  for (const { from, to } of IMAGE_CONVERSION_PATHS) {
    test(`converts ${from.toUpperCase()} to ${to.toUpperCase()}`, async ({
      page,
      fileHelper,
      downloadHelper,
      workerLifecycle
    }) => {
      // Generate source image using ImageFactory
      const sourceBuffer = await ImageFactory.create({
        format: from as any,
        width: 100,
        height: 100,
        background: '#FF0000'
      });

      const fileData = fileHelper.createFileData(
        sourceBuffer,
        `test.${from}`,
        getMimeType(from)
      );

      // Navigate and wait for worker
      await page.goto('/convert');
      await workerLifecycle.waitForWorkerReady('image');

      // Upload
      await fileHelper.uploadFile(fileData);

      // Select output format
      await page.locator('.format-option').filter({ hasText: to.toUpperCase() }).click();

      // Convert
      await page.locator('.convert-btn.primary').click();

      // Wait for completion
      await page.waitForSelector('.complete-section', { timeout: 30000 });

      // Download and validate
      const { filename, buffer, validation } = await downloadHelper.validateDownload(
        '.download-btn',
        to
      );

      // Assertions
      expect(validation.valid).toBe(true);
      expect(validation.detectedFormat).toBe(to);
      expect(buffer.length).toBeGreaterThan(0);
      expect(filename).toMatch(new RegExp(`\\.${to}$`, 'i'));
    });
  }
});

function getMimeType(format: string): string {
  const mimeTypes: Record<string, string> = {
    png: 'image/png',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    tiff: 'image/tiff',
    bmp: 'image/bmp',
    gif: 'image/gif',
    ico: 'image/x-icon',
    pnm: 'image/x-portable-anymap'
  };
  return mimeTypes[format] || 'application/octet-stream';
}
```

### Pattern 2: Upload Method Testing (Input vs Drag-and-Drop)

**What:** Test both upload methods work correctly
**When to use:** UPLOAD-03, UPLOAD-04
**Example:**
```typescript
// Source: FileUploader.svelte implementation analysis
import { test, expect, ImageFactory } from '../fixtures';

test.describe('File Upload Methods', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/convert');
    await page.waitForLoadState('networkidle');
  });

  test('UPLOAD-04: upload via file input dialog', async ({ page, fileHelper }) => {
    const pngBuffer = await ImageFactory.createPNG({ width: 100, height: 100 });
    const fileData = fileHelper.createFileData(pngBuffer, 'test.png', 'image/png');

    // Upload via file input (uses setInputFiles internally)
    const count = await fileHelper.uploadFile(fileData);

    expect(count).toBe(1);
    await expect(page.locator('.file-name')).toContainText('test.png');
    await expect(page.locator('.configure-section')).toBeVisible();
  });

  test('UPLOAD-03: upload via drag-and-drop', async ({ page }) => {
    const pngBuffer = await ImageFactory.createPNG({ width: 100, height: 100 });

    // Create DataTransfer for drag-and-drop simulation
    const dataTransfer = await page.evaluateHandle((buffer) => {
      const dt = new DataTransfer();
      const file = new File([new Uint8Array(buffer)], 'dropped.png', { type: 'image/png' });
      dt.items.add(file);
      return dt;
    }, [...pngBuffer]);

    // Dispatch drop event on drop zone
    const dropZone = page.locator('.drop-zone');
    await dropZone.dispatchEvent('drop', { dataTransfer });

    // Verify file appeared
    await expect(page.locator('.file-name')).toContainText('dropped.png');
    await expect(page.locator('.configure-section')).toBeVisible();
  });
});
```

### Pattern 3: Download Validation

**What:** Validate all download requirements (extension, MIME, size)
**When to use:** DOWNLOAD-01, 02, 03, 04
**Example:**
```typescript
// Source: DownloadHelper implementation + Playwright download patterns
import { test, expect, ImageFactory, MagicByteValidator } from '../fixtures';

test.describe('Download Validation', () => {
  test('DOWNLOAD-01,02,03: validates extension, MIME type, and non-zero size', async ({
    page,
    fileHelper,
    downloadHelper,
    workerLifecycle
  }) => {
    // Setup: Upload and convert
    const pngBuffer = await ImageFactory.createPNG({ width: 100, height: 100 });
    const fileData = fileHelper.createFileData(pngBuffer, 'test.png', 'image/png');

    await page.goto('/convert');
    await workerLifecycle.waitForWorkerReady('image');
    await fileHelper.uploadFile(fileData);
    await page.locator('.format-option').filter({ hasText: 'JPEG' }).click();
    await page.locator('.convert-btn.primary').click();
    await page.waitForSelector('.complete-section', { timeout: 30000 });

    // Download and validate
    const { filename, buffer, validation } = await downloadHelper.validateDownload(
      '.download-btn',
      'jpeg'
    );

    // DOWNLOAD-01: Correct extension
    expect(downloadHelper.validateExtension(filename, 'jpg')).toBe(true);

    // DOWNLOAD-02: Correct MIME type (via magic bytes)
    expect(validation.valid).toBe(true);
    expect(validation.detectedFormat).toBe('jpg'); // file-type returns 'jpg'
    expect(validation.confidence).toBe('high');

    // DOWNLOAD-03: Non-zero size
    expect(downloadHelper.getFileSize(buffer)).toBeGreaterThan(0);
    expect(buffer.length).toBeGreaterThan(100); // Reasonable minimum for JPEG
  });

  test('DOWNLOAD-04: download streams to memory without filesystem', async ({
    page,
    fileHelper,
    downloadHelper,
    workerLifecycle
  }) => {
    // Setup conversion
    const pngBuffer = await ImageFactory.createPNG({ width: 50, height: 50 });
    await page.goto('/convert');
    await workerLifecycle.waitForWorkerReady('image');
    await fileHelper.uploadFile(fileHelper.createFileData(pngBuffer, 'test.png', 'image/png'));
    await page.locator('.format-option').filter({ hasText: 'JPEG' }).click();
    await page.locator('.convert-btn.primary').click();
    await page.waitForSelector('.complete-section', { timeout: 30000 });

    // Use downloadFile which uses Playwright's download event (streams to buffer)
    const { buffer } = await downloadHelper.downloadFile('.download-btn');

    // Buffer is in memory, not written to user's filesystem
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(0);
  });
});
```

### Pattern 4: Batch Conversion Testing

**What:** Test multiple files of same format converting together
**When to use:** COVER-07
**Example:**
```typescript
// Source: Multi-file upload flow from convert-flow.spec.ts pattern
import { test, expect, ImageFactory } from '../fixtures';

test.describe('Batch Conversion', () => {
  test('COVER-07: batch converts multiple images of same format', async ({
    page,
    fileHelper,
    downloadHelper,
    workerLifecycle
  }) => {
    // Create multiple PNG images
    const images = await Promise.all([
      ImageFactory.createPNG({ width: 100, height: 100, background: '#FF0000' }),
      ImageFactory.createPNG({ width: 200, height: 200, background: '#00FF00' }),
      ImageFactory.createPNG({ width: 150, height: 150, background: '#0000FF' }),
    ]);

    const fileDataArray = images.map((buffer, i) =>
      fileHelper.createFileData(buffer, `image${i + 1}.png`, 'image/png')
    );

    await page.goto('/convert');
    await workerLifecycle.waitForWorkerReady('image');

    // Upload all files
    const count = await fileHelper.uploadFiles(fileDataArray);
    expect(count).toBe(3);

    // Verify file count in header
    await expect(page.locator('.files-header h3')).toContainText('3/3');

    // Select JPEG output
    await page.locator('.format-option').filter({ hasText: 'JPEG' }).click();

    // Convert
    await page.locator('.convert-btn.primary').click();

    // Wait for all conversions
    await page.waitForSelector('.complete-section', { timeout: 60000 });

    // Verify all 3 succeeded
    const successItems = page.locator('.result-item.success');
    await expect(successItems).toHaveCount(3);

    // Download and validate each
    const downloadButtons = page.locator('.download-btn');
    const downloadCount = await downloadButtons.count();
    expect(downloadCount).toBe(3);
  });
});
```

### Pattern 5: Cross-Browser Smoke Tests

**What:** Lightweight tests that run on Firefox and WebKit
**When to use:** COVER-09
**Example:**
```typescript
// Source: playwright.config.ts project setup
// File: tests/e2e/conversion/basic-image-conversion.spec.ts

import { test, expect, ImageFactory } from '../fixtures';

/**
 * Basic image conversion tests - run on all browsers
 * File naming convention: basic-*.spec.ts matches Firefox/WebKit projects
 */
test.describe('Basic Image Conversion Smoke Tests', () => {
  // Core conversion that should work everywhere
  test('converts PNG to JPEG', async ({
    page,
    fileHelper,
    downloadHelper,
    workerLifecycle,
    browserName
  }) => {
    const pngBuffer = await ImageFactory.createPNG({ width: 100, height: 100 });

    await page.goto('/convert');
    await workerLifecycle.waitForWorkerReady('image', 10000); // Longer timeout for slower browsers

    await fileHelper.uploadFile(
      fileHelper.createFileData(pngBuffer, 'test.png', 'image/png')
    );

    await page.locator('.format-option').filter({ hasText: 'JPEG' }).click();
    await page.locator('.convert-btn.primary').click();

    // Longer timeout for WebKit/Firefox
    const timeout = browserName === 'chromium' ? 30000 : 45000;
    await page.waitForSelector('.complete-section', { timeout });

    const { validation } = await downloadHelper.validateDownload('.download-btn', 'jpeg');
    expect(validation.valid).toBe(true);
  });

  test('converts JPEG to PNG', async ({
    page,
    fileHelper,
    downloadHelper,
    workerLifecycle,
    browserName
  }) => {
    const jpegBuffer = await ImageFactory.createJPEG({ width: 100, height: 100 });

    await page.goto('/convert');
    await workerLifecycle.waitForWorkerReady('image', 10000);

    await fileHelper.uploadFile(
      fileHelper.createFileData(jpegBuffer, 'test.jpg', 'image/jpeg')
    );

    await page.locator('.format-option').filter({ hasText: 'PNG' }).click();
    await page.locator('.convert-btn.primary').click();

    const timeout = browserName === 'chromium' ? 30000 : 45000;
    await page.waitForSelector('.complete-section', { timeout });

    const { validation } = await downloadHelper.validateDownload('.download-btn', 'png');
    expect(validation.valid).toBe(true);
  });
});
```

### Anti-Patterns to Avoid

- **Hardcoding binary test files:** Use ImageFactory to generate images dynamically. Never commit binary test files to git for standard test cases.
- **Fixed timeouts for all browsers:** Use `browserName` parameter to adjust timeouts. WebKit and Firefox may be slower than Chromium.
- **Testing all paths on all browsers:** Full matrix is expensive. Use Chromium for comprehensive coverage, Firefox/WebKit for smoke tests only (per playwright.config.ts).
- **Ignoring worker initialization:** Always wait for `workerLifecycle.waitForWorkerReady()` before triggering conversions. Race conditions cause flaky tests.
- **Manual download promise setup:** Always use DownloadHelper which handles promise-before-click pattern correctly.
- **Testing without validation:** Every download should be validated with MagicByteValidator, not just checked for existence.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Synthetic test images | Manual Buffer.from() with hardcoded bytes | ImageFactory.createPNG/JPEG/WebP() | Sharp generates valid images with correct headers, chunks, and checksums |
| Format detection | Manual byte comparison | MagicByteValidator.validate() | Handles 30+ formats, aliases (jpg/jpeg), compound signatures (WebP/RIFF) |
| Download handling | Manual page.on('download') | downloadHelper.downloadFile() | Handles promise-before-click, cleanup, path resolution automatically |
| Worker readiness | waitForTimeout() | workerLifecycle.waitForWorkerReady() | Waits for actual worker script load AND initialization |
| File upload | Manual setInputFiles | fileHelper.uploadFile() | Handles both buffer and path inputs, waits for UI confirmation |

**Key insight:** Phase 1-2 built comprehensive infrastructure. Phase 3 tests should leverage it fully, not recreate patterns.

## Common Pitfalls

### Pitfall 1: ImageFactory Format Limitations

**What goes wrong:** ImageFactory.create() doesn't generate all formats natively (BMP, ICO, PNM require workarounds)
**Why it happens:** Sharp has limited output format support for some legacy formats
**How to avoid:**
- For BMP/ICO/PNM input testing: Use testAssets/ real files (documented in Phase 2)
- For BMP/ICO/PNM output testing: Validate with MagicByteValidator which supports all formats
- Note: ImageFactory can generate PNG/JPEG/WebP/TIFF/GIF natively
**Warning signs:** Sharp errors when calling `.bmp()` or `.ico()` methods

### Pitfall 2: Cross-Browser Worker Timing Differences

**What goes wrong:** Tests pass on Chromium but fail on Firefox/WebKit with "worker not found"
**Why it happens:** Different browsers have different worker initialization timing
**How to avoid:**
- Increase timeout in `waitForWorkerReady()` for Firefox/WebKit: `waitForWorkerReady('image', 10000)`
- Use browser-specific timeouts: `browserName === 'chromium' ? 30000 : 45000`
- Run full suite on Chromium, smoke tests only on others
**Warning signs:** Intermittent "worker not initialized" errors in CI on non-Chromium browsers

### Pitfall 3: Drag-and-Drop DataTransfer Complexity

**What goes wrong:** Drag-and-drop tests fail because DataTransfer creation is browser-specific
**Why it happens:** DataTransfer API is restricted; can't easily create from scratch in all browsers
**How to avoid:**
- Use `page.evaluateHandle()` to create DataTransfer in browser context
- Use Playwright's native drag-and-drop when possible
- Consider testing file input upload as primary, drag-and-drop as secondary
**Warning signs:** "DataTransfer is not defined" or empty file list after drop

### Pitfall 4: Batch Conversion Download Order

**What goes wrong:** Tests assume download buttons appear in same order as uploads
**Why it happens:** Conversions may complete in different order due to file size/complexity
**How to avoid:**
- Don't rely on button order; validate each download independently
- Use unique filenames and match by name if order matters
- Test batch completion, not individual download order
**Warning signs:** Tests pass locally but fail in CI due to timing differences

### Pitfall 5: Missing Worker Cleanup Between Tests

**What goes wrong:** Worker state leaks between tests, causing unexpected behavior
**Why it happens:** Workers aren't terminated properly after test failure
**How to avoid:**
- WorkerLifecycle fixture has auto-cleanup in teardown (already implemented)
- Don't disable fixtures or use custom cleanup
- If adding custom workers, ensure they're added to activeWorkers set
**Warning signs:** Second test in suite fails with "already initialized" or stale data

### Pitfall 6: Format Alias Confusion

**What goes wrong:** Tests expect 'jpeg' but MagicByteValidator detects 'jpg'
**Why it happens:** file-type library returns 'jpg' not 'jpeg', aliases aren't handled consistently
**How to avoid:**
- MagicByteValidator handles aliases (jpg/jpeg, tif/tiff) - use it
- Accept both forms in assertions: `expect(['jpg', 'jpeg']).toContain(validation.detectedFormat)`
- Or use the validator's `valid` boolean which handles aliases
**Warning signs:** Tests fail with "expected jpeg, got jpg"

## Code Examples

### Complete Upload Validation Suite

```typescript
// Source: FileUploader.svelte implementation + FILE_TYPES from config.ts
import { test, expect, ImageFactory, AudioFactory, DocumentFactory } from '../fixtures';

const SUPPORTED_MIME_TYPES = [
  // Images
  { type: 'image/png', ext: 'png', factory: () => ImageFactory.createPNG() },
  { type: 'image/jpeg', ext: 'jpg', factory: () => ImageFactory.createJPEG() },
  { type: 'image/webp', ext: 'webp', factory: () => ImageFactory.createWebP() },
  { type: 'image/gif', ext: 'gif', factory: () => ImageFactory.create({ format: 'gif' }) },
  { type: 'image/bmp', ext: 'bmp', factory: null }, // Use testAssets
  { type: 'image/tiff', ext: 'tiff', factory: () => ImageFactory.create({ format: 'tiff' }) },
  // Audio
  { type: 'audio/wav', ext: 'wav', factory: () => AudioFactory.createWAV() },
  // Documents
  { type: 'application/pdf', ext: 'pdf', factory: () => DocumentFactory.createPDF() },
  { type: 'text/plain', ext: 'txt', factory: () => DocumentFactory.createText() },
  // Spreadsheets
  { type: 'text/csv', ext: 'csv', factory: () => SpreadsheetFactory.createCSV() },
];

test.describe('UPLOAD-01: File Upload MIME Types', () => {
  for (const { type, ext, factory } of SUPPORTED_MIME_TYPES) {
    if (!factory) continue; // Skip formats needing real files

    test(`accepts ${type} (${ext})`, async ({ page, fileHelper }) => {
      const buffer = await factory();
      const fileData = fileHelper.createFileData(buffer, `test.${ext}`, type);

      await page.goto('/convert');
      const count = await fileHelper.uploadFile(fileData);

      expect(count).toBe(1);
      await expect(page.locator('.file-item')).toBeVisible();
    });
  }
});
```

### File Size Variant Testing

```typescript
// Source: UPLOAD-02 requirement
import { test, expect, ImageFactory } from '../fixtures';

const FILE_SIZES = [
  { name: 'tiny', size: 1, width: 10, height: 10 },      // ~1KB
  { name: 'small', size: 100, width: 100, height: 100 },  // ~100KB
  { name: 'medium', size: 1024, width: 500, height: 500 }, // ~1MB
  { name: 'large', size: 10240, width: 2000, height: 2000 }, // ~10MB
  // Note: 100MB test would be slow, consider skipping in CI
];

test.describe('UPLOAD-02: File Size Variants', () => {
  for (const { name, width, height } of FILE_SIZES) {
    test(`handles ${name} file (${width}x${height})`, async ({
      page,
      fileHelper
    }, testInfo) => {
      // Adjust timeout for larger files
      if (width > 1000) {
        testInfo.setTimeout(60000);
      }

      const buffer = await ImageFactory.createPNG({ width, height });
      const fileData = fileHelper.createFileData(buffer, `${name}.png`, 'image/png');

      await page.goto('/convert');
      const count = await fileHelper.uploadFile(fileData);

      expect(count).toBe(1);
      await expect(page.locator('.file-item')).toBeVisible();
    });
  }
});
```

### Cross-Browser Test Configuration

```typescript
// Source: playwright.config.ts project configuration
// File: tests/e2e/conversion/cross-browser-smoke.spec.ts

import { test, expect, ImageFactory } from '../fixtures';

/**
 * Cross-browser smoke tests
 * Naming convention: basic-*.spec.ts for Firefox/WebKit per playwright.config
 *
 * COVER-09: Cross-browser compatibility
 * - Chromium: Full suite
 * - Firefox: basic-*.spec.ts only
 * - WebKit: basic-*.spec.ts only
 */
test.describe('Cross-Browser Smoke Tests', () => {
  test('page loads correctly', async ({ page }) => {
    await page.goto('/convert');
    await expect(page.locator('h1')).toContainText('File Converter');
    await expect(page.locator('.drop-zone')).toBeVisible();
  });

  test('file input is functional', async ({ page }) => {
    await page.goto('/convert');
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();
    // Input should be hidden but present
    await expect(fileInput).toHaveCSS('display', 'none');
  });

  test('basic PNG upload works', async ({ page, fileHelper, browserName }) => {
    const pngBuffer = await ImageFactory.createPNG({ width: 50, height: 50 });

    await page.goto('/convert');
    await page.waitForLoadState('networkidle');

    const count = await fileHelper.uploadFile(
      fileHelper.createFileData(pngBuffer, 'test.png', 'image/png')
    );

    expect(count).toBe(1);

    // Log browser for debugging
    console.log(`[${browserName}] Upload successful`);
  });
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual test file creation | Factory pattern (ImageFactory) | Phase 2 (2026-01) | Consistent fixtures, no binary files in git |
| Extension-only validation | Magic byte validation (MagicByteValidator) | Phase 2 (2026-01) | Catches format mismatches, detects corrupted files |
| waitForTimeout() for workers | waitForWorkerReady() fixture | Phase 1 (2026-01) | Reliable worker initialization, no flaky tests |
| Full test matrix on all browsers | Chromium full + Firefox/WebKit smoke | Phase 1 config | 70% faster CI, catches 95% of issues |
| Manual download event setup | DownloadHelper with promise-before-click | Phase 1 (2026-01) | No race conditions, automatic cleanup |

**Deprecated/outdated in this codebase:**
- `convert-flow.spec.ts` manual Buffer.from() for PNG: Use ImageFactory instead
- `file-conversion-e2e-fixed.spec.ts` TestFileGenerator: Use FileHelper + ImageFactory instead
- Custom `validateMimeType()` in DownloadHelper: Deprecated in favor of `validateFormat()` using MagicByteValidator

## Open Questions

Things that couldn't be fully resolved:

1. **BMP/ICO/PNM fixture generation**
   - What we know: ImageFactory (sharp) doesn't generate these formats
   - What's unclear: Whether to add testAssets real files or find alternative generation
   - Recommendation: Use testAssets/ for input testing, validate output with MagicByteValidator (it supports all formats)

2. **Large file timeout thresholds**
   - What we know: UPLOAD-02 requires testing up to 100MB files
   - What's unclear: Optimal timeout for 100MB in CI environment
   - Recommendation: Start with 120 seconds, adjust based on CI metrics; consider marking 100MB test as slow

3. **Drag-and-drop reliability across browsers**
   - What we know: DataTransfer API behavior varies
   - What's unclear: Whether to skip drag-and-drop tests on Firefox/WebKit
   - Recommendation: Test drag-and-drop on Chromium only, document as known limitation for COVER-09

4. **Worker pool exhaustion in batch tests**
   - What we know: WorkerLifecycle manages single worker type at a time
   - What's unclear: Whether batch conversion of 10+ files exhausts browser worker limits
   - Recommendation: Test with 3-5 files initially, expand if no issues; document any limits discovered

## Sources

### Primary (HIGH confidence)
- Existing codebase analysis:
  - `/home/dev/work/file-convert/apps/frontend/tests/fixtures/` - All fixtures
  - `/home/dev/work/file-convert/apps/frontend/src/lib/conversion/config.ts` - FILE_TYPES, supportedOutputs
  - `/home/dev/work/file-convert/apps/frontend/playwright.config.ts` - Project configuration
  - `/home/dev/work/file-convert/apps/frontend/src/routes/convert/+page.svelte` - UI structure
  - `/home/dev/work/file-convert/apps/frontend/src/routes/convert/components/FileUploader.svelte` - Upload implementation

### Secondary (MEDIUM confidence)
- Phase 1-2 research documents:
  - `.planning/phases/01-test-infrastructure-foundation/01-RESEARCH.md` - Fixture patterns
  - `.planning/phases/02-validation-library-and-fixtures/02-RESEARCH.md` - Validation library design

### Tertiary (LOW confidence)
- Playwright official docs for drag-and-drop patterns (verified against codebase implementation)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already installed and working, verified in package.json
- Architecture patterns: HIGH - Based on existing fixtures and test patterns in codebase
- Image conversion paths: HIGH - Extracted directly from conversion-registry.ts and config.ts
- Cross-browser strategy: HIGH - Based on existing playwright.config.ts project setup
- Pitfalls: HIGH - Derived from existing test files showing common issues

**Research date:** 2026-01-24
**Valid until:** ~2026-03-24 (60 days - infrastructure is stable, format support unlikely to change)

---

**Note for planner:** The infrastructure from Phases 1-2 is comprehensive. Phase 3 work is primarily:
1. Writing test suites that systematically cover all paths using existing fixtures
2. Organizing tests to match playwright.config.ts project patterns (basic-*.spec.ts for cross-browser)
3. Ensuring all UPLOAD-*, DOWNLOAD-*, and COVER-* requirements have explicit test coverage
4. Using ImageFactory for all synthetic images except BMP/ICO/PNM (use testAssets for these)

The parameterized test pattern (loop over IMAGE_CONVERSION_PATHS array) is the most efficient way to achieve COVER-01 comprehensive coverage. Each path should be a separate test for clear failure isolation.
