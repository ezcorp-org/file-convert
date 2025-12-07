# Phase 1: Test Infrastructure Foundation - Research

**Researched:** 2026-01-23
**Domain:** E2E testing with Playwright, Web Worker lifecycle management, CI/CD infrastructure
**Confidence:** HIGH

## Summary

This research covers the test infrastructure domain for a SvelteKit application with Web Worker-based file conversions. The standard approach in 2026 combines Playwright for E2E testing with Vitest for unit/component testing, using fixtures for reusable test utilities, promise-based patterns for Web Worker lifecycle management, and GitHub Actions for CI/CD with environment parity.

The current codebase already uses Playwright (v1.55.0) with 26+ test files, Comlink for Web Worker RPC communication, and Vitest for unit testing. The existing tests show common anti-patterns including hard waits (`waitForTimeout`), fragile selectors, and missing race condition prevention for downloads and worker initialization.

**Primary recommendation:** Build test infrastructure using Playwright's fixture system for reusable helpers, implement promise-based Web Worker lifecycle patterns with proper cleanup, use web-first assertions instead of hard waits, and establish GitHub Actions CI with browser caching for environment parity.

## Standard Stack

The established libraries/tools for Playwright E2E testing in 2026:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @playwright/test | ^1.55.0 | E2E browser testing framework | Industry standard for E2E, built-in auto-waiting, cross-browser support, parallel execution |
| Vitest | ^3.2.4 | Unit/component testing | Fast, Vite-native, browser mode for Web Worker testing |
| Comlink | ^4.4.2 | Web Worker RPC communication | Google Chrome Labs standard for promise-based worker messaging |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @vitest/web-worker | latest | Web Worker unit testing | Testing worker logic in isolation during unit tests |
| jsdom | ^26.1.0 | DOM simulation for unit tests | Lightweight DOM for non-browser-critical unit tests |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Playwright | Cypress | Cypress has simpler API but Playwright offers better multi-browser support, faster execution, and built-in auto-waiting |
| Vitest | Jest | Jest is more established but Vitest is faster, Vite-native, and has stable browser mode as of v4 |
| Comlink | promise-worker | promise-worker is lighter (1kB) but Comlink offers richer features (callbacks, transferables, finalizers) |

**Installation:**
```bash
# Already installed - verify versions
npm list @playwright/test vitest comlink

# Install Playwright browsers with system dependencies
npx playwright install --with-deps chromium

# For CI - cache browsers to speed up runs
npx playwright install --with-deps
```

## Architecture Patterns

### Recommended Project Structure
```
apps/frontend/
├── tests/
│   ├── fixtures/          # Custom Playwright fixtures
│   │   ├── test-helpers.ts   # Reusable test utilities
│   │   ├── file-fixtures.ts  # File upload/download helpers
│   │   └── worker-fixtures.ts # Web Worker lifecycle helpers
│   ├── e2e/               # End-to-end test suites
│   │   ├── conversion/       # Conversion flow tests
│   │   ├── ui/              # UI interaction tests
│   │   └── mobile/          # Mobile-specific tests
│   ├── utils/             # Test utilities (non-fixtures)
│   │   ├── test-file-generator.ts # Synthetic file creation
│   │   └── assertions.ts     # Custom assertions
│   └── TEST_AUDIT.md      # Audit results and rationale
├── src/
│   └── lib/
│       └── workers/
│           └── __tests__/    # Worker unit tests (Vitest)
└── playwright.config.ts
```

### Pattern 1: Custom Fixtures for Test Helpers
**What:** Use `test.extend()` to create reusable test context and helpers
**When to use:** When multiple tests need the same setup, helpers, or page objects
**Example:**
```typescript
// Source: https://playwright.dev/docs/test-fixtures
import { test as base } from '@playwright/test';

type FileConversionFixtures = {
  uploadHelper: UploadHelper;
  downloadHelper: DownloadHelper;
  workerLifecycle: WorkerLifecycleHelper;
};

export const test = base.extend<FileConversionFixtures>({
  uploadHelper: async ({ page }, use) => {
    const helper = new UploadHelper(page);
    await use(helper);
  },

  downloadHelper: async ({ page }, use) => {
    const helper = new DownloadHelper(page);
    await use(helper);
    // Cleanup downloads after test
    await helper.cleanup();
  },

  workerLifecycle: async ({ page }, use) => {
    const helper = new WorkerLifecycleHelper(page);
    await use(helper);
    // Ensure workers are terminated
    await helper.terminateAll();
  }
});

export { expect } from '@playwright/test';
```

### Pattern 2: Race-Condition-Free Download Handling
**What:** Start waiting for download event before triggering download action
**When to use:** Every file download test to prevent missing the download event
**Example:**
```typescript
// Source: https://playwright.dev/docs/downloads
async function downloadFile(page: Page, triggerSelector: string): Promise<Buffer> {
  // Start waiting BEFORE clicking - no await on initial call
  const downloadPromise = page.waitForEvent('download');

  // Trigger download
  await page.locator(triggerSelector).click();

  // Await completion
  const download = await downloadPromise;

  // Save and read file
  const path = await download.path();
  return fs.readFile(path);
}
```

### Pattern 3: Promise-Based Web Worker Lifecycle Management
**What:** Ensure worker initialization completes before testing and cleanup happens after
**When to use:** Tests that depend on Web Workers being ready
**Example:**
```typescript
// Source: Comlink documentation + Playwright best practices
class WorkerLifecycleHelper {
  private workers: Worker[] = [];

  async waitForWorkerReady(page: Page, workerType: string): Promise<void> {
    // Use Promise.all to prevent race conditions
    await Promise.all([
      // Wait for worker script to load
      page.waitForResponse(resp =>
        resp.url().includes(`${workerType}-worker.js`) && resp.status() === 200
      ),
      // Wait for worker initialization in page context
      page.evaluate((type) => {
        return new Promise((resolve) => {
          const checkWorker = setInterval(() => {
            const manager = (window as any).__workerManager;
            if (manager && manager.workers?.has(type)) {
              clearInterval(checkWorker);
              resolve(true);
            }
          }, 100);

          // Timeout after 5 seconds
          setTimeout(() => {
            clearInterval(checkWorker);
            resolve(false);
          }, 5000);
        });
      }, workerType)
    ]);
  }

  async terminateAll(): Promise<void> {
    // Terminate all tracked workers to prevent memory leaks
    await page.evaluate(() => {
      const manager = (window as any).__workerManager;
      if (manager) {
        manager.terminate();
      }
    });
  }
}
```

### Pattern 4: Web-First Assertions (Not Manual Checks)
**What:** Use auto-retrying assertions instead of `isVisible()` + manual checks
**When to use:** All visibility, text content, and state checks
**Example:**
```typescript
// Source: https://playwright.dev/docs/best-practices
// ❌ BAD - Race condition, no auto-retry
if (await page.locator('.result-item').isVisible()) {
  expect(await page.locator('.result-item').textContent()).toContain('Success');
}

// ✅ GOOD - Auto-retrying, race-condition-free
await expect(page.locator('.result-item')).toBeVisible();
await expect(page.locator('.result-item')).toContainText('Success');
```

### Pattern 5: Dynamic Timeout Configuration
**What:** Adjust timeouts based on file size and operation complexity
**When to use:** File conversion tests where processing time varies significantly
**Example:**
```typescript
// Source: https://playwright.dev/docs/test-timeouts
function calculateTimeout(fileSize: number, complexity: 'simple' | 'medium' | 'complex'): number {
  const baseTimeout = 30000; // 30s default
  const complexityMultiplier = { simple: 1, medium: 2, complex: 4 };

  // Add 1 second per MB for file processing
  const fileSizeTimeout = (fileSize / (1024 * 1024)) * 1000;

  return baseTimeout + (fileSizeTimeout * complexityMultiplier[complexity]);
}

test('convert large PDF to images', async ({ page }, testInfo) => {
  const fileSize = 10 * 1024 * 1024; // 10MB
  const timeout = calculateTimeout(fileSize, 'complex');

  // Extend timeout for this specific test
  testInfo.setTimeout(timeout);

  // Test proceeds with appropriate timeout
});
```

### Anti-Patterns to Avoid

- **Hard waits (waitForTimeout):** Use web-first assertions and waitForSelector instead. Hard waits make tests slower and more flaky.
- **Manual visibility checks:** Don't use `isVisible()` without auto-retrying assertions. Use `await expect().toBeVisible()`.
- **Global variables in tests:** Pass state via fixtures or test arguments to avoid test pollution.
- **Testing without waiting for workers:** Always ensure Web Workers are initialized before triggering conversions.
- **Download event listeners after click:** Start `waitForEvent('download')` BEFORE clicking to avoid race conditions.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Web Worker promise wrapper | Custom postMessage handlers | Comlink | Handles serialization, callbacks, transferables, error propagation, and cleanup automatically |
| File download testing | Manual file system polling | `page.waitForEvent('download')` | Built-in race-condition prevention, proper promise handling, browser download manager integration |
| Test data generation | Random/hardcoded test data | Fixtures with factory pattern | Consistent, reusable, isolated per test, automatic cleanup |
| Worker lifecycle management | Manual terminate() calls | Fixtures with auto-cleanup | Prevents memory leaks, ensures cleanup even on test failure |
| Timeout handling | Fixed setTimeout values | Playwright's built-in timeouts | Auto-retry, configurable per-test, respects action completion |
| Selector strategy | CSS classes, XPath | `getByRole`, `getByLabel`, `getByText` | Resilient to UI changes, matches user perception, better accessibility |

**Key insight:** E2E testing has mature patterns for async operations, file handling, and browser automation. Custom solutions miss edge cases like race conditions, cleanup on failure, and cross-browser differences.

## Common Pitfalls

### Pitfall 1: Missing await Causes Race Conditions
**What goes wrong:** Forgetting `await` on async operations creates race conditions where tests pass/fail unpredictably
**Why it happens:** All Playwright operations are async, but TypeScript doesn't enforce awaiting promises
**How to avoid:**
- Enable ESLint rule `@typescript-eslint/no-floating-promises`
- Use `Promise.all()` when coordinating multiple operations
- Always await fixture methods and page interactions
**Warning signs:** Tests fail intermittently in CI but pass locally, "element not found" errors

### Pitfall 2: Fragile Selectors Break on UI Changes
**What goes wrong:** CSS class selectors like `.btn-primary` break when styling changes
**Why it happens:** Developers choose selectors based on implementation details, not user behavior
**How to avoid:**
- Prioritize role-based selectors: `getByRole('button', { name: 'Convert' })`
- Use `data-testid` attributes only for dynamic content without stable roles
- Run Playwright codegen to see recommended selectors
**Warning signs:** Tests break after CSS refactoring, frequent selector updates in PRs

### Pitfall 3: Hard Waits Create Flaky Tests
**What goes wrong:** `await page.waitForTimeout(2000)` causes tests to fail when operations take 2.1 seconds
**Why it happens:** Developers observe operation taking ~1s locally and add 2s buffer
**How to avoid:**
- Use `waitForSelector`, `waitForLoadState('networkidle')`, or web-first assertions
- For conversions, wait for specific completion indicators: `await expect(page.locator('.complete-section')).toBeVisible()`
- Use dynamic timeouts based on file size/complexity
**Warning signs:** Tests fail in CI with "timeout exceeded", arbitrary timeout values (1000, 2000, 3000ms)

### Pitfall 4: Web Worker Not Ready Before Test
**What goes wrong:** Test triggers conversion before worker initializes, causing "worker not found" errors
**Why it happens:** Worker script loading and Comlink initialization are async
**How to avoid:**
- Create fixture that waits for worker ready state
- Use `page.waitForResponse()` to confirm worker script loaded
- Check worker manager state in page context before proceeding
**Warning signs:** First conversion test fails, subsequent tests pass; "undefined worker" errors

### Pitfall 5: Missing Download Promise Setup Before Click
**What goes wrong:** Download completes before `waitForEvent('download')` is called, causing timeout
**Why it happens:** Download starts immediately on click, listener must be ready
**How to avoid:**
- Call `const downloadPromise = page.waitForEvent('download')` BEFORE clicking
- Don't await the initial call
- Use `Promise.all([downloadPromise, clickAction])` if order is uncertain
**Warning signs:** Download tests timeout despite successful download in browser

### Pitfall 6: Environment Differences Between Local and CI
**What goes wrong:** Tests pass locally but fail in CI with different browser versions, screen sizes, or resources
**Why it happens:** Local dev uses different Node version, browser installation, or system resources than CI
**How to avoid:**
- Use `npx playwright install --with-deps` in CI (installs system dependencies)
- Match Node.js versions: use `node-version: lts/*` in GitHub Actions
- Set consistent viewport: `use: { viewport: { width: 1280, height: 720 } }`
- Reduce workers in CI: `workers: process.env.CI ? 1 : undefined`
**Warning signs:** "System dependencies missing" errors, font rendering differences, CI-only failures

### Pitfall 7: Test Isolation Violations Create Cascading Failures
**What goes wrong:** Tests share state, causing later tests to fail when earlier tests modify global state
**Why it happens:** Tests use same browser context, shared local storage, or don't clean up workers
**How to avoid:**
- Use `beforeEach` to reset state, not just initial setup
- Leverage Playwright's automatic context isolation
- Terminate workers in afterEach or fixture cleanup
- Avoid global variables; use fixtures for shared instances
**Warning signs:** Test order affects pass/fail, "already exists" errors, mystery failures in test suites

## Code Examples

Verified patterns from official sources:

### File Upload with Web-First Assertions
```typescript
// Source: Playwright best practices + existing codebase patterns
async function uploadAndVerify(page: Page, filePath: string, expectedName: string) {
  const fileInput = page.locator('input[type="file"]');

  // Upload file
  await fileInput.setInputFiles(filePath);

  // Use web-first assertions - auto-retry until condition met
  await expect(page.locator('.file-item')).toBeVisible();
  await expect(page.locator('.file-item')).toContainText(expectedName);

  // No need for waitForTimeout - assertions handle waiting
}
```

### Download Handling with Race Condition Prevention
```typescript
// Source: https://playwright.dev/docs/downloads
async function downloadAndValidate(
  page: Page,
  triggerSelector: string,
  expectedExtension: string
): Promise<Buffer> {
  // Start waiting BEFORE click - prevents race condition
  const downloadPromise = page.waitForEvent('download');

  // Trigger download
  await page.locator(triggerSelector).click();

  // Await completion
  const download = await downloadPromise;

  // Validate filename
  const filename = download.suggestedFilename();
  expect(filename).toMatch(new RegExp(`\\.${expectedExtension}$`));

  // Read file content
  const path = await download.path();
  if (!path) throw new Error('Download path not available');

  return fs.promises.readFile(path);
}
```

### Custom Fixture for Worker Lifecycle
```typescript
// Source: https://playwright.dev/docs/test-fixtures + Comlink patterns
import { test as base, Page } from '@playwright/test';

class WorkerManager {
  constructor(private page: Page) {}

  async waitForWorkerReady(workerType: string, timeout = 5000): Promise<void> {
    await Promise.all([
      // Wait for worker script to load
      this.page.waitForResponse(
        resp => resp.url().includes(`${workerType}-worker.js`) && resp.ok(),
        { timeout }
      ),
      // Wait for worker initialization
      this.page.waitForFunction(
        (type) => {
          const manager = (window as any).__workerManager;
          return manager?.workerApis?.has(type);
        },
        workerType,
        { timeout }
      )
    ]);
  }

  async terminateAll(): Promise<void> {
    await this.page.evaluate(() => {
      const manager = (window as any).__workerManager;
      if (manager?.terminate) {
        manager.terminate();
      }
    });
  }
}

type WorkerFixtures = {
  workerManager: WorkerManager;
};

export const test = base.extend<WorkerFixtures>({
  workerManager: async ({ page }, use) => {
    const manager = new WorkerManager(page);
    await use(manager);
    // Auto-cleanup after test
    await manager.terminateAll();
  },
});
```

### Dynamic Timeout Based on File Size
```typescript
// Source: https://playwright.dev/docs/test-timeouts
import { test } from './fixtures';

function getConversionTimeout(fileSizeMB: number, complexity: 'simple' | 'complex'): number {
  const baseTimeout = 30000; // 30s
  const perMBTimeout = 2000; // 2s per MB
  const complexityMultiplier = complexity === 'complex' ? 2 : 1;

  return baseTimeout + (fileSizeMB * perMBTimeout * complexityMultiplier);
}

test('convert large PDF', async ({ page, workerManager }, testInfo) => {
  const fileSizeMB = 15;
  const timeout = getConversionTimeout(fileSizeMB, 'complex');

  // Set timeout for this test
  testInfo.setTimeout(timeout);

  await page.goto('/convert');
  await workerManager.waitForWorkerReady('document');

  // Conversion proceeds with appropriate timeout
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hard waits (waitForTimeout) | Web-first assertions (expect().toBeVisible()) | Playwright v1.20+ (2022) | Eliminates race conditions, tests run faster |
| CSS/XPath selectors | Role-based locators (getByRole) | Playwright v1.27+ (2022) | Tests survive UI refactoring, better accessibility |
| Page Object Model classes | Test fixtures with test.extend() | Playwright v1.10+ (2021) | Automatic setup/teardown, dependency injection, better isolation |
| Manual worker message handling | Comlink RPC wrapper | Stable since 2019 | Cleaner code, automatic serialization, error handling |
| Fixed test timeouts | Dynamic timeouts via testInfo.setTimeout() | Playwright v1.10+ (2021) | Tests adapt to file size/complexity |
| JSDOM for unit tests | Vitest Browser Mode | Vitest v4 (2024) | Real browser APIs including Web Workers |
| Jest | Vitest | 2023-2024 migration trend | Faster, Vite-native, ESM support |

**Deprecated/outdated:**
- `playwright-github-action`: Microsoft recommends using Playwright CLI directly (`npx playwright install --with-deps`)
- Manual `page.on('download')` listeners: Use `page.waitForEvent('download')` for better control flow
- `testInfo.retry()` with manual retry logic: Use Playwright's built-in retry mechanism (configured in playwright.config.ts)

## Open Questions

Things that couldn't be fully resolved:

1. **Existing test audit methodology**
   - What we know: User wants judgment-based evaluation, documentation in TEST_AUDIT.md, removal of flaky/low-value tests
   - What's unclear: Specific criteria for "real user value" vs "low value", threshold for test complexity
   - Recommendation: Create evaluation rubric based on: (1) Does it test critical user journey? (2) Does it duplicate coverage? (3) Is it flaky? (4) Can it be improved or should it be removed?

2. **CI/CD platform final choice**
   - What we know: GitHub Actions is standard for Playwright, ubuntu-latest recommended, Node.js LTS, browser caching
   - What's unclear: Whether to use Vercel's built-in preview deployments or separate E2E environment
   - Recommendation: Start with GitHub Actions + local preview server (existing `webServer` config), can add Vercel preview testing later

3. **Optimal worker count for CI**
   - What we know: GitHub Actions ubuntu-latest has 2 CPU cores, local dev may have more
   - What's unclear: Whether serial execution (workers: 1) or parallel (workers: 2) is better for Web Worker tests
   - Recommendation: Start with `workers: 1` for CI to avoid resource contention with Web Workers, monitor test duration and adjust

4. **Browser coverage strategy**
   - What we know: Current config tests all browsers, but limits Firefox/WebKit to basic tests
   - What's unclear: Whether Web Worker support is consistent enough across browsers to test all conversions
   - Recommendation: Audit Web Worker API compatibility (Comlink works in all modern browsers), run conversion tests on all browsers, use testMatch to limit mobile tests

## Sources

### Primary (HIGH confidence)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices) - Official best practices documentation
- [Playwright CI Setup](https://playwright.dev/docs/ci-intro) - Official CI/CD setup guide
- [Playwright Downloads](https://playwright.dev/docs/downloads) - Official file download handling documentation
- [Playwright Test Fixtures](https://playwright.dev/docs/test-fixtures) - Official fixture pattern documentation
- [Playwright Timeouts](https://playwright.dev/docs/test-timeouts) - Official timeout configuration guide
- [Comlink GitHub](https://github.com/GoogleChromeLabs/comlink) - Official Comlink library documentation

### Secondary (MEDIUM confidence)
- [BrowserStack Playwright Best Practices 2026](https://www.browserstack.com/guide/playwright-best-practices) - Industry best practices guide
- [BrowserStack Playwright Timeout 2026](https://www.browserstack.com/guide/playwright-timeout) - Timeout strategies
- [BrowserStack Fixtures in Playwright 2026](https://www.browserstack.com/guide/fixtures-in-playwright) - Fixture patterns
- [Playwright GitHub Actions Setup](https://autify.com/blog/playwright-github-actions) - GitHub Actions integration guide
- [Better Stack: Avoiding Flaky Tests](https://betterstack.com/community/guides/testing/avoid-flaky-playwright-tests/) - Flaky test prevention
- [DEV Community: Playwright Assertions Race Conditions](https://dev.to/playwright/playwright-assertions-avoid-race-conditions-with-this-simple-fix-dm1) - Race condition patterns
- [Vitest Browser Mode Guide](https://vitest.dev/guide/browser/) - Official Vitest browser mode documentation
- [Vitest vs Playwright BrowserStack](https://www.browserstack.com/guide/vitest-vs-playwright) - Testing strategy comparison
- [Comlink Web Workers LogRocket](https://blog.logrocket.com/comlink-web-workers-match-made-in-heaven/) - Comlink usage patterns

### Tertiary (LOW confidence)
- [Testing in 2026 Full Stack Strategies](https://www.nucamp.co/blog/testing-in-2026-jest-react-testing-library-and-full-stack-testing-strategies) - Industry trends (needs verification)
- [E2E Testing Guide 2026 Leapwork](https://www.leapwork.com/blog/end-to-end-testing) - General E2E guidance (needs project-specific validation)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified in official docs, versions confirmed in package.json
- Architecture: HIGH - Patterns sourced from official Playwright documentation and verified with recent 2025-2026 sources
- Pitfalls: HIGH - Sourced from official best practices, multiple corroborating sources, matches existing codebase issues
- CI/CD: HIGH - Official Playwright CI documentation, GitHub Actions is standard platform
- Web Worker patterns: MEDIUM - Comlink official docs are authoritative, but testing patterns are synthesized from multiple sources

**Research date:** 2026-01-23
**Valid until:** ~2026-03-23 (60 days - testing infrastructure is relatively stable)

---

**Note for planner:** The existing test suite (26+ files) shows significant duplication and anti-patterns. Audit should identify:
1. Tests with hard waits → convert to web-first assertions
2. Tests with fragile selectors → convert to role-based locators
3. Duplicate conversion tests → consolidate into parameterized tests
4. Tests missing worker lifecycle management → add fixtures
5. Tests worth keeping but need enhancement vs complete rewrite

The infrastructure phase should build the foundation (fixtures, helpers, CI) that subsequent phases will use to write proper conversion tests.
