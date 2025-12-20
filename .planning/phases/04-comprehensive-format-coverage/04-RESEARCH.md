# Phase 4: Comprehensive Format Coverage - Research

**Researched:** 2026-01-24
**Domain:** Multi-format conversion testing with advanced quality validation
**Confidence:** HIGH

## Summary

This research investigates the technical requirements for testing all conversion paths across 6 format categories (Audio, Document, Spreadsheet, Archive, Text, Image) with advanced quality validation that proves correctness beyond basic "file opens" checks.

The codebase already has strong foundation infrastructure from Phase 2 (factories, validators) and Phase 3 (test patterns). The key technical challenges are:
1. **Visual fidelity validation**: Using SSIM for image quality measurement
2. **Lossless audio verification**: Byte-for-byte comparison after round-trip conversion
3. **Content integrity validation**: Semantic equivalence for documents/spreadsheets
4. **Archive integrity testing**: Extract and verify contents with checksums

**Primary recommendation:** Leverage existing validator infrastructure (StructuralValidator, MetadataValidator, ContentValidator) and add SSIM library for image quality validation. Follow Phase 3 test patterns exactly - one file per format category with describe blocks organized by target format.

## Standard Stack

The established libraries/tools for this domain:

### Core - Already Installed
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| sharp | 0.34.5 | Image processing/metadata | Industry standard, already used in StructuralValidator |
| music-metadata | 11.10.6 | Audio parsing/validation | Already used for audio metadata extraction |
| ExcelJS | 4.4.0 | Spreadsheet generation/parsing | Already used in SpreadsheetFactory |
| JSZip | 3.10.1 | Archive manipulation | Already used in ArchiveFactory and StructuralValidator |
| exifreader | 4.36.0 | Image metadata extraction | Already used in MetadataValidator |
| pdfkit | 0.17.2 | PDF generation | Already used in DocumentFactory |
| wavefile | 11.0.0 | WAV file parsing/generation | Already used in AudioFactory |

### Supporting - Need to Add
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| ssim.js | latest | SSIM image similarity | Every image conversion test (ADV-08, ADV-09, ADV-10) |
| pdf-parse | latest | PDF text extraction | Document conversion validation (ADV-03) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| ssim.js | image-ssim | ssim.js more actively maintained, better documentation |
| pdf-parse | pdfjs-dist | pdf-parse simpler API for text extraction, pdfjs-dist already in deps for worker |
| ExcelJS | xlsx (SheetJS) | ExcelJS already in use, consistent with existing code |

**Installation:**
```bash
npm install ssim.js pdf-parse
```

## Architecture Patterns

### Recommended Test Structure (from Phase 3)
```
apps/frontend/tests/e2e/04-comprehensive-coverage/
├── audio-conversions.spec.ts           # COVER-02
├── document-conversions.spec.ts        # COVER-03
├── spreadsheet-conversions.spec.ts     # COVER-04
├── archive-conversions.spec.ts         # COVER-05
├── text-conversions.spec.ts            # COVER-06
├── mixed-batch-conversion.spec.ts      # COVER-08
└── advanced-image-validation.spec.ts   # ADV-08, ADV-09, ADV-10 (SSIM)
```

### Pattern 1: Format Conversion Matrix Testing
**What:** Test every source→target conversion combination within a category
**When to use:** Exhaustive coverage requirements (COVER-02 through COVER-06)
**Example:**
```typescript
// Source: Phase 3 image-conversion-common.spec.ts
const AUDIO_CONVERSIONS = [
  // WAV source
  { from: 'wav', to: 'flac', mimeType: 'audio/wav' },
  { from: 'wav', to: 'mp3', mimeType: 'audio/wav' },
  { from: 'wav', to: 'ogg', mimeType: 'audio/wav' },
  { from: 'wav', to: 'opus', mimeType: 'audio/wav' },
  // FLAC source
  { from: 'flac', to: 'wav', mimeType: 'audio/flac' },
  // ... etc
];

for (const { from, to, mimeType } of AUDIO_CONVERSIONS) {
  test(`converts ${from.toUpperCase()} to ${to.toUpperCase()}`, async ({
    page, fileHelper, downloadHelper
  }) => {
    const sourceBuffer = await AudioFactory.create({ format: from });
    // ... standard test flow
  });
}
```

### Pattern 2: SSIM Visual Fidelity Validation
**What:** Measure structural similarity between original and converted images
**When to use:** Every image conversion test (ADV-08 requirement)
**Example:**
```typescript
// Source: ssim.js GitHub README + Phase 3 patterns
import ssim from 'ssim.js';
import sharp from 'sharp';

test('PNG→JPEG→PNG maintains visual fidelity', async ({
  page, fileHelper, downloadHelper
}) => {
  // Create original
  const originalBuffer = await ImageFactory.createPNG({
    width: 100, height: 100, background: '#FF0000'
  });

  // Convert to JPEG
  const jpegResult = await convertAndDownload(originalBuffer, 'jpeg');

  // Convert back to PNG
  const finalPngResult = await convertAndDownload(jpegResult.buffer, 'png');

  // Load images for SSIM comparison
  const img1 = await sharp(originalBuffer).raw().toBuffer();
  const img2 = await sharp(finalPngResult.buffer).raw().toBuffer();
  const metadata = await sharp(originalBuffer).metadata();

  // Calculate SSIM
  const { mssim } = ssim(img1, img2, {
    width: metadata.width,
    height: metadata.height
  });

  // SSIM >0.95 for lossy round-trip (ADV-09)
  expect(mssim).toBeGreaterThan(0.95);
});
```

### Pattern 3: Lossless Audio Round-Trip Verification
**What:** Verify byte-for-byte equality after WAV→FLAC→WAV conversion
**When to use:** Lossless audio validation (ADV-12)
**Example:**
```typescript
test('WAV→FLAC→WAV is truly lossless', async ({
  page, fileHelper, downloadHelper
}) => {
  // Create WAV with known properties
  const originalWav = AudioFactory.createWAV({
    duration: 1,
    sampleRate: 44100,
    channels: 2,
    bitDepth: 16
  });

  // Extract audio data (skip headers)
  const originalAudioData = extractPCMAudioData(originalWav);

  // Convert WAV→FLAC→WAV
  const flacResult = await convertAndDownload(originalWav, 'flac');
  const finalWavResult = await convertAndDownload(flacResult.buffer, 'wav');

  // Extract final audio data
  const finalAudioData = extractPCMAudioData(finalWavResult.buffer);

  // Byte-for-byte comparison of audio data
  expect(Buffer.compare(originalAudioData, finalAudioData)).toBe(0);
});
```

### Pattern 4: Content Semantic Equivalence
**What:** Validate content preservation without strict formatting requirements
**When to use:** Document/spreadsheet conversions (ADV-03, ADV-04)
**Example:**
```typescript
// Source: Existing ContentValidator + Phase 3 patterns
test('CSV→JSON→CSV preserves all data', async ({
  page, fileHelper, downloadHelper
}) => {
  // Original data
  const originalData = [
    ['Name', 'Age', 'City'],
    ['Alice', '30', 'NYC'],
    ['Bob', '25', 'LA']
  ];
  const originalCsv = SpreadsheetFactory.createCSV({ data: originalData });

  // CSV→JSON
  const jsonResult = await convertAndDownload(originalCsv, 'json');
  const jsonData = JSON.parse(jsonResult.buffer.toString('utf-8'));

  // Validate JSON structure
  expect(jsonData).toHaveLength(2); // 2 data rows
  expect(jsonData[0]).toEqual({ Name: 'Alice', Age: '30', City: 'NYC' });

  // JSON→CSV
  const finalCsvResult = await convertAndDownload(jsonResult.buffer, 'csv');
  const csvValidation = ContentValidator.validateCSV(finalCsvResult.buffer);

  expect(csvValidation.csv.rowCount).toBe(3); // header + 2 rows
  expect(csvValidation.csv.columnCount).toBe(3);
});
```

### Pattern 5: Archive Integrity Validation
**What:** Extract archive contents and verify file sizes/checksums
**When to use:** Archive conversions (ADV-15, ADV-16)
**Example:**
```typescript
test('ZIP→TAR preserves all files with correct sizes', async ({
  page, fileHelper, downloadHelper
}) => {
  // Create ZIP with known files
  const files = {
    'file1.txt': Buffer.from('Content 1'),
    'file2.txt': Buffer.from('Content 2'),
    'dir/file3.txt': Buffer.from('Content 3')
  };
  const zipBuffer = await ArchiveFactory.createWithFiles(files);

  // Convert to TAR
  const tarResult = await convertAndDownload(zipBuffer, 'tar');

  // Extract and validate TAR contents
  const extractedFiles = await extractTarContents(tarResult.buffer);

  expect(extractedFiles).toHaveLength(3);
  expect(extractedFiles['file1.txt'].length).toBe(9); // 'Content 1'.length
  expect(extractedFiles['file2.txt'].toString()).toBe('Content 2');

  // Verify checksums match (ADV-16)
  const originalChecksum = calculateChecksum(files['file1.txt']);
  const extractedChecksum = calculateChecksum(extractedFiles['file1.txt']);
  expect(extractedChecksum).toBe(originalChecksum);
});
```

### Pattern 6: Metadata Preservation Validation
**What:** Verify critical metadata fields persist through conversions
**When to use:** All formats supporting metadata (ADV-05, ADV-06, ADV-07)
**Example:**
```typescript
// Source: Existing MetadataValidator
test('JPEG→PNG preserves EXIF metadata', async ({
  page, fileHelper, downloadHelper
}) => {
  // Create JPEG with metadata (use real file with EXIF)
  const jpegWithExif = await fileHelper.loadFile('testAssets/images/sample-with-exif.jpg');

  // Extract original metadata
  const originalMeta = await MetadataValidator.extractImageMetadata(jpegWithExif);
  expect(originalMeta.hasExif).toBe(true);

  // Convert to PNG
  const pngResult = await convertAndDownload(jpegWithExif, 'png');

  // Validate metadata preservation (ADV-07)
  const validation = await MetadataValidator.validateMetadataPreservation(
    jpegWithExif,
    pngResult.buffer,
    'preserved' // expectation
  );

  expect(validation.valid).toBe(true);
  expect(validation.errors).toHaveLength(0);
});
```

### Anti-Patterns to Avoid
- **Fixed timeouts for all conversions**: Use dynamic timeouts based on file size/complexity (established in Phase 2)
- **Testing worker initialization**: Test the API contract, not internal implementation
- **Exact byte comparison for lossy formats**: Use semantic/quality metrics instead
- **Separate validation suites**: Integrate SSIM/metadata checks into standard conversion tests
- **Manual cleanup**: Rely on fixture teardown (already implemented)

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image similarity comparison | Custom pixel diffing | ssim.js | SSIM is proven algorithm, correlates with human perception, handles lighting/contrast variations |
| PDF text extraction | Custom parser | pdf-parse or pdfjs-dist | PDF structure is complex, edge cases numerous (encryption, fonts, encodings) |
| Audio format detection | Magic bytes only | music-metadata parseBuffer | Handles metadata, validates structure, detects sample rate/duration |
| CSV parsing with edge cases | String splitting | ContentValidator (already built) | Handles inconsistent columns, empty files, encoding issues |
| Archive extraction | Manual ZIP parsing | JSZip loadAsync | Handles compression algorithms, directory structure, error cases |
| WAV audio data extraction | Manual header parsing | wavefile library (already used) | Handles multiple bit depths, channel configurations, chunk formats |
| SSIM preprocessing | Custom resize/normalize | sharp + ssim.js | Sharp handles color space conversions, resizing, format normalization correctly |

**Key insight:** Advanced validation requires domain-specific algorithms (SSIM, FLAC compression verification) that are non-trivial to implement correctly. Using established libraries ensures correctness and saves significant development time.

## Common Pitfalls

### Pitfall 1: SSIM Comparison Without Proper Image Preprocessing
**What goes wrong:** Comparing images with different dimensions or color spaces produces invalid SSIM scores or crashes
**Why it happens:** ssim.js expects raw pixel buffers with matching width/height/channels
**How to avoid:**
- Use sharp to normalize images before SSIM comparison
- Ensure both images are same dimensions (resize if needed)
- Convert to same color space (RGB/grayscale)
- Extract raw pixel data with `.raw().toBuffer()`
**Warning signs:**
- SSIM throws "dimension mismatch" errors
- Unexpected SSIM scores near 0 for visually similar images
- Comparison takes extremely long (wrong buffer size)

### Pitfall 2: Expecting Metadata Preservation Where Not Supported
**What goes wrong:** Tests fail because format conversion strips metadata by design
**Why it happens:** Not all format conversions preserve metadata (e.g., some web-based converters strip EXIF)
**How to avoid:**
- Document which conversions preserve metadata (consult workers)
- Use `test.skip()` with clear comments for known metadata-stripping conversions
- Set expectation parameter in MetadataValidator: 'preserved' | 'stripped' | 'partial'
- Validate worker capabilities before writing tests
**Warning signs:**
- Metadata tests fail for specific conversion pairs
- Worker implementation shows intentional metadata removal
- Format specifications indicate no metadata support

### Pitfall 3: Byte-for-Byte Comparison of Lossy Formats
**What goes wrong:** Round-trip tests fail because lossy compression (JPEG, MP3) cannot be identical
**Why it happens:** Confusion between lossless (PNG, FLAC) and lossy (JPEG, MP3) formats
**How to avoid:**
- Use SSIM (>0.95) for lossy image conversions
- Use spectrogram analysis or quality thresholds for lossy audio
- Reserve byte-for-byte comparison ONLY for truly lossless formats (WAV→FLAC→WAV)
- Document expected quality loss in test names/comments
**Warning signs:**
- Round-trip tests failing for JPEG, MP3, OGG
- Expecting identical file sizes after lossy conversion
- Test assumes lossless when format spec says lossy

### Pitfall 4: Race Conditions in Batch Conversion Tests
**What goes wrong:** Batch tests flaky - sometimes downloads complete, sometimes timeout
**Why it happens:** Multiple conversions spawn workers competing for resources
**How to avoid:**
- Use sequential processing in CI (workers: 1 in playwright.config.ts - already set)
- Increase timeouts for batch tests: base + (fileCount * perFileTime)
- Wait for each download button individually, not just first
- Use proper promise-before-click pattern (already in DownloadHelper)
**Warning signs:**
- Tests pass locally but fail in CI
- Intermittent timeouts on download buttons
- Some files convert, others hang

### Pitfall 5: Archive Extraction Without Proper Path Sanitization
**What goes wrong:** Security vulnerability or test failures from malicious archive filenames
**Why it happens:** Archives can contain paths like `../../etc/passwd` (Zip Slip attack)
**How to avoid:**
- Use JSZip's built-in path handling (already safe)
- Validate extracted filenames don't contain `..` or absolute paths
- Extract to temporary directories with proper cleanup
- Reference: JSZip CVE-2022-48285 (Arbitrary File Write via Archive Extraction)
**Warning signs:**
- Archive tests creating files outside test directories
- Security scanner warnings about Zip Slip
- Unexpected file system modifications during tests

### Pitfall 6: Fixed SSIM Thresholds Across All Conversions
**What goes wrong:** Some conversions fail SSIM checks even though output looks fine
**Why it happens:** Different format conversions have different expected quality loss
**How to avoid:**
- Lossless→Lossless (PNG→PNG): SSIM >0.99 expected
- Lossless→Lossy (PNG→JPEG): SSIM >0.95 acceptable
- Lossy→Lossless (JPEG→PNG): SSIM >0.95 (cannot improve lossy source)
- Lossy→Lossy (JPEG→WebP): SSIM >0.90 (cumulative loss)
- Document thresholds in test comments or constants
**Warning signs:**
- High-quality conversions failing SSIM >0.95 check
- Test expectations don't match format characteristics
- Arbitrary threshold values without justification

### Pitfall 7: CSV/JSON Structural Assumptions
**What goes wrong:** Content validation fails on valid but differently structured data
**Why it happens:** CSV→JSON→CSV may reorder columns, normalize whitespace, change quoting
**How to avoid:**
- Validate semantic content (row count, column count, key presence) not exact string match
- Use ContentValidator which handles structural differences
- Compare parsed data structures, not raw text
- Accept equivalent representations (e.g., "true" vs true in JSON)
**Warning signs:**
- Tests failing on whitespace differences
- Column order causing failures when data is correct
- Quote character differences breaking assertions

## Code Examples

Verified patterns from existing codebase:

### Using Existing AudioFactory for Test Files
```typescript
// Source: apps/frontend/tests/fixtures/factories/audio-factory.ts
import { AudioFactory } from '../../fixtures';

// Create 1-second 440Hz tone
const wavBuffer = AudioFactory.createWAV({
  duration: 1,
  sampleRate: 44100,
  channels: 2,
  bitDepth: 16,
  frequency: 440,
  volume: 0.5
});

// Create silent audio
const silentWav = AudioFactory.createSilentWAV({ duration: 1 });

// Get audio properties
const sampleCount = AudioFactory.getSampleCount(wavBuffer);
const duration = AudioFactory.getDuration(wavBuffer);
```

### Using Existing DocumentFactory for Test Files
```typescript
// Source: apps/frontend/tests/fixtures/factories/document-factory.ts
import { DocumentFactory } from '../../fixtures';

// Create PDF
const pdfBuffer = await DocumentFactory.createPDF({
  title: 'Test Document',
  content: 'Main content here',
  paragraphs: 3
});

// Create text formats
const txtBuffer = DocumentFactory.createTXT({ title: 'Test', content: 'Content' });
const htmlBuffer = DocumentFactory.createHTML({ title: 'Test', content: 'Content' });
const mdBuffer = DocumentFactory.createMarkdown({ title: 'Test', content: 'Content' });
```

### Using Existing SpreadsheetFactory for Test Files
```typescript
// Source: apps/frontend/tests/fixtures/factories/spreadsheet-factory.ts
import { SpreadsheetFactory } from '../../fixtures';

// Create with default data
const xlsxBuffer = await SpreadsheetFactory.createXLSX();
const csvBuffer = SpreadsheetFactory.createCSV();

// Create with custom data
const data = [
  ['Name', 'Age', 'City'],
  ['Alice', 30, 'NYC'],
  ['Bob', 25, 'LA']
];
const xlsxCustom = await SpreadsheetFactory.createXLSX({ data });
const jsonBuffer = SpreadsheetFactory.createJSON({ data });
const yamlBuffer = SpreadsheetFactory.createYAML({ data });
const xmlBuffer = SpreadsheetFactory.createXML({ data });
```

### Using Existing ArchiveFactory for Test Files
```typescript
// Source: apps/frontend/tests/fixtures/factories/archive-factory.ts
import { ArchiveFactory } from '../../fixtures';

// Create ZIP with files
const zipBuffer = await ArchiveFactory.createWithFiles({
  'file1.txt': Buffer.from('Content 1'),
  'file2.txt': Buffer.from('Content 2'),
  'dir/file3.txt': Buffer.from('Nested content')
});

// Create different archive formats
const tarBuffer = ArchiveFactory.createTAR();
const tgzBuffer = ArchiveFactory.createTGZ();
const tbz2Buffer = ArchiveFactory.createTBZ2(); // Requires bzip2
const txzBuffer = ArchiveFactory.createTXZ(); // Requires xz
```

### Using Existing ContentValidator
```typescript
// Source: apps/frontend/tests/fixtures/validators/content.ts
import { ContentValidator } from '../../fixtures';

// Validate JSON
const jsonResult = ContentValidator.validateJSON(buffer);
expect(jsonResult.valid).toBe(true);
expect(jsonResult.json.parsed).toEqual({ key: 'value' });

// Validate CSV
const csvResult = ContentValidator.validateCSV(buffer);
expect(csvResult.csv.rowCount).toBe(4);
expect(csvResult.csv.columnCount).toBe(3);

// Validate XML
const xmlResult = ContentValidator.validateXML(buffer);
expect(xmlResult.valid).toBe(true);
expect(xmlResult.xml.rootElement).toBe('data');
```

### Using Existing MetadataValidator
```typescript
// Source: apps/frontend/tests/fixtures/validators/metadata.ts
import { MetadataValidator } from '../../fixtures';

// Extract image metadata
const metadata = await MetadataValidator.extractImageMetadata(imageBuffer);
expect(metadata.hasExif).toBe(true);
expect(metadata.make).toBe('Canon');
expect(metadata.width).toBe(1920);

// Validate preservation
const validation = await MetadataValidator.validateMetadataPreservation(
  originalBuffer,
  convertedBuffer,
  'preserved' // expectation: 'preserved' | 'stripped' | 'partial'
);
expect(validation.valid).toBe(true);
expect(validation.errors).toHaveLength(0);

// Extract audio metadata
const audioMeta = await MetadataValidator.extractAudioMetadata(mp3Buffer);
expect(audioMeta.hasId3).toBe(true);
expect(audioMeta.artist).toBe('Test Artist');
```

### Adding SSIM Image Comparison (NEW)
```typescript
// Source: ssim.js GitHub + sharp documentation
import ssim from 'ssim.js';
import sharp from 'sharp';

async function compareImages(img1Buffer: Buffer, img2Buffer: Buffer): Promise<number> {
  // Get metadata from first image
  const metadata = await sharp(img1Buffer).metadata();

  // Ensure both images are same size (resize if needed)
  const normalized1 = await sharp(img1Buffer)
    .resize(metadata.width, metadata.height)
    .raw()
    .toBuffer();

  const normalized2 = await sharp(img2Buffer)
    .resize(metadata.width, metadata.height)
    .raw()
    .toBuffer();

  // Calculate SSIM
  const { mssim } = ssim(normalized1, normalized2, {
    width: metadata.width,
    height: metadata.height
  });

  return mssim; // Returns 0-1, where 1 is identical
}

// In test
const similarity = await compareImages(originalPng, convertedPng);
expect(similarity).toBeGreaterThan(0.95); // ADV-09 requirement
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Test only "file opens" | Validate content integrity + metadata + quality | Phase 0 decision | Catches silent data corruption |
| Manual pixel comparison | SSIM structural similarity | Research 2026-01 | Correlates with human perception, handles lighting variations |
| Fixed timeouts | Dynamic timeouts based on file size | Phase 2 (01-02) | Prevents flaky tests, adapts to varying file complexity |
| Test workers directly | Test conversion API contract | Phase 1 decision | Isolated from worker implementation details |
| Separate validation files | Integrated validation in conversion tests | Phase 3 pattern | Single test proves "converts AND maintains quality" |
| Music-metadata 7.x | Music-metadata 11.10.6 | Package.json shows current | Better TypeScript support, more format coverage |

**Deprecated/outdated:**
- Manual EXIF parsing: Use exifreader (already in deps)
- Custom CSV parsing: Use ContentValidator (already built)
- Image magic bytes only: Use StructuralValidator for deep validation (already built)
- Separate quality validation phase: Integrate SSIM into conversion tests per ADV-08

## Open Questions

Things that couldn't be fully resolved:

1. **Audio Spectrogram Analysis for Lossy Validation**
   - What we know: essentia.js and spectro packages exist for Node.js spectrogram generation
   - What's unclear: Whether spectrogram analysis adds value over simpler metrics (duration, sample rate, bitrate match) for ADV-13
   - Recommendation: Start with simpler validation (metadata comparison) and add spectrogram only if bugs surface that simple metrics miss. Complexity vs. value tradeoff.

2. **PDF Text Extraction Library Choice**
   - What we know: pdfjs-dist already in dependencies (used by workers), pdf-parse is simpler for text extraction
   - What's unclear: Whether to add pdf-parse or use existing pdfjs-dist for test validation
   - Recommendation: Try pdfjs-dist first (no new dependency), fallback to pdf-parse if API is too complex for test needs

3. **SSIM Threshold for Mixed Lossy Conversions**
   - What we know: Lossless >0.99, single lossy pass >0.95 based on research
   - What's unclear: Appropriate threshold for JPEG→WebP (two lossy formats) or PNG→JPEG→WebP chains
   - Recommendation: Start with 0.90 for lossy→lossy conversions, adjust based on actual results. Document rationale in test comments.

4. **Partially Implemented Format Support**
   - What we know: User decision to use test.skip() for unsupported conversions
   - What's unclear: Which specific format combinations are not yet implemented
   - Recommendation: Run quick manual test of each conversion pair in UI, document unsupported combinations in test file header comments

5. **Archive Format Support Beyond ZIP**
   - What we know: ArchiveFactory supports TAR/TGZ/TBZ2/TXZ but requires system commands (bzip2, xz)
   - What's unclear: Whether CI environment has these tools installed
   - Recommendation: Test in CI, use test.skip() with environment checks if tools missing. Focus on ZIP and TGZ (most common) as primary validation targets.

## Sources

### Primary (HIGH confidence)
- ssim.js GitHub repository - SSIM implementation and API
- music-metadata npm package documentation - parseBuffer audio validation
- Package.json (apps/frontend) - Current library versions and dependencies
- Existing test infrastructure (Phase 2 validators, Phase 3 patterns) - Direct codebase examination
- [SSIM GitHub Repository](https://github.com/obartra/ssim) - Installation and usage
- [SSIM Visually Lossless Thresholds Study](https://pmc.ncbi.nlm.nih.gov/articles/PMC9918960/) - MS-SSIM 0.997 for visually lossless
- [Structural Similarity Index Measure - Wikipedia](https://en.wikipedia.org/wiki/Structural_similarity) - SSIM fundamentals

### Secondary (MEDIUM confidence)
- [Node.js Compare Images Guide](https://www.w3tutorials.net/blog/nodejs-compare-images/) - SSIM usage patterns
- [Playwright Best Practices 2026](https://www.browserstack.com/guide/playwright-best-practices) - File download validation
- [Archive Integrity Verification - LabEx](https://labex.io/tutorials/linux-how-to-check-zip-archive-integrity-425775) - ZIP/TAR checksum validation
- [CSV vs JSON vs XML Comparison 2026](https://sonra.io/csv-vs-json-vs-xml/) - Data integrity preservation patterns
- [ExcelJS npm documentation](https://www.npmjs.com/package/exceljs) - Spreadsheet validation
- [JSZip Documentation](https://stuk.github.io/jszip/) - Archive manipulation API
- [pdf-parse npm](https://www.npmjs.com/package/pdf-parse) - PDF text extraction capabilities

### Tertiary (LOW confidence)
- WebSearch: "audio lossless verification" - General FLAC/WAV comparison concepts (not library-specific)
- WebSearch: "audio spectrogram analysis Node.js" - essentia.js and spectro mentioned but not deeply investigated

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified in package.json or directly tested in codebase
- Architecture: HIGH - Phase 3 patterns proven in production, validators already built and tested
- Pitfalls: MEDIUM - Based on common testing issues and library documentation, some speculation on edge cases
- SSIM implementation: HIGH - Official documentation and research papers provide clear guidance
- Audio lossless validation: MEDIUM - Concept proven but specific implementation details need verification
- Archive validation: MEDIUM - JSZip capabilities verified, TAR validation needs implementation testing

**Research date:** 2026-01-24
**Valid until:** 2026-02-24 (30 days - stable testing domain, libraries mature)
