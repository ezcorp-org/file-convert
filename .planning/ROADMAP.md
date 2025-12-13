# Roadmap: File Convert - Comprehensive Testing & Validation

## Overview

This roadmap transforms File Convert from a functional but inadequately tested application into a comprehensively validated system. The journey builds test infrastructure first, then validation capabilities, and finally expands to full coverage across all 30+ supported formats. Each phase delivers working test suites with observable results, ensuring every advertised conversion produces valid, uncorrupted output files.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Test Infrastructure Foundation** - Core test utilities, CI/CD, worker lifecycle management
- [x] **Phase 2: Validation Library & Fixtures** - Multi-layer validators and fixture generators for all formats
- [ ] **Phase 3: Upload/Download & Basic Coverage** - File handling flows and pilot conversion tests
- [ ] **Phase 4: Comprehensive Format Coverage** - All conversion paths across 6 format categories
- [ ] **Phase 5: Error Handling & Edge Cases** - Error scenarios, corrupted files, and edge case validation
- [ ] **Phase 6: Performance & Bug Fixes** - Performance benchmarking and resolution of known bugs

## Phase Details

### Phase 1: Test Infrastructure Foundation
**Goal**: Establish reliable test infrastructure that prevents flaky tests and enables confident test execution
**Depends on**: Nothing (first phase)
**Requirements**: INFRA-01, INFRA-09, INFRA-10
**Success Criteria** (what must be TRUE):
  1. Tests run successfully in CI environment matching local development
  2. Web Worker lifecycle is managed with promise-based handlers that prevent race conditions
  3. File download events are handled correctly with proper promise awaiting
  4. Timeout configuration adjusts dynamically based on file size and format complexity
  5. Existing Playwright tests have been audited with clear documentation of what to keep/enhance
**Plans**: 7 plans

Plans:
- [x] 01-01-PLAN.md — Audit existing tests and create TEST_AUDIT.md
- [x] 01-02-PLAN.md — Create Playwright fixture infrastructure
- [x] 01-03-PLAN.md — Set up GitHub Actions CI/CD
- [x] 01-04-PLAN.md — Validate fixtures with integration tests
- [x] 01-05-PLAN.md — Remove debug/manual tests and trigger CI (gap closure)
- [x] 01-06-PLAN.md — Migrate KEEP tests to fixtures, merge duplicates, document patterns (gap closure)
- [x] 01-07-PLAN.md — Migrate ENHANCE tests to fixtures (gap closure)

### Phase 2: Validation Library & Fixtures
**Goal**: Build comprehensive validation capabilities that detect corrupted or incorrect conversion output
**Depends on**: Phase 1
**Requirements**: INFRA-02, INFRA-03, INFRA-04, INFRA-05, INFRA-06, INFRA-07, INFRA-08, VALID-01, VALID-02, VALID-03, VALID-04, VALID-05, VALID-06, VALID-07, VALID-08, VALID-09, VALID-10, ADV-01, ADV-05
**Success Criteria** (what must be TRUE):
  1. Every supported format has magic byte validation that detects incorrect file types
  2. Synthetic test fixtures can be generated programmatically for all formats (no binary files in git)
  3. Format-specific parsers can validate structural integrity (images parse, PDFs open, archives extract)
  4. Real-world test file collection includes edge cases (large files, complex metadata, unusual structures)
  5. Metadata extractors can verify EXIF, XMP, and audio tags are preserved through conversions
**Plans**: 7 plans

Plans:
- [x] 02-01-PLAN.md — Magic byte validator library for all 30+ formats
- [x] 02-02-PLAN.md — Image fixture factory (PNG, JPEG, WebP)
- [x] 02-03-PLAN.md — Audio fixture factory (WAV)
- [x] 02-04-PLAN.md — Document factory (PDF, TXT, HTML, MD)
- [x] 02-04b-PLAN.md — Spreadsheet factory (XLSX, CSV, TSV, JSON, YAML, XML)
- [x] 02-05-PLAN.md — Archive factory (ZIP, TAR, TGZ, TBZ2, TXZ) and structural validator
- [x] 02-06-PLAN.md — Metadata validator and real-world test assets

### Phase 3: Upload/Download & Basic Coverage
**Goal**: Validate core file upload/download workflows and prove testing approach with image conversions
**Depends on**: Phase 2
**Requirements**: UPLOAD-01, UPLOAD-02, UPLOAD-03, UPLOAD-04, DOWNLOAD-01, DOWNLOAD-02, DOWNLOAD-03, DOWNLOAD-04, COVER-01, COVER-07, COVER-09
**Success Criteria** (what must be TRUE):
  1. Files of all supported MIME types can be uploaded successfully
  2. File upload works via both drag-and-drop and input dialog methods
  3. Downloaded files have correct extensions, MIME types, and non-zero sizes
  4. All image conversion paths (PNG, JPEG, WebP, TIFF, BMP, GIF, ICO, PNM) are validated
  5. Batch conversion with multiple images processes correctly without errors
  6. Tests run successfully on Chromium (full suite), Firefox, and WebKit (smoke tests)
**Plans**: TBD

Plans:
- [ ] TBD during planning

### Phase 4: Comprehensive Format Coverage
**Goal**: Extend proven testing approach to all 6 format categories with advanced validation
**Depends on**: Phase 3
**Requirements**: COVER-02, COVER-03, COVER-04, COVER-05, COVER-06, COVER-08, ADV-02, ADV-03, ADV-04, ADV-06, ADV-07, ADV-08, ADV-09, ADV-10, ADV-11, ADV-12, ADV-13, ADV-14, ADV-15, ADV-16
**Success Criteria** (what must be TRUE):
  1. All audio conversion paths (WAV, FLAC, MP3, OGG, Opus) produce valid, playable output
  2. All document conversion paths (DOCX, HTML, TXT, PDF, Markdown) preserve text content accurately
  3. All spreadsheet conversion paths (XLSX, CSV, TSV, JSON, YAML, XML) maintain data integrity
  4. All archive conversion paths (ZIP, 7Z, TAR, TGZ, TBZ2, TXZ) preserve file contents with correct sizes
  5. All text format conversions (HTML, TXT, MD, JSON, YAML) maintain content equivalence
  6. Batch conversion with mixed formats processes all files correctly
  7. Visual fidelity validation shows image conversions maintain quality (SSIM >0.95)
  8. Audio quality validation confirms lossless conversions are truly lossless
  9. Metadata preservation validation confirms critical fields persist through conversions
**Plans**: TBD

Plans:
- [ ] TBD during planning

### Phase 5: Error Handling & Edge Cases
**Goal**: Ensure application handles invalid input gracefully and recovers from worker failures
**Depends on**: Phase 4
**Requirements**: ERROR-01, ERROR-02, ERROR-03, ERROR-04, ERROR-05, ERROR-06, ERROR-07, ERROR-08
**Success Criteria** (what must be TRUE):
  1. Unsupported file formats are rejected with clear, actionable error messages
  2. Corrupted files (bad headers, truncated data) are detected and handled gracefully
  3. Files exceeding size limits are rejected before processing starts
  4. File extension spoofing is detected via magic byte validation
  5. Web Worker crashes are recovered from without freezing the UI
  6. Multiple simultaneous conversion failures don't stop queue processing
  7. Success and failure UI indicators display correctly for all scenarios
**Plans**: TBD

Plans:
- [ ] TBD during planning

### Phase 6: Performance & Bug Fixes
**Goal**: Establish performance baselines, fix known bugs, and achieve zero test failures
**Depends on**: Phase 5
**Requirements**: PERF-01, PERF-02, PERF-03, PERF-04, PERF-05, PERF-06, PERF-07, BUG-01, BUG-02, BUG-03, BUG-04, BUG-05, BUG-06, BUG-07, BUG-08
**Success Criteria** (what must be TRUE):
  1. Performance benchmarks exist for all conversion types with documented baseline times
  2. Tests detect performance regressions (conversions >20% slower than baseline)
  3. Large files (50MB images, 100MB audio, 200MB archives) convert successfully without memory errors
  4. Progress indicators update correctly during long-running conversions
  5. All known bugs from CONCERNS.md are fixed with targeted regression tests
  6. Worker message handler memory leak is resolved
  7. PDF worker initialization timeout issues are eliminated
  8. Full test suite runs with zero failures across all browsers
**Plans**: TBD

Plans:
- [ ] TBD during planning

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Test Infrastructure Foundation | 7/7 | Complete | 2026-01-24 |
| 2. Validation Library & Fixtures | 7/7 | Complete | 2026-01-24 |
| 3. Upload/Download & Basic Coverage | 0/TBD | Not started | - |
| 4. Comprehensive Format Coverage | 0/TBD | Not started | - |
| 5. Error Handling & Edge Cases | 0/TBD | Not started | - |
| 6. Performance & Bug Fixes | 0/TBD | Not started | - |
