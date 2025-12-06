# Architecture Research: E2E Testing for File Conversion System

**Domain:** File conversion E2E test architecture
**Researched:** 2026-01-23
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Test Orchestration                            │
│  Playwright Test Runner (Multi-browser: Chromium/Firefox/WebKit)    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌───────────────┐  ┌──────────────┐  ┌────────────────────────┐    │
│  │ Test Suites   │  │ Test Helpers │  │  Page Objects          │    │
│  │ (spec files)  │  │ & Utilities  │  │  (UI interactions)     │    │
│  └───────┬───────┘  └──────┬───────┘  └────────┬───────────────┘    │
│          │                 │                    │                    │
├──────────┴─────────────────┴────────────────────┴────────────────────┤
│                        Test Data Layer                                │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │
│  │  Fixture     │  │  Fixture     │  │   File Validators        │   │
│  │  Generators  │  │  Storage     │  │   (Magic #, Integrity)   │   │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────────┘   │
│         │                 │                      │                   │
├─────────┴─────────────────┴──────────────────────┴───────────────────┤
│                     Conversion Under Test                             │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  SvelteKit App + Web Workers (Image/Audio/Doc/Archive)       │    │
│  └──────────────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────────────┤
│                      Validation Layer                                 │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │ Binary Format Validators | Hash Verifiers | Content Parsers    │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Test Suites** | Define test scenarios, orchestrate conversions, assert results | Playwright test files organized by category |
| **Fixture Generators** | Create valid test files for all 30+ formats on-demand | Factory pattern with format-specific builders |
| **Fixture Storage** | Cache reusable test fixtures, manage test file lifecycle | File system with organized directory structure |
| **Page Objects** | Encapsulate UI interactions (upload, format selection, download) | TypeScript classes exposing high-level methods |
| **File Validators** | Verify output file integrity using magic numbers, checksums | Binary analysis utilities, hash functions |
| **Test Helpers** | Shared utilities for waits, retries, browser-specific handling | Reusable functions in dedicated utilities module |
| **Content Parsers** | Validate internal structure of converted files | Format-specific parsers (JSON, XML, image metadata) |

## Recommended Project Structure

```
apps/frontend/
├── tests/
│   ├── e2e/                          # E2E test suites
│   │   ├── conversions/              # Conversion tests by category
│   │   │   ├── image.spec.ts         # Image conversion tests
│   │   │   ├── audio.spec.ts         # Audio conversion tests
│   │   │   ├── document.spec.ts      # Document conversion tests
│   │   │   ├── spreadsheet.spec.ts   # Spreadsheet conversion tests
│   │   │   ├── archive.spec.ts       # Archive conversion tests
│   │   │   └── text.spec.ts          # Text conversion tests
│   │   ├── workflows/                # Complete user workflows
│   │   │   ├── batch-conversion.spec.ts
│   │   │   ├── error-handling.spec.ts
│   │   │   └── accessibility.spec.ts
│   │   └── smoke/                    # Critical path smoke tests
│   │       └── basic-flow.spec.ts
│   ├── fixtures/                     # Test data management
│   │   ├── generators/               # Runtime fixture generation
│   │   │   ├── image-factory.ts      # Generate PNG, JPEG, WebP, etc.
│   │   │   ├── audio-factory.ts      # Generate WAV, MP3, FLAC, etc.
│   │   │   ├── document-factory.ts   # Generate PDF, DOCX, HTML, etc.
│   │   │   ├── spreadsheet-factory.ts# Generate CSV, XLSX, JSON, etc.
│   │   │   ├── archive-factory.ts    # Generate ZIP, TAR, 7Z, etc.
│   │   │   └── index.ts              # Unified factory interface
│   │   ├── static/                   # Pre-generated complex fixtures
│   │   │   ├── images/               # Sample images (various formats)
│   │   │   ├── documents/            # Sample documents
│   │   │   └── corrupted/            # Invalid files for error testing
│   │   └── registry.ts               # Central fixture registry
│   ├── validators/                   # Output file validation
│   │   ├── magic-numbers.ts          # Binary signature verification
│   │   ├── hash-validator.ts         # Checksum/integrity validation
│   │   ├── format-parsers/           # Format-specific validation
│   │   │   ├── image-validator.ts    # Verify image metadata/dimensions
│   │   │   ├── json-validator.ts     # Parse and validate JSON structure
│   │   │   ├── csv-validator.ts      # Validate CSV row/column structure
│   │   │   └── index.ts              # Validator registry
│   │   └── index.ts                  # Unified validation interface
│   ├── page-objects/                 # Page Object Model
│   │   ├── convert-page.ts           # Main conversion page interactions
│   │   ├── components/               # Reusable UI components
│   │   │   ├── file-upload.ts        # File upload component
│   │   │   ├── format-selector.ts    # Format selection component
│   │   │   ├── conversion-progress.ts# Progress tracking component
│   │   │   └── download-manager.ts   # Download handling component
│   │   └── base-page.ts              # Base page object with common methods
│   ├── helpers/                      # Test utilities
│   │   ├── wait-helpers.ts           # Smart wait strategies
│   │   ├── file-helpers.ts           # File system operations
│   │   ├── browser-helpers.ts        # Browser-specific handling
│   │   └── assertion-helpers.ts      # Custom assertions
│   └── config/                       # Test configuration
│       ├── test-matrix.ts            # Define conversion test matrix
│       └── browser-config.ts         # Browser-specific configurations
└── playwright.config.ts              # Playwright configuration
```

### Structure Rationale

- **tests/e2e/conversions/**: Organized by category (6 files) mirrors the 6 conversion categories, making tests easy to locate. Each file tests all conversions within that category.
- **tests/fixtures/generators/**: Factory pattern enables on-demand creation of valid test files without storing hundreds of binary files in git. Generators create minimal valid files programmatically.
- **tests/fixtures/static/**: Complex or large fixtures that can't be easily generated (multi-page PDFs, realistic images with metadata) are stored here.
- **tests/validators/**: Separate validation logic from test logic. Validators are reusable across all conversion tests and focus solely on output verification.
- **tests/page-objects/**: Encapsulates UI interactions using Page Object Model, making tests readable and maintainable. When UI changes, only page objects need updates.
- **tests/helpers/**: Shared utilities reduce duplication and handle cross-cutting concerns like browser differences, flaky waits, and file cleanup.

## Architectural Patterns

### Pattern 1: Fixture Factory Pattern

**What:** Generate test files programmatically using factory functions that create minimal valid binary files for each format.

**When to use:** For simple formats (PNG, JPEG, CSV, JSON, TXT) that can be constructed in code. Avoids storing hundreds of binary fixtures in source control.

**Trade-offs:**
- **Pros**: No binary files in git, fast generation, easy to customize per test
- **Cons**: Requires understanding of file format specifications, generated files are minimal (not realistic)

**Example:**
```typescript
// tests/fixtures/generators/image-factory.ts
export class ImageFactory {
  /**
   * Generate minimal valid PNG (1x1 pixel)
   */
  static createPNG(width = 1, height = 1, color = [255, 0, 0]): Buffer {
    // PNG signature
    const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

    // IHDR chunk (image header)
    const ihdr = this.createChunk('IHDR', Buffer.concat([
      Buffer.from([0, 0, 0, width, 0, 0, 0, height]), // width, height
      Buffer.from([8, 2, 0, 0, 0]) // bit depth, color type, etc.
    ]));

    // IDAT chunk (image data)
    const idat = this.createChunk('IDAT', Buffer.from([/* compressed pixel data */]));

    // IEND chunk (end marker)
    const iend = this.createChunk('IEND', Buffer.alloc(0));

    return Buffer.concat([signature, ihdr, idat, iend]);
  }

  /**
   * Generate minimal valid JPEG
   */
  static createJPEG(): Buffer {
    return Buffer.from([
      0xFF, 0xD8, // JPEG SOI (Start of Image)
      0xFF, 0xE0, // APP0 marker
      0x00, 0x10, 'J', 'F', 'I', 'F', 0x00, // JFIF header
      // ... minimal JPEG data
      0xFF, 0xD9  // JPEG EOI (End of Image)
    ]);
  }
}

// Usage in tests:
const testFile = ImageFactory.createPNG();
await page.setInputFiles('input[type="file"]', {
  name: 'test.png',
  mimeType: 'image/png',
  buffer: testFile
});
```

### Pattern 2: Magic Number Validation

**What:** Verify converted files by checking their binary signature (magic numbers) to confirm correct format.

**When to use:** As first-line validation for all binary conversions. Ensures the output file is actually the requested format, not just renamed.

**Trade-offs:**
- **Pros**: Fast, reliable, catches major conversion failures
- **Cons**: Doesn't validate internal structure or content correctness

**Example:**
```typescript
// tests/validators/magic-numbers.ts
export const MAGIC_NUMBERS = {
  png: Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
  jpeg: Buffer.from([0xFF, 0xD8, 0xFF]),
  pdf: Buffer.from([0x25, 0x50, 0x44, 0x46]), // %PDF
  zip: Buffer.from([0x50, 0x4B, 0x03, 0x04]), // PK.. (also DOCX, XLSX)
  gif: Buffer.from([0x47, 0x49, 0x46, 0x38]), // GIF8
  webp: Buffer.from([0x52, 0x49, 0x46, 0x46]), // RIFF (WebP starts with RIFF)
};

export function validateMagicNumber(buffer: Buffer, format: string): boolean {
  const expected = MAGIC_NUMBERS[format];
  if (!expected) return false;

  return buffer.subarray(0, expected.length).equals(expected);
}

// Usage:
const downloadedFile = await page.download();
const buffer = await downloadedFile.createReadStream();
expect(validateMagicNumber(buffer, 'jpeg')).toBe(true);
```

### Pattern 3: Test Matrix Generation

**What:** Automatically generate test cases for all valid conversion paths using the conversion registry.

**When to use:** To ensure comprehensive coverage without manually writing 100+ individual tests.

**Trade-offs:**
- **Pros**: Complete coverage, automatically tests new formats when added
- **Cons**: Test output can be verbose, failures harder to debug

**Example:**
```typescript
// tests/config/test-matrix.ts
import { conversionPaths } from '$lib/utils/conversion-registry';

export function generateConversionMatrix() {
  return conversionPaths.map(path => ({
    name: `${path.from.toUpperCase()} to ${path.to.toUpperCase()}`,
    from: path.from,
    to: path.to,
    category: path.converter
  }));
}

// Usage in test:
const matrix = generateConversionMatrix();

for (const conversion of matrix) {
  test(`Convert ${conversion.name}`, async ({ page }) => {
    const inputFile = await FixtureFactory.create(conversion.from);
    await convertPage.uploadFile(inputFile);
    await convertPage.selectFormat(conversion.to);
    await convertPage.convert();

    const output = await convertPage.downloadResult();
    expect(validateMagicNumber(output, conversion.to)).toBe(true);
  });
}
```

### Pattern 4: Page Object Model with Components

**What:** Encapsulate UI interactions in page objects, with reusable component objects for shared UI elements.

**When to use:** Always for E2E tests. Separates test logic from UI implementation details.

**Trade-offs:**
- **Pros**: Maintainable, readable tests; UI changes isolated to page objects
- **Cons**: Initial overhead to create page object structure

**Example:**
```typescript
// tests/page-objects/convert-page.ts
export class ConvertPage {
  constructor(private page: Page) {}

  async uploadFile(file: { name: string; buffer: Buffer; mimeType: string }) {
    const fileInput = this.page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: file.name,
      mimeType: file.mimeType,
      buffer: file.buffer
    });

    // Wait for file to be processed
    await this.page.waitForSelector('.file-item', { timeout: 5000 });
  }

  async selectFormat(format: string) {
    const formatOption = this.page
      .locator('.format-option')
      .filter({ hasText: new RegExp(format, 'i') });
    await formatOption.first().click();
  }

  async convert() {
    await this.page.locator('.convert-btn').click();
    await this.waitForConversion();
  }

  async waitForConversion() {
    await this.page.waitForSelector('.complete-section', { timeout: 30000 });
  }

  async downloadResult(): Promise<Buffer> {
    const downloadPromise = this.page.waitForEvent('download');
    await this.page.locator('.download-btn').first().click();
    const download = await downloadPromise;

    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];

    return new Promise((resolve) => {
      stream.on('data', chunk => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }
}

// Usage:
const convertPage = new ConvertPage(page);
await convertPage.uploadFile(testFile);
await convertPage.selectFormat('jpeg');
await convertPage.convert();
const result = await convertPage.downloadResult();
```

### Pattern 5: Multi-Layer Validation

**What:** Validate converted files at multiple levels: magic numbers (format), integrity (checksum), structure (parsing), and content (semantic validation).

**When to use:** For critical conversions or complex formats where magic number validation isn't sufficient.

**Trade-offs:**
- **Pros**: Comprehensive validation catches subtle issues
- **Cons**: Slower tests, more complex validation code

**Example:**
```typescript
// tests/validators/format-parsers/json-validator.ts
export class JSONValidator {
  static async validate(buffer: Buffer) {
    const results = {
      magicNumber: false,
      parseable: false,
      structure: false,
      content: false
    };

    // Layer 1: Magic number (JSON doesn't have one, check text format)
    const text = buffer.toString('utf-8');
    results.magicNumber = text.trim().startsWith('{') || text.trim().startsWith('[');

    // Layer 2: Parse integrity
    let parsed;
    try {
      parsed = JSON.parse(text);
      results.parseable = true;
    } catch {
      return results;
    }

    // Layer 3: Structure validation
    results.structure = typeof parsed === 'object';

    // Layer 4: Content validation (example: CSV->JSON should have array of objects)
    if (Array.isArray(parsed)) {
      results.content = parsed.every(item => typeof item === 'object');
    }

    return results;
  }
}

// Usage:
const validation = await JSONValidator.validate(outputBuffer);
expect(validation.magicNumber).toBe(true);
expect(validation.parseable).toBe(true);
expect(validation.structure).toBe(true);
expect(validation.content).toBe(true);
```

## Data Flow

### Conversion Test Flow

```
[Test Starts]
    ↓
[Fixture Generator] → Creates minimal valid input file (Buffer)
    ↓
[Page Object: Upload] → Sets file input, triggers upload handler
    ↓
[Page Object: Format Selection] → Selects target format from UI
    ↓
[Page Object: Convert] → Triggers conversion, waits for completion
    ↓
[Page Object: Download] → Captures download event, returns Buffer
    ↓
[Validator: Magic Number] → Verifies binary signature
    ↓
[Validator: Format Parser] → Validates internal structure (if needed)
    ↓
[Validator: Hash Check] → Compares checksum if deterministic
    ↓
[Test Assertion] → All validations pass → Test succeeds
```

### Fixture Generation Flow

```
[Test Requests Fixture]
    ↓
[Fixture Registry] → Checks format type (image, audio, doc, etc.)
    ↓
[Appropriate Factory] → ImageFactory, AudioFactory, etc.
    ↓
[Factory Method] → Constructs minimal valid binary
    ↓
    ├─ [Cache?] → If cacheable, store in /tmp for reuse
    └─ [Return Buffer] → Return to test immediately
```

### Validation Flow

```
[Downloaded File Buffer]
    ↓
    ├→ [Magic Number Check] → FAIL → Report format mismatch
    ↓  (fast, catches major issues)
    ↓
    ├→ [Hash Validation] → FAIL → Report corruption
    ↓  (medium speed, ensures integrity)
    ↓
    ├→ [Format Parser] → FAIL → Report structure error
    ↓  (slow, validates internal correctness)
    ↓
    └→ [Content Validation] → FAIL → Report semantic error
       (slowest, validates meaning)
```

### Key Data Flows

1. **Test Execution Flow**: Test → Fixture Generator → Page Object → Validator → Assertion
2. **Parallel Test Execution**: Playwright spawns multiple workers, each runs subset of tests independently
3. **Cross-Browser Flow**: Same test runs in Chromium → Firefox → WebKit with browser-specific handling in helpers
4. **Error Path Flow**: Invalid input → Conversion error → Error UI display → Test validates error message

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| **1-50 conversion paths** | Simple fixture generators, basic magic number validation, single test file per category (current state) |
| **50-200 conversion paths** | Test matrix generation to avoid manual test writing, multi-layer validation for critical paths, parallel test execution with sharding |
| **200+ conversion paths** | Pre-generated fixture cache in CI to speed up tests, selective testing (smoke tests on all paths, deep validation on critical paths), distributed test execution across multiple CI runners |

### Scaling Priorities

1. **First bottleneck: Test execution time (30+ formats = 100+ conversion paths)**
   - **Fix**: Enable test sharding in Playwright config with `--shard=1/4` to split tests across 4 parallel CI jobs
   - **Fix**: Use `test.describe.configure({ mode: 'parallel' })` for independent conversion tests
   - **Fix**: Cache generated fixtures in `/tmp` to avoid regenerating identical files

2. **Second bottleneck: Fixture generation overhead**
   - **Fix**: Pre-generate complex fixtures (multi-page PDFs, large images) during CI setup phase, store in artifact cache
   - **Fix**: Use lazy fixture generation - only create fixtures when tests actually run, not all upfront
   - **Fix**: Implement fixture fingerprinting - hash fixture parameters, reuse if same fixture requested multiple times

3. **Third bottleneck: Cross-browser testing cost (3 browsers × 100+ tests = 300+ test runs)**
   - **Fix**: Run full test suite only on Chromium, run smoke tests (10-15% of tests) on Firefox/WebKit
   - **Fix**: Use browser-specific test tagging with `testMatch` in playwright.config.ts (already implemented)
   - **Fix**: Skip browser-specific tests when conversion logic is browser-agnostic (most conversions happen in Web Workers)

## Anti-Patterns

### Anti-Pattern 1: Storing Binary Fixtures in Git

**What people do:** Commit hundreds of PNG/JPEG/PDF/DOCX files to git repository as test fixtures.

**Why it's wrong:**
- Bloats repository size (binary files don't compress well)
- Slow git operations (clone, pull, checkout)
- Difficult to maintain and update fixtures
- Merge conflicts on binary files are impossible to resolve

**Do this instead:** Use fixture factories that generate minimal valid files programmatically. Store only complex fixtures that can't be generated (e.g., a realistic 10-page PDF with images), and store them in a separate fixtures/ directory with `.gitattributes` LFS configuration if necessary.

### Anti-Pattern 2: Testing Implementation Details

**What people do:** Test that specific Web Worker messages are sent, or that internal conversion state machines transition through specific states.

**Why it's wrong:**
- Brittle tests that break when refactoring internal implementation
- Tests don't reflect user behavior or business value
- Couples tests to implementation, making refactoring painful

**Do this instead:** Test observable behavior: upload file → select format → download result → validate output file. Don't care how conversion happens internally (worker messages, state transitions), only care that correct output is produced.

### Anti-Pattern 3: Overly Complex Page Objects

**What people do:** Create page objects with business logic, assertions, and complex conditional flows.

**Why it's wrong:**
- Page objects should only encapsulate UI interactions, not test logic
- Business logic in page objects makes it harder to understand what tests actually verify
- Reduces reusability when page objects make assumptions about test flow

**Do this instead:** Keep page objects simple - expose methods like `uploadFile()`, `selectFormat()`, `convert()`, `downloadResult()`. Put assertions and test logic in test files. Page objects return data (e.g., downloaded Buffer), tests validate that data.

```typescript
// BAD: Page object with assertions
class ConvertPage {
  async convertAndValidate(file, targetFormat) {
    await this.upload(file);
    await this.selectFormat(targetFormat);
    await this.convert();
    const result = await this.download();
    expect(validateMagicNumber(result, targetFormat)).toBe(true); // ❌ Assertion in page object
    return result;
  }
}

// GOOD: Page object returns data, test asserts
class ConvertPage {
  async downloadResult(): Promise<Buffer> {
    const download = await this.page.waitForEvent('download');
    // ... download handling
    return buffer;
  }
}

// Test file:
test('converts PNG to JPEG', async ({ page }) => {
  const convertPage = new ConvertPage(page);
  const result = await convertPage.downloadResult();
  expect(validateMagicNumber(result, 'jpeg')).toBe(true); // ✅ Assertion in test
});
```

### Anti-Pattern 4: Validating Only File Extension or MIME Type

**What people do:** Check that downloaded file has `.jpeg` extension or `image/jpeg` MIME type, assume conversion succeeded.

**Why it's wrong:**
- File extension and MIME type can be wrong while file is corrupted or in wrong format
- Doesn't catch conversion bugs - a PNG renamed to `.jpeg` would pass
- No actual verification that conversion logic worked

**Do this instead:** Always validate binary content using magic numbers as minimum. For critical conversions, parse file structure to verify internal correctness.

### Anti-Pattern 5: Sequential Test Execution for Independent Tests

**What people do:** Run conversion tests sequentially with `workers: 1` to avoid concurrency issues.

**Why it's wrong:**
- Massively slows down CI (100+ tests taking 5+ minutes instead of 1-2 minutes)
- Conversion tests are usually independent - PNG→JPEG doesn't affect CSV→JSON
- Wastes CI resources and developer time

**Do this instead:** Enable parallel execution (`fullyParallel: true`) for conversion tests. Each test is isolated (uploads different file, downloads to different location). Only run sequentially when tests genuinely share state (rare for file conversions).

```typescript
// playwright.config.ts
export default defineConfig({
  fullyParallel: true,  // Enable parallel execution
  workers: process.env.CI ? 4 : undefined,  // 4 parallel workers in CI

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Run subset on Firefox/WebKit to save time
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testMatch: ['**/smoke/*.spec.ts'], // Only smoke tests
    },
  ],
});
```

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **Playwright** | Test runner and browser automation | Official integration, well-supported |
| **Web Workers** | Tests interact via page.evaluate() to access worker state | Cannot directly access worker internals, test via UI behavior |
| **File System** | Temporary files for fixtures, download validation | Use `/tmp` for generated fixtures, clean up after tests |
| **CI (GitHub Actions)** | Matrix strategy for cross-browser, artifact caching | Upload test reports and screenshots as artifacts |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| **Test ↔ Fixture Generator** | Direct function calls, returns Buffer | Generators are pure functions, no side effects |
| **Test ↔ Page Object** | Method calls, returns data or Promises | Page objects encapsulate Playwright API, tests use high-level methods |
| **Test ↔ Validator** | Validator receives Buffer, returns validation result | Validators are pure functions, can be unit tested independently |
| **Page Object ↔ Browser** | Playwright API (locators, waitFor, etc.) | Page objects translate business actions to Playwright commands |
| **Validator ↔ File System** | Temporary file storage if needed for external tools | Most validators work on Buffers in memory |

## Build Order Implications

Based on dependencies, implement test architecture components in this order:

### Phase 1: Foundation (Test Infrastructure)
**Build first**: Test helpers, browser configuration
- **Rationale**: All tests depend on these utilities
- **Deliverables**: `helpers/wait-helpers.ts`, `helpers/browser-helpers.ts`, `config/browser-config.ts`

### Phase 2: Fixture Generation
**Build second**: Fixture generators for simple formats
- **Rationale**: Tests need input files before they can run conversions
- **Deliverables**:
  - `fixtures/generators/image-factory.ts` (PNG, JPEG)
  - `fixtures/generators/document-factory.ts` (TXT, JSON, CSV)
  - `fixtures/registry.ts`
- **Why before validators**: Generating valid test files is prerequisite to validating outputs

### Phase 3: Page Object Model
**Build third**: Base page objects and components
- **Rationale**: UI interaction layer needed before writing actual tests
- **Deliverables**:
  - `page-objects/base-page.ts`
  - `page-objects/convert-page.ts`
  - `page-objects/components/file-upload.ts`
- **Why after fixtures**: Page objects will use fixtures during development/testing

### Phase 4: Basic Validation
**Build fourth**: Magic number validators
- **Rationale**: Simplest form of output validation, needed for first tests
- **Deliverables**:
  - `validators/magic-numbers.ts`
  - `validators/index.ts` (validator registry)
- **Why after page objects**: Validators consume output from page object download methods

### Phase 5: Test Matrix
**Build fifth**: Test matrix generation and first conversion tests
- **Rationale**: Now we have all pieces - fixtures, page objects, validators
- **Deliverables**:
  - `config/test-matrix.ts`
  - `e2e/conversions/image.spec.ts` (pilot)
  - `e2e/smoke/basic-flow.spec.ts`
- **Why now**: Can write end-to-end tests using all previous components

### Phase 6: Advanced Validation
**Build sixth**: Format-specific parsers and multi-layer validation
- **Rationale**: After basic tests work, add deeper validation for critical paths
- **Deliverables**:
  - `validators/format-parsers/json-validator.ts`
  - `validators/format-parsers/csv-validator.ts`
  - `validators/hash-validator.ts`
- **Why last**: These are enhancements to existing working tests

### Phase 7: Complete Coverage
**Build seventh**: Remaining conversion test suites
- **Rationale**: Expand coverage to all 6 categories using established patterns
- **Deliverables**:
  - `e2e/conversions/audio.spec.ts`
  - `e2e/conversions/document.spec.ts`
  - `e2e/conversions/spreadsheet.spec.ts`
  - `e2e/conversions/archive.spec.ts`
  - `e2e/conversions/text.spec.ts`
  - `e2e/workflows/batch-conversion.spec.ts`
  - `e2e/workflows/error-handling.spec.ts`

### Dependency Graph
```
Test Helpers & Config
    ↓
Fixture Generators → Page Objects
    ↓                    ↓
    └──────→ Basic Validators
                 ↓
           Test Matrix & First Tests
                 ↓
         Advanced Validators
                 ↓
         Complete Test Coverage
```

## CI/CD Integration

### GitHub Actions Test Matrix

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        browser: [chromium, firefox, webkit]
        shard: [1, 2, 3, 4]  # 4-way parallel execution

    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: bun install

      - name: Install Playwright browsers
        run: bunx playwright install --with-deps ${{ matrix.browser }}

      - name: Run E2E tests
        run: bunx playwright test --project=${{ matrix.browser }} --shard=${{ matrix.shard }}/4

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-results-${{ matrix.browser }}-${{ matrix.shard }}
          path: test-results/
```

### Optimizations for CI

1. **Parallel Execution**: 4-way sharding reduces test time from ~10min to ~2.5min
2. **Browser Selection**: Full tests on Chromium, smoke tests on Firefox/WebKit saves ~60% of test runs
3. **Artifact Caching**: Cache `node_modules` and Playwright browsers between runs
4. **Fixture Caching**: Pre-generate complex fixtures once, cache for all shards

## Sources

**E2E Testing Best Practices:**
- [End-To-End Testing: 2026 Guide for E2E Testing](https://www.leapwork.com/blog/end-to-end-testing)
- [7 End-to-End Testing Best Practices in 2026](https://research.aimultiple.com/end-to-end-testing-best-practices/)
- [End-to-End Testing Guide for 2025 - Best Practices & Testing Plan | DogQ](https://dogq.io/blog/end-to-end-testing-guide/)

**Test Fixtures and Factories:**
- [Make Testing Easier with Test Fixture Generators - DEV Community](https://dev.to/jcteague/make-testing-easier-with-test-fixture-generators-5485)
- [Creating Test Objects via Design Patterns | NimblePros Blog](https://blog.nimblepros.com/blogs/creating-test-objects-via-design-patterns/)
- [Mastering Test Fixture Strategies for Effective Test Automation | by Manish Saini | Medium](https://manishsaini74.medium.com/mastering-test-fixture-strategies-for-effective-test-automation-eeb672dc12ae)
- [Test Automation Strategy 2026 - 8 Tips for an Ultimate Plan](https://blog.qasource.com/resources/8-tips-for-creating-the-ultimate-test-automation-strategy)

**Playwright Testing:**
- [15 Best Practices for Playwright testing in 2026 | BrowserStack](https://www.browserstack.com/guide/playwright-best-practices)
- [Snapshot Testing with Playwright in 2026 | BrowserStack](https://www.browserstack.com/guide/playwright-snapshot-testing)
- [How to Writing Scalable Playwright Test Scripts in 2026 | BrowserStack](https://www.browserstack.com/guide/playwright-scripts)
- [Fixtures | Playwright](https://playwright.dev/docs/test-fixtures)

**File Validation:**
- [List of file signatures - Wikipedia](https://en.wikipedia.org/wiki/List_of_file_signatures)
- [Beneath the Bytes: A Deep Dive into Magic Numbers for File Identification | by Shailendra Purohit | Medium](https://medium.com/@shailendrapurohit2010/beneath-the-bytes-a-deep-dive-into-magic-numbers-for-file-identification-4bff213121c4)
- [Detect & Validate file types by their 'magic numbers' in React](https://medium.com/@nir.almog90/detect-validate-file-types-by-their-magic-numbers-in-react-f678e65b45187)
- [File verification - Wikipedia](https://en.wikipedia.org/wiki/File_verification)
- [How to check file integrity by validating checksums](https://fairplus.github.io/the-fair-cookbook/content/recipes/findability/checksum-validate.html)

**Page Object Model:**
- [Page Object Design Pattern for E2E Tests | by Rosie | Medium](https://medium.com/@rosiehsmith/page-object-design-pattern-for-e2e-testing-3381c9745ffb)
- [Page Model Design Pattern: Writing maintainable End-to-End Test - DEV Community](https://dev.to/darasimiajewole/page-model-design-pattern-writing-maintainable-end-to-end-test-3h48)
- [Page object models | Selenium](https://www.selenium.dev/documentation/test_practices/encouraged/page_object_models/)

**CI/CD Integration:**
- [Building a Robust CI/CD Pipeline for Multi-Browser Cypress Testing with GitHub Actions | by Clark Ewerton | Medium](https://medium.com/@clarkewertonSilva/building-a-robust-ci-cd-pipeline-for-multi-browser-cypress-testing-1cf10840f47c)
- [Automating Playwright Tests with GitHub Actions | BrowserStack](https://www.browserstack.com/guide/playwright-github-action)
- [Matrix Testing in CI/CD Pipelines · Yuri Kan - Senior QA Lead and Test Automation Expert](https://yrkan.com/blog/matrix-testing-in-ci-cd-pipelines/)

---
*Architecture research for E2E testing of file conversion system with 30+ formats across 6 categories*
*Researched: 2026-01-23*
