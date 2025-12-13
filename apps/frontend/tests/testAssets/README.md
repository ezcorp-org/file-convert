# Test Assets

This directory contains real-world test files for edge case testing.

## Directory Structure

```
testAssets/
├── images/
│   ├── edge-cases/      # Large files, unusual dimensions, corrupted samples
│   └── metadata/        # Files with EXIF/XMP data for preservation tests
├── audio/
│   └── edge-cases/      # Long audio, unusual sample rates, corrupted samples
├── documents/
│   └── edge-cases/      # Complex PDFs, large documents
└── archives/
    └── edge-cases/      # Deep nesting, many files, encrypted samples
```

## Inclusion Criteria

Files should only be added to testAssets if they:

1. **Cannot be synthetically generated** - The edge case requires specific
   real-world characteristics that factories cannot reproduce
2. **Have documented provenance** - Source and license must be documented
3. **Are legally shareable** - Must be public domain, CC0, or have explicit
   permission for open source use
4. **Are under 10MB** - Keep repository size manageable
5. **Test a specific edge case** - Each file should document what it tests

## Adding Files

When adding a file, document it in this format:

```markdown
### filename.ext

- **Source:** [Where the file came from]
- **License:** [Public domain/CC0/MIT/etc]
- **Edge case:** [What this file tests]
- **Expected behavior:** [success/error with message]
```

## Current Assets

Currently empty. Files will be added during Phase 3+ testing when specific
edge cases are discovered that require real-world samples.

## Note on Synthetic Fixtures

Most test scenarios should use the fixture factories in `tests/fixtures/factories/`:

- `ImageFactory` - PNG, JPEG, WebP with configurable dimensions
- `AudioFactory` - WAV with configurable duration, sample rate
- `DocumentFactory` - PDF, TXT, HTML, MD
- `SpreadsheetFactory` - XLSX, CSV, JSON, YAML, XML
- `ArchiveFactory` - ZIP, TAR with configurable contents

These generate fresh, consistent fixtures without git bloat. Only add real
files here when synthetic generation is insufficient.
