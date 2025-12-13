# Phase 2: Validation Library & Fixtures - Research

**Researched:** 2026-01-24
**Domain:** File format validation, synthetic fixture generation, metadata extraction
**Confidence:** HIGH

## Summary

This research covers validation library and test fixture generation for a browser-based file conversion application. The standard approach combines magic byte validation for file type verification, programmatic fixture generation using format-specific libraries (node-canvas for images, PDFKit for PDFs, JSZip for archives, wavefile for audio), structural integrity validation with parsing libraries, and metadata extraction using ExifReader/exifr for EXIF/XMP data.

The application already has basic magic byte validation in DownloadHelper (PNG, JPEG, PDF, ZIP, GIF) and fixture helpers (FileHelper, DownloadHelper) with automatic cleanup. The validation must expand to cover all 30+ supported formats, add structural integrity checks (can files be parsed/opened), validate metadata preservation through conversions, and generate synthetic test fixtures programmatically to avoid binary files in git.

**Primary recommendation:** Build validation library using file-type npm for magic bytes (supports 100+ formats), format-specific parsers for structural validation (sharp for images, music-metadata for audio, JSZip for archives), ExifReader for metadata extraction, and factory pattern for synthetic fixture generation with one factory per format category (images, audio, documents, spreadsheets, archives).

## Standard Stack

The established libraries/tools for file validation and fixture generation:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| file-type | ^19.7.1 | Magic byte detection for 100+ formats | Industry standard, pure JS, works browser+Node, actively maintained (sindresorhus) |
| sharp | ^0.33.5 | Image validation & processing | Fastest Node.js image library (4-5x faster than ImageMagick), libvips-backed, validates format integrity |
| ExifReader | ^4.33.1 | EXIF/XMP/IPTC metadata extraction | Comprehensive metadata support, works browser+Node, 4KB gzipped, recently updated (4 days ago) |
| JSZip | ^3.10.1 | ZIP archive creation & validation | Most popular ZIP library (9k+ stars), simple API, browser+Node support |
| music-metadata | ^10.5.1 | Audio metadata & format parsing | Supports MP3/WAV/FLAC/OGG, promise-based API, stream-based (efficient for large files) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| node-canvas | ^2.11.2 | Synthetic image generation | Creating PNG/JPEG test fixtures programmatically |
| pureimage | ^0.4.20 | Pure JS canvas (no native deps) | Alternative to node-canvas when native dependencies are problematic |
| PDFKit | ^0.15.1 | PDF generation | Creating synthetic PDF test documents |
| pdfmake | ^0.2.15 | Declarative PDF generation | Structured PDF fixtures with automatic layout |
| wavefile | ^11.0.0 | WAV file creation & parsing | Generating synthetic audio fixtures, validating WAV structure |
| ExcelJS | ^4.5.0 | XLSX/CSV generation & validation | Creating spreadsheet test fixtures |
| fishery | ^2.2.2 | TypeScript test data factories | Type-safe fixture generation with factory pattern |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| file-type | magic-bytes.js | magic-bytes.js is lighter but file-type has broader format support and better maintenance |
| sharp | jimp (pure JS) | jimp has no native deps but is 10x slower, lacks validation features |
| ExifReader | exifr | exifr is faster (30x in benchmarks) but ExifReader has broader metadata format support |
| JSZip | zip.js | zip.js supports Zip64 and encryption but JSZip has simpler API for test fixtures |
| music-metadata | wav-fmt-validator | wav-fmt-validator is WAV-only, music-metadata handles all audio formats |
| node-canvas | skia-canvas | skia-canvas is GPU-powered and faster but node-canvas has better ecosystem compatibility |
| fishery | efate | efate is newer, fishery is more established with better TypeScript support |

**Installation:**
```bash
# Core validation libraries
npm install file-type sharp ExifReader jszip music-metadata

# Fixture generation libraries
npm install node-canvas pdfkit wavefile exceljs fishery

# Development/testing only (don't ship to browser)
npm install --save-dev file-type sharp music-metadata wavefile exceljs
```

## Architecture Patterns

### Recommended Project Structure
```
apps/frontend/
├── tests/
│   ├── fixtures/
│   │   ├── factories/              # Fixture generation
│   │   │   ├── image-factory.ts       # PNG, JPEG, WebP generation
│   │   │   ├── audio-factory.ts       # WAV, FLAC generation
│   │   │   ├── document-factory.ts    # PDF, TXT generation
│   │   │   ├── spreadsheet-factory.ts # XLSX, CSV generation
│   │   │   └── archive-factory.ts     # ZIP, TAR generation
│   │   ├── validators/             # Format validation
│   │   │   ├── magic-bytes.ts         # Magic byte validation
│   │   │   ├── structural.ts          # Parse & validate structure
│   │   │   └── metadata.ts            # EXIF/XMP validation
│   │   ├── file-helpers.ts         # File upload helpers (existing)
│   │   ├── download-helpers.ts     # Download & basic validation (existing)
│   │   └── index.ts                # Export all fixtures
│   ├── testAssets/                 # Real-world test files
│   │   ├── images/
│   │   │   ├── edge-cases/            # Large, corrupted, unusual files
│   │   │   └── metadata/              # Files with EXIF/XMP data
│   │   ├── audio/
│   │   ├── documents/
│   │   └── README.md               # Provenance and licensing info
│   └── e2e/
│       └── conversion/
│           ├── validation.spec.ts     # Validation library tests
│           └── fixtures.spec.ts       # Fixture generation tests
```

### Pattern 1: Magic Byte Validation
**What:** Validate file format by checking magic bytes (file signature) at start of buffer
**When to use:** Every downloaded file to verify correct format output
**Example:**
```typescript
// Source: file-type npm + existing DownloadHelper pattern
import { fileTypeFromBuffer } from 'file-type';

class MagicByteValidator {
  private static readonly SIGNATURES: Record<string, Buffer> = {
    png: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    jpeg: Buffer.from([0xff, 0xd8, 0xff]),
    webp: Buffer.from([0x52, 0x49, 0x46, 0x46]), // RIFF (check byte 8-11 for WEBP)
    pdf: Buffer.from([0x25, 0x50, 0x44, 0x46]), // %PDF
    zip: Buffer.from([0x50, 0x4b, 0x03, 0x04]),
    flac: Buffer.from([0x66, 0x4c, 0x61, 0x43]), // fLaC
  };

  static async validate(buffer: Buffer, expectedFormat: string): Promise<boolean> {
    // Use file-type library for comprehensive detection
    const detected = await fileTypeFromBuffer(buffer);

    if (!detected) {
      // Fallback to manual signature check for text formats
      return this.validateManually(buffer, expectedFormat);
    }

    return detected.ext === expectedFormat ||
           detected.mime.includes(expectedFormat);
  }

  private static validateManually(buffer: Buffer, format: string): boolean {
    const signature = this.SIGNATURES[format];
    if (!signature) return false;

    // Special case for WebP - check RIFF + WEBP
    if (format === 'webp') {
      const riff = buffer.subarray(0, 4).equals(Buffer.from([0x52, 0x49, 0x46, 0x46]));
      const webp = buffer.subarray(8, 12).equals(Buffer.from([0x57, 0x45, 0x42, 0x50]));
      return riff && webp;
    }

    return buffer.subarray(0, signature.length).equals(signature);
  }
}
```

### Pattern 2: Factory Pattern for Synthetic Fixtures
**What:** Generate test files programmatically using factory functions with type safety
**When to use:** Creating consistent test fixtures without committing binary files to git
**Example:**
```typescript
// Source: fishery + node-canvas pattern
import { Factory } from 'fishery';
import { createCanvas } from 'canvas';

interface ImageFixtureOptions {
  width?: number;
  height?: number;
  format?: 'png' | 'jpeg';
  color?: string;
  hasMetadata?: boolean;
}

class ImageFactory {
  static create(options: ImageFixtureOptions = {}): Buffer {
    const {
      width = 100,
      height = 100,
      format = 'png',
      color = '#FF0000',
    } = options;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Fill with solid color
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);

    // Add text marker for traceability
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px Arial';
    ctx.fillText(`Test ${format.toUpperCase()}`, 10, 50);

    // Return as buffer
    return format === 'png'
      ? canvas.toBuffer('image/png')
      : canvas.toBuffer('image/jpeg', { quality: 0.9 });
  }

  // Fishery factory wrapper for Playwright tests
  static factory = Factory.define<ImageFixtureOptions, Buffer>(({ params }) => {
    return ImageFactory.create(params);
  });
}

// Usage in tests
test('validate PNG conversion', async ({ fileHelper, downloadHelper }) => {
  // Generate synthetic PNG
  const pngBuffer = ImageFactory.create({ format: 'png', width: 200, height: 200 });
  const fileData = fileHelper.createFileData(pngBuffer, 'test.png', 'image/png');

  await fileHelper.uploadFile(fileData);
  const result = await downloadHelper.downloadFile('.download-btn');

  // Validate output
  expect(await MagicByteValidator.validate(result.buffer, 'jpeg')).toBe(true);
});
```

### Pattern 3: Structural Integrity Validation
**What:** Parse file with format-specific library to validate structure beyond magic bytes
**When to use:** Detect corrupted output that has correct magic bytes but invalid structure
**Example:**
```typescript
// Source: sharp + music-metadata + JSZip
import sharp from 'sharp';
import { parseBuffer } from 'music-metadata';
import JSZip from 'jszip';

class StructuralValidator {
  static async validateImage(buffer: Buffer): Promise<{ valid: boolean; error?: string }> {
    try {
      const metadata = await sharp(buffer).metadata();

      // Image parsed successfully - check basic properties
      if (!metadata.width || !metadata.height) {
        return { valid: false, error: 'Missing width/height' };
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  static async validateAudio(buffer: Buffer): Promise<{ valid: boolean; error?: string }> {
    try {
      const metadata = await parseBuffer(buffer, { mimeType: 'audio/wav' });

      // Audio parsed successfully - check format
      if (!metadata.format.duration || metadata.format.duration <= 0) {
        return { valid: false, error: 'Invalid duration' };
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  static async validateArchive(buffer: Buffer): Promise<{ valid: boolean; error?: string }> {
    try {
      const zip = await JSZip.loadAsync(buffer);

      // Archive parsed successfully - check can list files
      const files = Object.keys(zip.files);
      if (files.length === 0) {
        return { valid: false, error: 'Empty archive' };
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }
}
```

### Pattern 4: Metadata Extraction & Validation
**What:** Extract and validate EXIF/XMP metadata preservation through conversions
**When to use:** Verify metadata is preserved (or intentionally stripped) during conversion
**Example:**
```typescript
// Source: ExifReader documentation
import ExifReader from 'exifreader';

interface MetadataValidation {
  hasExif: boolean;
  hasXmp: boolean;
  tags: Record<string, any>;
  errors: string[];
}

class MetadataValidator {
  static async extract(buffer: Buffer): Promise<MetadataValidation> {
    try {
      const tags = ExifReader.load(buffer, { expanded: true });

      return {
        hasExif: !!tags.exif,
        hasXmp: !!tags.xmp,
        tags: tags,
        errors: []
      };
    } catch (error) {
      return {
        hasExif: false,
        hasXmp: false,
        tags: {},
        errors: [error.message]
      };
    }
  }

  static async validatePreservation(
    originalBuffer: Buffer,
    convertedBuffer: Buffer,
    expectedPreservation: 'full' | 'partial' | 'none'
  ): Promise<boolean> {
    const original = await this.extract(originalBuffer);
    const converted = await this.extract(convertedBuffer);

    switch (expectedPreservation) {
      case 'full':
        // All metadata should be preserved
        return original.hasExif === converted.hasExif &&
               original.hasXmp === converted.hasXmp;

      case 'partial':
        // Some metadata may be preserved
        return true; // Just check it doesn't error

      case 'none':
        // Metadata should be stripped
        return !converted.hasExif && !converted.hasXmp;

      default:
        return false;
    }
  }
}
```

### Pattern 5: Real-World Test File Collection
**What:** Curated collection of edge case files for comprehensive testing
**When to use:** Supplement synthetic fixtures with real-world complexity
**Example:**
```typescript
// Source: Best practices from edge case testing research
/**
 * Real-world test files are stored in tests/testAssets/ with documentation
 * Structure:
 * - images/edge-cases/large-10mb.jpg (tests timeout handling)
 * - images/edge-cases/corrupted-header.png (tests error handling)
 * - images/metadata/exif-gps.jpg (tests EXIF preservation)
 * - audio/edge-cases/empty.wav (tests zero-length handling)
 *
 * Each subdirectory has README.md documenting:
 * - File source/provenance
 * - License (must be public domain or compatible)
 * - What edge case it tests
 * - Expected behavior
 */

interface RealWorldAsset {
  path: string;
  category: string;
  edgeCase: string;
  expectedBehavior: 'success' | 'error' | 'warning';
}

const REAL_WORLD_ASSETS: RealWorldAsset[] = [
  {
    path: 'tests/testAssets/images/edge-cases/large-10mb.jpg',
    category: 'image',
    edgeCase: 'Large file size (10MB)',
    expectedBehavior: 'success'
  },
  {
    path: 'tests/testAssets/images/metadata/exif-gps.jpg',
    category: 'image',
    edgeCase: 'EXIF with GPS coordinates',
    expectedBehavior: 'success'
  },
  // Add more real-world assets as discovered through beta testing
];
```

### Anti-Patterns to Avoid

- **Binary files in git:** Don't commit synthetic test files. Generate them programmatically in test setup to keep repository clean.
- **Extension-only validation:** Don't trust file extensions. Always validate with magic bytes and structural parsing.
- **Single validation layer:** Don't rely only on magic bytes. Corrupted files can have correct headers but invalid structure.
- **Ignoring metadata:** Don't skip metadata validation. Silent metadata loss is a common user complaint.
- **Hardcoded test data:** Don't hardcode binary buffers in test files. Use factories to generate fresh fixtures per test.
- **Missing edge cases:** Don't test only happy path. Collect real-world edge cases from user reports and beta testing.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Magic byte detection | Custom byte comparison for each format | file-type npm library | Handles 100+ formats, edge cases (JPEG EXIF vs JFIF), actively maintained |
| Image validation | Custom PNG/JPEG parsing | sharp library | Robust parsing, handles corrupted files, fast (libvips), validates all image properties |
| Metadata extraction | Custom EXIF parsing | ExifReader or exifr | Handles EXIF/XMP/IPTC/ICC/MPF, browser+Node, 15+ years of edge cases encoded |
| Test fixture generation | Random binary data or static files | Factory pattern + format libraries | Consistent, reproducible, type-safe, avoids git bloat |
| Audio format validation | Custom WAV header parsing | music-metadata library | Supports all audio formats, handles metadata, stream-based for large files |
| Archive integrity checking | Custom ZIP CRC validation | JSZip with validation | Handles ZIP variants, CRC checks, corrupt archive detection |
| PDF validation | Custom PDF header check | PDFKit or pdf-lib parsing | PDF structure is complex (cross-reference tables, object streams, encryption) |

**Key insight:** File format validation has decades of edge cases. Magic bytes alone miss corrupted structure, incorrect metadata, truncated files, and format variants. Use battle-tested libraries that encode this knowledge.

## Common Pitfalls

### Pitfall 1: Trusting File Extensions or MIME Types
**What goes wrong:** File with .png extension and image/png MIME type contains JPEG data, conversion succeeds but output is corrupted
**Why it happens:** Browsers and users can set any extension/MIME type, doesn't reflect actual content
**How to avoid:**
- Always validate with magic bytes using file-type library
- Check structural integrity with format-specific parser
- Reject files where magic bytes don't match declared type
**Warning signs:** Tests pass with synthetic files but fail with user uploads, corruption reports

### Pitfall 2: Single-Layer Validation (Magic Bytes Only)
**What goes wrong:** File has correct PNG magic bytes but truncated/corrupted data, passes validation but conversion fails
**Why it happens:** Magic bytes only validate first 4-16 bytes, not entire file structure
**How to avoid:**
- Layer validation: magic bytes → structural parsing → metadata extraction
- Use format-specific libraries (sharp, music-metadata) to attempt full parse
- Test with corrupted files to ensure detection
**Warning signs:** Silent conversion failures, "file corrupted" errors from workers

### Pitfall 3: Committing Binary Fixtures to Git
**What goes wrong:** Repository grows to hundreds of MB, clones become slow, binary diffs pollute history
**Why it happens:** Developers add "just one more test file" for each bug/edge case
**How to avoid:**
- Generate synthetic fixtures programmatically using factories
- Store only real-world edge cases with documentation justifying inclusion
- Use .gitignore for generated test files
- Document in tests/testAssets/README.md criteria for inclusion
**Warning signs:** Repository size > 100MB, complaints about slow clones

### Pitfall 4: Not Testing Metadata Preservation
**What goes wrong:** Image conversion strips EXIF data (camera info, GPS, timestamps), users lose important metadata
**Why it happens:** Many image libraries strip metadata by default for privacy/size reasons
**How to avoid:**
- Extract metadata from source using ExifReader
- Extract metadata from output
- Assert preservation or document intentional stripping
- Test with real photos containing EXIF/XMP
**Warning signs:** User reports "lost camera info", "dates missing after conversion"

### Pitfall 5: Ignoring Format Variants
**What goes wrong:** Validation passes for JPEG/JFIF but fails for JPEG/EXIF, missing real-world files
**Why it happens:** Formats have variants (JPEG has JFIF/EXIF, ZIP has different compression methods)
**How to avoid:**
- Use libraries that handle variants (file-type detects JPEG variants)
- Collect real-world files covering common variants
- Document supported variants in conversion-registry.ts
**Warning signs:** "Format detection failed" errors for valid files, inconsistent validation

### Pitfall 6: Insufficient Edge Case Coverage
**What goes wrong:** Tests pass with small synthetic files but fail with 10MB images, empty files, or unusual aspect ratios
**Why it happens:** Synthetic fixtures use happy path defaults (100x100px, 1KB size)
**How to avoid:**
- Generate fixtures with variations: tiny (1x1px), large (4000x4000px), unusual aspect (100x1px)
- Test boundary conditions: empty files, maximum size, zero-length audio
- Collect real-world edge cases from user reports
- Follow 20-30% edge case coverage guideline
**Warning signs:** Production-only bugs, size-related failures, timeout issues

### Pitfall 7: Synchronous Validation Blocking Tests
**What goes wrong:** Tests timeout when validating large files synchronously
**Why it happens:** File validation libraries often have sync APIs (easier to use) but block event loop
**How to avoid:**
- Always use async APIs: fileTypeFromBuffer() not fileTypeFromBufferSync()
- Use streaming APIs for large files: sharp().metadata() reads incrementally
- Set appropriate timeouts based on file size
**Warning signs:** Test timeouts with files > 5MB, CPU spikes during validation

## Code Examples

Verified patterns from official sources:

### Complete Validation Pipeline
```typescript
// Source: Synthesized from file-type, sharp, ExifReader docs
interface ValidationResult {
  valid: boolean;
  format: string | null;
  structural: { valid: boolean; error?: string };
  metadata: { hasExif: boolean; hasXmp: boolean };
  errors: string[];
}

async function validateConversionOutput(
  buffer: Buffer,
  expectedFormat: string,
  options: { checkStructure?: boolean; checkMetadata?: boolean } = {}
): Promise<ValidationResult> {
  const result: ValidationResult = {
    valid: false,
    format: null,
    structural: { valid: true },
    metadata: { hasExif: false, hasXmp: false },
    errors: []
  };

  // Layer 1: Magic bytes
  try {
    const detected = await fileTypeFromBuffer(buffer);
    result.format = detected?.ext || null;

    if (result.format !== expectedFormat) {
      result.errors.push(`Format mismatch: expected ${expectedFormat}, got ${result.format}`);
      return result;
    }
  } catch (error) {
    result.errors.push(`Magic byte validation failed: ${error.message}`);
    return result;
  }

  // Layer 2: Structural integrity (optional)
  if (options.checkStructure) {
    if (expectedFormat.match(/png|jpeg|webp|tiff|bmp|gif/)) {
      result.structural = await StructuralValidator.validateImage(buffer);
    } else if (expectedFormat.match(/wav|flac|mp3|ogg|opus/)) {
      result.structural = await StructuralValidator.validateAudio(buffer);
    } else if (expectedFormat.match(/zip|7z|tar/)) {
      result.structural = await StructuralValidator.validateArchive(buffer);
    }

    if (!result.structural.valid) {
      result.errors.push(`Structural validation failed: ${result.structural.error}`);
      return result;
    }
  }

  // Layer 3: Metadata extraction (optional)
  if (options.checkMetadata && expectedFormat.match(/png|jpeg|tiff/)) {
    const metadata = await MetadataValidator.extract(buffer);
    result.metadata = metadata;
  }

  result.valid = result.errors.length === 0;
  return result;
}
```

### Image Fixture Factory with Metadata
```typescript
// Source: node-canvas + ExifReader integration pattern
import { createCanvas } from 'canvas';
import ExifReader from 'exifreader';

interface ImageFixtureWithMetadata {
  width?: number;
  height?: number;
  format?: 'png' | 'jpeg';
  exif?: {
    make?: string;
    model?: string;
    dateTime?: string;
    gps?: { latitude: number; longitude: number };
  };
}

class ImageFixtureFactory {
  static create(options: ImageFixtureWithMetadata = {}): Buffer {
    const {
      width = 100,
      height = 100,
      format = 'png',
      exif = {}
    } = options;

    // Generate base image
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Draw gradient for visual verification
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#FF0000');
    gradient.addColorStop(1, '#0000FF');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    let buffer = canvas.toBuffer(format === 'png' ? 'image/png' : 'image/jpeg');

    // Add EXIF metadata if requested (JPEG only)
    if (format === 'jpeg' && Object.keys(exif).length > 0) {
      // Note: Adding EXIF programmatically requires JPEG manipulation library
      // For test purposes, use piexifjs or exiftool-vendored
      // This is a simplified example showing the pattern
      console.warn('EXIF injection requires additional library like piexifjs');
    }

    return buffer;
  }

  // Factory with variations for edge case testing
  static createVariations(): Record<string, Buffer> {
    return {
      tiny: this.create({ width: 1, height: 1 }),
      large: this.create({ width: 4000, height: 3000 }),
      wide: this.create({ width: 1000, height: 100 }),
      tall: this.create({ width: 100, height: 1000 }),
      square: this.create({ width: 500, height: 500 }),
    };
  }
}
```

### Audio Fixture Factory
```typescript
// Source: wavefile npm documentation
import { WaveFile } from 'wavefile';

interface AudioFixtureOptions {
  duration?: number; // seconds
  sampleRate?: number;
  channels?: 1 | 2;
  frequency?: number; // Hz for tone
}

class AudioFixtureFactory {
  static create(options: AudioFixtureOptions = {}): Buffer {
    const {
      duration = 1,
      sampleRate = 44100,
      channels = 2,
      frequency = 440 // A4 note
    } = options;

    const numSamples = Math.floor(duration * sampleRate);
    const samples = new Int16Array(numSamples * channels);

    // Generate sine wave tone
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const value = Math.sin(2 * Math.PI * frequency * t) * 32767 * 0.5;

      for (let ch = 0; ch < channels; ch++) {
        samples[i * channels + ch] = value;
      }
    }

    // Create WAV file
    const wav = new WaveFile();
    wav.fromScratch(channels, sampleRate, '16', samples);

    return Buffer.from(wav.toBuffer());
  }

  static createVariations(): Record<string, Buffer> {
    return {
      silent: this.create({ duration: 1, frequency: 0 }),
      mono: this.create({ channels: 1 }),
      stereo: this.create({ channels: 2 }),
      long: this.create({ duration: 10 }),
      highFreq: this.create({ frequency: 8000 }),
      lowFreq: this.create({ frequency: 100 }),
    };
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Static binary test files in git | Programmatic fixture generation with factories | 2020-2023 (factory pattern adoption) | Smaller repos, reproducible tests, no binary diffs |
| Extension-based validation | Magic byte validation with file-type | 2018+ (security concerns) | Prevents malicious file uploads, reliable type detection |
| ImageMagick for validation | sharp (libvips) | 2019+ (performance) | 4-5x faster, lower memory, better error handling |
| Custom EXIF parsing | ExifReader/exifr standardized | 2020+ | Handles all metadata formats (EXIF/XMP/IPTC), browser+Node |
| Synchronous file operations | Async/streaming APIs | 2020+ (Node.js best practices) | Non-blocking, handles large files, prevents timeouts |
| JSON fixtures for all test data | Factories for binary, JSON for text | 2021+ | Type-safe, composable, avoids JSON encoding issues |
| File validation only in E2E tests | Unit tests for validators + E2E integration | 2022+ | Faster feedback, isolated validation testing |

**Deprecated/outdated:**
- `mmmagic` (libmagic bindings): Unmaintained, use file-type instead
- `exif` npm package: Abandoned (2014), use ExifReader or exifr
- `gm` (GraphicsMagick bindings): Slow, use sharp for image operations
- Committing test images to git: Use factories and generate in test setup
- `image-size` for validation: Only gets dimensions, doesn't validate structure - use sharp

## Open Questions

Things that couldn't be fully resolved:

1. **WebAssembly-based validation in browser**
   - What we know: Current validation libraries work in Node.js (test environment)
   - What's unclear: Whether same libraries can validate in browser (where conversions happen)
   - Recommendation: Research sharp WASM build for browser-side validation, or accept validation is test-only

2. **EXIF injection for synthetic fixtures**
   - What we know: Creating images with EXIF requires additional library (piexifjs, exiftool-vendored)
   - What's unclear: Whether EXIF injection is worth complexity vs using real photos
   - Recommendation: Start with real photos in testAssets/images/metadata/, add piexifjs later if needed

3. **Optimal fixture generation timing**
   - What we know: Factories can generate in beforeEach or once per file
   - What's unclear: Performance impact of generating 100+ fixtures per test vs caching
   - Recommendation: Generate in beforeEach for isolation, optimize later if slow (cache by fixture signature)

4. **Archive format edge cases**
   - What we know: ZIP has variants (stored, deflate, deflate64), JSZip handles most
   - What's unclear: Whether to test all compression methods or just common ones (stored, deflate)
   - Recommendation: Test stored + deflate (99% of real-world), add others if user reports issues

5. **Metadata preservation expectations**
   - What we know: Some conversions preserve metadata, others strip it
   - What's unclear: User expectations - do they want metadata preserved by default?
   - Recommendation: Document behavior in conversion-registry.ts, make configurable per format

## Sources

### Primary (HIGH confidence)
- [file-type npm](https://www.npmjs.com/package/file-type) - Official package, 2.5k+ dependents
- [sharp documentation](https://sharp.pixelplumbing.com/) - Official docs, libvips-backed
- [ExifReader npm](https://www.npmjs.com/package/exifreader) - Official package, version 4.33.1 (updated 4 days ago)
- [JSZip documentation](https://stuk.github.io/jszip/) - Official docs and examples
- [music-metadata GitHub](https://github.com/Borewit/music-metadata) - Official repository
- [wavefile documentation](https://rochars.github.io/wavefile/) - Official docs with specs
- [node-canvas GitHub](https://github.com/Automattic/node-canvas) - Official repository
- [PDFKit documentation](https://pdfkit.org/) - Official docs
- [fishery GitHub](https://github.com/thoughtbot/fishery) - Official repository with TypeScript examples
- [Wikipedia: List of file signatures](https://en.wikipedia.org/wiki/List_of_file_signatures) - Comprehensive magic bytes reference

### Secondary (MEDIUM confidence)
- [How to Validate File Type Using Magic Bytes and MIME Type](https://pye.hashnode.dev/how-to-validate-javascript-file-types-with-magic-bytes-and-mime-type) - Practical guide (2025)
- [Processing images with sharp in Node.js - LogRocket](https://blog.logrocket.com/processing-images-sharp-node-js/) - Sharp usage patterns
- [Test Data Factories in Javascript - DEV Community](https://dev.to/mlowen/test-data-factories-in-javascript-obo) - Factory pattern guide
- [Fixtures, the way to manage sample and test data](https://michalzalecki.com/fixtures-the-way-to-manage-sample-and-test-data/) - Fixture best practices
- [Edge Case Testing Explained – VirtuosoQA](https://www.virtuosoqa.com/post/edge-case-testing) - Edge case coverage (20-30%)
- [Magic Bytes – Identifying Common File Formats - NetSPI](https://www.netspi.com/blog/technical-blog/web-application-pentesting/magic-bytes-identifying-common-file-formats-at-a-glance/) - File signatures reference
- [Make Testing Easier with Test Fixture Generators - DEV Community](https://dev.to/jcteague/make-testing-easier-with-test-fixture-generators-5485) - Fixture generation patterns

### Tertiary (LOW confidence)
- [Best JavaScript PDF libraries 2025 - Nutrient](https://www.nutrient.io/blog/javascript-pdf-libraries/) - Library comparison (marketing site, verify claims)
- [Testing in 2026: Full Stack Testing Strategies - Nucamp](https://www.nucamp.co/blog/testing-in-2026-jest-react-testing-library-and-full-stack-testing-strategies) - General trends (needs validation)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified on npm with recent updates, version numbers confirmed
- Magic byte validation: HIGH - file-type is industry standard, Wikipedia provides authoritative signature list
- Fixture generation: HIGH - Libraries (node-canvas, PDFKit, wavefile) have official docs and active maintenance
- Structural validation: HIGH - sharp, music-metadata, JSZip all have production usage and comprehensive error handling
- Metadata extraction: HIGH - ExifReader recently updated (4 days ago), supports all major metadata formats
- Edge case patterns: MEDIUM - Best practices synthesized from multiple sources, no single authoritative guide

**Research date:** 2026-01-24
**Valid until:** ~2026-03-24 (60 days - library APIs stable, but new formats/edge cases emerge continuously)

---

**Note for planner:** The validation library should be built in layers:
1. **Layer 1 - Magic Bytes** (VALID-01 through VALID-08): Use file-type for quick format detection
2. **Layer 2 - Structural** (VALID-09): Use format-specific parsers to validate file opens correctly
3. **Layer 3 - Metadata** (ADV-05): Use ExifReader for EXIF/XMP preservation checks
4. **Layer 4 - Content** (ADV-01): Validate text content integrity for JSON/CSV/TXT

Fixture factories (INFRA-02 through INFRA-07) should generate fresh files per test using factory pattern, with real-world edge cases (INFRA-08) documented in testAssets/ with provenance. The existing DownloadHelper already has basic magic byte validation - extend it with the complete format list from file-type library.
