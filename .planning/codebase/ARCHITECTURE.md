# Architecture

**Analysis Date:** 2026-01-23

## Pattern Overview

**Overall:** Client-Side Conversion Engine with Web Worker Pool & Progressive Enhancement

**Key Characteristics:**
- Completely browser-based, zero-server file processing
- Web Worker thread pool for parallel conversions and non-blocking UI
- Singleton Conversion Manager as central orchestrator
- Format-agnostic registry system with pluggable worker types
- Svelte + SvelteKit for reactive UI with SSR support
- Multi-layer abstraction: core manager → type-specific workers → format-specific handlers

## Layers

**Presentation Layer:**
- Purpose: Render conversion UI and manage user interactions
- Location: `src/routes/`, `src/lib/components/`
- Contains: Svelte components, page templates, schema components (SEO)
- Depends on: Stores, ConversionManager, utilities
- Used by: Browser DOM

**State Management Layer:**
- Purpose: Manage notifications, conversion state, and reactive updates
- Location: `src/lib/stores/notifications.ts`
- Contains: Svelte stores with custom methods (success, error, warning, info, dismiss)
- Depends on: Svelte writable store
- Used by: Presentation components, ConversionManager

**Orchestration Layer (Core):**
- Purpose: Central management of conversion lifecycle, queuing, and worker coordination
- Location: `src/lib/conversion/manager.ts`
- Contains: `ConversionManager` singleton class with queue, state tracking, listener pattern
- Depends on: Configuration, types, stores, workers
- Used by: All conversion triggers in components

**Configuration & Type Definition Layer:**
- Purpose: Define supported formats, validation rules, and conversion metadata
- Location: `src/lib/conversion/config.ts`, `src/lib/conversion/types.ts`, `src/lib/utils/conversion-registry.ts`
- Contains: Format definitions, validation rules, file type catalog, conversion path graph
- Depends on: None (foundational)
- Used by: Manager, registry, components

**Worker Management Layer:**
- Purpose: Create and manage Web Worker pool, handle initialization and lifecycle
- Location: `src/lib/conversion/manager.ts` (embedded), `static/workers/`
- Contains: Worker instantiation, Comlink proxy setup, error handling
- Depends on: Browser API (Worker API), Comlink library
- Used by: ConversionManager

**Execution Layer:**
- Purpose: Format-specific conversion logic executing in Web Workers
- Location: `static/workers/*.js`
- Contains: Image worker, audio worker, document worker, spreadsheet worker, archive worker, text worker, universal fallback
- Depends on: WASM libraries (via CDN), base worker class
- Used by: Manager via postMessage/Comlink

**Utility & Infrastructure Layer:**
- Purpose: Helper functions for files, validation, encoding, and utilities
- Location: `src/lib/utils/`, `src/lib/conversion/utils.ts`
- Contains: File detection, chunking, validation, base64 conversion, download management
- Depends on: Configuration
- Used by: Manager, components, workers

## Data Flow

**Conversion Initiation Flow:**

1. User uploads file via `FileDropZone` component
2. Component calls `conversionManager.convert(file, targetFormat, options)`
3. Manager creates `ConversionRequest` and `ConversionState`
4. Request added to `queue`, state initialized in `activeConversions` Map
5. Manager notifies all listeners (UI updates to "pending")
6. `processQueue()` checks concurrency limit (max 3 active)

**Active Conversion Flow:**

1. Manager dequeues request, calls `processConversion()`
2. File type detected via `detectFileType()` using extension + MIME match
3. File validated against `FILE_TYPES[format].validationRules`
4. State updated to "validating" (5% progress)
5. Appropriate worker selected based on source/target format:
   - Archive files → `archive-worker.js`
   - Images (image→image) → `image-worker.js`
   - Audio (audio→audio) → `audio-worker.js`
   - Documents → `document-worker.js`
   - Spreadsheets (CSV/XLSX) → `spreadsheet-worker.js`
   - Text files → `text-worker.js`
   - Fallback → `universal-worker.js`
6. Special case: Non-WAV audio decoded to WAV in main thread via AudioContext
7. Worker retrieved or created via `getOrCreateWorker(type)`
8. Message handler registered to listen for progress and completion
9. `ConversionJob` sent to worker with Comlink format:
   ```
   {
     id: string,
     type: 'CALL',
     method: 'convert',
     args: [{ id, file, fromFormat, toFormat, options }]
   }
   ```

**Worker Processing Flow:**

1. Worker's message handler receives Comlink CALL message
2. Worker processes conversion using WASM libraries or native JS
3. Progress updates sent as: `{ type: 'progress', id, progress: number, message: string }`
4. Manager updates state in real-time (UI shows progress bar)
5. On completion: `{ type: 'RESULT', result: ConversionResult }`
6. On error: `{ type: 'ERROR', error: { message: string } }`

**Completion Flow:**

1. Manager calls `handleConversionComplete()` or `handleConversionError()`
2. State updated to "completed" (100%) or "failed" with error
3. Listeners notified (UI shows complete/error state)
4. Result stored in `activeConversions` state with `ConversionResult` blob
5. Removed from queue and processing set
6. `processQueue()` called recursively to start next job
7. DownloadManager component triggers download of result blob

**Cancellation Flow:**

1. User clicks cancel button (UI triggers `conversionManager.cancel(id)`)
2. If pending: removed from queue immediately
3. If converting: cancel message sent to worker `{ type: 'cancel', id }`
4. State updated to "failed" with cancellation error
5. Listeners notified
6. Queue processing resumes

**State Management:**

- **activeConversions Map:** Tracks all ongoing/completed conversions by ID
- **queue Array:** FIFO queue of pending requests
- **listeners Map:** Set of callbacks per conversion ID (observer pattern)
- **processingIds Set:** Prevents duplicate processing of same request
- **maxConcurrent:** Limited to 3 simultaneous conversions
- **localStorage:** Stores `lifetime_conversions` count and `last_conversion_date`

## Key Abstractions

**ConversionManager (Singleton):**
- Purpose: Central coordinator for entire conversion pipeline
- Examples: `src/lib/conversion/manager.ts`
- Pattern: Singleton with lazy initialization, listener/observer pattern
- Responsibilities:
  - Queue management (FIFO with priority)
  - Worker lifecycle and pool management
  - State tracking with reactive updates
  - Error categorization and user feedback
  - Audio pre-processing (MP3/FLAC → WAV)
  - Concurrency control

**FileTypeConfig:**
- Purpose: Declarative format metadata
- Examples: `src/lib/conversion/config.ts` FILE_TYPES registry
- Pattern: Configuration object with validation hooks
- Contains: ID, name, extensions, MIME types, max size, supported outputs, worker type, validation rules

**ConversionJob:**
- Purpose: Immutable request payload for workers
- Examples: `src/lib/conversion/types.ts`
- Pattern: Data transfer object
- Fields: id, file, fromFormat, toFormat, options

**ConversionResult:**
- Purpose: Worker output wrapper with metadata
- Examples: `src/lib/conversion/types.ts`
- Pattern: Data transfer object
- Contains: Output blob, filename, MIME type, optional metadata (size, duration, dimensions, pages)

**ConversionState:**
- Purpose: Track conversion lifecycle and progress
- Examples: `src/lib/conversion/manager.ts`
- Pattern: Mutable state object with status enum
- Statuses: pending → validating → converting → completed|failed

**Worker Type Router:**
- Purpose: Select appropriate worker based on format pair
- Examples: `src/lib/conversion/manager.ts` (lines 300-328)
- Pattern: Type-based dispatch with fallback chain
- Logic: Archive > specialized pairs > universal fallback

**Conversion Registry:**
- Purpose: Map format IDs to metadata and conversion paths
- Examples: `src/lib/utils/conversion-registry.ts`
- Pattern: Declarative graph of supported conversions
- Contains: `formats[]` array, `conversionPaths[]` directed graph, helper functions

## Entry Points

**Web Application:**
- Location: `src/routes/+layout.svelte`
- Triggers: Initial page load
- Responsibilities:
  - Renders Header, Footer, NotificationContainer
  - Registers service worker (production only)
  - Manages app layout structure

**Conversion Page:**
- Location: `src/routes/convert/+page.svelte`
- Triggers: User navigates to `/convert`
- Responsibilities:
  - Hosts FileUploader component
  - Manages upload state and file grouping
  - Orchestrates conversion workflow
  - Displays ConversionStatus and results

**Format-Specific Pages:**
- Location: `src/routes/convert/[format]/+page.svelte`
- Example: `src/routes/convert/pdf-to-excel/+page.svelte`
- Triggers: User navigates to `/convert/pdf-to-excel` etc.
- Responsibilities:
  - SEO-optimized landing page for each conversion type
  - FAQ schema, breadcrumbs, Open Graph data
  - Redirects to `/convert` when user starts conversion

**API Routes:**
- Location: `src/routes/robots.txt/+server.ts`, `src/routes/sitemap.xml/+server.ts`, etc.
- Purpose: Server-side generated metadata and feeds

## Error Handling

**Strategy:** Categorized error messages with user-friendly fallbacks

**Patterns:**

1. **File Validation Errors:**
   - Unsupported file type detected in `detectFileType()`
   - File size exceeds `maxSize` in validation
   - File format malformed or corrupted
   - User receives: "File format error" notification

2. **Conversion Errors:**
   - Worker fails during processing
   - Comlink ERROR response: `{ type: 'ERROR', error: { message } }`
   - Error categorized by message keywords: "unsupported", "too large", "corrupt", "timeout", "memory"
   - Each category maps to user-friendly notification with actionable guidance

3. **Worker Errors:**
   - Worker fails to initialize → fallback to universal worker
   - Worker script not found → cascade fallback (text → universal, spreadsheet → text)
   - Worker runtime error → caught and logged, user notified

4. **Recovery:**
   - Failed conversions do NOT block queue
   - Next item in queue automatically processes
   - User can retry failed conversion
   - Notifications auto-dismiss for warnings (7s), persist for errors

## Cross-Cutting Concerns

**Logging:**
- Approach: Browser console with semantic prefixes
- Examples: `console.log('Pre-initialized image worker')`, `console.error('Conversion failed:', error)`
- In components: State changes logged for debugging

**Validation:**
- File extension check (against `extensions[]` array)
- MIME type check (against `mimeTypes[]` array)
- File size check (against `maxSize`)
- Custom validation rules from `FILE_TYPES[format].validationRules`
- Source → target compatibility check (against `supportedOutputs`)

**Authentication:**
- Not implemented (client-side only, no user accounts)
- Storage: localStorage for anonymous conversion tracking

**Performance Optimization:**
- Pre-initialization of image worker (most common format)
- Web Worker pool limits concurrency to 3 simultaneous conversions
- Chunked file reading for large files (via file-chunker.ts)
- Progress throttling to reduce listener notifications
- Audio pre-decoding in main thread to offload worker (MP3/FLAC → WAV)
- Comlink remote procedure call pattern for clean message marshalling

**SEO & Metadata:**
- SEO Head component with schema.org markup (FAQ, SoftwareApplication, Organization, Breadcrumb)
- Per-page titles and descriptions in route `+page.ts`
- RSS feed for guides (src/routes/guides/rss.xml/+server.ts)
- Robots.txt and sitemap.xml auto-generated

---

*Architecture analysis: 2026-01-23*
