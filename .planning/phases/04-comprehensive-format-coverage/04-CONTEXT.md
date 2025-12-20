# Phase 4: Comprehensive Format Coverage - Context

**Gathered:** 2026-01-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Testing all conversion paths across 6 format categories (Audio, Document, Spreadsheet, Archive, Text) with advanced validation that proves output quality beyond basic "file opens" checks. Extends the proven testing approach from Phase 3 (images) to all remaining format categories.

This phase validates conversion correctness and quality. Performance optimization and error handling are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Test organization structure
- One test file per format category: 6 files total
  - `audio-conversions.spec.ts`
  - `document-conversions.spec.ts`
  - `spreadsheet-conversions.spec.ts`
  - `archive-conversions.spec.ts`
  - `text-conversions.spec.ts`
  - `advanced-image-validation.spec.ts` (visual fidelity)
- Within each file: organize by target format
  - `describe('Convert to JPEG')` contains PNG→JPEG, WebP→JPEG, etc.
  - Groups tests by output format for clearer failure patterns
- Parallel execution within category files
  - Tests run concurrently within each file (faster feedback)
  - May encounter worker resource contention but prioritizing speed

### Quality validation depth
- Image visual fidelity: Apply SSIM checks to EVERY image conversion test
  - SSIM thresholds determined by Claude based on format characteristics
  - Success criteria targets >0.95 for lossless, but Claude has discretion
- Audio lossless verification: Byte-for-byte comparison after round-trip
  - WAV→FLAC→WAV must produce identical audio data
  - Strictest validation to prove truly lossless
- Document/spreadsheet content: Semantic equivalence required
  - Content must match but whitespace/formatting can vary
  - Realistic for document conversions where structure may differ
  - Validates preservation of critical data without being overly strict

### Format coverage approach
- Exhaustive testing: Test EVERY source→target conversion combination
  - Complete coverage of the conversion matrix
  - Maximum confidence in all advertised conversion paths
- Partially-implemented formats: Skip with clear TODO comments
  - `test.skip()` with explanation for unsupported combinations
  - Visible in test reports, easy to track implementation progress
  - Ready to unskip when format support is added
- Batch conversions with mixed formats: All files must convert successfully
  - Validates queue processing handles different format types
  - Each file in batch should complete without errors
  - Simple pass/fail for batch as a whole

### Advanced validation scope
- Visual fidelity (SSIM): Applied to every image conversion test
  - Not just lossy formats — comprehensive quality validation
  - Integrated into standard conversion tests, not separate suite
- Metadata preservation: All formats that support metadata
  - Images (EXIF/XMP), Audio (ID3/Vorbis), Documents, PDFs
  - Comprehensive metadata validation across all categories
- Metadata validation expectations: Expect preservation unless conversion strips by design
  - Default assumption is metadata preserved
  - Explicitly mark formats/conversions known to strip metadata
  - Clearer intent than assuming stripping is acceptable

### Claude's Discretion
- Specific SSIM threshold values for different format combinations
- Exact timeout values for different format conversions
- Test file sizes and complexity levels for fixtures
- Error message assertions (exact wording vs pattern matching)
- Whether to log additional diagnostic information (file sizes, conversion times)

</decisions>

<specifics>
## Specific Ideas

- Follow Phase 3 patterns: same fixture usage, upload/download helpers, validation approach
- Build on existing validation library from Phase 2: FormatValidator, StructuralValidator, MetadataValidator
- Leverage existing factories: ImageFactory, AudioFactory, DocumentFactory, SpreadsheetFactory, ArchiveFactory
- Test files should demonstrate "this conversion works AND produces quality output" not just "file opens"

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 04-comprehensive-format-coverage*
*Context gathered: 2026-01-24*
