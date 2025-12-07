---
phase: 01-test-infrastructure-foundation
plan: 02
subsystem: testing
tags: [playwright, fixtures, web-workers, e2e-testing, typescript]

# Dependency graph
requires:
  - phase: 01-test-infrastructure-foundation
    provides: Research document identifying fixture patterns needed
provides:
  - Reusable Playwright fixtures for file upload, download, worker lifecycle, and timeouts
  - FileHelper class for buffer and path-based file uploads
  - DownloadHelper with race-condition-free promise-before-click pattern
  - WorkerLifecycle for worker initialization and cleanup
  - Dynamic timeout calculation based on file size and complexity
affects: [all-future-conversion-tests, image-tests, audio-tests, document-tests, worker-tests]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Promise-before-click pattern for downloads (prevents race conditions)"
    - "Playwright test.extend() for custom fixtures"
    - "Automatic fixture cleanup in teardown hooks"
    - "Dynamic timeout calculation: base + (fileSizeMB * perMB * complexity)"

key-files:
  created:
    - apps/frontend/tests/fixtures/index.ts
    - apps/frontend/tests/fixtures/file-helpers.ts
    - apps/frontend/tests/fixtures/download-helpers.ts
    - apps/frontend/tests/fixtures/worker-lifecycle.ts
    - apps/frontend/tests/fixtures/timeout-config.ts
  modified: []

key-decisions:
  - "Use promise-before-click pattern for all downloads to prevent race conditions"
  - "Support both Buffer objects and file paths in FileHelper for flexibility"
  - "Automatic cleanup in fixture teardown (downloads, workers) to prevent leaks"
  - "Dynamic timeouts based on file size (2s/MB) and complexity (1x/2x/4x multipliers)"

patterns-established:
  - "Promise-before-click: const downloadPromise = page.waitForEvent('download'); await click(); const download = await downloadPromise;"
  - "Fixture pattern: All tests import { test, expect } from './fixtures' to get helpers"
  - "Worker cleanup: workerLifecycle.terminateAll() in fixture teardown"
  - "Web-first assertions: Use page.locator().waitFor() instead of waitForTimeout"

# Metrics
duration: 3min
completed: 2026-01-24
---

# Phase 01 Plan 02: Playwright Fixtures Summary

**Reusable Playwright fixtures with race-condition-free downloads, automatic worker cleanup, and dynamic timeouts**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-24T07:32:55Z
- **Completed:** 2026-01-24T07:35:43Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments
- Created comprehensive fixture system all tests can import
- Implemented promise-before-click pattern preventing download race conditions
- Automatic cleanup prevents worker/file leaks between tests
- Dynamic timeout calculation adjusts to file size and conversion complexity

## Task Commits

Each task was committed atomically:

1. **Task 1: Create file and download helper fixtures** - `87515c7` (feat)
2. **Task 2: Create worker lifecycle and timeout fixtures** - `14c79ee` (feat)
3. **Task 3: Create main fixtures index with test.extend** - `92bb0ae` (feat)

## Files Created/Modified

- `apps/frontend/tests/fixtures/index.ts` - Main fixture exports with test.extend()
- `apps/frontend/tests/fixtures/file-helpers.ts` - File upload utilities (buffer/path support)
- `apps/frontend/tests/fixtures/download-helpers.ts` - Download handling with race prevention
- `apps/frontend/tests/fixtures/worker-lifecycle.ts` - Worker initialization and cleanup
- `apps/frontend/tests/fixtures/timeout-config.ts` - Dynamic timeout calculation

## Decisions Made

**1. Promise-before-click pattern for downloads**
- Rationale: Prevents race conditions where download starts before waitForEvent listener is attached
- Pattern: Always call `page.waitForEvent('download')` before clicking download trigger
- Impact: All future tests will use this pattern automatically via DownloadHelper

**2. Support both Buffer and file path inputs**
- Rationale: Tests need flexibility - some use synthetic buffers, others use real files
- Implementation: FileHelper.uploadFile() accepts FileData | string
- Impact: Tests can choose most convenient approach for their needs

**3. Automatic cleanup in fixture teardown**
- Rationale: Tests shouldn't manage cleanup manually (easy to forget)
- Implementation: downloadHelper.cleanup() and workerLifecycle.terminateAll() in fixture hooks
- Impact: No leaked workers or temp files between tests

**4. Dynamic timeout calculation**
- Rationale: Fixed timeouts cause flaky tests (too short) or waste time (too long)
- Formula: base (30s) + (fileSizeMB * 2s * complexityMultiplier)
- Complexity multipliers: simple=1x, medium=2x, complex=4x
- Impact: Tests automatically adjust timeout to file size and operation complexity

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all fixtures implemented successfully on first attempt.

## Next Phase Readiness

**Ready for next phase:**
- All future tests can import { test, expect } from './fixtures'
- fileHelper, downloadHelper, workerLifecycle available as fixtures
- Timeout utilities (calculateTimeout, applyTimeout) ready for use
- Pattern documentation in fixture comments

**No blockers or concerns.**

**Next step:** Create sample tests demonstrating fixture usage (Plan 03)

---
*Phase: 01-test-infrastructure-foundation*
*Completed: 2026-01-24*
