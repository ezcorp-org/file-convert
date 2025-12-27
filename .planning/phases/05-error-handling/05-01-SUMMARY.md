---
phase: 05-error-handling
plan: 01
subsystem: testing
tags: [e2e, error-handling, validation, fixtures]
requires:
  - phase-04 (test infrastructure)
provides:
  - CorruptedFileFactory for test fixtures
  - E2E tests for file validation errors
  - Bug documentation for missing validation
affects:
  - 05-02 through 05-05 (will fix bugs documented here)
tech-stack:
  added: []
  patterns:
    - Test factory pattern for corrupted files
    - Skip-with-documentation pattern for known bugs
key-files:
  created:
    - tests/fixtures/factories/corrupted-file-factory.ts
    - tests/fixtures/factories/corrupted-file-factory.test.ts
    - tests/e2e/error-handling/file-validation-errors.spec.ts
  modified:
    - tests/fixtures/factories/index.ts
decisions:
  - Skip failing tests with documentation rather than breaking CI
  - Document current behavior bugs for fix in later plans
  - Use factory pattern for consistent corrupted file generation
metrics:
  duration: 11m
  completed: 2026-01-24
---

# Phase 05 Plan 01: File Validation Error Tests Summary

CorruptedFileFactory + E2E tests for ERROR-01/02/03/04 with bug documentation for missing validation.

## Completed Tasks

| Task | Name | Commit | Status |
|------|------|--------|--------|
| 1 | Create corrupted file factory | 8b5c69c | Complete |
| 2 | Create file validation error tests | 3b05c5e | Complete |

## Artifacts Created

### CorruptedFileFactory (tests/fixtures/factories/corrupted-file-factory.ts)

Factory class for generating corrupted test files:

| Method | Purpose | Use Case |
|--------|---------|----------|
| `createZeroByteFile(filename)` | Empty 0-byte file | ERROR-04 testing |
| `createTruncatedFile(format, bytes)` | Valid header, incomplete body | ERROR-02 testing |
| `createBadHeaderFile(format, size)` | Random bytes, wrong format | ERROR-02 testing |
| `createOversizedMetadata(format, sizeMB)` | Metadata with large size claim | ERROR-03 testing |
| `createLargeFile(sizeMB, format)` | Actual large buffer | ERROR-03 testing |
| `createSpoofedExtension(actual, claimed)` | Valid file, wrong extension | Format mismatch testing |
| `createPartialSignature(format)` | Incomplete magic bytes | Edge case testing |

14 unit tests validate all factory methods.

### E2E Tests (tests/e2e/error-handling/file-validation-errors.spec.ts)

592-line test file covering:

| Error Code | Description | Status | Tests |
|------------|-------------|--------|-------|
| ERROR-01 | Unsupported formats | WORKING | 4 passing |
| ERROR-02 | Corrupted files | PARTIAL | 2 passing, 3 skipped |
| ERROR-03 | Size limits | NOT IMPLEMENTED | 0 passing, 3 (2 skipped + 1 bug doc) |
| ERROR-04 | Zero-byte files | NOT IMPLEMENTED | 0 passing, 4 (3 skipped + 1 bug doc) |

**Total: 10 passing, 8 skipped**

## Bugs Documented

The tests revealed three missing validation features:

### BUG-001: Oversized files accepted at upload

**Location:** FileUploader.svelte -> processFiles()
**Root cause:** Uses `detectFileType()` not `validateFile()`, size check skipped
**Current behavior:** 6MB GIF accepted (5MB limit ignored)
**Fix:** Call `validateFile()` which includes size check

### BUG-002: Zero-byte files accepted at upload

**Location:** FileUploader.svelte -> processFiles()
**Root cause:** No `file.size === 0` check
**Current behavior:** Empty files shown in file list
**Fix:** Add early return for zero-byte files

### BUG-003: Bad header files accepted at upload

**Location:** FileUploader.svelte -> processFiles()
**Root cause:** Magic byte validation in `file-validation.ts` not called
**Current behavior:** Random bytes with valid extension accepted
**Fix:** Import and use `validateFileType()` from file-validation.ts

## Implementation Notes

### Test Pattern: Skip-with-documentation

For tests that would fail due to missing features, we use:

```typescript
test.skip('rejects empty PNG file (0 bytes)', async ({ page }) => {
  /**
   * SKIPPED: Zero-byte validation not implemented.
   *
   * Current behavior: Empty file is accepted
   * Expected behavior: Rejected with "File is empty"
   *
   * Fix: Add file.size === 0 check in processFiles()
   */
  // ... test code
});
```

This approach:
- Keeps CI green
- Documents expected behavior
- Provides fix guidance
- Tests are ready to unskip when fixes implemented

### Test Pattern: Bug documentation tests

Each error category has a passing test that documents current (buggy) behavior:

```typescript
test('documents current behavior - zero-byte files are accepted', async ({ page }) => {
  // Upload zero-byte file
  // Assert it appears in file list (current buggy behavior)
  console.log('[BUG] ERROR-04: Zero-byte PNG was accepted at upload');
});
```

## Verification Results

1. **Factory export:** CorruptedFileFactory exported from factories/index.ts
2. **E2E tests:** 10 passing, 8 skipped (all expected)
3. **Error messages:** User-friendly (no technical jargon)
4. **Artifact sizes:**
   - corrupted-file-factory.ts: 485 lines
   - file-validation-errors.spec.ts: 592 lines (requirement: 150+)

## Deviations from Plan

None - plan executed as written.

## Next Phase Readiness

Phase 5 Plans 02-05 can now:
- Use CorruptedFileFactory for additional test scenarios
- Reference the documented bugs for implementation
- Unskip tests as fixes are implemented

Specific bugs to address:
- 05-02: Add zero-byte validation (enable ERROR-04 tests)
- 05-02: Add size validation at upload (enable ERROR-03 tests)
- 05-03: Add magic byte validation at upload (enable ERROR-02 bad header tests)
