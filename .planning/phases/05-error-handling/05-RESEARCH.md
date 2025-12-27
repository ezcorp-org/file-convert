# Phase 5: Error Handling & Edge Cases - Research

**Researched:** 2026-01-24
**Domain:** Client-side error handling, file validation, worker crash recovery
**Confidence:** HIGH

## Summary

This phase implements robust error handling for a browser-based file conversion application using Web Workers. The research focuses on four key domains: file validation (magic bytes, size limits, corruption detection), Web Worker crash recovery with retry logic, user-friendly error messaging patterns, and UI feedback states.

The standard approach combines multiple validation layers (magic bytes, MIME type, size checks) executed before conversion starts, automatic worker recovery with limited retries to prevent infinite loops, and context-aware error messages that guide users to actionable solutions. The existing codebase already has magic byte validation utilities (`file-type` library + custom validators) and a notification store with expandable details, providing a solid foundation.

**Primary recommendation:** Layer validation at upload (magic bytes, size, basic format check), implement single-retry worker recovery with crash pattern detection, and use inline error messages with expandable technical details for power users.

## Standard Stack

The established libraries/tools for browser-based file validation and error handling:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| file-type | 21.3+ | Magic byte detection | Industry standard for content-based file type detection, 2,681+ dependent projects |
| Web Workers API | Native | Isolated processing | Built-in browser API, no alternatives for true parallelism |
| Svelte stores | Built-in | State management | Native SvelteKit reactive state, no external dependencies needed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Svelte toast libraries | Various | User notifications | Optional - can build custom with stores (already exists in codebase) |
| exponential-backoff | 4.1+ | Retry logic | Optional - simple retry logic can be hand-rolled for single retry case |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| file-type | Custom magic bytes | file-type has broader format support and active maintenance |
| Custom retry | exponential-backoff library | Library overkill for 1-retry limit; custom is simpler |
| Svelte stores | External toast library | Existing notification store already has expandable details |

**Installation:**
```bash
# Already in codebase
npm install file-type

# Optional (not recommended for this use case)
npm install exponential-backoff
```

## Architecture Patterns

### Recommended Validation Flow
```
Upload → Size Check → Magic Byte Detection → MIME Validation → Queue → Convert
         ↓              ↓                      ↓
      Reject         Warn if mismatch      Detect spoofing
```

### Pattern 1: Layered Validation (Defense in Depth)
**What:** Multiple independent validation checks executed sequentially
**When to use:** Any file upload that processes user-provided content
**Example:**
```typescript
// Source: OWASP File Upload Cheat Sheet + existing codebase
async function validateUpload(file: File): Promise<ValidationResult> {
  // Layer 1: Size check (fast, fail early)
  if (file.size === 0) {
    return { valid: false, error: 'ZERO_BYTE_FILE', message: 'File is empty' };
  }
  if (file.size > config.maxSize) {
    return { valid: false, error: 'SIZE_EXCEEDED', message: `Maximum size: ${formatSize(config.maxSize)}` };
  }

  // Layer 2: Magic byte detection (actual content)
  const buffer = await file.slice(0, 4100).arrayBuffer();
  const detected = await MagicByteValidator.detectFormat(Buffer.from(buffer));

  // Layer 3: MIME vs extension vs magic bytes
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (detected && detected !== extension) {
    // Spoofed extension detected
    return {
      valid: false,
      error: 'FORMAT_MISMATCH',
      message: `File appears to be ${detected.toUpperCase()}, not ${extension?.toUpperCase()}`,
      suggestion: 'Rename file or select correct format'
    };
  }

  return { valid: true };
}
```

### Pattern 2: Worker Crash Recovery with Retry Limit
**What:** Automatic retry on worker failure with pattern detection for repeated crashes
**When to use:** Any system using Web Workers for processing
**Example:**
```typescript
// Source: MDN Web Workers + crash recovery best practices
class WorkerPool {
  private crashCount: Map<string, number> = new Map(); // Track crashes per worker type
  private readonly MAX_RETRIES = 1; // User decision from CONTEXT.md
  private readonly CRASH_THRESHOLD = 3; // Pattern detection threshold

  async executeWithRecovery(workerType: string, job: Job): Promise<Result> {
    let attempts = 0;

    while (attempts <= this.MAX_RETRIES) {
      try {
        const worker = await this.getOrCreateWorker(workerType);

        // Set up error handler
        const errorHandler = (event: ErrorEvent) => {
          event.preventDefault(); // Prevent default to handle gracefully
          this.incrementCrashCount(workerType);
          throw new Error(`Worker crashed: ${event.message}`);
        };

        worker.addEventListener('error', errorHandler);

        const result = await this.executeJob(worker, job);

        // Success - reset crash count for this worker type
        this.crashCount.set(workerType, 0);
        return result;

      } catch (error) {
        attempts++;

        // Terminate crashed worker
        this.terminateWorker(workerType);

        if (attempts > this.MAX_RETRIES) {
          // Check for crash pattern
          const crashes = this.crashCount.get(workerType) || 0;
          if (crashes >= this.CRASH_THRESHOLD) {
            throw new Error('WORKER_CRASH_PATTERN', {
              suggestion: 'Please refresh the page to reload conversion services'
            });
          }

          throw new Error(`Conversion failed after ${attempts} attempts`);
        }

        // Notify user of retry
        notify(`Conversion failed, retrying... (attempt ${attempts + 1}/${this.MAX_RETRIES + 1})`);

        // Brief delay before retry (prevent immediate re-crash)
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }

  private incrementCrashCount(workerType: string) {
    const current = this.crashCount.get(workerType) || 0;
    this.crashCount.set(workerType, current + 1);
  }
}
```

### Pattern 3: Context-Aware Error Messages
**What:** Error messages tailored to failure type with actionable guidance
**When to use:** All user-facing error displays
**Example:**
```typescript
// Source: Nielsen Norman Group error message guidelines
interface ErrorContext {
  code: string;
  fileName: string;
  fileSize?: number;
  detectedFormat?: string;
  expectedFormat?: string;
}

function formatUserError(context: ErrorContext): UserMessage {
  const { code, fileName } = context;

  const ERROR_TEMPLATES = {
    UNSUPPORTED_FORMAT: {
      title: 'Format not supported',
      message: `Cannot convert ${fileName}`,
      details: `File type "${context.detectedFormat}" is not supported`,
      suggestion: `Try converting to: ${getSupportedFormats(context.detectedFormat).join(', ')}`,
      recoverable: false
    },

    CORRUPTED_FILE: {
      title: 'File appears corrupted',
      message: `Unable to read ${fileName}`,
      details: 'File header is invalid or truncated',
      suggestion: null, // No action user can take
      recoverable: false
    },

    SIZE_EXCEEDED: {
      title: 'File too large',
      message: `${fileName} exceeds size limit`,
      details: `File size: ${formatSize(context.fileSize!)}, Limit: ${formatSize(MAX_SIZE)}`,
      suggestion: 'Try compressing the file or using a smaller version',
      recoverable: false
    },

    FORMAT_MISMATCH: {
      title: 'File format mismatch',
      message: `${fileName} may not be what it claims`,
      details: `File extension says ${context.expectedFormat}, but content appears to be ${context.detectedFormat}`,
      suggestion: `Rename to .${context.detectedFormat} or select ${context.detectedFormat?.toUpperCase()} as input format`,
      recoverable: true // User can fix this
    },

    WORKER_CRASH: {
      title: 'Conversion service crashed',
      message: `Unable to convert ${fileName}`,
      details: 'The conversion worker encountered an unexpected error',
      suggestion: 'File will be retried automatically',
      recoverable: true // Auto-retry
    }
  };

  return ERROR_TEMPLATES[code] || {
    title: 'Conversion failed',
    message: fileName,
    details: code,
    suggestion: null,
    recoverable: false
  };
}
```

### Pattern 4: UI Feedback States
**What:** Visual indicators for validation, processing, success, and failure states
**When to use:** All async operations with user feedback
**Example:**
```typescript
// Source: UX design patterns + existing codebase notification store
type ConversionStatus =
  | 'validating'   // Magic byte check, size check
  | 'queued'       // Waiting for worker
  | 'converting'   // Active processing
  | 'retrying'     // Worker crashed, attempting retry
  | 'completed'    // Success
  | 'failed';      // Terminal failure

interface FileState {
  id: string;
  status: ConversionStatus;
  progress: number;
  message?: string;
  error?: {
    code: string;
    title: string;
    message: string;
    details?: string;     // Expandable technical info
    suggestion?: string;  // Actionable guidance
  };
}

// UI rendering (Svelte component pattern)
// {#if state.status === 'validating'}
//   <Icon name="spinner" /> Validating file...
// {:else if state.status === 'retrying'}
//   <Icon name="refresh" /> Retrying (attempt 2/2)...
// {:else if state.status === 'failed'}
//   <Icon name="error" class="text-red-500" />
//   <button on:click={() => expanded = !expanded}>
//     {state.error.title}
//     <Icon name={expanded ? 'chevron-up' : 'chevron-down'} />
//   </button>
//   {#if expanded}
//     <div class="error-details">
//       <p>{state.error.message}</p>
//       {#if state.error.details}
//         <pre>{state.error.details}</pre>
//       {/if}
//       {#if state.error.suggestion}
//         <p class="suggestion">{state.error.suggestion}</p>
//       {/if}
//     </div>
//   {/if}
// {/if}
```

### Anti-Patterns to Avoid
- **Validating only MIME type or extension:** Easily spoofed, must check magic bytes
- **Infinite retry loops:** Always limit retries (1-3 max) to prevent resource exhaustion
- **Generic "error occurred" messages:** Useless to users, provide context and action
- **Blocking UI during validation:** Use async validation with progress indicators
- **Hiding technical details:** Power users need this for debugging, make it expandable
- **Blaming the user:** "You uploaded an invalid file" → "File format not recognized"

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Magic byte detection | Custom signature matching | file-type library | Handles 100+ formats, edge cases (compound signatures, offset headers), actively maintained |
| File type validation | Extension checking | file-type + custom validator | Extensions trivially spoofed, need content-based detection |
| Toast notifications | From scratch | Existing notification store | Codebase already has expandable details, auto-dismiss, type categorization |
| Error categorization | Switch statements | Error template map | Maintainable, easy to add new error types, consistent messaging |
| Worker message protocol | Custom format | Existing Comlink protocol | Already implemented in worker-manager.ts |

**Key insight:** The codebase already has most needed infrastructure (file-type, magic byte validators, notification store, worker pool). Phase 5 is about **wiring these together** with proper error handling, not building new validation systems.

## Common Pitfalls

### Pitfall 1: Validating After Processing Starts
**What goes wrong:** User waits for large file upload, conversion begins, then fails validation
**Why it happens:** Validation added as afterthought in processing pipeline
**How to avoid:** Validate at upload time (size, magic bytes, format) before queuing
**Warning signs:** Users complain about wasted time, network bandwidth consumed for rejected files

### Pitfall 2: Not Handling Worker Termination Cleanup
**What goes wrong:** Terminated workers leave listeners attached, memory leaks accumulate
**Why it happens:** Worker.terminate() doesn't clean up message handlers automatically
**How to avoid:** Remove event listeners before terminating, clear worker references
**Warning signs:** Memory usage grows over time, "ghost" workers in DevTools

```typescript
// WRONG - memory leak
worker.terminate();

// RIGHT - cleanup before termination
worker.removeEventListener('message', messageHandler);
worker.removeEventListener('error', errorHandler);
worker.terminate();
this.workers.delete(workerType);
```

### Pitfall 3: Trusting PDF Magic Bytes at Byte 0
**What goes wrong:** Polyglot files bypass validation (e.g., PDF wrapped in JSON)
**Why it happens:** PDF spec allows magic number within first 1024 bytes, not just byte 0
**How to avoid:** Check for suspicious patterns beyond magic bytes, use format-specific parsers for strict validation
**Warning signs:** Security scanners flag uploaded files, unusual file behavior
**Source:** [Bypassing File Upload Restrictions (Doyensec, Jan 2025)](https://blog.doyensec.com/2025/01/09/cspt-file-upload.html)

### Pitfall 4: No Retry Delay After Worker Crash
**What goes wrong:** Worker crashes immediately again, burns through retries in milliseconds
**Why it happens:** Same conditions that caused crash still exist (memory pressure, bad state)
**How to avoid:** Add 500ms-1s delay between retries, allows system to stabilize
**Warning signs:** Retries exhaust instantly, logs show rapid retry attempts

### Pitfall 5: Vague Error Messages
**What goes wrong:** User sees "Conversion failed" with no context or action to take
**Why it happens:** Generic error handling catches everything the same way
**How to avoid:** Categorize errors by type (size, format, corruption, worker, network), provide specific messages
**Warning signs:** Support tickets asking "what does this mean?", users give up and leave
**Source:** [Error Message Guidelines (Nielsen Norman Group)](https://www.nngroup.com/articles/error-message-guidelines/)

### Pitfall 6: Blocking Main Thread for Validation
**What goes wrong:** UI freezes while reading file for magic byte validation
**Why it happens:** Reading large files synchronously
**How to avoid:** Read only first 4KB for magic bytes (async), validate size immediately (file.size is instant)
**Warning signs:** UI jank during file selection, poor Lighthouse scores

### Pitfall 7: Not Tracking Crash Patterns
**What goes wrong:** Same worker type crashes repeatedly, user stuck in retry loop
**Why it happens:** No session-level tracking of worker reliability
**How to avoid:** Track crashes per worker type, suggest page refresh after 3+ crashes
**Warning signs:** Users report "keeps failing", worker issues not surfaced to developers

## Code Examples

Verified patterns from official sources and existing codebase:

### Magic Byte Validation with file-type
```typescript
// Source: file-type npm library + existing codebase validators/magic-bytes.ts
import { fileTypeFromBuffer } from 'file-type';

async function validateFileFormat(file: File, expectedFormat: string): Promise<ValidationResult> {
  // Read only first 4KB for magic byte detection (efficient)
  const buffer = await file.slice(0, 4100).arrayBuffer();

  // Use file-type library (high confidence)
  const detected = await fileTypeFromBuffer(Buffer.from(buffer));

  if (!detected) {
    // Fallback to manual signatures for formats file-type doesn't cover
    return MagicByteValidator.validate(Buffer.from(buffer), expectedFormat);
  }

  // Handle format aliases (jpg/jpeg, tif/tiff)
  const isMatch =
    detected.ext === expectedFormat ||
    (expectedFormat === 'jpeg' && detected.ext === 'jpg') ||
    (expectedFormat === 'jpg' && detected.ext === 'jpeg');

  return {
    valid: isMatch,
    detectedFormat: detected.ext,
    expectedFormat,
    confidence: 'high'
  };
}
```

### Worker Error Recovery
```typescript
// Source: MDN Web Workers API + existing worker-manager.ts pattern
async function convertWithRecovery(job: ConversionJob): Promise<ConversionResult> {
  const MAX_ATTEMPTS = 2; // 1 retry
  let attempt = 0;

  while (attempt < MAX_ATTEMPTS) {
    try {
      const worker = await this.getOrCreateWorker(job.workerType);

      return await new Promise((resolve, reject) => {
        const messageHandler = (event: MessageEvent) => {
          if (event.data.type === 'RESULT') {
            worker.removeEventListener('message', messageHandler);
            worker.removeEventListener('error', errorHandler);
            resolve(event.data.result);
          }
        };

        const errorHandler = (event: ErrorEvent) => {
          event.preventDefault(); // Don't bubble to window.onerror
          worker.removeEventListener('message', messageHandler);
          worker.removeEventListener('error', errorHandler);
          reject(new Error(`Worker crashed: ${event.message}`));
        };

        worker.addEventListener('message', messageHandler);
        worker.addEventListener('error', errorHandler);

        worker.postMessage({ type: 'CALL', method: 'convert', args: [job] });
      });

    } catch (error) {
      attempt++;

      // Terminate crashed worker
      this.workers.get(job.workerType)?.terminate();
      this.workers.delete(job.workerType);

      if (attempt >= MAX_ATTEMPTS) {
        throw new Error(`Conversion failed after ${attempt} attempts: ${error.message}`);
      }

      // Notify user of retry
      this.updateState(job.id, {
        status: 'retrying',
        message: `Retrying (attempt ${attempt + 1}/${MAX_ATTEMPTS})...`
      });

      // Brief delay before retry
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
}
```

### Size Validation (Pre-Queue)
```typescript
// Source: Existing config.ts + OWASP best practices
function validateFileSize(file: File, config: FileTypeConfig): ValidationResult {
  // Zero-byte check
  if (file.size === 0) {
    return {
      valid: false,
      error: {
        code: 'ZERO_BYTE_FILE',
        title: 'Empty file',
        message: `${file.name} is empty (0 bytes)`,
        details: 'File contains no data',
        suggestion: null
      }
    };
  }

  // Size limit check
  if (file.size > config.maxSize) {
    const maxSizeMB = Math.round(config.maxSize / 1024 / 1024);
    const fileSizeMB = (file.size / 1024 / 1024).toFixed(1);

    return {
      valid: false,
      error: {
        code: 'SIZE_EXCEEDED',
        title: 'File too large',
        message: `${file.name} exceeds size limit`,
        details: `File size: ${fileSizeMB}MB, Maximum: ${maxSizeMB}MB`,
        suggestion: 'Try compressing the file or using a smaller version'
      }
    };
  }

  return { valid: true };
}
```

### Expandable Error Display (Svelte)
```svelte
<!-- Source: Existing notification store + UX best practices -->
<script lang="ts">
  export let state: ConversionState;
  let expanded = false;
</script>

{#if state.status === 'failed' && state.error}
  <div class="error-container">
    <div class="error-header" on:click={() => expanded = !expanded}>
      <Icon name="alert-circle" class="text-red-500" />
      <span class="error-title">{state.error.title}</span>
      <Icon name={expanded ? 'chevron-up' : 'chevron-down'} />
    </div>

    {#if expanded}
      <div class="error-details">
        <p class="error-message">{state.error.message}</p>

        {#if state.error.suggestion}
          <div class="suggestion">
            <Icon name="lightbulb" />
            <span>{state.error.suggestion}</span>
          </div>
        {/if}

        {#if state.error.details}
          <details>
            <summary>Technical details</summary>
            <pre>{state.error.details}</pre>
          </details>
        {/if}
      </div>
    {/if}
  </div>
{/if}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Extension-only validation | Magic byte + MIME + extension | 2020+ | Prevents file type spoofing, required by OWASP |
| Generic error messages | Context-aware categorized errors | 2022+ | Better UX, fewer support tickets |
| Infinite retry | Limited retry with backoff | Always | Prevents resource exhaustion |
| Synchronous validation | Async validation (first 4KB only) | File API adoption | Non-blocking UI, faster feedback |
| Worker restart only | Worker restart + pattern detection | 2024+ | Surfaces systemic issues, prevents user frustration |

**Deprecated/outdated:**
- **File.type only validation:** Browsers don't set MIME types consistently, easily spoofed by attackers
- **Blocking alerts for errors:** `alert()` is jarring, use inline expandable errors instead
- **No retry on worker crash:** Modern apps expect resilience, single retry is standard
- **Technical jargon in user messages:** "ArrayBuffer allocation failed" → "File too large for available memory"

## Open Questions

Things that couldn't be fully resolved:

1. **Browser memory limits for large file validation**
   - What we know: Reading first 4KB for magic bytes is safe, full file validation may exceed memory
   - What's unclear: Precise browser memory limits vary by device, can't predict reliably
   - Recommendation: Validate only first 4KB for magic bytes, rely on size limits for safety

2. **Optimal retry delay timing**
   - What we know: Some delay needed to prevent immediate re-crash, 500ms-1s is common
   - What's unclear: Optimal delay depends on crash cause (memory pressure vs bad data)
   - Recommendation: Use fixed 500ms delay for simplicity, user can cancel if too slow

3. **Corrupted file detection reliability**
   - What we know: Magic bytes detect invalid headers, not mid-file corruption
   - What's unclear: How much of file to scan without performance impact
   - Recommendation: Check magic bytes only, let worker fail on mid-file corruption with clear error

## Sources

### Primary (HIGH confidence)
- [file-type npm library](https://www.npmjs.com/package/file-type) - Magic byte detection standard
- [MDN Web Workers API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers) - Error handling and onerror event
- [OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html) - Security validation best practices
- Existing codebase - `apps/frontend/tests/fixtures/validators/magic-bytes.ts`, `apps/frontend/src/lib/stores/notifications.ts`

### Secondary (MEDIUM confidence)
- [Nielsen Norman Group Error Message Guidelines](https://www.nngroup.com/articles/error-message-guidelines/) - UX best practices for error messages
- [Secure API file uploads with magic numbers (Transloadit)](https://transloadit.com/devtips/secure-api-file-uploads-with-magic-numbers/) - Magic byte validation patterns
- [Bypassing File Upload Restrictions (Doyensec, Jan 2025)](https://blog.doyensec.com/2025/01/09/cspt-file-upload.html) - Recent polyglot attack vectors
- [Mastering Error Handling in Web Workers (Medium)](https://mysteryweevil.medium.com/mastering-error-handling-in-web-workers-a-comprehensive-guide-89b8126cf1cc) - Worker error patterns
- [How to implement exponential backoff retry (Advanced Web Machinery)](https://advancedweb.hu/how-to-implement-an-exponential-backoff-retry-strategy-in-javascript/) - Retry logic patterns

### Tertiary (LOW confidence)
- [svelte-toast (zerodevx)](https://github.com/zerodevx/svelte-toast) - Alternative toast library (not needed, have notification store)
- [UX Content Collective - Error Messages](https://uxcontent.com/how-to-write-error-messages/) - Error message writing guidelines
- Various WebSearch results on file validation and browser size limits - Community knowledge

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - file-type is industry standard, Web Workers are native API, existing notification store proven
- Architecture: HIGH - Patterns verified against OWASP, MDN, and existing codebase structure
- Pitfalls: MEDIUM - Some from experience reports, others from security research (Doyensec 2025)

**Research date:** 2026-01-24
**Valid until:** 2026-02-24 (30 days - stable domain, browser APIs don't change rapidly)
