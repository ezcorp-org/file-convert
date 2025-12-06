# Codebase Concerns

**Analysis Date:** 2026-01-23

## Tech Debt

**Incomplete Cancellation Logic:**
- Issue: Cancellation of running conversions is stubbed but not fully implemented
- Files: `src/lib/workers/worker-manager.ts` (line 292)
- Impact: Users cannot stop conversions once started, leading to wasted resources and poor UX on large files
- Fix approach: Implement proper message passing to workers to abort operations mid-conversion, add AbortController support, and clean up resources properly

**Dual Worker Management Systems:**
- Issue: Two separate worker management systems exist - `ConversionManager` in `manager.ts` and `WorkerManager` in `worker-manager.ts` - creating confusion and potential for race conditions
- Files: `src/lib/conversion/manager.ts`, `src/lib/workers/worker-manager.ts`
- Impact: Inconsistent behavior, duplicated code, difficult to maintain single conversion flow
- Fix approach: Consolidate into single worker orchestration system with clear responsibility boundaries

**Audio Decoding in Main Thread:**
- Issue: All non-WAV audio files are decoded in main thread using AudioContext, blocking the UI during heavy audio decoding
- Files: `src/lib/conversion/manager.ts` (lines 659-686)
- Impact: UI freezes on large audio files (MP3, FLAC, OGG), especially on lower-end devices
- Fix approach: Move AudioContext decoding to a dedicated Web Worker or use streaming decoding libraries

**Complex Worker Selection Logic:**
- Issue: Multiple fallback routing paths and special cases scattered across manager.ts (lines 298-328)
- Files: `src/lib/conversion/manager.ts` (lines 298-328), `src/lib/workers/worker-manager.ts` (lines 248-287)
- Impact: Hard to debug why certain conversions use unexpected workers, edge cases not well tested
- Fix approach: Create unified format-to-worker mapping with explicit routing table in config

## Known Bugs

**Worker Message Handler Not Removed on Error:**
- Symptoms: Memory leaks when conversions fail, duplicate messages processed on retry
- Files: `src/lib/conversion/manager.ts` (lines 334-397)
- Trigger: Any conversion error or timeout - message listener remains attached and processes all future messages
- Workaround: Refresh page to reset worker state
- Root cause: Message handler removal only happens on successful completion (line 369/380/387/393), not in catch block

**Message ID Filtering Logic Inconsistent:**
- Symptoms: Messages from other conversions leak to wrong handlers, progress updates appear out of order
- Files: `src/lib/conversion/manager.ts` (lines 340-354)
- Trigger: Running multiple conversions simultaneously with different workers
- Issue: Checks `messageId !== id` but also checks `event.data.id !== id` separately, creating blind spots where messages slip through
- Fix: Single authoritative check at top of handler

**PDF Worker Initialization Retry Loop:**
- Symptoms: PDF conversions fail with "Worker initialization timeout" after 5 seconds
- Files: `src/lib/workers/worker-manager.ts` (lines 47-120)
- Trigger: Heavy load or slow connections where inline PDF worker takes >5 seconds to load
- Workaround: Increase timeout in line 74 from 5000ms
- Issue: No exponential backoff, fixed 500ms delays between retries may be too aggressive

**localStorage Not Cleared on Session:**
- Symptoms: Lifetime conversion count persists across browsers/devices, privacy concern
- Files: `src/lib/conversion/manager.ts` (lines 445-448)
- Impact: Users expect fresh start; count may represent other users if device is shared
- Recommendation: Use sessionStorage instead or add explicit "reset stats" button

## Security Considerations

**Unrestricted File Size Uploads:**
- Risk: Browser will load entire file into memory without validation, potential DoS/crash
- Files: `src/lib/conversion/manager.ts`, `src/routes/convert/+page.svelte`
- Current mitigation: MAX_SIZE limits in config.ts (50-200MB depending on type)
- Recommendations:
  - Validate file size BEFORE reading into memory (check File.size property)
  - Add client-side file size check in FileUploader component
  - Implement streaming validation for archive operations

**File Extension Spoofing:**
- Risk: Files with wrong extensions pass magic number checks, execution of malicious content
- Files: `src/lib/utils/file-validation.ts` (lines 85-136)
- Current mitigation: Magic number validation implemented for most formats
- Gaps:
  - Some formats (CSV, TSV, YAML, JSON) have no magic numbers - rely only on extension/MIME type
  - User can manually craft JSON with script tags that passes validation
- Recommendations: Add parser-level validation for text formats, sanitize content before processing

**AudioContext Decoding Throws on Malformed Audio:**
- Risk: Malformed audio files cause uncaught errors in main thread, UI state corruption
- Files: `src/lib/conversion/manager.ts` (line 672)
- Current mitigation: Try/catch around `decodeAudioData`, finally closes context
- Gap: AudioContext.decodeAudioData doesn't validate format before consuming resources
- Recommendation: Add file format check before attempting decode, limit decode timeout

**Worker Script Loading from CDN:**
- Risk: If comlink CDN goes down, workers fail silently
- Files: `static/workers/base-worker.js` (line 6)
- Current mitigation: importScripts from unpkg.com but no fallback
- Recommendation: Bundle comlink locally, add error handler in worker init

## Performance Bottlenecks

**Large File Memory Bloat:**
- Problem: Entire files loaded into memory via `file.arrayBuffer()` before conversion
- Files: `src/lib/conversion/manager.ts` (line 669), worker files
- Cause: No streaming or chunking for file reading, creates 2-4x memory spike during conversion
- Improvement path:
  - Implement FileChunker for archives and documents (partially exists)
  - Use Streams API for streaming conversions where possible
  - Implement progressive JPEG/WebP encoding in image worker

**No Request Deduplication:**
- Problem: Same file converted twice triggers two separate conversions instead of sharing result
- Files: `src/lib/conversion/manager.ts` (no deduplication check)
- Cause: Each conversion gets unique ID based on timestamp
- Improvement: Cache conversion results by file hash + targetFormat, deduplicate requests

**Memory Monitor Only Checks Heap, Not Total:**
- Problem: Browser heap may be 50% full but system out of memory - no meaningful signal
- Files: `src/lib/converters/optimized-converter.ts` (lines 260-268)
- Impact: Memory monitor false negatives on constrained devices
- Better approach: Use performance.measureUserAgentSpecificMemory() when available, add OS memory API calls

**No Connection Pooling for Workers:**
- Problem: Creating new workers for each conversion type sequentially
- Files: `src/lib/workers/worker-manager.ts` (lines 47-120)
- Impact: 3-5 second delay on first conversion of each type (PDF, image, audio, etc.)
- Fix: Pre-initialize worker pool on app start, keep alive indefinitely

## Fragile Areas

**Message Protocol Between Manager and Workers:**
- Files: `src/lib/conversion/manager.ts` (lines 335-396), worker files
- Why fragile: Three different message formats coexist (Comlink envelope, legacy 'complete', 'error' messages) with overlapping fields
- Safe modification:
  - Add message type validation before switch statement
  - Add comprehensive logging for unexpected message formats
  - Create unified message schema with version field
- Test coverage gaps: Only 2 test files for conversion flow, limited edge case coverage

**Audio Decoding Flow:**
- Files: `src/lib/conversion/manager.ts` (lines 277-296, 659-686)
- Why fragile: Special-case branching for audio, manual WAV file creation with raw binary manipulation
- Safe modification:
  - Add validation of decoded audio buffer before WAV conversion
  - Test with various audio formats and bitrates
  - Add error recovery for partially decoded audio
- Test coverage gaps: No unit tests for audioBufferToWAV method

**Worker Selector Routing:**
- Files: `src/lib/conversion/manager.ts` (lines 298-328), `src/lib/workers/worker-manager.ts` (lines 248-287)
- Why fragile: Multiple fallback paths, format categorization in two places, order-dependent logic
- Safe modification:
  - Use centralized routing table from config
  - Add explicit test case for each format pair
  - Log selected worker path for debugging
- Test coverage: Routing tested indirectly through E2E tests only

## Scaling Limits

**3 Concurrent Conversions Cap:**
- Current capacity: `maxConcurrent = 3` in ConversionManager
- Limit: On modern browsers with plenty of RAM, could safely handle 5-10
- Scaling path: Make configurable per device, use deviceMemory API to auto-tune

**File Size Limits Inconsistent Across Formats:**
- Current: Images 50-100MB, audio 100-200MB, TIFF 100MB, archives not specified
- Issue: No clear criteria for limits, some very conservative
- Recommendation: Base on format complexity and typical browser heap, document rationale

**Worker Pool Not Persistent:**
- Current: Workers created on demand, not terminated
- Gap: 100+ conversions over session would create 100+ worker instances in memory
- Fix: Implement worker pool with max size, reuse workers, LRU eviction

## Dependencies at Risk

**PDF.js (pdfjs-dist@5.4.149):**
- Risk: Large bundle size (2-3MB), slow initial load, breaking changes between versions
- Impact: PDF operations slow down app significantly, version upgrades risky
- Migration plan: Consider pdf-lib for simple PDFs, reserve pdf.js for complex multi-page conversions only

**SheetJS via CDN:**
- Risk: CDN URL hardcoded (`https://cdn.sheetjs.com/xlsx-latest/xlsx-latest.tgz`), version always "latest"
- Impact: Unexpected breaking changes, versioning inconsistency
- Migration: Pin to specific version, fallback to npm package

**Comlink via CDN:**
- Risk: Base worker imports from unpkg.com CDN without fallback
- Impact: Workers fail silently if CDN unreachable, no error logging
- Fix: Bundle comlink locally, add error handler in worker initialization

**Deprecated lamejs Library:**
- Risk: lamejs appears to have no updates since 2016, limited MP3 format support
- Impact: Some MP3 variants may fail to encode, maintenance burden
- Alternative: libmp3lame via WebAssembly or replace with more modern audio codec library

## Missing Critical Features

**Job Persistence Across Sessions:**
- Problem: Incomplete conversions lost if browser closes
- Blocks: Users cannot resume long-running conversions, must restart from scratch
- Recommendation: Use IndexedDB to persist job queue, resume on app restart

**Conversion History/Stats:**
- Problem: Only lifetime count stored in localStorage, no detailed history
- Blocks: Users can't see what they've converted, analytics limited to count
- Recommendation: Store conversion metadata (format pairs, file sizes, duration) in IndexedDB

**User-Configurable Conversion Settings:**
- Problem: Options partially implemented but not exposed to UI
- Files: `src/lib/conversion/config.ts` (ConversionOption interface defined but not used)
- Blocks: No quality control, compression settings, output size preferences
- Recommendation: Build UI for ConversionOptions, pass through to workers

**Error Recovery/Retry:**
- Problem: Failed conversions not retryable without manual re-upload
- Blocks: Transient errors require user action, poor UX
- Recommendation: Implement automatic retry with exponential backoff for transient errors

## Test Coverage Gaps

**Message Handler Error Cases:**
- What's not tested: Error handling paths in conversion manager message handler
- Files: `src/lib/conversion/manager.ts` (lines 461-550)
- Risk: Edge cases in error notification logic not caught, error messages may be wrong
- Priority: High - errors should be clear and actionable

**Worker Initialization Failures:**
- What's not tested: Fallback logic when workers fail to load
- Files: `src/lib/workers/worker-manager.ts` (lines 101-115)
- Risk: PDF fallback worker may not work, users get cryptic error
- Priority: High - affects core functionality

**Memory Pressure Scenarios:**
- What's not tested: Behavior when memory monitor detects critical pressure
- Files: `src/lib/converters/optimized-converter.ts` (lines 245-285)
- Risk: Conversions may fail mysteriously under load, no graceful degradation
- Priority: Medium - affects power users converting large files

**Concurrent Conversion Deadlock:**
- What's not tested: Edge case where all 3 concurrent slots filled, queue stuck
- Files: `src/lib/conversion/manager.ts` (lines 199-231)
- Risk: Queue never processes if pending status never cleared
- Priority: Medium - affects batch operations

**Audio Format Detection Edge Cases:**
- What's not tested: Audio files with wrong MIME types, partially corrupted headers
- Files: `src/lib/utils/file-validation.ts`
- Risk: Valid audio files rejected, invalid files accepted
- Priority: Medium - affects audio conversion reliability

---

*Concerns audit: 2026-01-23*
