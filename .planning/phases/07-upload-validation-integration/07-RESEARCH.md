# Phase 7: Upload Validation Integration - Research

**Researched:** 2026-01-24
**Domain:** File upload validation, magic byte detection, input validation
**Confidence:** HIGH

## Summary

This phase integrates existing validation infrastructure into the FileUploader upload flow. The validation logic already exists in `file-validation.ts` - the gap is that FileUploader.svelte only calls `detectFileType()` and `validateFile()` from `config.ts`, which do not perform magic byte validation, zero-byte checks, or enforce size limits at the correct point in the flow.

The implementation is straightforward because:
1. `validateFileType()` in `file-validation.ts` already handles magic bytes, text format validation, and format detection
2. `validateFile()` in `config.ts` already checks file size limits against `maxSize` in FILE_TYPES
3. FileUploader.svelte already has error handling infrastructure (notifications, error display)
4. All 8 skipped tests have clear "Unskip when" conditions that define success criteria

**Primary recommendation:** Modify FileUploader.svelte's `processFiles()` function to add three validation checks before accepting files: zero-byte check, size limit enforcement (already partially there), and magic byte validation via `validateFileType()`.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| file-type | ^19.x | Magic byte detection | Already in codebase, comprehensive format detection via `fileTypeFromBuffer()` |
| Svelte stores | built-in | Notification system | App's notification infrastructure already exists |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Buffer | built-in | Binary data handling | Reading file bytes for magic byte validation |
| FileReader | Web API | Async file reading | Reading file content for validation |

### Already Implemented
| Component | Location | Purpose |
|-----------|----------|---------|
| validateFileType() | src/lib/utils/file-validation.ts | Magic bytes + text format validation |
| validateFileSignature() | src/lib/utils/file-validation.ts | Low-level signature checking |
| validateTextFormat() | src/lib/utils/file-validation.ts | JSON/CSV/TSV/YAML structure validation |
| validateFile() | src/lib/conversion/config.ts | Size limit checking against FILE_TYPES |
| detectFileType() | src/lib/conversion/config.ts | Extension/MIME type detection |
| FILE_TYPES | src/lib/conversion/config.ts | Format definitions with maxSize limits |
| notifications store | src/lib/stores/notifications.ts | Toast notifications (error, warning, success, info) |
| MagicByteValidator | tests/fixtures/validators/magic-bytes.ts | Test infrastructure (not production) |
| CorruptedFileFactory | tests/fixtures/factories/corrupted-file-factory.ts | Test file generation |

## Architecture Patterns

### Current Upload Flow (Before Integration)

```
FileUploader.processFiles()
    ├── detectFileType(file) → config.ts
    │   ├── Check MIME type
    │   └── Fallback to extension
    │
    ├── validateFile(file, config) → config.ts
    │   ├── Check file.size > config.maxSize
    │   └── Check MIME type/extension match
    │
    ├── If invalid: show notification
    └── If valid: dispatch('files', validFiles)
```

### Target Upload Flow (After Integration)

```
FileUploader.processFiles()
    ├── Check file.size === 0 → REJECT (ERROR-04)
    │
    ├── detectFileType(file) → config.ts
    │   └── Get format config
    │
    ├── validateFile(file, config) → config.ts (already called)
    │   └── Size limit check (ERROR-03 - already implemented)
    │
    ├── validateFileType(file) → file-validation.ts (NEW)
    │   ├── Magic byte validation
    │   ├── Text format validation
    │   └── Returns isValid, detectedType, reason
    │
    ├── If magic bytes mismatch: notifications.warning() → WARN but allow (ERROR-05)
    ├── If truly corrupt: notifications.error() → REJECT
    └── If valid: dispatch('files', validFiles)
```

### Key Files to Modify

```
src/routes/convert/components/FileUploader.svelte
    ├── Import validateFileType from file-validation.ts
    ├── Add zero-byte check at start of processFiles()
    └── Call validateFileType() after detectFileType()
```

### Pattern: Validation Decision Tree

```typescript
async function validateUploadedFile(file: File): ValidationDecision {
    // 1. Zero-byte check (fast, synchronous)
    if (file.size === 0) {
        return { action: 'reject', reason: 'File is empty' };
    }

    // 2. Format detection (existing)
    const config = detectFileType(file);
    if (!config) {
        return { action: 'reject', reason: 'Unsupported file type' };
    }

    // 3. Size limit check (existing, already in processFiles)
    const sizeValidation = validateFile(file, config);
    if (!sizeValidation.valid) {
        return { action: 'reject', reason: sizeValidation.reason };
    }

    // 4. Magic byte / content validation (NEW)
    const typeValidation = await validateFileType(file);
    if (!typeValidation.isValid) {
        if (typeValidation.detectedType) {
            // Extension spoofing - warn but allow
            return {
                action: 'warn',
                reason: `File appears to be ${typeValidation.detectedType}, not ${extension}`,
                allow: true
            };
        } else {
            // Truly corrupted - reject
            return { action: 'reject', reason: typeValidation.reason };
        }
    }

    return { action: 'accept' };
}
```

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Magic byte detection | Custom signature matching | `file-type` library + existing `validateFileType()` | Already in codebase, handles compound signatures (WebP, WAV), 30+ formats |
| Size limit config | Hardcoded limits | `FILE_TYPES[format].maxSize` from config.ts | Already defined per format, used by validateFile() |
| Error notifications | Custom error display | `notifications.error()` / `.warning()` | Already integrated with UI, proper styling, auto-dismiss |
| Text format validation | Regex checks | `validateTextFormat()` in file-validation.ts | JSON.parse, CSV column validation, etc. already implemented |
| File buffer reading | Manual FileReader | `readFileBytes()` in file-validation.ts | Already handles async reading, error cases |

**Key insight:** All validation logic exists in file-validation.ts. The integration is about calling it at the right place (FileUploader.svelte), not building new validation.

## Common Pitfalls

### Pitfall 1: Sync vs Async Validation

**What goes wrong:** Magic byte validation requires reading file content asynchronously, but the current processFiles() loop is synchronous.
**Why it happens:** validateFileType() returns a Promise, current loop iterates synchronously.
**How to avoid:** Convert the file processing loop to async/await or use Promise.all for parallel validation.
**Warning signs:** Files getting processed before validation completes.

```typescript
// WRONG: Sync loop with async validation
for (const file of files) {
    const validation = validateFileType(file); // Returns Promise, not awaited!
    // Continues immediately, validation not complete
}

// RIGHT: Await validation in loop
for (const file of files) {
    const validation = await validateFileType(file);
    // Validation complete before proceeding
}
```

### Pitfall 2: Blocking UI on Large Batches

**What goes wrong:** Awaiting validation for each file in sequence can freeze UI with many files.
**Why it happens:** Sequential await in for-loop blocks until all files validated.
**How to avoid:** Use Promise.all for parallel validation, or validate in small batches.
**Warning signs:** UI freezes when uploading 10+ files at once.

```typescript
// Better: Parallel validation for responsiveness
const validationResults = await Promise.all(
    files.map(file => validateFileType(file))
);
```

### Pitfall 3: Warning vs Error Distinction

**What goes wrong:** Treating format mismatch as a hard error instead of a warning.
**Why it happens:** Per CONTEXT.md, spoofed extensions should "warn but allow".
**How to avoid:** Check `detectedType` in validation result - if present, it's spoofing (warn); if absent, it's corruption (error).
**Warning signs:** Valid files with misnamed extensions being rejected instead of warned.

### Pitfall 4: Duplicate Error Messages

**What goes wrong:** Showing both inline error and toast notification for same issue.
**Why it happens:** Current code has both `errors` array and `notifications` toast system.
**How to avoid:** Use toast notifications for immediate feedback, remove inline errors after short timeout (already implemented).
**Warning signs:** User sees same error twice in different UI locations.

### Pitfall 5: Small File Size Edge Cases

**What goes wrong:** Magic byte validation requires minimum bytes to work.
**Why it happens:** Very small files may not have enough bytes for signature detection.
**How to avoid:** validateFileType() already handles this - skips signature check for files <=10 bytes.
**Warning signs:** False negatives on tiny valid files.

## Code Examples

### Current FileUploader.processFiles() Structure

```typescript
// Source: src/routes/convert/components/FileUploader.svelte (lines 43-116)
function processFiles(files) {
    console.log('FileUploader: processFiles called with', files.length, 'files');
    errors = [];
    const validFiles = [];
    const fileTypeErrors = [];
    const validationErrors = [];

    for (const file of files) {
        // Detect file type
        const config = detectFileType(file);

        if (!config) {
            const errorMsg = 'Unsupported file type';
            errors.push({ file: file.name, message: errorMsg });
            fileTypeErrors.push(file.name);
            continue;
        }

        // Validate file with config
        const validation = validateFile(file, config);

        if (!validation.valid) {
            const errorMsg = validation.reason || 'Invalid file';
            errors.push({ file: file.name, message: errorMsg });
            validationErrors.push(`${file.name}: ${errorMsg}`);
            continue;
        }

        validFiles.push(file);
    }
    // ... notification handling ...
}
```

### Integration Point for Zero-Byte Check

```typescript
// Add at start of processFiles(), before format detection
for (const file of files) {
    // NEW: Zero-byte validation (ERROR-04)
    if (file.size === 0) {
        errors.push({
            file: file.name,
            message: 'File is empty (0 bytes)'
        });
        validationErrors.push(`${file.name}: File is empty`);
        continue;
    }
    // ... existing code ...
}
```

### Integration Point for Magic Byte Validation

```typescript
// Import at top of file
import { validateFileType } from '$lib/utils/file-validation';

// In processFiles(), after validateFile() but before adding to validFiles
async function processFiles(files) {
    // ... existing zero-byte and format detection ...

    for (const file of files) {
        // ... existing checks ...

        // NEW: Magic byte validation (ERROR-05)
        const typeValidation = await validateFileType(file);

        if (!typeValidation.isValid) {
            if (typeValidation.detectedType) {
                // Spoofing detected - warn but allow
                notifications.warning(
                    'Format mismatch detected',
                    `${file.name} appears to be ${typeValidation.detectedType.toUpperCase()}, not ${extension.toUpperCase()}.`
                );
                // Still add to validFiles per "warn but allow" policy
            } else if (typeValidation.reason) {
                // Corruption detected - reject
                errors.push({
                    file: file.name,
                    message: typeValidation.reason
                });
                validationErrors.push(`${file.name}: ${typeValidation.reason}`);
                continue;
            }
        }

        validFiles.push(file);
    }
}
```

### Notification Store API Reference

```typescript
// Source: src/lib/stores/notifications.ts
notifications.error(message: string, detail?: string)    // No auto-close
notifications.warning(message: string, detail?: string)  // Auto-close 7s
notifications.success(message: string, detail?: string)  // Auto-close 5s
notifications.info(message: string, detail?: string)     // Auto-close 5s
```

## Validation Tests to Unskip

8 tests are currently skipped with clear "Unskip when" conditions:

### ERROR-03: Size Limits (2 tests)
Location: `tests/e2e/error-handling/file-validation-errors.spec.ts`

| Test | Current Status | Unskip When |
|------|---------------|-------------|
| `rejects GIF file exceeding 5MB limit` | SKIPPED | Size validation enforced at upload |
| `size limit error prevents file from being queued` | SKIPPED | Same as above |

**Note:** `validateFile()` in config.ts already checks size. The issue is FileUploader IS calling validateFile() but GIF maxSize is 20MB not 5MB. Test may need updating to match actual config, OR this is already working.

### ERROR-04: Zero-Byte Files (3 tests)
Location: `tests/e2e/error-handling/file-validation-errors.spec.ts`

| Test | Current Status | Unskip When |
|------|---------------|-------------|
| `rejects empty PNG file (0 bytes)` | SKIPPED | file.size === 0 check added |
| `rejects empty JPEG file (0 bytes)` | SKIPPED | Same |
| `rejects empty JSON file (0 bytes)` | SKIPPED | Same |

### ERROR-05: Extension Spoofing (3 tests)
Location: `tests/e2e/error-handling/extension-spoofing.spec.ts`

| Test | Current Status | Unskip When |
|------|---------------|-------------|
| `detects JPEG file with PNG extension` | SKIPPED | validateFileType() called in upload flow |
| `detects PNG file with JPEG extension` | SKIPPED | Same |
| `detects WAV file with MP3 extension` | SKIPPED | Same |

**Note:** These expect "warn but allow" behavior - file should still be added, but warning notification shown.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| MIME type only | Magic bytes + MIME | Current codebase | More reliable format detection |
| Extension trust | Extension + validation | Current codebase | Catches spoofing |
| No size limits | Per-format limits | Current codebase | Prevents oversized uploads |

**Current code gaps:**
- validateFile() is called but zero-byte check missing
- validateFileType() exists but not called in upload flow

## Open Questions

Things that couldn't be fully resolved:

1. **GIF size limit discrepancy**
   - What we know: Tests expect 5MB limit, config.ts shows 20MB limit
   - What's unclear: Is the test wrong, or was config changed?
   - Recommendation: Verify with git history, update test if config is authoritative

2. **Parallel vs sequential validation performance**
   - What we know: Promise.all would be faster for large batches
   - What's unclear: Is batch upload common enough to warrant optimization?
   - Recommendation: Start with sequential (simpler), optimize if performance issue observed

## Sources

### Primary (HIGH confidence)
- `/home/dev/work/file-convert/apps/frontend/src/routes/convert/components/FileUploader.svelte` - Current upload implementation
- `/home/dev/work/file-convert/apps/frontend/src/lib/utils/file-validation.ts` - Existing validation logic
- `/home/dev/work/file-convert/apps/frontend/src/lib/conversion/config.ts` - FILE_TYPES and validateFile()
- `/home/dev/work/file-convert/apps/frontend/tests/e2e/error-handling/file-validation-errors.spec.ts` - Skipped tests with detailed comments
- `/home/dev/work/file-convert/apps/frontend/tests/e2e/error-handling/extension-spoofing.spec.ts` - Spoofing detection tests

### Secondary (MEDIUM confidence)
- `/home/dev/work/file-convert/.planning/STATE.md` - Decision history and blockers

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All components already in codebase
- Architecture: HIGH - Clear integration points documented in existing code
- Pitfalls: HIGH - Async handling is well-understood pattern

**Research date:** 2026-01-24
**Valid until:** 2026-02-24 (stable - existing codebase integration)
