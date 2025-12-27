---
phase: 06-performance-bug-fixes
plan: 03
subsystem: validation
tags: [text-validation, json, csv, tsv, yaml, parser, spoofing-detection]

# Dependency graph
requires:
  - phase: 02-validation-library
    provides: file-validation.ts structure and validation patterns
provides:
  - Parser-level validation for text formats without magic bytes
  - validateTextFormat() exported function for JSON/CSV/TSV/YAML
  - Integration into validateFileType() flow
  - 46 unit tests covering validation scenarios
affects: [error-handling, file-upload]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Parser-level validation for text formats"
    - "Switch-case format dispatch pattern"
    - "Column consistency check for tabular data"

key-files:
  created:
    - apps/frontend/tests/unit/validation/text-format-validation.test.ts
  modified:
    - apps/frontend/src/lib/utils/file-validation.ts

key-decisions:
  - "Use JSON.parse for JSON validation - authoritative parser"
  - "CSV/TSV validation via column count consistency"
  - "YAML validates structure patterns, accepts JSON as superset"
  - "Plain text formats (TXT/MD/HTML/XML) only check non-empty"

patterns-established:
  - "Text format validation integrated at null signature point in validateFileType()"
  - "Unit tests in tests/unit/validation/ directory structure"

# Metrics
duration: 4min
completed: 2026-01-25
---

# Phase 06 Plan 03: Text Format Validation Summary

**Parser-level validation for JSON, CSV, TSV, YAML detecting malformed and spoofed files without magic bytes**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-25T02:14:50Z
- **Completed:** 2026-01-25T02:18:45Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Added validateJSON() using JSON.parse for authoritative validation
- Added validateCSV() with quoted field handling and column consistency checks
- Added validateTSV() with column consistency and Windows line ending support
- Added validateYAML() validating structure patterns (key-value, lists)
- Integrated validateTextFormat() into validateFileType() at the null-signature point
- Created 46 unit tests covering all validation scenarios

## Task Commits

Each task was committed atomically:

1. **Task 1: Add parser-level validation for text formats** - `e0f548f` (feat)
2. **Task 1 fix: Handle empty content in CSV/TSV** - `32a2def` (fix)
3. **Task 2: Create unit tests for text format validation** - `341b598` (test)

## Files Created/Modified

- `apps/frontend/src/lib/utils/file-validation.ts` - Added validateJSON, validateCSV, validateTSV, validateYAML, validateTextFormat functions
- `apps/frontend/tests/unit/validation/text-format-validation.test.ts` - 46 unit tests for text format validation

## Decisions Made

1. **JSON.parse for JSON validation** - Authoritative parser catches all syntax errors
2. **Column count consistency for CSV/TSV** - Simple but effective structure validation
3. **Quoted field handling in CSV** - Count commas only outside quoted strings
4. **YAML accepts JSON as superset** - Per YAML specification, valid JSON is valid YAML
5. **Plain text formats check non-empty only** - TXT/MD/HTML/XML have no strict structure

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Empty content handling in CSV/TSV**
- **Found during:** Task 2 (unit test execution)
- **Issue:** `''.trim().split('\n')` returns `['']` not `[]`, bypassing empty check
- **Fix:** Added explicit `trimmed.length === 0` check before split
- **Files modified:** apps/frontend/src/lib/utils/file-validation.ts
- **Verification:** Empty CSV/TSV tests now correctly return false
- **Committed in:** 32a2def

---

**Total deviations:** 1 auto-fixed (bug)
**Impact on plan:** Minor fix for edge case. No scope creep.

## Issues Encountered

None - plan executed with one minor bug fix for empty content edge case.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- BUG-05 (text format spoofing) addressed with parser-level validation
- validateTextFormat() is exported and available for direct use
- Integration point in validateFileType() handles all text formats
- Unit test directory structure established at tests/unit/validation/

---
*Phase: 06-performance-bug-fixes*
*Plan: 03*
*Completed: 2026-01-25*
