# Phase 5: Error Handling & Edge Cases - Context

**Gathered:** 2026-01-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Ensure the application handles invalid input gracefully and recovers from worker failures. This phase adds:
- Clear error messages for unsupported/corrupted files
- Magic byte validation to detect spoofed extensions
- Worker crash recovery with automatic retry
- UI feedback for success/failure states

This is about **error handling and resilience**, not adding new conversion features or format support.

</domain>

<decisions>
## Implementation Decisions

### Error message design
- User-friendly messages with technical details on demand (expandable "Show details" section)
- Actionable suggestions only when an obvious fix exists (format mismatch → suggest correct format; corruption → no suggestion)
- Per-file error messages in batch conversions (error shows inline next to the failed file)
- Unsupported format errors list the supported formats the user could convert to

### Corrupted file behavior
- Validation happens at upload (before queuing for conversion) — magic byte check immediately
- Spoofed extensions (e.g., .png file that's actually JPEG): Warn but allow — "This appears to be a JPEG, not PNG. Continue anyway?"
- Truly corrupted files (bad headers, truncated): Reject immediately — never attempt conversion
- Two-level detection: "Definitely corrupted" (reject) vs "Suspicious" (warn and let user decide)

### Worker crash recovery
- Auto-retry with visible notification — "Conversion failed, retrying..."
- Batch continues after crash — mark failed file, spawn new worker, process remaining queue
- 1 retry (2 total attempts) before marking as failed
- Pattern detection: If same worker type crashes 3+ times in session, suggest page refresh

### UI feedback patterns
- Success: Brief animation (checkmark bounce or similar), then settle
- Failure: Error icon on the file row, expandable to show error message inline
- Validation state visible: "Validating..." shown before "Converting..." begins
- Retry indicator: Show "Retrying (attempt 2/2)" during retry

### Claude's Discretion
- Exact animation design for success/failure
- Specific threshold for "suspicious" vs "definitely corrupted" detection
- Retry delay timing
- Exact wording of error messages (following the tone decisions above)

</decisions>

<specifics>
## Specific Ideas

- Error messages should feel helpful, not scary — user made no mistake, the file was just bad
- The expandable technical details are for power users debugging issues, not for everyone
- When suggesting alternatives for unsupported formats, list formats that actually work as output for the given input type

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-error-handling*
*Context gathered: 2026-01-24*
