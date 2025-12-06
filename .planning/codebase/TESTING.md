# Testing Patterns

**Analysis Date:** 2026-01-23

## Test Framework

**Runner:**
- Vitest 3.2.4
- Config: `vitest.config.ts`

**Assertion Library:**
- Vitest built-in `expect()`

**E2E Testing:**
- Playwright 1.55.0
- Config: `playwright.config.ts`

**Run Commands:**
```bash
bun run test              # Run unit tests (watch mode)
bun run test:run          # Run unit tests (single run)
bun run test:unit         # Run unit tests (single run, alias)
bun run test:unit:watch   # Run unit tests (watch mode, alias)
bun run test:e2e          # Run E2E tests (headless)
bun run test:e2e:ui       # Run E2E tests (interactive UI)
bun run test:e2e:debug    # Run E2E tests (debug mode with DevTools)
bun run test:conversion   # Run file-conversion-e2e tests only
bun run test:all          # Run both unit and E2E tests
```

## Test File Organization

**Location:**
- Unit tests: Co-located with source files in `src/`
- E2E tests: Separate directory at `tests/`

**Naming:**
- Unit tests: `*.test.ts` or `*.spec.ts` suffix
- E2E tests: `*.spec.ts` suffix in `tests/` directory
- Examples:
  - `src/lib/conversion/audio-conversion.test.ts`
  - `src/lib/utils/conversion-registry.spec.ts`
  - `tests/convert-basic.spec.ts`
  - `tests/file-conversion-e2e.spec.ts`

**Structure:**
```
/apps/frontend/
├── src/
│   └── lib/
│       ├── conversion/
│       │   ├── audio-conversion.test.ts
│       │   └── audio-conversion-manager.test.ts
│       └── utils/
│           └── conversion-registry.spec.ts
└── tests/
    ├── convert-basic.spec.ts
    ├── convert-flow.spec.ts
    ├── file-conversion-e2e.spec.ts
    ├── e2e/
    │   ├── traffic-acquisition.spec.ts
    │   └── structured-data-validation.spec.ts
    └── [other E2E test files]
```

## Test Structure

**Suite Organization:**

Unit test example from `audio-conversion.test.ts`:
```typescript
describe('Audio File Type Detection', () => {
  describe('Audio File Types Configuration', () => {
    it('should have WAV audio configuration', () => {
      const wavConfig = FILE_TYPES.wav;
      expect(wavConfig).toBeDefined();
      expect(wavConfig.id).toBe('wav');
      expect(wavConfig.category).toBe('audio');
    });
  });

  describe('detectFileType for Audio Files', () => {
    it('should detect WAV file by MIME type', () => {
      const file = new File([''], 'audio.wav', { type: 'audio/wav' });
      const config = detectFileType(file);
      expect(config).toBeDefined();
      expect(config?.id).toBe('wav');
    });
  });
});
```

**Patterns:**
- Nested `describe()` blocks for logical grouping
- Descriptive test names starting with "should"
- One assertion per test in most cases (or related assertions for the same behavior)
- Setup within test or via `beforeEach` if needed

**E2E Test Example from `convert-basic.spec.ts`:**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Convert Page Basic Tests', () => {
  test('convert page loads without error', async ({ page }) => {
    const response = await page.goto('/convert');
    expect(response?.status()).toBe(200);

    await page.screenshot({ path: 'test-results/convert-page-loaded.png' });
    await page.waitForTimeout(2000);

    const bodyText = await page.textContent('body');
    const hasH1 = await page.locator('h1').count();

    expect(hasH1).toBeGreaterThan(0);
  });
});
```

## Test Types

**Unit Tests:**
- Scope: Individual functions, types, and configurations
- Approach: Direct function calls with mocked File objects
- Located: `src/lib/conversion/`, `src/lib/utils/`
- Examples:
  - `detectFileType()` with various MIME types and extensions
  - `validateFile()` with files under/over size limits
  - `getAvailableConversions()` with different format inputs
  - Configuration object validation

**Integration Tests:**
- Not explicitly separated; E2E tests serve this role

**E2E Tests:**
- Framework: Playwright
- Scope: Full page load, user interactions, form submissions, navigation
- Located: `tests/` directory
- Browser targets:
  - Chromium (all tests)
  - Firefox (basic tests only)
  - WebKit/Safari (basic tests only)
  - Mobile Chrome (mobile-specific tests)
  - Mobile Safari (mobile-specific tests)
- Features:
  - Parallel execution disabled (serial tests): `fullyParallel: false, workers: 1`
  - Screenshots on failure: `screenshot: 'only-on-failure'`
  - Video retention on failure: `video: 'retain-on-failure'`
  - Trace recording on first retry: `trace: 'on-first-retry'`
  - Retries in CI: 2 retries when `process.env.CI` is set

## Test Data

**Mock File Creation:**
- Files created with `new File()` constructor
- Example patterns:
  ```typescript
  // With MIME type
  const file = new File([''], 'audio.wav', { type: 'audio/wav' });

  // With content (repeated character to reach size)
  const file = new File(['x'.repeat(1024 * 1024)], 'audio.wav', { type: 'audio/wav' });

  // Without MIME type (testing extension detection)
  const file = new File([''], 'audio.wav', { type: '' });
  ```

**Fixtures:**
- Located at: `src/lib/converters/test-fixtures/fixtures-generator.ts`
- Purpose: Generate test data for different file types

**Location:**
- Test fixtures colocated with implementation in `test-fixtures/` subdirectories

## Coverage

**Requirements:** Not explicitly enforced (no coverage config found in vitest.config.ts)

**View Coverage:**
- Coverage not currently tracked via CLI command

## Common Patterns

**Async Testing:**
```typescript
it('should detect WAV file by MIME type', async () => {
  const file = new File([''], 'audio.wav', { type: 'audio/wav' });
  const config = detectFileType(file);
  expect(config).toBeDefined();
});
```

**File Validation Testing:**
```typescript
it('should reject WAV file exceeding size limit', () => {
  const maxSize = FILE_TYPES.wav.maxSize;
  const file = new File(['x'.repeat(maxSize + 1)], 'huge.wav', { type: 'audio/wav' });
  const config = FILE_TYPES.wav;
  const validation = validateFile(file, config);
  expect(validation.valid).toBe(false);
  expect(validation.reason).toContain('too large');
});
```

**Configuration Validation:**
```typescript
it('should have WAV audio configuration', () => {
  const wavConfig = FILE_TYPES.wav;
  expect(wavConfig).toBeDefined();
  expect(wavConfig.id).toBe('wav');
  expect(wavConfig.name).toBe('WAV Audio');
  expect(wavConfig.category).toBe('audio');
  expect(wavConfig.extensions).toContain('wav');
  expect(wavConfig.mimeTypes).toContain('audio/wav');
  expect(wavConfig.workerType).toBe('audio');
});
```

**E2E Page Navigation:**
```typescript
test('convert page loads without error', async ({ page }) => {
  const response = await page.goto('/convert');
  expect(response?.status()).toBe(200);

  await page.screenshot({ path: 'test-results/convert-page-loaded.png', fullPage: true });
  await page.waitForTimeout(2000);

  const bodyText = await page.textContent('body');
  const hasH1 = await page.locator('h1').count();
});
```

## Mocking

**Framework:** Vitest built-in mocking (not explicitly configured)

**Patterns:**
- File objects mocked directly: `new File([''], 'name.ext', { type: 'mime/type' })`
- No external mock libraries detected
- Configuration objects used as test data rather than mocked

**What to Mock:**
- File inputs (use File constructor)
- Environment detection (type checks for `typeof window`)

**What NOT to Mock:**
- Conversion configuration (use actual FILE_TYPES, formats constants)
- Function implementations that are being tested (test the real implementations)

## E2E Test Configuration Details

**Playwright Config** (`playwright.config.ts`):
- Test directory: `./tests`
- Serial execution: `fullyParallel: false, workers: 1`
- Reporter: HTML report generation
- Base URL: `http://localhost:5173` (dev server)
- Web server startup: `bun run dev` command
- Server reuse: `reuseExistingServer: true` (speeds up test runs)
- Server timeout: 120 seconds

**Test Patterns by Browser:**
- Chromium: All tests
- Firefox: `**/basic-*.spec.ts`, `**/ui-*.spec.ts`
- WebKit: `**/basic-*.spec.ts`
- Mobile Chrome: `**/mobile-*.spec.ts`
- Mobile Safari: `**/mobile-*.spec.ts`

## Test Count and Coverage

**Unit Tests:**
- `src/lib/conversion/audio-conversion.test.ts`: 27 test suites covering audio file detection, validation, conversion options, and formatting
- `src/lib/utils/conversion-registry.spec.ts`: 8 test suites covering format lookup, available conversions, and conversion paths
- `src/lib/conversion/audio-conversion-manager.test.ts`: Additional manager tests (not examined in detail)

**E2E Tests:**
- Multiple test suites in `tests/`: convert page, image conversion, file upload, format detection, etc.
- Multiple e2e subdirectory tests: traffic acquisition, structured data validation

---

*Testing analysis: 2026-01-23*
