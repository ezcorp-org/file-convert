---
phase: 05-error-handling
plan: 02
subsystem: testing
tags: [magic-bytes, file-validation, extension-spoofing, playwright, e2e]

# Dependency graph
requires:
  - phase: 02-validation-library
    provides: MagicByteValidator and file format detection infrastructure
provides:
  - E2E tests for ERROR-05 (extension spoofing detection)
  - Gap documentation for magic byte integration
  - Implementation guidance for FileUploader.svelte modification
affects: [05-error-handling, future-implementation]

# Tech tracking
tech-stack:
  added: []
  patterns: [gap-documentation-in-tests, skip-with-implementation-guidance]

key-files:
  created:
    - apps/frontend/tests/e2e/error-handling/extension-spoofing.spec.ts
  modified: []

key-decisions:
  - "Document spoofing detection gap with implementation guidance in test file header"
  - "Skip 3 detection tests, keep 1 negative case test active"
  - "Use ImageFactory and AudioFactory for spoofed file generation"

patterns-established:
  - "Gap documentation: When feature not implemented, skip tests with detailed implementation steps"
  - "Negative testing: Include test for correct behavior (no false positives)"

# Metrics
duration: 4min
completed: 2026-01-24
---

# Phase 05 Plan 02: Extension Spoofing Detection Tests Summary

**E2E tests for magic byte validation against file extension (ERROR-05) - detection NOT IMPLEMENTED, gap documented with implementation guidance**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-24T23:39:29Z
- **Completed:** 2026-01-24T23:44:00Z
- **Tasks:** 2
- **Files created:** 1

## Accomplishments

- Created E2E test suite for extension spoofing detection (213 lines)
- Verified spoofing detection is NOT implemented (app shows "Files loaded" for spoofed files)
- Documented detailed implementation guidance in test file header
- Confirmed correct files work without false warnings (1 test passing)

## Task Commits

Each task was committed atomically:

1. **Task 1 + 2: Create and document extension spoofing tests** - `05804d2` (test)

## Files Created

- `apps/frontend/tests/e2e/error-handling/extension-spoofing.spec.ts` - E2E tests for ERROR-05 with implementation guidance

## Test Results

| Test | Status | Reason |
|------|--------|--------|
| detects JPEG file with PNG extension | SKIPPED | Detection not implemented |
| detects PNG file with JPEG extension | SKIPPED | Detection not implemented |
| detects WAV file with MP3 extension | SKIPPED | Detection not implemented |
| allows correct file without spoofing warning | PASSED | Negative case works correctly |

## Gap Documentation

The test file header (lines 1-63) contains detailed implementation guidance:

1. **Current state:** App accepts spoofed files without warning
2. **Infrastructure exists:** MagicByteValidator in tests/fixtures/validators/magic-bytes.ts
3. **Missing integration:** FileUploader.svelte doesn't call magic byte validation
4. **Implementation steps:**
   - Copy MagicByteValidator to src/lib/utils/
   - Add validation call in processFiles() function
   - Show warning notification per CONTEXT.md ("warn but allow")
5. **Key files to modify:** FileUploader.svelte, new magic-byte-validator.ts

## Decisions Made

- Skip failing tests with implementation guidance rather than assertions that always fail
- Document gap clearly in test file header for future implementation
- Keep negative test (correct extension) active to ensure no false positives introduced

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - tests ran successfully, gap documented as expected.

## Next Phase Readiness

- Extension spoofing tests ready to unskip when implementation added
- Implementation guidance provided for future work
- Negative test validates no false positives when feature is added

---
*Phase: 05-error-handling*
*Completed: 2026-01-24*
