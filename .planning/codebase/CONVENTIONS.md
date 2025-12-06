# Coding Conventions

**Analysis Date:** 2026-01-23

## Naming Patterns

**Files:**
- TypeScript/Svelte files use kebab-case: `conversion-manager.ts`, `file-drop-zone.svelte`
- Test files use `.test.ts` or `.spec.ts` suffix: `audio-conversion.test.ts`, `conversion-registry.spec.ts`
- Utility functions grouped by domain in `src/lib/utils/`: `conversion-registry.ts`, `file-validation.ts`
- Components in `src/lib/components/`: descriptive, category names like `FileDropZone.svelte`, `ConversionProgress.svelte`

**Functions:**
- camelCase for all functions: `detectFileType()`, `validateFile()`, `handleFiles()`, `getOrCreateWorker()`
- Event handlers use `handle` prefix: `handleDragEnter()`, `handleFileInput()`, `handleDrop()`
- Getters use `get` prefix: `getFormat()`, `getAvailableConversions()`, `getState()`
- Private methods in classes use leading underscore: `_processQueue()`, `_getOrCreateWorker()`, `_updateState()`
- Factory/constructor functions use descriptive names: `createNotificationStore()`, `ConversionManager.getInstance()`

**Variables:**
- camelCase for local variables: `maxConcurrent`, `activeConversions`, `isDragging`, `dragCounter`
- CONSTANT_CASE for module constants: `FILE_TYPES`, `CONVERSION_OPTIONS`
- Boolean variables often prefixed with `is` or `has`: `isDragging`, `hasError`, `isLargeFile`
- Map/Set types use plural descriptive names: `activeConversions`, `workers`, `listeners`, `processingIds`

**Types:**
- PascalCase for interfaces and types: `ConversionJob`, `ConversionState`, `ConversionResult`, `FileTypeConfig`
- Interfaces describe contracts; use object type names: `ConversionProgress`, `ValidationRule`, `ConversionOption`
- Union types for status: `'pending' | 'validating' | 'converting' | 'completed' | 'failed'`

## Code Style

**Formatting:**
- No explicit formatter configured (no ESLint or Prettier config files found)
- Code uses consistent TypeScript style with proper indentation
- Imports organized by source grouping

**Linting:**
- TypeScript `strict` mode enabled in `tsconfig.json`
- Type checking enabled with `checkJs: true`
- ESLint not detected; code relies on TypeScript for type safety

## Import Organization

**Order:**
1. External libraries (e.g., `import { writable } from 'svelte/store'`)
2. Comlink and worker-related imports
3. Local type imports: `import type { ... } from './types'`
4. Local function/constant imports: `import { detectFileType, ... } from './config'`
5. Store imports: `import { notifications } from '../stores/notifications'`

**Path Aliases:**
- `$lib` - Maps to `src/lib` directory (configured in `vite.config.ts`)
- `$workers` - Maps to `src/lib/workers` directory
- Relative paths used for same-directory imports

## Error Handling

**Patterns:**
- Try-catch blocks with explicit error type checking: `error instanceof Error ? error.message : 'Unknown error'`
- Errors wrapped in Error objects with descriptive messages
- Custom error messages provided to users via notifications store
- Categorized error handling in `ConversionManager.handleConversionError()`:
  - Worker initialization errors → "Conversion service unavailable"
  - File format errors → "Unsupported conversion" (warning type)
  - File size errors → "File too large" (warning type)
  - Corruption/invalid format → "File format error"
  - Network errors → "Network error"
  - Timeout errors → "Conversion timeout"
  - Memory errors → "Insufficient resources"
  - Permission errors → "Access denied"
  - Generic fallback message

**Result handling:**
- Success/failure tracked in state: `{ status: 'completed'|'failed', result?: ConversionResult, error?: Error }`
- All async operations return typed promises
- Error propagation through callback mechanism for listeners

## Logging

**Framework:** `console` methods (`console.log`, `console.warn`, `console.error`)

**Patterns:**
- Debug logs use prefix pattern: `console.log('[FileDropZone] handleFiles called with ...')`
- Logs include component/module context in brackets: `[FileDropZone]`, `[getAvailableConversions]`
- Progress events logged: `console.log('Worker message for ${id}:', event.data.type)`
- Errors logged with context: `console.error('Conversion ${id} failed:', error)`
- All console.log statements for tracking conversion flow and worker communication

## Comments

**When to Comment:**
- Complex algorithmic logic is commented (e.g., WAV header writing, audio buffer conversion)
- Intent of non-obvious code explained (e.g., retry logic with fallbacks)
- Algorithm steps numbered for clarity
- No redundant comments on obvious code

**JSDoc/TSDoc:**
- Block comments with `/**` for functions and classes explaining purpose
- Single-line comments with `//` for inline logic
- Example from `ConversionManager`:
  ```typescript
  /**
   * Convert a file to the target format
   */
  async convert(...) { ... }

  /**
   * Subscribe to conversion updates
   */
  subscribe(id: string, callback: ...) { ... }
  ```

## Function Design

**Size:** Functions range from single-purpose (10-20 lines) to complex managers (400+ lines)
- Utility functions kept small: `getFormat()` (20 lines)
- Manager methods split by responsibility: `processConversion()` vs `handleConversionComplete()` vs `handleConversionError()`
- Event handlers typically 5-20 lines

**Parameters:**
- Use object parameters for related options: `{ type: 'classic', credentials: 'same-origin' }`
- Optional parameters with `?`: `options?: Record<string, any>`
- Callback functions passed as parameters: `callback: (state: ConversionState) => void`
- Generic handler patterns: `(event: MessageEvent) => { ... }`

**Return Values:**
- Explicit return types on all functions
- Promise-based for async: `async convert(...): Promise<string>`
- Unsubscribe function returned from subscribers: `return () => { ... listeners.delete(callback) ... }`
- Nullable returns explicitly typed: `ConversionState | null`, `FileTypeConfig | undefined`
- Helper methods return typed objects: `{ valid: boolean, reason?: string }`

## Module Design

**Exports:**
- Named exports for utilities: `export function getFormat()`, `export const formats`
- Default export for singleton instances: `export const conversionManager = ConversionManager.getInstance()`
- Type exports: `export type WorkerApi = { ... }`
- Named exports from stores: `export const notifications = createNotificationStore()`

**Barrel Files:**
- Not used; imports reference specific files directly

---

*Convention analysis: 2026-01-23*
