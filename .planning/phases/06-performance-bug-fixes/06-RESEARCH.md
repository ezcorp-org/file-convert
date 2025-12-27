# Phase 6: Performance & Bug Fixes - Research

**Researched:** 2026-01-24
**Domain:** Performance benchmarking, Web Worker bug fixes, memory management
**Confidence:** HIGH (findings based on direct codebase analysis)

## Summary

This phase covers performance benchmarking infrastructure and fixing known bugs documented in CONCERNS.md. The codebase has significant existing infrastructure that can be leveraged: an `OptimizedConverter` class with basic performance metrics, a `MemoryMonitor` class, existing test fixtures with worker lifecycle management, and comprehensive magic byte validation. The key challenges are:

1. **Memory Leak in Message Handlers** - The `ConversionManager` does not remove message listeners in error paths
2. **PDF Worker Timeout** - Fixed 5-second timeout with no exponential backoff or configurable retry
3. **Audio Decoding Blocking UI** - AudioContext used in main thread (`manager.ts` lines 659-686)
4. **Text Format Spoofing** - CSV, TSV, YAML, JSON have no magic bytes - only extension validation

**Primary recommendation:** Fix memory leak first (highest impact, clear code path), then build benchmark infrastructure to prevent regressions during other fixes.

## Standard Stack

The established libraries/tools for this domain:

### Core (Already in Codebase)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vitest | present | Unit testing | Already configured with jsdom environment |
| Playwright | present | E2E testing | Already configured with fixtures |
| Performance API | browser | Timing metrics | Native, used in OptimizedConverter |

### Supporting (To Add)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| tinybench | ^3.0.0 | Microbenchmarking | Performance regression detection |
| baselines.json | N/A | JSON file | Store benchmark baselines |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| tinybench | Vitest bench | Vitest bench is newer, less mature but integrated |
| JSON baselines | SQLite | Overkill for simple threshold comparison |

**Installation:**
```bash
cd apps/frontend && bun add -D tinybench
```

## Architecture Patterns

### Recommended Project Structure
```
apps/frontend/
├── src/lib/
│   ├── benchmarks/           # NEW: Benchmark infrastructure
│   │   ├── baselines.json    # Committed baseline times
│   │   └── runner.ts         # Benchmark runner
│   └── conversion/
│       └── manager.ts        # Fix memory leak here
├── tests/
│   ├── benchmarks/           # NEW: Benchmark tests
│   │   ├── image.bench.ts
│   │   ├── audio.bench.ts
│   │   └── regression.spec.ts
│   └── e2e/
│       └── performance/      # NEW: Large file tests
│           └── large-files.spec.ts
└── static/workers/           # Fix workers here
```

### Pattern 1: Message Handler Lifecycle (Fix Memory Leak)

**What:** Ensure message handlers are always removed, especially in error paths
**When to use:** Any code that adds `addEventListener('message', ...)` to workers
**Example (Current Problematic Code):**
```typescript
// File: src/lib/conversion/manager.ts lines 334-430
// PROBLEM: messageHandler not removed in catch block

const messageHandler = (event: MessageEvent) => {
  // ... handler logic
  switch (event.data.type) {
    case 'RESULT':
      worker.removeEventListener('message', messageHandler);  // Only here
      break;
    case 'ERROR':
      worker.removeEventListener('message', messageHandler);  // Only here
      break;
    // No removal in catch block below!
  }
};

worker.addEventListener('message', messageHandler);

// ... later in catch block
} catch (error) {
  this.handleConversionError(id, error as Error);
  // MESSAGE HANDLER STILL ATTACHED!
}
```

**Fixed Pattern:**
```typescript
// Use try/finally to ensure cleanup
worker.addEventListener('message', messageHandler);

try {
  // ... conversion logic
} catch (error) {
  this.handleConversionError(id, error as Error);
} finally {
  // ALWAYS remove handler
  if (worker && messageHandler) {
    worker.removeEventListener('message', messageHandler);
  }
}
```

### Pattern 2: Benchmark with Baselines

**What:** Store timing baselines in JSON, compare against them in tests
**When to use:** Performance regression detection
**Example:**
```typescript
// baselines.json structure (from CONTEXT.md decision)
{
  "conversions": {
    "png-to-jpeg": {
      "baselineMs": 150,
      "threshold": 0.5,  // 50% regression threshold
      "fileSize": "1MB"
    }
  }
}

// In benchmark test
const result = await benchmark('png-to-jpeg');
const baseline = baselines.conversions['png-to-jpeg'];
const allowedMax = baseline.baselineMs * (1 + baseline.threshold);

expect(result.duration).toBeLessThan(allowedMax);
```

### Pattern 3: Worker Initialization with Retry

**What:** Add exponential backoff and longer timeouts for worker init
**When to use:** PDF worker and other slow-loading workers
**Current Problem (worker-manager.ts line 74):**
```typescript
const timeout = setTimeout(() => reject(new Error('Worker initialization timeout')), 5000);
```

**Better Pattern:**
```typescript
const initTimeout = 10000;  // Increased from 5000
const retryDelays = [500, 1000, 2000];  // Exponential backoff

async function initWithRetry(attempts: number = 3): Promise<Worker> {
  for (let i = 0; i < attempts; i++) {
    try {
      const worker = await initWorker(initTimeout);
      return worker;
    } catch (error) {
      if (i < attempts - 1) {
        await sleep(retryDelays[i]);
        continue;
      }
      throw error;
    }
  }
}
```

### Anti-Patterns to Avoid
- **Removing listeners conditionally:** Always use try/finally for cleanup
- **Hardcoded timeouts:** Use configurable values, especially for workers
- **Main-thread heavy processing:** AudioContext decoding blocks UI
- **Extension-only validation for text formats:** Add content parsing validation

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Performance timing | Manual Date.now() | `performance.now()` + `OptimizedConverter.startPerformanceMonitoring()` | Already exists in codebase |
| Magic byte validation | Custom byte checking | `validateFileSignature()` in `file-validation.ts` | Already comprehensive |
| Memory monitoring | Manual heap checks | `MemoryMonitor` class | Already has thresholds |
| Test fixtures | Ad-hoc file creation | `ImageFactory`, `FileHelper` | Already configured |
| Worker lifecycle | Manual tracking | `WorkerLifecycle` fixture | Already handles cleanup |

**Key insight:** The codebase has significant infrastructure already. Focus on fixing bugs and wiring up existing pieces, not building from scratch.

## Common Pitfalls

### Pitfall 1: Memory Leak from Orphaned Message Handlers
**What goes wrong:** Message listeners accumulate across failed conversions
**Why it happens:** Error paths don't call `removeEventListener`
**How to avoid:** Use try/finally pattern for all event listener cleanup
**Warning signs:** Memory growth over multiple conversion failures

**Locations to fix:**
- `src/lib/conversion/manager.ts` lines 334-430 (main messageHandler)
- `src/lib/workers/worker-manager.ts` lines 175-245 (similar pattern)

### Pitfall 2: PDF Worker Timeout Too Aggressive
**What goes wrong:** 5-second timeout causes failures on slow networks
**Why it happens:** PDF worker loads large pdfjs-dist library (~2-3MB)
**How to avoid:** Increase timeout, add exponential backoff
**Warning signs:** "Worker initialization timeout" errors

**Location to fix:**
- `src/lib/workers/worker-manager.ts` line 74

### Pitfall 3: AudioContext Blocking Main Thread
**What goes wrong:** UI freezes during MP3/FLAC decoding
**Why it happens:** `decodeAudioData` runs in main thread
**How to avoid:** Move to worker or use Web Audio API in worker context
**Warning signs:** "Decoding audio..." message while UI is unresponsive

**Location to fix:**
- `src/lib/conversion/manager.ts` lines 659-686 (`decodeAudioToWAV` method)

### Pitfall 4: Text Format Spoofing
**What goes wrong:** Malicious files with wrong extensions pass validation
**Why it happens:** CSV, TSV, JSON, YAML have no magic bytes
**How to avoid:** Add parser-level validation (try parsing, catch errors)
**Warning signs:** Files that look like one format but contain another

**Gaps in current validation (`file-validation.ts`):**
- CSV: No magic bytes, relies on extension
- TSV: No magic bytes, relies on extension
- JSON: No magic bytes, relies on extension
- YAML: No magic bytes, relies on extension
- TXT: No magic bytes, relies on extension

### Pitfall 5: Progress Bar Not Continuous
**What goes wrong:** Progress jumps from milestone to milestone
**Why it happens:** Workers report progress at fixed points (10%, 30%, 60%, etc.)
**How to avoid:** Add more frequent progress updates in workers
**Warning signs:** Progress bar appears "jumpy"

**Per CONTEXT.md decision:** Progress should be continuous, not milestone-based.

## Code Examples

Verified patterns from codebase:

### Current Performance Monitoring (Already Exists)
```typescript
// File: src/lib/converters/optimized-converter.ts lines 45-74
static startPerformanceMonitoring(jobId: string): void {
  this.performanceMetrics.set(jobId, {
    startTime: performance.now(),
    memoryUsageMB: this.getMemoryUsage()
  });
}

static endPerformanceMonitoring(jobId: string, fileSize: number): PerformanceMetrics | undefined {
  const metrics = this.performanceMetrics.get(jobId);
  if (!metrics) return undefined;

  metrics.endTime = performance.now();
  metrics.processingTimeMs = metrics.endTime - metrics.startTime;

  const fileSizeMB = fileSize / (1024 * 1024);
  const processingTimeSec = metrics.processingTimeMs / 1000;
  metrics.throughputMBps = fileSizeMB / processingTimeSec;

  return metrics;
}
```

### Current Memory Monitoring (Already Exists)
```typescript
// File: src/lib/converters/optimized-converter.ts lines 245-296
export class MemoryMonitor {
  private static readonly WARNING_THRESHOLD = 0.7;  // 70%
  private static readonly CRITICAL_THRESHOLD = 0.85; // 85%

  static getMemoryStatus(): 'safe' | 'warning' | 'critical' {
    const usage = this.getMemoryUsagePercentage();
    if (usage >= this.CRITICAL_THRESHOLD) return 'critical';
    if (usage >= this.WARNING_THRESHOLD) return 'warning';
    return 'safe';
  }
}
```

### Magic Byte Validation (Already Exists)
```typescript
// File: src/lib/utils/file-validation.ts lines 85-136
const FILE_SIGNATURES: { [key: string]: { offset: number; signature: number[] }[] } = {
  'png': [{ offset: 0, signature: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] }],
  'jpg': [
    { offset: 0, signature: [0xFF, 0xD8, 0xFF, 0xE0] },
    { offset: 0, signature: [0xFF, 0xD8, 0xFF, 0xE1] },
    // ... more signatures
  ],
  // Images, audio, archives, documents all covered
  // MISSING: csv, tsv, json, yaml, txt (no magic bytes exist)
};
```

### localStorage Usage (Bug Location)
```typescript
// File: src/lib/conversion/manager.ts lines 445-448
// PROBLEM: Uses localStorage (persists across sessions, privacy concern)
const currentConversions = parseInt(localStorage.getItem('lifetime_conversions') || '0');
const newConversions = currentConversions + 1;
localStorage.setItem('lifetime_conversions', newConversions.toString());
localStorage.setItem('last_conversion_date', new Date().toISOString());

// FIX: Use sessionStorage instead (per CONTEXT.md recommendation)
// sessionStorage.setItem('lifetime_conversions', ...);
// Or: Add explicit "reset stats" button
```

### Conversion Paths (30+ paths to benchmark)
```typescript
// File: src/lib/utils/conversion-registry.ts lines 58-125
// Total conversion paths: 44
// Image: 17 paths (png, jpeg, webp, bmp, gif, ico, pnm, tiff)
// Audio: 8 paths (wav, flac, mp3, ogg, opus)
// Archive: 7 paths (zip, tar, tgz, 7z)
// Document: 5 paths (docx, pdf)
// Spreadsheet: 6 paths (xlsx, csv, tsv, json)
// Text: 12 paths (txt, md, html, yaml, json, xml)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 5s worker timeout | Should be 10s+ with backoff | This phase | PDF reliability |
| localStorage for stats | sessionStorage recommended | This phase | Privacy fix |
| Extension-only for text | Need parser validation | This phase | Security fix |
| Main-thread audio decode | Should be in worker | This phase | UI responsiveness |

**Deprecated/outdated:**
- lamejs library (MP3 encoder) - No updates since 2016, limited MP3 support
- CDN-loaded Comlink - Should be bundled locally for reliability

## Open Questions

Things that couldn't be fully resolved:

1. **Exact benchmark file sizes for each format**
   - What we know: Per CONTEXT.md - 10MB images, 25MB audio, 50MB archives for CI
   - What's unclear: Optimal "standard" size for each format baseline
   - Recommendation: Use 1MB as consistent baseline for all conversion paths

2. **AudioContext in Worker thread**
   - What we know: AudioContext not available in standard Web Workers
   - What's unclear: Whether OfflineAudioContext works in workers, or need AudioWorklet
   - Recommendation: Research AudioWorklet approach or streaming decode libraries

3. **Mixed-batch format selection bug (from CONTEXT.md)**
   - What we know: Listed as "Claude's Discretion" to assess complexity
   - What's unclear: Exact bug behavior, reproduction steps
   - Recommendation: Investigate during implementation, scope if complex

## Sources

### Primary (HIGH confidence)
- `/home/dev/work/file-convert/apps/frontend/src/lib/conversion/manager.ts` - Message handler patterns
- `/home/dev/work/file-convert/apps/frontend/src/lib/workers/worker-manager.ts` - Worker initialization
- `/home/dev/work/file-convert/apps/frontend/src/lib/converters/optimized-converter.ts` - Existing perf infrastructure
- `/home/dev/work/file-convert/apps/frontend/src/lib/utils/file-validation.ts` - Magic byte validation
- `/home/dev/work/file-convert/.planning/codebase/CONCERNS.md` - Bug documentation

### Secondary (MEDIUM confidence)
- `/home/dev/work/file-convert/apps/frontend/tests/fixtures/` - Test infrastructure
- `/home/dev/work/file-convert/apps/frontend/tests/TEST_AUDIT.md` - Test status

### Tertiary (LOW confidence)
- AudioWorklet approach for audio decoding (needs verification)

## Metadata

**Confidence breakdown:**
- Memory leak fix: HIGH - Clear code path, well-documented
- PDF timeout fix: HIGH - Straightforward config change
- Benchmark infrastructure: HIGH - Existing pieces to wire together
- Audio decode fix: MEDIUM - May need AudioWorklet research
- Text format validation: MEDIUM - Approach clear, implementation details TBD

**Research date:** 2026-01-24
**Valid until:** 30 days (stable domain, implementation-focused)

---

## Appendix: Bug Locations Quick Reference

| Bug ID | File | Lines | Issue |
|--------|------|-------|-------|
| BUG-01 | `manager.ts` | 334-430 | Message handler not removed on error |
| BUG-02 | `manager.ts` | 340-354 | Message ID filtering inconsistent |
| BUG-03 | `worker-manager.ts` | 74 | PDF timeout too short (5s) |
| BUG-04 | `manager.ts` | 659-686 | Audio decode in main thread |
| BUG-05 | `file-validation.ts` | 85-136 | Missing text format validation |
| BUG-06 | `manager.ts` | 445-448 | localStorage privacy issue |

## Appendix: All Conversion Paths (44 total)

**Image (17):** png-jpeg, png-webp, png-tiff, jpeg-png, jpeg-webp, webp-png, webp-jpeg, bmp-png, bmp-jpeg, gif-png, gif-jpeg, gif-webp, ico-png, pnm-png, pnm-jpeg, png-pnm, jpeg-pnm

**Audio (8):** wav-flac, wav-mp3, wav-ogg, wav-opus, flac-wav, mp3-wav, ogg-wav, opus-wav

**Archive (7):** zip-tar, zip-tgz, zip-7z, tar-zip, tar-tgz, tgz-zip, 7z-zip

**Document (5):** docx-html, docx-txt, pdf-png, pdf-jpeg, pdf-txt

**Spreadsheet (6):** xlsx-csv, xlsx-json, csv-xlsx, csv-json, csv-tsv, tsv-csv

**Text (12):** txt-md, txt-html, md-txt, md-html, md-pdf, html-md, html-txt, html-pdf, yaml-json, json-yaml, xml-json, json-xml

## Appendix: Skipped Tests to Unskip (per "zero failures" goal)

From tests audit:
- `tests/e2e/error-handling/file-validation-errors.spec.ts` - 6 skipped tests
- `tests/e2e/error-handling/extension-spoofing.spec.ts` - 3 skipped tests
- `tests/e2e/error-handling/worker-crash-recovery.spec.ts` - 2 skipped tests
- `tests/e2e/conversion/audio-conversions.spec.ts` - 10+ skipped tests
- `tests/e2e/conversion/document-conversions.spec.ts` - 12 skipped tests
- `tests/e2e/validation/metadata-preservation.spec.ts` - 2 skipped tests

Many skipped due to missing features (FLAC factory, OGG encoder) rather than bugs.
