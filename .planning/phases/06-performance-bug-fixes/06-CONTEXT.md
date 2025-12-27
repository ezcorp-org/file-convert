# Phase 6: Performance & Bug Fixes - Context

**Gathered:** 2026-01-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish performance baselines for all conversion types, fix known bugs documented in earlier phases, and achieve zero test failures. This phase delivers benchmarking infrastructure, bug fixes with regression tests, and enables all currently-skipped tests where possible.

</domain>

<decisions>
## Implementation Decisions

### Large File Thresholds
- Use scaled-down sizes for faster CI: 10MB images, 25MB audio, 50MB archives
- Memory errors show clear message: "File too large" with suggested max size
- Large file tests are local-only, skip in CI (too slow)

### Progress Indicators
- Continuous progress bar updating as conversion proceeds (not milestone-based)
- Cancelable mid-process with cancel button that stops worker
- Show estimated time remaining ("About 30 seconds remaining")
- Batch conversions show overall batch progress ("3/10 files"), not per-file

### Benchmark Strategy
- Benchmark all conversion formats (30+ conversion paths)
- Store baselines in committed JSON file in repo (baselines.json)
- 50% regression threshold (more lenient than original 20%)
- Use fixed test files for consistent comparison across runs

### Bug Prioritization
- All bugs equal priority - fix in whatever order makes implementation sense
- Unskip all possible tests as part of "zero failures" goal
- Covers: BUG-001 (size limits), BUG-002 (zero-byte), BUG-003 (magic bytes)
- Covers: Worker memory leak, PDF worker timeout, worker crashes

### Claude's Discretion
- Memory limit enforcement approach (document observed vs set explicit caps)
- Test depth per bug (minimal vs thorough edge cases)
- Mixed-batch format selection bug (assess complexity, decide if in-scope)

</decisions>

<specifics>
## Specific Ideas

- Progress bar should feel responsive - continuous updates, not jumpy milestones
- Cancel button should immediately stop work, not just hide the UI
- Baselines.json should be human-readable for easy debugging

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-performance-bug-fixes*
*Context gathered: 2026-01-24*
