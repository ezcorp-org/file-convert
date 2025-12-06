# Pitfalls Research: E2E Testing for File Conversion Apps

**Domain:** E2E testing and file validation for multi-format file conversion applications
**Researched:** 2026-01-23
**Confidence:** MEDIUM

Research focused on common testing mistakes in file conversion apps with Web Worker architecture, particularly false positives, false negatives, flaky tests, and inadequate validation patterns.

## Critical Pitfalls

### Pitfall 1: File Existence Validation Without Content Validation

**What goes wrong:**
Tests verify that a converted file exists and has non-zero size, but don't validate the file's actual integrity or format correctness. This creates false positives where tests pass but conversions produce corrupted or malformed output files.

**Why it happens:**
Binary file validation is complex and time-consuming to implement. Developers often start with basic checks (file exists, size > 0 bytes) and never upgrade to proper content validation. The test passes quickly, giving false confidence.

**How to avoid:**
Implement multi-layer validation:
1. File metadata (exists, size, MIME type)
2. Format-specific magic bytes/header validation
3. Structural integrity (can the file be parsed by the format's library?)
4. Content preservation (compare extracted content/metadata with source)
5. Visual/functional validation for media files

**Warning signs:**
- Tests pass but users report corrupted downloads
- Conversion succeeds but files won't open in target applications
- File size is correct but content is garbled
- Tests run very fast (<100ms for complex conversions)

**Phase to address:**
Phase 1 (Test Infrastructure) — Build validation helpers before writing tests. Each format needs a dedicated validator that checks structure, not just existence.

**Sources:**
- [Using Python to find corrupted images](https://opensource.com/article/17/2/python-tricks-artists)
- [Best way to check whether an image is corrupted?](https://github.com/libvips/ruby-vips/issues/166)

---

### Pitfall 2: Testing Only Happy Path Formats

**What goes wrong:**
Tests cover standard, well-formed input files but fail to catch bugs with edge cases like truncated files, unusual metadata, large files, or files with uncommon format variations. Production failures occur with real-world "messy" files.

**Why it happens:**
Creating edge case test fixtures requires domain knowledge and effort. Teams use sample files from the internet or generate simple fixtures, missing the diversity of real-world files. Edge case files that break conversions are discovered in production, not tests.

**How to avoid:**
Build a comprehensive test fixture library:
- Standard valid files (baseline)
- Maximum size files (test memory limits)
- Minimum size files (1x1 pixel images, empty documents)
- Corrupted files (truncated, invalid headers, partial data)
- Files with complex metadata (EXIF, tags, embedded fonts)
- Files with unusual characteristics (grayscale, CMYK, high bit-depth)
- Real-world samples from user uploads (anonymized)

**Warning signs:**
- Test suite has 1-2 fixtures per format
- All test files are <1MB and "clean"
- Bug reports include files that fail but your tests pass
- No intentionally corrupted files in test suite

**Phase to address:**
Phase 2 (Validation Library) — Create fixture generators and edge case collections before implementing comprehensive tests. Use tools like [imagecorruptions](https://github.com/bethgelab/imagecorruptions) for intentional corruption testing.

**Sources:**
- [Corrupt A File Online - About](https://corrupt-a-file.com/about/)
- [GitHub - bethgelab/imagecorruptions](https://github.com/bethgelab/imagecorruptions)
- [PDF Extraction APIs for Production (Jan 2026)](https://www.extend.ai/resources/pdf-extraction-apis-production-workloads)

---

### Pitfall 3: Race Conditions in Web Worker Message Handlers

**What goes wrong:**
Tests interact with Web Workers through message passing (postMessage/onmessage). If tests don't properly await worker initialization or handle asynchronous message responses, they produce flaky failures where the same test passes sometimes and fails other times.

**Why it happens:**
Web Workers are asynchronous by nature. Tests that don't properly wait for worker readiness or message responses will have timing-dependent behavior. The worker might not be fully initialized, or a response message might arrive after the test assertion runs.

**How to avoid:**
1. Implement worker lifecycle management with explicit ready states
2. Use promise-based wrappers around worker message handlers
3. Add timeout protection (fail-fast if worker doesn't respond)
4. Ensure workers send explicit "ready" messages after initialization
5. Test worker pool management (acquire/release/cleanup)

**Warning signs:**
- Tests fail intermittently in CI but pass locally
- Test failures mention timeouts or null responses
- Tests fail more often under load (parallel test runs)
- Adding `await new Promise(r => setTimeout(r, 100))` "fixes" tests

**Phase to address:**
Phase 1 (Test Infrastructure) — Build worker test harness with proper lifecycle management before testing individual conversions. The harness must handle initialization, message queueing, and cleanup.

**Sources:**
- [Web Workers: Race-Condition setting onmessage handler?](https://lists.whatwg.org/pipermail/help-whatwg.org/2010-August/003219.html)
- [Using Web Workers - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers)
- [Exploring The Potential Of Web Workers For Multithreading](https://www.smashingmagazine.com/2023/04/potential-web-workers-multithreading-web/)

---

### Pitfall 4: Playwright File Download Timing Issues

**What goes wrong:**
Tests trigger file downloads but complete before downloads finish, leading to false negatives (test fails when conversion succeeded) or missing the actual download validation entirely. Downloaded files are deleted when the browser context closes.

**Why it happens:**
File downloads in Playwright are asynchronous operations. Without proper awaiting of the download promise, the test control flow continues and may close the browser context before the download completes. The download API changed in recent Playwright versions, catching teams off guard.

**How to avoid:**
```typescript
// Correct: Wait for download promise
const downloadPromise = page.waitForEvent('download');
await page.click('button.download');
const download = await downloadPromise;
const path = await download.path();
// Validate file at path

// Incorrect: Test completes before download
await page.click('button.download');
// ❌ No waiting, context closes, file deleted
```

**Warning signs:**
- Tests pass but downloaded files aren't validated
- "File not found" errors in download validation code
- Tests fail with "context closed" messages
- Download directory is empty after test runs

**Phase to address:**
Phase 1 (Test Infrastructure) — Build Playwright download helpers with proper promise handling before writing conversion tests.

**Sources:**
- [Downloads | Playwright](https://playwright.dev/docs/downloads)
- [File Uploads and Downloads Using Playwright (Guide)](https://nareshit.com/blogs/file-uploads-and-downloads-using-playwright)
- [How to Upload Files with Playwright | BrowserStack](https://www.browserstack.com/guide/playwright-upload-file)

---

### Pitfall 5: Missing Metadata Preservation Validation

**What goes wrong:**
Tests verify that file format conversion succeeds (PNG → JPEG) but don't validate that important metadata (EXIF data, color profiles, timestamps, author info) is preserved. Users lose critical metadata in "successful" conversions.

**Why it happens:**
Metadata preservation is a secondary concern during initial implementation. Tests focus on visible content (can you see the image?) not invisible metadata. Different formats have different metadata standards (EXIF, XMP, IPTC), making comprehensive validation complex.

**How to avoid:**
For each format, identify critical metadata fields:
- Images: EXIF data, color profiles, orientation, DPI
- Audio: Artist, album, duration, sample rate, bit depth
- Video: Codec info, frame rate, resolution, subtitles
- Documents: Author, creation date, page count, fonts
- Archives: File permissions, timestamps, compression ratios

Create metadata comparison tests that verify preservation across conversions.

**Warning signs:**
- User complaints about lost metadata despite successful conversions
- No tests that read metadata from converted files
- Test suite only validates visual/structural output
- Documentation doesn't mention metadata preservation guarantees

**Phase to address:**
Phase 2 (Validation Library) — Build format-specific metadata extractors and comparison utilities. Phase 3+ should test metadata preservation for each conversion path.

**Sources:**
- [Audio and Video Metadata Guidelines Working Group | NISO](https://www.niso.org/standards-committees/video-audio-metadata-guidelines)
- [AES Standard AES57-2011: Audio object structures for preservation](https://www.aes.org/publications/standards/search.cfm?docID=84)
- [10 Best Video Metadata Editor You Must Know in 2026](https://videoconverter.wondershare.com/edit-video/video-metadata-editor.html)

---

### Pitfall 6: WASM Memory Limits Not Tested

**What goes wrong:**
Tests use small files that succeed, but larger files fail in production due to WASM memory limits or browser memory constraints. Conversions crash or hang with out-of-memory errors that never appeared in tests.

**Why it happens:**
WASM has a default memory limit (typically 2GB), and browsers impose additional constraints. Small test fixtures fit comfortably in memory, giving false confidence. Large file processing requires streaming or chunking strategies that aren't exercised by small-file tests.

**How to avoid:**
1. Test with files across the full size spectrum (1KB to 100MB+)
2. Monitor WASM memory usage during tests
3. Test memory cleanup after conversions (memory leaks)
4. Test parallel conversions (multiple workers competing for memory)
5. Implement and test streaming/chunking for large files
6. Test graceful degradation when memory limit reached

**Warning signs:**
- All test files are <10MB
- No memory monitoring in tests
- Production crashes with "out of memory" but tests pass
- Tests don't cover multiple concurrent conversions
- No cleanup verification (memory released after conversion)

**Phase to address:**
Phase 3 (Large File Handling) — After basic conversions work, explicitly test memory constraints and large file scenarios.

**Sources:**
- [Best Practices for Testing WebAssembly Applications](https://blog.pixelfreestudio.com/best-practices-for-testing-webassembly-applications/)
- [Mastering Headless Browser Automation](https://www.browserless.io/blog/what-is-a-headless-browser-key-features-benefits-and-uses-explained)

---

### Pitfall 7: CI Environment Differs from Test Environment

**What goes wrong:**
Tests pass locally but fail in CI, or vice versa. Differences in browser versions, WASM support, available codecs, file system behavior, or memory limits cause environment-dependent failures.

**Why it happens:**
Headless browsers in CI may have different capabilities (codec support, font availability). CI runners have memory/CPU limits that don't match local machines. File paths differ between Windows/Linux/macOS. Teams don't explicitly test in CI-like conditions locally.

**How to avoid:**
1. Use containerized test environments matching CI exactly
2. Document and test browser version requirements
3. Test with headless browsers locally, not just headed
4. Use absolute paths or cross-platform path helpers
5. Mock or bundle fonts, codecs, and other system dependencies
6. Monitor CI resource usage (memory, CPU, disk I/O)
7. Add CI-specific timeouts for slower environments

**Warning signs:**
- "Works on my machine" but fails in CI
- Tests timeout in CI but not locally
- Font rendering or codec errors in CI only
- File path errors specific to CI platform
- Random test failures in CI that aren't reproducible locally

**Phase to address:**
Phase 1 (Test Infrastructure) — Configure CI pipeline and ensure local/CI parity from the start. All subsequent phases inherit this consistency.

**Sources:**
- [Testing in Headless Browsers - wasm-bindgen Guide](https://rustwasm.github.io/docs/wasm-bindgen/wasm-bindgen-test/browsers.html)
- [15 Best Practices for Playwright testing in 2026 | BrowserStack](https://www.browserstack.com/guide/playwright-best-practices)
- [CI testing large file uploads GitHub Actions memory 2026](https://devops-geek.net/devops-lab/github-actions-pricing-changes-2026-what-devops-geeks-need-to-know/)

---

### Pitfall 8: Binary Comparison Instead of Semantic Comparison

**What goes wrong:**
Tests compare converted files byte-for-byte with expected output, but non-deterministic metadata (timestamps, compression randomness) causes false negatives. The conversion is semantically correct but binary-different.

**Why it happens:**
Byte-for-byte comparison is simple to implement and seems rigorous. However, many formats include timestamps, random compression seeds, or tool-specific metadata that changes on every conversion. Binary comparison fails even when the conversion is functionally correct.

**How to avoid:**
Use semantic comparison strategies:
- Images: Perceptual hashing (pHash), SSIM, pixel-level comparison with tolerance
- Audio: Waveform comparison, spectral analysis, metadata-stripped comparison
- Documents: Content extraction and text comparison, visual rendering comparison
- Archives: File list and content comparison, ignore compression metadata
- For deterministic formats: Normalize metadata before binary comparison

**Warning signs:**
- Tests fail randomly despite identical inputs
- Changing test run time causes failures
- Regenerating "expected" files makes tests pass
- Test failures mention timestamp or metadata mismatches
- Comments in code about "brittle" comparisons

**Phase to address:**
Phase 2 (Validation Library) — Build semantic comparison utilities per format. Don't rely on binary diff for non-deterministic formats.

**Sources:**
- [Snapshot Testing with Playwright in 2026 | BrowserStack](https://www.browserstack.com/guide/playwright-snapshot-testing)
- [Visual comparisons | Playwright](https://playwright.dev/docs/test-snapshots)
- [Playwright Test image comparisons and validation – Part 2](https://www.edgewordstraining.co.uk/2024/07/19/playwright-test-image-comparisons-and-validation-part-2/)

---

### Pitfall 9: No Format-Specific Error Testing

**What goes wrong:**
Tests verify successful conversions but don't test expected failure modes (unsupported formats, corrupt input, resource exhaustion). When these scenarios occur in production, the app crashes or hangs instead of failing gracefully.

**Why it happens:**
Happy path testing is easier and more satisfying. Error paths require understanding failure modes and creating fixtures that trigger them. Teams assume error handling "just works" without explicit validation.

**How to avoid:**
Test failure scenarios explicitly:
- Unsupported format combinations (PDF → MP3 should fail gracefully)
- Corrupted input files (truncated, invalid headers)
- Resource exhaustion (file too large, memory exceeded)
- Worker crashes and recovery
- Timeout handling for slow conversions
- Invalid configuration (impossible output settings)

Verify error responses include:
- Clear error messages (not generic "conversion failed")
- Error codes or types for programmatic handling
- No memory leaks after errors
- Proper cleanup of temporary files/workers

**Warning signs:**
- Test suite only has success cases
- No tests with intentionally corrupted files
- No tests for unsupported conversion paths
- Generic "something went wrong" errors in production
- Memory/worker leaks after conversion failures

**Phase to address:**
Phase 4 (Error Handling) — After core conversions work, systematically test error paths and edge cases.

**Sources:**
- [Data Conversion Mistakes and Solutions](https://www.damcogroup.com/blogs/top-7-data-conversion-mistakes-and-solution-to-avoid-them)
- [How to avoid False Positives and False Negatives in Testing? | BrowserStack](https://www.browserstack.com/guide/false-positives-and-false-negatives-in-testing)

---

### Pitfall 10: Inadequate Timeout Configuration

**What goes wrong:**
Tests use fixed timeouts that are too short (causing false negatives on slow machines) or too long (causing slow CI runs and hiding actual hangs). Different conversion types need different timeout strategies.

**Why it happens:**
Developers pick arbitrary timeout values (30 seconds, 60 seconds) without measuring actual conversion times. Timeouts aren't adjusted based on file size, complexity, or conversion type. CI environments are slower than local machines.

**How to avoid:**
Implement dynamic timeout strategies:
- Base timeout on file size (e.g., 10s + 1s per MB)
- Different timeouts per format/complexity (PDF → DOCX slower than PNG → JPEG)
- Measure P95 conversion times and set timeouts at P99
- Separate timeouts for worker initialization vs. conversion
- Timeout multipliers for CI environments (2x local timeout)
- Progress tracking to distinguish "slow" from "hung"

**Warning signs:**
- Hardcoded timeouts like `timeout: 30000` everywhere
- Tests fail with "timeout exceeded" despite successful conversions
- No differentiation between fast formats (image) and slow formats (video)
- Tests that take 80% of timeout in CI
- No timeout adjustment based on file size

**Phase to address:**
Phase 1 (Test Infrastructure) — Establish baseline timeout patterns during infrastructure setup. Phase 3+ should refine based on actual performance data.

**Sources:**
- [Flaky Tests in 2026: Key Causes, Fixes, and Prevention](https://www.accelq.com/blog/flaky-tests/)
- [Why E2E Test Suites Fail—And How to Avoid Breakdowns](https://prodperfect.com/blog/end-to-end-testing/why-test-suites-fail-and-how-to-avoid-breakdowns/)

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Testing only file existence, not content | Tests run fast, easy to implement | False positives, corrupted files in production | Never acceptable for production |
| Using same small test files for all scenarios | Quick to set up, tests are fast | Misses edge cases, production failures | Only during initial spike/prototype |
| Skipping metadata validation | Simpler test code, faster tests | Users lose important data (EXIF, tags) | Only for formats where metadata is truly optional |
| Binary file comparison without normalization | Simple equality check | Flaky tests from non-deterministic output | Never for formats with timestamps/metadata |
| Fixed 30-second timeout for all conversions | Easy to configure | False negatives on large files, slow CI | Never — always use dynamic timeouts |
| Testing only in headed browser locally | Easier to debug, see what's happening | CI failures, environment inconsistencies | Early development only — switch to headless ASAP |
| Manual test file upload in E2E tests | Mimics user behavior exactly | Slow tests, hard to automate fixtures | Never — use programmatic file input |

---

## Integration Gotchas

Common mistakes when connecting to external services and tools.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| FFmpeg.wasm | Assuming sample rates are preserved automatically | Explicitly verify and configure `-ar` flag for audio conversions |
| Playwright downloads | Not awaiting download promise, context closes too early | Use `page.waitForEvent('download')` and await before validation |
| Web Workers | Setting onmessage handler without checking ready state | Implement explicit worker initialization protocol with ready events |
| WASM modules | Loading synchronously in tests, causing race conditions | Ensure WASM modules fully initialize before test assertions |
| GitHub Actions cache | Hitting 10GB cache limit with large test fixtures | Use cache key strategies to rotate old fixtures, compress where possible |
| Magic byte validation | Using file extension instead of actual header bytes | Read first N bytes and validate against format spec (magic numbers) |
| Binary diff tools | Expecting identical output from non-deterministic encoders | Strip metadata/timestamps before comparison or use perceptual hashing |

---

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Loading entire file into memory before conversion | Works fine with test files <10MB | Implement streaming/chunking for large files | Files >50MB in WASM context |
| Running all tests serially | Tests are predictable and stable | Parallelize with proper worker pool management | Test suite >100 tests |
| Keeping converted files in browser memory | Fast download access during test | Clean up Blob URLs and file handles immediately | Parallel tests or >10 conversions |
| No memory leak testing | Tests pass in isolation | Add memory profiling and cleanup verification | Long-running test suites |
| Using unbounded worker pools | Unlimited parallelism seems fast | Limit concurrent workers to CPU count × 2 | >20 simultaneous conversions |
| Storing test fixtures in git without LFS | Easy to check out and run | Use Git LFS for binary files >1MB | Test fixtures >100MB total |
| Running full E2E suite on every commit | Complete coverage, high confidence | Split into smoke tests (every commit) and full suite (PR/nightly) | Suite >10 minutes |

---

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Trusting file extensions instead of magic bytes | Malicious files masquerading as safe formats | Validate file headers (magic bytes) before processing |
| Not validating WASM module integrity | Compromised WASM could execute malicious code | Use Subresource Integrity (SRI) hashes for WASM files |
| Processing files without size limits | DoS through memory exhaustion | Enforce maximum file size before conversion starts |
| Exposing file contents in error messages | Information leakage through stack traces | Sanitize errors to remove file content/paths |
| Allowing unlimited conversion queue | Resource exhaustion attack | Rate limit conversions per user/session |
| Not sanitizing filenames in downloads | Path traversal or script injection | Validate and sanitize all user-provided filenames |
| Using client-side only validation | Bypassed by malicious users | While app is client-side, validate file integrity before processing |

---

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No progress indication for long conversions | Users think app is frozen | Emit progress events from workers, show percentage/spinner |
| Generic "conversion failed" errors | Users don't know what went wrong or how to fix | Specific error messages: "Unsupported codec", "File corrupted", "File too large" |
| Allowing unsupported conversion pairs | Users try impossible conversions, get confused | Disable or hide unsupported format combinations in UI |
| Converting in main thread | UI freezes during conversion | Always use Web Workers for conversions |
| No preview before download | Users download garbage, try again, waste time | Show preview or validation result before download |
| Losing work on page refresh | Users re-upload large files, start over | Persist conversion jobs in IndexedDB or localStorage |
| No batch conversion support | Users convert files one-by-one tediously | Support drag-and-drop multiple files, queue conversions |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **File validation:** Often missing structural integrity checks — verify format-specific parsers can read output, not just file exists
- [ ] **Error handling:** Often missing cleanup after errors — verify workers are terminated and memory released on failure
- [ ] **Metadata preservation:** Often missing cross-format metadata mapping — verify EXIF/tags/properties survive conversion
- [ ] **Large file support:** Often missing memory limits and streaming — verify files >50MB don't crash or timeout
- [ ] **Concurrent conversions:** Often missing worker pool limits — verify 10+ simultaneous conversions don't exhaust resources
- [ ] **Browser compatibility:** Often missing Safari/Firefox testing — verify works in all target browsers, not just Chrome
- [ ] **CI configuration:** Often missing headless browser setup — verify tests run in actual CI environment before claiming "done"
- [ ] **Timeout handling:** Often missing progress vs. hung detection — verify long conversions don't timeout, hung conversions do
- [ ] **Download validation:** Often missing awaiting download promise — verify downloads complete before context closes
- [ ] **Fixture diversity:** Often missing edge cases and corrupted files — verify test suite includes truncated, oversized, and malformed inputs

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| False positives (tests pass, conversions broken) | HIGH | 1. Add proper validation library (1-2 weeks) 2. Rewrite tests with real validation 3. May discover many latent bugs |
| Missing edge case testing | MEDIUM | 1. Build edge case fixture library 2. Add tests incrementally by priority 3. Fix bugs as discovered |
| Race conditions in worker tests | MEDIUM | 1. Add worker lifecycle wrapper with promises 2. Refactor tests to use wrapper 3. May require test rewrite |
| Flaky download tests | LOW | 1. Add download promise helpers 2. Update tests to await properly 3. Usually quick fix |
| Missing metadata validation | MEDIUM | 1. Add metadata extraction utilities per format 2. Add comparison tests 3. Fix preservation bugs found |
| WASM memory limit crashes | HIGH | 1. Implement streaming/chunking 2. May require significant architecture changes 3. Retest all large file scenarios |
| CI/local environment mismatch | MEDIUM | 1. Containerize test environment 2. Update CI config 3. Rerun full suite to verify consistency |
| Binary comparison brittleness | LOW-MEDIUM | 1. Switch to semantic comparison per format 2. Update expected results 3. Tests become more robust |
| No error path testing | MEDIUM | 1. Create corrupted/invalid fixtures 2. Add error scenario tests 3. Improve error handling as needed |
| Timeout issues | LOW | 1. Measure actual conversion times 2. Implement dynamic timeouts 3. Quick configuration change |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| File existence without content validation | Phase 1: Test Infrastructure | Validation helpers can parse and verify actual file formats |
| Testing only happy path formats | Phase 2: Validation Library | Fixture library includes corrupted, edge case, and large files |
| Race conditions in Web Worker handlers | Phase 1: Test Infrastructure | Worker harness properly awaits initialization and message responses |
| Playwright file download timing | Phase 1: Test Infrastructure | Download helper correctly awaits download promise before validation |
| Missing metadata preservation | Phase 2: Validation Library | Metadata extractors exist and comparison tests verify preservation |
| WASM memory limits not tested | Phase 3: Large File Handling | Tests include files >50MB and monitor memory usage |
| CI environment differs from local | Phase 1: Test Infrastructure | Tests pass identically in local containerized environment and CI |
| Binary comparison instead of semantic | Phase 2: Validation Library | Comparison utilities use perceptual/semantic comparison per format |
| No format-specific error testing | Phase 4: Error Handling | Test suite includes corrupted inputs and invalid conversion combinations |
| Inadequate timeout configuration | Phase 1: Test Infrastructure | Timeouts are dynamic based on file size and conversion complexity |

---

## Sources

### E2E Testing and False Positives
- [End-To-End Testing: 2026 Guide for E2E Testing](https://www.leapwork.com/blog/end-to-end-testing)
- [How to avoid False Positives and False Negatives in Testing? | BrowserStack](https://www.browserstack.com/guide/false-positives-and-false-negatives-in-testing)
- [Why E2E Test Suites Fail—And How to Avoid Breakdowns](https://prodperfect.com/blog/end-to-end-testing/why-test-suites-fail-and-how-to-avoid-breakdowns/)

### File Validation and Corruption
- [Using Python to find corrupted images](https://opensource.com/article/17/2/python-tricks-artists)
- [Best way to check whether an image is corrupted? · Issue #166](https://github.com/libvips/ruby-vips/issues/166)
- [GitHub - bethgelab/imagecorruptions](https://github.com/bethgelab/imagecorruptions)
- [Corrupt A File Online - About](https://corrupt-a-file.com/about/)
- [How to check and verify file integrity | TechTarget](https://www.techtarget.com/searchcontentmanagement/tip/How-to-check-and-verify-file-integrity)

### Playwright Testing
- [15 Best Practices for Playwright testing in 2026 | BrowserStack](https://www.browserstack.com/guide/playwright-best-practices)
- [Downloads | Playwright](https://playwright.dev/docs/downloads)
- [File Uploads and Downloads Using Playwright (Guide)](https://nareshit.com/blogs/file-uploads-and-downloads-using-playwright)
- [Snapshot Testing with Playwright in 2026 | BrowserStack](https://www.browserstack.com/guide/playwright-snapshot-testing)
- [Visual comparisons | Playwright](https://playwright.dev/docs/test-snapshots)

### Web Workers and WASM
- [Web Workers: Race-Condition setting onmessage handler?](https://lists.whatwg.org/pipermail/help-whatwg.org/2010-August/003219.html)
- [Using Web Workers - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers)
- [Exploring The Potential Of Web Workers For Multithreading](https://www.smashingmagazine.com/2023/04/potential-web-workers-multithreading-web/)
- [Testing in Headless Browsers - wasm-bindgen Guide](https://rustwasm.github.io/docs/wasm-bindgen/wasm-bindgen-test/browsers.html)
- [Best Practices for Testing WebAssembly Applications](https://blog.pixelfreestudio.com/best-practices-for-testing-webassembly-applications/)

### Metadata Preservation
- [Audio and Video Metadata Guidelines Working Group | NISO](https://www.niso.org/standards-committees/video-audio-metadata-guidelines)
- [AES Standard AES57-2011: Audio object structures for preservation](https://www.aes.org/publications/standards/search.cfm?docID=84)
- [10 Best Video Metadata Editor You Must Know in 2026](https://videoconverter.wondershare.com/edit-video/video-metadata-editor.html)

### PDF and Document Testing
- [Validate confidently with 8 best PDF testing tools](https://www.accelq.com/blog/pdf-testing-tools/)
- [PDF Extraction APIs for Production (Jan 2026)](https://www.extend.ai/resources/pdf-extraction-apis-production-workloads)
- [PDF Conversion Quality Showdown](https://www.snaps2pdf.com/2025/10/pdf-conversion-quality-showdown.html)

### CI and Performance
- [GitHub Actions Pricing Changes 2026](https://devops-geek.net/devops-lab/github-actions-pricing-changes-2026-what-devops-geeks-need-to-know/)
- [Uncovering Disk I/O Bottlenecks in GitHub Actions](https://depot.dev/blog/uncovering-disk-io-bottlenecks-github-actions-ci)
- [Flaky Tests in 2026: Key Causes, Fixes, and Prevention](https://www.accelq.com/blog/flaky-tests/)

### General Testing and Conversion
- [Data Conversion Mistakes and Solutions](https://www.damcogroup.com/blogs/top-7-data-conversion-mistakes-and-solution-to-avoid-them)
- [Data Migration Testing in 2026: Strategy and Techniques](https://blog.qasource.com/a-guide-to-data-migration-testing)
- [Secure coding practices 2: Binary upload validation | Vaadin](https://vaadin.com/blog/secure-coding-practices-2-binary-upload-validation)

---

*Pitfalls research for: E2E Testing for File Conversion Applications*
*Researched: 2026-01-23*
*Confidence: MEDIUM — Based on WebSearch findings verified with official documentation where available. Format-specific validation techniques verified with authoritative sources. Some edge cases extrapolated from general testing best practices.*
