# Test Suite Audit Report

**Audit Date:** 2026-01-24
**Total Test Files:** 24
**Purpose:** Evaluate existing tests before building new infrastructure to identify what to keep, enhance, or remove

## Executive Summary

| Decision | Count | Percentage |
|----------|-------|------------|
| **KEEP** | 4 | 17% |
| **ENHANCE** | 8 | 33% |
| **REMOVE** | 12 | 50% |

**Key Findings:**
- Heavy duplication across test files (3+ versions of similar conversion tests)
- Pervasive anti-patterns: hard waits, fragile selectors, missing Web Worker lifecycle management
- Many "debug" and "manual" tests that should never have been committed
- Good patterns exist in newer tests (file-conversion-e2e-fixed.spec.ts, multi-file-conversion-e2e.spec.ts)
- Hamburger menu tests are well-written and should be preserved

## Detailed Audit

### File-by-File Analysis

| # | File | Decision | Priority | Rationale |
|---|------|----------|----------|-----------|
| 1 | convert-basic.spec.ts | REMOVE | Low | Debug-only test with no assertions, just console.log outputs and screenshots |
| 2 | convert-dropdown.spec.ts | REMOVE | Low | Exploratory test using page.evaluate anti-pattern, no real assertions |
| 3 | convert-flow.spec.ts | ENHANCE | High | Good coverage of core UI flow (upload, format select, convert, clear), but uses hard waits |
| 4 | convert-functionality-fixed.spec.ts | ENHANCE | High | Similar to convert-functionality but with improvements - consolidate these two |
| 5 | convert-functionality.spec.ts | ENHANCE | High | Good UI tests but duplicate of -fixed version, merge the two |
| 6 | convert-image.spec.ts | REMOVE | Low | Uses page.evaluate anti-pattern to fake file uploads, no real file testing |
| 7 | convert-manual.spec.ts | REMOVE | Low | Manual debugging test, hardcoded localhost URL, uses page.evaluate |
| 8 | convert-page-working.spec.ts | REMOVE | Low | Diagnostic test for debugging server errors, not a real test |
| 9 | convert-page.spec.ts | KEEP | Medium | Clean basic page load and UI structure tests with web-first assertions |
| 10 | convert-render.spec.ts | REMOVE | Low | Hardcoded localhost URL, debugging focused, no meaningful assertions |
| 11 | convert-text-files.spec.ts | ENHANCE | Medium | Good text conversion tests but needs worker lifecycle fixes and timeout improvements |
| 12 | debug-conversion-issue.spec.ts | REMOVE | Low | Debug test referencing non-existent test-worker-fix.html page |
| 13 | debug-file-upload.spec.ts | REMOVE | Low | Pure debugging test with console logging focus, no assertions |
| 14 | error-notifications.spec.ts | ENHANCE | Medium | Good error handling coverage but has hard waits and weak assertions |
| 15 | file-conversion-e2e-fixed.spec.ts | KEEP | **Very High** | Best E2E test file - proper error handling, browser compatibility, skip patterns |
| 16 | file-conversion-e2e-simple.spec.ts | REMOVE | Medium | Redundant with -fixed version, less sophisticated error handling |
| 17 | file-conversion-e2e.spec.ts | REMOVE | High | Massive 512-line test with extensive duplication, superseded by -fixed version |
| 18 | file-conversion-working.spec.ts | REMOVE | Medium | "Working tests" implies others broken, has skip logic - use -fixed instead |
| 19 | file-convert.spec.ts | KEEP | High | Comprehensive UI/UX tests with good assertions and accessibility coverage |
| 20 | format-detection.spec.ts | REMOVE | Low | Debug test using page.evaluate, manual inspection focus |
| 21 | hamburger-fixed.spec.ts | KEEP | High | Excellent mobile nav tests - proper visibility checks, accessibility, multiple viewports |
| 22 | hamburger-simple.spec.ts | REMOVE | Medium | Duplicate of hamburger-fixed with less comprehensive coverage |
| 23 | multi-file-conversion-e2e.spec.ts | ENHANCE | High | Excellent multi-file type testing but needs worker lifecycle management |
| 24 | multi-file-type.spec.ts | ENHANCE | Medium | Good multi-type tests but duplicate coverage with multi-file-conversion-e2e |

---

## Anti-Patterns Catalog

### 1. Hard Waits (`waitForTimeout`)

**Impact:** Tests slower, more flaky in CI
**Examples:**
- `convert-basic.spec.ts:14` - `await page.waitForTimeout(2000)`
- `convert-dropdown.spec.ts:39` - `await page.waitForTimeout(500)`
- `convert-flow.spec.ts:55,92,143` - Multiple 500ms hard waits
- `file-conversion-e2e-fixed.spec.ts:46` - `await page.waitForTimeout(3000)`

**Fix:** Replace with web-first assertions like `await expect(element).toBeVisible()`

### 2. Manual Visibility Checks Without Assertions

**Impact:** Race conditions, tests pass when they shouldn't
**Examples:**
- `convert-dropdown.spec.ts:47` - `const dropdownVisible = await dropdown.isVisible(); console.log(...)`
- `convert-image.spec.ts:48` - `const dropdownVisible = await dropdown.isVisible(); console.log(...)`
- `convert-render.spec.ts:41` - `const pageVisible = await fileConvertPage.isVisible(); console.log(...)`

**Fix:** Use `await expect(element).toBeVisible()` instead of `isVisible()` + console.log

### 3. `page.evaluate()` for File Uploads

**Impact:** Doesn't test real file handling, creates fake File objects
**Examples:**
- `convert-image.spec.ts:12-25` - Creates fake PNG file with `new File([...], ...)`
- `convert-manual.spec.ts:21-34` - Same pattern
- `format-detection.spec.ts:8-23` - Custom event dispatch

**Fix:** Use `setInputFiles()` with proper file buffers

### 4. Fragile CSS Class Selectors

**Impact:** Tests break on UI refactoring
**Examples:**
- `.drop-zone` used everywhere (better: `getByRole('button')` or data-testid)
- `.format-option` instead of semantic selectors
- `.convert-btn.primary` instead of accessible selectors

**Fix:** Prioritize `getByRole()`, `getByLabel()`, or `data-testid` attributes

### 5. Missing Web Worker Lifecycle Management

**Impact:** Race conditions in conversion tests, unreliable results
**Examples:**
- `convert-text-files.spec.ts:60-70` - Clicks convert without ensuring worker ready
- `file-conversion-e2e.spec.ts:174-206` - No worker ready check before conversion
- `multi-file-conversion-e2e.spec.ts:114-117` - Starts conversion without worker verification

**Fix:** Add fixture for worker lifecycle management (see RESEARCH.md Pattern 3)

### 6. Hardcoded URLs

**Impact:** Tests fail outside localhost, not portable
**Examples:**
- `convert-manual.spec.ts:6` - `await page.goto('http://localhost:5173/convert')`
- `convert-render.spec.ts:14` - `await page.goto('http://localhost:5173/convert')`

**Fix:** Use relative URLs: `await page.goto('/convert')`

### 7. Console.log Instead of Assertions

**Impact:** Tests don't fail when they should, just log
**Examples:**
- `convert-basic.spec.ts:18-26` - All console.log, zero expect calls
- `convert-dropdown.spec.ts:18,23,48,etc` - Excessive logging instead of assertions
- `debug-file-upload.spec.ts` - Entire file is logging

**Fix:** Add proper `expect()` assertions, remove console.log

---

## Good Patterns to Preserve

### 1. Web-First Assertions
**From:** `convert-flow.spec.ts`, `file-convert.spec.ts`
```typescript
await expect(page.locator('.file-item')).toHaveCount(1);
await expect(page.locator('.configure-section h3')).toContainText('Output Format');
```

### 2. Proper File Buffers
**From:** `file-conversion-e2e-fixed.spec.ts`, `convert-functionality-fixed.spec.ts`
```typescript
const pngBuffer = Buffer.from([
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
  // ... proper PNG structure
]);
await fileInput.setInputFiles({
  name: 'test.png',
  mimeType: 'image/png',
  buffer: pngBuffer
});
```

### 3. Skip Patterns for Graceful Degradation
**From:** `file-conversion-e2e-fixed.spec.ts`
```typescript
if (!uploaded) {
  test.skip(true, 'Cannot test conversion - file upload failed');
  return;
}
```

### 4. Browser Compatibility Checks
**From:** `file-conversion-e2e-fixed.spec.ts:10`
```typescript
/**
 * This is the corrected version that addresses all the timeout and compatibility issues:
 * 1. Uses actual test assets instead of temporary files
 * 2. Handles browser compatibility differences (WebKit/Safari vs Chromium)
 */
```

### 5. Accessibility Testing
**From:** `file-convert.spec.ts`, `hamburger-fixed.spec.ts`
```typescript
await expect(dropZone).toHaveAttribute('role', 'button');
await expect(dropZone).toHaveAttribute('tabindex', '0');
await expect(menuButton).toHaveAttribute('aria-expanded', 'true');
```

### 6. Mobile Responsive Testing
**From:** `hamburger-fixed.spec.ts`
```typescript
test.use({ viewport: { width: 375, height: 667 } });
```

---

## Recommended Actions

### Phase 1: Immediate Removals (12 files)
Remove debug/manual/duplicate tests that provide no value:
1. `convert-basic.spec.ts` - Debug only
2. `convert-dropdown.spec.ts` - Exploratory
3. `convert-image.spec.ts` - page.evaluate anti-pattern
4. `convert-manual.spec.ts` - Manual debugging
5. `convert-page-working.spec.ts` - Diagnostic
6. `convert-render.spec.ts` - Debug with hardcoded URL
7. `debug-conversion-issue.spec.ts` - Debug test
8. `debug-file-upload.spec.ts` - Debug logging
9. `file-conversion-e2e-simple.spec.ts` - Superseded by -fixed
10. `file-conversion-e2e.spec.ts` - Massive duplication, superseded
11. `file-conversion-working.spec.ts` - Superseded by -fixed
12. `format-detection.spec.ts` - Debug test
13. `hamburger-simple.spec.ts` - Superseded by -fixed

### Phase 2: Keep As-Is (4 files)
These tests are well-written and valuable:
1. **`file-conversion-e2e-fixed.spec.ts`** - Best practice reference
2. **`file-convert.spec.ts`** - Comprehensive UI/UX coverage
3. **`convert-page.spec.ts`** - Clean page load tests
4. **`hamburger-fixed.spec.ts`** - Excellent mobile nav testing

### Phase 3: Enhance Before Migration (8 files)
Fix anti-patterns then integrate into new fixture system:

**High Priority:**
1. **`convert-flow.spec.ts`** + **`convert-functionality.spec.ts`** + **`convert-functionality-fixed.spec.ts`**
   - Merge these three into single comprehensive UI flow test
   - Remove hard waits, add worker lifecycle checks
   - Use web-first assertions throughout

2. **`multi-file-conversion-e2e.spec.ts`**
   - Excellent coverage of multi-file type scenarios
   - Add worker lifecycle management
   - Remove hard waits (lines 44, 98, 128, 173, 204, 230, 262, 283, 296, 320)

**Medium Priority:**
3. **`convert-text-files.spec.ts`**
   - Good text format conversion coverage
   - Add worker ready checks before conversion
   - Reduce hard waits (lines 26, 53, 93, 168)

4. **`error-notifications.spec.ts`**
   - Good error handling coverage
   - Remove hard waits (lines 25, 50, 61, 98, 125)
   - Strengthen assertions (lines 76, 106)

5. **`multi-file-type.spec.ts`**
   - Good but overlaps with multi-file-conversion-e2e
   - Consider merging or keeping as focused unit tests

---

## Statistics

### Test Complexity Distribution
| Lines of Code | Files | Percentage |
|---------------|-------|------------|
| 0-100 | 12 | 50% |
| 101-200 | 6 | 25% |
| 201-300 | 3 | 12.5% |
| 301-500 | 2 | 8.3% |
| 500+ | 1 | 4.2% |

**Longest test:** `file-conversion-e2e.spec.ts` (512 lines) - flagged for removal

### Anti-Pattern Frequency
| Pattern | Occurrences | Files Affected |
|---------|-------------|----------------|
| Hard waits (waitForTimeout) | 47+ | 18 files |
| Manual visibility checks | 28+ | 11 files |
| Console.log instead of expect | 35+ | 13 files |
| page.evaluate for file upload | 5 | 3 files |
| Hardcoded localhost URLs | 3 | 3 files |
| Missing worker lifecycle | 15+ | 8 files |

---

## Migration Strategy

### Step 1: Clean Up (Remove 12 files)
Delete all debug, manual, and superseded test files. This reduces noise and focuses effort on valuable tests.

### Step 2: Build Fixtures
Using patterns from `file-conversion-e2e-fixed.spec.ts`, create:
- `test-helpers.ts` - Reusable upload/convert/download helpers
- `file-fixtures.ts` - Test file generators with proper buffers
- `worker-fixtures.ts` - Web Worker lifecycle management

### Step 3: Migrate KEEP Files
Move 4 "KEEP" files to new structure with minimal changes:
- Update imports to use new fixtures
- Add worker lifecycle where needed
- Verify in CI

### Step 4: Enhance & Migrate
For each ENHANCE file:
1. Remove anti-patterns (hard waits, fragile selectors)
2. Add worker lifecycle management
3. Convert to use new fixtures
4. Add missing assertions
5. Test in CI

### Step 5: Fill Gaps
After migration, audit coverage and add tests for:
- Real file conversion paths (all format pairs)
- Download validation with file content checks
- Worker error handling
- CI environment compatibility

---

## Success Criteria

**Audit is complete when:**
- ✅ All 24 files have documented decisions
- ✅ Anti-patterns catalogued with examples
- ✅ Good patterns identified for preservation
- ✅ Migration strategy defined
- ✅ Priority ratings assigned

**Tests are ready for infrastructure work when:**
- [ ] 12 files removed (debug/manual/duplicate)
- [ ] 4 files kept as reference examples
- [ ] 8 files enhanced with anti-patterns fixed
- [ ] New fixture system built based on good patterns
- [ ] All tests passing in CI with new infrastructure

---

## Appendix: Test File Categories

### Debug/Manual Tests (Never Should Have Been Committed)
- convert-basic.spec.ts
- convert-dropdown.spec.ts
- convert-image.spec.ts
- convert-manual.spec.ts
- convert-page-working.spec.ts
- convert-render.spec.ts
- debug-conversion-issue.spec.ts
- debug-file-upload.spec.ts
- format-detection.spec.ts

### Duplicate Coverage
- convert-functionality.spec.ts vs convert-functionality-fixed.spec.ts
- file-conversion-e2e.spec.ts vs file-conversion-e2e-fixed.spec.ts vs file-conversion-e2e-simple.spec.ts vs file-conversion-working.spec.ts
- hamburger-fixed.spec.ts vs hamburger-simple.spec.ts
- multi-file-conversion-e2e.spec.ts vs multi-file-type.spec.ts

### High-Quality Tests (Keep/Enhance)
- file-conversion-e2e-fixed.spec.ts ⭐ **Best practice reference**
- file-convert.spec.ts ⭐ **Comprehensive UI coverage**
- hamburger-fixed.spec.ts ⭐ **Mobile nav excellence**
- multi-file-conversion-e2e.spec.ts (needs enhancement)
- convert-flow.spec.ts (needs enhancement)
- convert-page.spec.ts

---

**Audit completed:** 2026-01-24
**Next step:** Build test infrastructure fixtures based on patterns from `file-conversion-e2e-fixed.spec.ts`
