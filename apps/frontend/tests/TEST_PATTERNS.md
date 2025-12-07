# Test Patterns and Best Practices

This document defines test infrastructure patterns, anti-patterns to avoid, and migration examples for the File Convert test suite.

## Table of Contents

- [Fixture Usage](#fixture-usage)
- [Dynamic Timeout Configuration](#dynamic-timeout-configuration)
- [Anti-Patterns to Avoid](#anti-patterns-to-avoid)
- [Migration Examples](#migration-examples)
- [Worker Lifecycle](#worker-lifecycle)

## Fixture Usage

### How to Import

All tests should import from the fixture system instead of Playwright directly:

```typescript
// ✅ Correct
import { test, expect } from './fixtures';

// ❌ Incorrect
import { test, expect } from '@playwright/test';
```

### Available Fixtures

The fixture system provides three main helpers:

#### 1. `fileHelper` - File Upload Management

Provides utilities for uploading files to the application.

```typescript
test('upload file', async ({ page, fileHelper }) => {
  await fileHelper.uploadFile('test.png');
  // File is automatically uploaded via the file input
});
```

#### 2. `downloadHelper` - Download Handling

Provides race-condition-free download handling. Automatically cleans up downloaded files after test.

```typescript
test('download file', async ({ page, downloadHelper }) => {
  const download = await downloadHelper.waitForDownload(async () => {
    await page.click('.download-btn');
  });
  // Download is captured, verified, and cleaned up automatically
});
```

**When to use:** Any test that triggers file downloads. The helper uses the promise-before-click pattern to avoid race conditions.

#### 3. `workerLifecycle` - Web Worker Management

Manages Web Worker initialization and cleanup. Automatically terminates workers after test.

```typescript
test('conversion', async ({ page, workerLifecycle }) => {
  await workerLifecycle.waitForWorkerReady('image');
  // Proceed with conversion knowing the worker is initialized
});
```

**When to use:** Any test that performs conversions. Workers must be ready before conversion operations begin.

## Dynamic Timeout Configuration

### INFRA-10 Requirement

The test infrastructure includes dynamic timeout calculation based on file size and operation complexity.

### Formula

```
timeout = base + (fileSizeMB * perMB * complexityMultiplier)
```

**Default values:**
- Base: 30 seconds
- Per MB: 2 seconds
- Complexity multipliers:
  - Simple: 1x (text operations)
  - Medium: 2x (image conversions)
  - Complex: 4x (PDF generation, compression)

### Examples

```typescript
import { calculateTimeout, applyTimeout, getComplexityForConversion } from './fixtures';

// Example 1: Small text file (1MB, simple)
const timeout1 = calculateTimeout(1, 'simple');
// Result: 32000ms (30s base + 2s)

// Example 2: Large image (10MB, medium)
const timeout2 = calculateTimeout(10, 'medium');
// Result: 70000ms (30s base + 40s)

// Example 3: Complex PDF (5MB, complex)
const timeout3 = calculateTimeout(5, 'complex');
// Result: 70000ms (30s base + 40s)

// Example 4: Auto-detect complexity
const complexity = getComplexityForConversion('png', 'jpeg');
const timeout4 = calculateTimeout(5, complexity);
```

### Usage in Tests

```typescript
test('convert large image', async ({ page }, testInfo) => {
  // Apply dynamic timeout
  applyTimeout(testInfo, 10, 'medium');

  // Test proceeds with appropriate timeout
  // ...
});
```

### Why Dynamic Timeouts?

- **CI reliability:** Fixed timeouts cause flaky tests under load
- **File size variance:** Large files need more time
- **Operation complexity:** PDF generation takes longer than PNG→JPEG
- **Environment differences:** CI may be slower than local

## Anti-Patterns to Avoid

### 1. `waitForTimeout` - Hard Waits

**Problem:** Tests slower, more flaky in CI, hides real timing issues.

```typescript
// ❌ WRONG: Hard wait
await page.waitForTimeout(2000);
await expect(element).toBeVisible();

// ✅ CORRECT: Web-first assertion
await expect(element).toBeVisible();
```

**Why it's bad:**
- Wastes time (waits full duration even if element appears instantly)
- Unreliable (element may not appear in fixed time under load)
- Masks race conditions (code may be wrong but test passes by accident)

### 2. `page.evaluate()` for File Uploads

**Problem:** Doesn't test real file handling, creates fake File objects.

```typescript
// ❌ WRONG: Fake file object
await page.evaluate(() => {
  const file = new File(['content'], 'test.txt');
  // Dispatch fake event...
});

// ✅ CORRECT: Real file upload
const fileInput = page.locator('input[type="file"]');
await fileInput.setInputFiles({
  name: 'test.txt',
  mimeType: 'text/plain',
  buffer: Buffer.from('content')
});
```

**Why it's bad:**
- Bypasses actual file input handling
- Doesn't test browser file API
- Creates unrealistic test scenarios

### 3. Manual Visibility Checks Without Assertions

**Problem:** Race conditions, tests pass when they shouldn't.

```typescript
// ❌ WRONG: Manual check with console.log
const visible = await element.isVisible();
console.log('Element visible:', visible);

// ✅ CORRECT: Assertion that waits
await expect(element).toBeVisible();
```

**Why it's bad:**
- No auto-retry (fails on temporary invisible states)
- No test failure (just logs, doesn't fail test)
- Race conditions (element state may change between check and assertion)

### 4. Hardcoded URLs

**Problem:** Tests fail outside localhost, not portable.

```typescript
// ❌ WRONG: Hardcoded localhost
await page.goto('http://localhost:5173/convert');

// ✅ CORRECT: Relative URL
await page.goto('/convert');
```

**Why it's bad:**
- Breaks in CI (different port/host)
- Not configurable
- Doesn't work with Playwright's webServer config

### 5. Missing Web Worker Lifecycle Management

**Problem:** Race conditions in conversion tests, unreliable results.

```typescript
// ❌ WRONG: Start conversion without worker check
await page.click('.convert-btn');
await expect(page.locator('.result')).toBeVisible();

// ✅ CORRECT: Wait for worker ready
await workerLifecycle.waitForWorkerReady('image');
await page.click('.convert-btn');
await expect(page.locator('.result')).toBeVisible();
```

**Why it's bad:**
- Worker may not be loaded yet
- Conversion starts before worker ready
- Causes timeouts and flaky tests

## Migration Examples

### Before/After: waitForTimeout → Web-First Assertion

```typescript
// BEFORE
await page.click('.upload-btn');
await page.waitForTimeout(2000);
await expect(page.locator('.file-item')).toBeVisible();

// AFTER
await page.click('.upload-btn');
await expect(page.locator('.file-item')).toBeVisible();
```

### Before/After: page.evaluate File Upload → setInputFiles

```typescript
// BEFORE
await page.evaluate(() => {
  const input = document.querySelector('input[type="file"]');
  const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  input.files = dataTransfer.files;
  input.dispatchEvent(new Event('change', { bubbles: true }));
});

// AFTER
const fileInput = page.locator('input[type="file"]');
await fileInput.setInputFiles({
  name: 'test.txt',
  mimeType: 'text/plain',
  buffer: Buffer.from('test content')
});
```

### Before/After: Manual isVisible() → expect().toBeVisible()

```typescript
// BEFORE
const dropdown = page.locator('.dropdown');
const isVisible = await dropdown.isVisible();
console.log('Dropdown visible:', isVisible);
if (isVisible) {
  // Continue test...
}

// AFTER
const dropdown = page.locator('.dropdown');
await expect(dropdown).toBeVisible();
// Continue test - assertion guarantees visibility
```

### Before/After: Importing Playwright → Importing Fixtures

```typescript
// BEFORE
import { test, expect } from '@playwright/test';

test('my test', async ({ page }) => {
  // Test code without fixtures...
});

// AFTER
import { test, expect } from './fixtures';

test('my test', async ({ page, fileHelper, downloadHelper, workerLifecycle }) => {
  // All fixtures automatically available
  await fileHelper.uploadFile('test.png');
  await workerLifecycle.waitForWorkerReady('image');
  const result = await downloadHelper.waitForDownload(async () => {
    await page.click('.download-btn');
  });
});
```

## Worker Lifecycle

### When to Use

Use `workerLifecycle.waitForWorkerReady()` before any conversion operation:

- Image conversions (PNG, JPEG, WebP, etc.)
- Audio conversions (WAV, MP3, FLAC, etc.)
- Document conversions (PDF, DOCX, etc.)
- Archive operations (ZIP, 7Z, TAR, etc.)

### Worker Types

```typescript
type WorkerType = 'image' | 'audio' | 'document' | 'archive' | 'spreadsheet';
```

### Usage

```typescript
test('convert PNG to JPEG', async ({ page, workerLifecycle }) => {
  await page.goto('/convert');

  // Upload file
  await page.locator('input[type="file"]').setInputFiles('test.png');

  // Wait for image worker to be ready
  await workerLifecycle.waitForWorkerReady('image');

  // Now safe to click convert
  await page.click('.convert-btn');
  await expect(page.locator('.result')).toBeVisible();
});
```

### Cleanup

Workers are automatically terminated after each test via fixture teardown. No manual cleanup needed.

```typescript
// ✅ AUTOMATIC
// Workers terminated in fixture teardown

// ❌ NOT NEEDED
// await workerLifecycle.terminateAll(); // This happens automatically
```

---

**Last updated:** 2026-01-24
**Related:** Plan 01-02 (fixture infrastructure), Plan 01-04 (CI integration)
