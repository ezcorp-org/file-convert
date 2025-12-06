# File Convert - Comprehensive Testing & Validation

## What This Is

A comprehensive testing and bug-fixing initiative for File Convert, a privacy-first client-side file conversion web app. This project will create E2E tests for all supported conversion paths, validate output file integrity, and fix any bugs discovered during testing.

## Core Value

Every supported file conversion works correctly and produces valid, accurate output files that can be opened and used without errors.

## Requirements

### Validated

Existing capabilities that are already built and functional:

- ✓ Client-side file conversion using Web Workers (no server upload) — existing
- ✓ Support for 30+ file formats across 6 categories (image, audio, document, spreadsheet, archive, text) — existing
- ✓ Image conversions: PNG, JPEG, WebP, TIFF, BMP, GIF, ICO, PNM — existing
- ✓ Audio conversions: WAV, FLAC, MP3, OGG, Opus — existing
- ✓ Archive operations: ZIP, 7Z, TAR, TGZ, TBZ2, TXZ — existing
- ✓ Document conversions: PDF, DOCX, HTML, TXT, Markdown — existing
- ✓ Spreadsheet conversions: XLSX, CSV, TSV, JSON, YAML, XML — existing
- ✓ Queue-based conversion manager with max 3 concurrent conversions — existing
- ✓ Progress tracking and error notifications — existing
- ✓ File validation (size limits, MIME types, magic numbers) — existing
- ✓ Basic Playwright E2E test framework — existing
- ✓ Unit tests for audio conversion and conversion registry — existing

### Active

New capabilities to build for this testing initiative:

- [ ] Comprehensive E2E test suite covering all supported conversion paths
- [ ] Test fixture generation for all supported formats (synthetic + real-world samples)
- [ ] Output file validation tests (file opens, content integrity, metadata preservation)
- [ ] Visual/audio fidelity validation for media files
- [ ] Audit and enhance existing E2E tests
- [ ] Verify and fix known bugs from CONCERNS.md:
  - [ ] Worker message handler not removed on error (memory leak)
  - [ ] Message ID filtering logic inconsistent (cross-conversion message leakage)
  - [ ] PDF worker initialization timeout issues
  - [ ] Audio decoding errors in main thread blocking UI
  - [ ] File extension spoofing vulnerabilities
- [ ] Fix any bugs discovered during comprehensive testing
- [ ] Re-run full test suite after all fixes to ensure zero failures
- [ ] Document test coverage and validation approach

### Out of Scope

- New file format support — Focus is testing existing formats, not adding new ones
- Performance optimization beyond bug fixes — Not addressing performance bottlenecks unless they cause test failures
- UI/UX changes — Testing backend conversion logic, not interface improvements
- Conversion history or user settings features — Only testing core conversion functionality
- Architecture refactoring — Fix bugs in existing architecture, don't redesign it

## Context

**Existing Codebase:**
- SvelteKit 1.30.4 + TypeScript 5.9.2 application
- Web Worker-based architecture with Comlink RPC
- Playwright 1.55.0 E2E tests + Vitest 3.2.4 unit tests
- Currently has limited test coverage (2 unit test files, basic E2E tests)
- Known bugs documented in `.planning/codebase/CONCERNS.md`

**Why This Matters:**
- Users depend on accurate file conversions; silent failures or corrupted output erode trust
- Current test coverage doesn't validate output file correctness (only that conversion completes)
- Known bugs can cause memory leaks, incorrect conversions, and UI freezes
- Missing comprehensive validation means bugs go undetected until users report them

**Testing Approach:**
- Audit existing tests first to determine what to keep/enhance
- Create test fixtures for all 30+ formats (both synthetic and real-world)
- Write E2E tests that validate: file opens, content integrity, metadata preservation, fidelity
- Run tests continuously during development (write → run → fix → re-run)
- Document all bugs first, then fix in priority order
- Final validation: full test suite passes with zero failures

## Constraints

- **Tech stack**: Must use existing Playwright + Vitest setup (don't introduce new testing frameworks)
- **Timeline**: Systematic approach - complete testing for one category before moving to next
- **Budget**: Open source project - prefer built-in browser capabilities over paid services
- **Compatibility**: Tests must run on Chromium, Firefox, WebKit (existing Playwright config)
- **Dependencies**: Use existing test infrastructure in `apps/frontend/tests/` and `apps/frontend/src/lib/conversion/*.test.ts`
- **Architecture**: Fix bugs in place, don't refactor conversion architecture during this project

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Test ALL conversion paths (not just popular ones) | User trust requires every advertised conversion to work correctly | — Pending |
| Validate file opens + content + metadata + fidelity | Surface-level tests (conversion completes) miss silent data corruption | — Pending |
| Document all bugs first, then fix | Allows prioritization and prevents missing issues during iterative fixes | — Pending |
| Use both synthetic and real-world test files | Synthetic ensures consistency, real-world catches edge cases | — Pending |
| Audit existing tests before replacing | Existing tests may have value; build on them rather than start from scratch | — Pending |

---
*Last updated: 2026-01-23 after initialization*
