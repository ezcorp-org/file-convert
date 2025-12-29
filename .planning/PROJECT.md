# File Convert

## What This Is

A privacy-first client-side file conversion web app with comprehensive E2E test coverage. All conversions happen in the browser using Web Workers and WebAssembly - no server required. The application supports 30+ file formats across 6 categories (image, audio, document, spreadsheet, archive, text) with validated output quality.

## Core Value

Every supported file conversion works correctly and produces valid, accurate output files that can be opened and used without errors.

## Current State

**Shipped:** v1 Comprehensive Testing & Validation (2026-01-25)

The application now has:
- 180+ E2E tests covering all supported conversion paths
- Validation library with 30+ format validators (magic bytes, structural, metadata)
- Performance benchmarks with 22 baselines and regression detection
- 8 bug fixes (memory leaks, worker issues, privacy improvements)
- Upload validation (size limits, zero-byte rejection, spoofing detection)

**Tech Stack:**
- SvelteKit 1.30.4 + TypeScript 5.9.2
- Playwright 1.55.0 E2E tests + Vitest 3.2.4 unit tests
- Web Workers with Comlink RPC for conversions

## Requirements

### Validated

Capabilities shipped in v1:

- ✓ Client-side file conversion using Web Workers — v1
- ✓ Support for 30+ file formats across 6 categories — v1
- ✓ Comprehensive E2E test suite (180+ tests) — v1
- ✓ Test fixture factories for all format types — v1
- ✓ Output file validation (magic bytes, structure, metadata) — v1
- ✓ Visual fidelity validation with SSIM — v1
- ✓ Performance benchmarks with regression detection — v1
- ✓ Bug fixes: memory leaks, worker timeouts, audio blocking — v1
- ✓ Upload validation: size limits, zero-byte, spoofing detection — v1
- ✓ Cross-browser support (Chromium, Firefox, WebKit) — v1

### Active

For next milestone:

(To be defined in /gsd:new-milestone)

### Out of Scope

- New file format support — Focus on validating existing formats
- Video format support — Not in current app capabilities
- Server-side conversion — App is client-side only
- Mobile app — Web-first approach, PWA works well

## Context

**v1 shipped** with comprehensive test coverage:
- 362,907 lines of code (TypeScript/Svelte)
- 247 files modified during milestone
- 3 days from start to ship (Jan 23-25, 2026)

**Known limitations (tech debt from v1):**
- OGG/Opus encoding blocked (no browser encoder)
- FLAC UI not exposed (worker implemented)
- Document worker UI integration deferred
- XML processing server crashes
- 60 tests skipped with documented blockers

## Constraints

- **Tech stack**: SvelteKit + Playwright + Vitest (established)
- **Privacy**: All conversions client-side, no server uploads
- **Browser support**: Chromium, Firefox, WebKit
- **Dependencies**: Existing test infrastructure in apps/frontend/tests/

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Test ALL conversion paths | User trust requires comprehensive validation | ✓ Good — 180+ tests |
| Validate file opens + content + metadata + fidelity | Surface-level tests miss silent corruption | ✓ Good — Deep validation |
| Document all bugs first, then fix | Allows prioritization | ✓ Good — 8 bugs fixed |
| Bundle encoder libraries instead of CDN | Reliable test execution | ✓ Good — MP3/FLAC working |
| Promise-before-click for downloads | Prevents race conditions | ✓ Good — Zero flaky downloads |
| Dynamic timeouts based on file size | Prevents flaky tests | ✓ Good — CI stable |

---
*Last updated: 2026-01-25 after v1 milestone*
