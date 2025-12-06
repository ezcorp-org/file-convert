# Codebase Structure

**Analysis Date:** 2026-01-23

## Directory Layout

```
file-convert/
├── apps/
│   └── frontend/                           # SvelteKit application (main app)
│       ├── src/
│       │   ├── routes/                     # SvelteKit page routes & API endpoints
│       │   │   ├── +layout.svelte          # Root layout (Header, Footer, Notifications)
│       │   │   ├── +page.svelte            # Landing page with features, testimonials, FAQ
│       │   │   ├── convert/
│       │   │   │   ├── +page.svelte        # Main conversion interface
│       │   │   │   ├── +page.ts            # Page load handler
│       │   │   │   ├── components/         # Conversion-specific components
│       │   │   │   │   ├── FileUploader.svelte
│       │   │   │   │   ├── ConversionOptions.svelte
│       │   │   │   │   ├── ConversionStatus.svelte
│       │   │   │   │   └── ConversionResults.svelte
│       │   │   │   └── [format]/           # Format-specific SEO pages
│       │   │   │       ├── pdf-to-excel/+page.svelte
│       │   │   │       ├── jpg-to-pdf/+page.svelte
│       │   │   │       ├── docx-to-pdf/+page.svelte
│       │   │   │       ├── word-to-pdf/+page.svelte
│       │   │   │       ├── excel-to-pdf/+page.svelte
│       │   │   │       ├── pdf-to-jpg/+page.svelte
│       │   │   │       ├── png-to-pdf/+page.svelte
│       │   │   │       ├── powerpoint-to-pdf/+page.svelte
│       │   │   │       ├── pdf-to-word/+page.svelte
│       │   │   │       ├── excel-to-word/+page.svelte
│       │   │   │       └── csv-to-excel/+page.svelte
│       │   │   ├── guides/                 # Blog/guide content for SEO
│       │   │   │   ├── +page.svelte        # Guides listing page
│       │   │   │   ├── rss.xml/+server.ts  # RSS feed endpoint
│       │   │   │   └── [guide-slug]/+page.svelte  # Individual guide pages
│       │   │   ├── help/+page.svelte       # Help/support page
│       │   │   ├── contact/+page.svelte    # Contact page
│       │   │   ├── robots.txt/+server.ts   # SEO robots.txt
│       │   │   ├── sitemap.xml/+server.ts  # SEO sitemap
│       │   │   └── .well-known/            # Chrome DevTools config
│       │   │
│       │   └── lib/                        # Shared libraries & logic
│       │       ├── components/             # Reusable Svelte components
│       │       │   ├── Header.svelte
│       │       │   ├── Footer.svelte
│       │       │   ├── FileDropZone.svelte
│       │       │   ├── ConversionProgress.svelte
│       │       │   ├── ConversionError.svelte
│       │       │   ├── DownloadManager.svelte
│       │       │   ├── BatchConversionPanel.svelte
│       │       │   ├── NotificationContainer.svelte
│       │       │   ├── Notification.svelte
│       │       │   ├── SEOHead.svelte      # Universal SEO component
│       │       │   └── schemas/            # Schema.org components
│       │       │       ├── SoftwareApplicationSchema.svelte
│       │       │       ├── FAQSchema.svelte
│       │       │       ├── OrganizationSchema.svelte
│       │       │       └── BreadcrumbSchema.svelte
│       │       │
│       │       ├── conversion/             # Core conversion orchestration
│       │       │   ├── manager.ts          # ConversionManager (singleton)
│       │       │   ├── config.ts           # Format config & validation
│       │       │   ├── types.ts            # Shared types (ConversionJob, ConversionResult, etc.)
│       │       │   ├── utils.ts            # Conversion utilities (detectFileType, download, etc.)
│       │       │   ├── *.test.ts           # Unit tests for conversion logic
│       │       │   └── README.md           # Conversion system documentation
│       │       │
│       │       ├── converters/             # Format-specific converter implementations
│       │       │   ├── optimized-converter.ts
│       │       │   └── test-fixtures/      # Test data and fixtures
│       │       │
│       │       ├── stores/                 # Svelte stores (reactive state)
│       │       │   └── notifications.ts    # Notification store with methods
│       │       │
│       │       ├── types/                  # Shared TypeScript types
│       │       │   └── worker-types.ts
│       │       │
│       │       ├── utils/                  # Utility functions
│       │       │   ├── conversion-registry.ts  # Format registry & conversion paths graph
│       │       │   ├── file-validation.ts     # File validation utilities
│       │       │   ├── file-chunker.ts        # Large file chunking for processing
│       │       │   ├── click-outside.ts       # Svelte action for click-outside detection
│       │       │   ├── service-worker-registration.ts  # PWA support
│       │       │   └── *.spec.ts             # Unit tests
│       │       │
│       │       └── workers/                # TypeScript wrapper files for workers
│       │           ├── image-worker.ts
│       │           ├── audio-worker.ts
│       │           ├── archive-worker.ts
│       │           └── ... (worker wrappers)
│       │
│       ├── static/
│       │   └── workers/                    # Web Worker scripts (WASM-based)
│       │       ├── base-worker.js          # Base class for all workers
│       │       ├── image-worker.js         # Image format conversions (PNG, JPEG, WebP, etc.)
│       │       ├── audio-worker.js         # Audio conversions (WAV, MP3, FLAC, OGG, Opus)
│       │       ├── document-worker.js      # Document conversions (PDF, DOCX)
│       │       ├── spreadsheet-worker.js   # Spreadsheet conversions (CSV, XLSX, JSON)
│       │       ├── archive-worker.js       # Archive operations (ZIP, TAR, 7Z)
│       │       ├── text-worker.js          # Text conversions (TXT, MD, HTML, JSON, YAML, XML)
│       │       ├── universal-worker.js     # Fallback for unsupported formats
│       │       ├── pdf-worker-inline.js    # PDF-specific worker
│       │       ├── pdf-simple-worker.js    # Simplified PDF worker
│       │       └── enhanced-image-worker.js # Enhanced image processing
│       │
│       ├── tests/                          # E2E tests (Playwright)
│       │   ├── file-conversion-e2e.spec.ts
│       │   └── ... (other E2E tests)
│       │
│       ├── tsconfig.json                   # TypeScript config
│       ├── vite.config.ts                  # Vite build config
│       ├── vitest.config.ts                # Vitest config (unit tests)
│       ├── svelte.config.js                # SvelteKit config (Vercel adapter)
│       ├── playwright.config.ts            # Playwright E2E config
│       ├── tailwind.config.js              # Tailwind CSS config
│       ├── postcss.config.js               # PostCSS config
│       ├── package.json                    # Dependencies & scripts
│       └── Dockerfile                      # Container config for deployment
│
├── web-bundles/                            # GSD orchestration bundles
│   ├── agents/                             # Agent definitions
│   ├── expansion-packs/                    # Domain-specific packs
│   └── teams/                              # Team role definitions
│
├── CLAUDE.md                               # Project instructions
├── docker-compose.yml                      # Local dev environment
├── Makefile                                # Development shortcuts
├── package.json                            # Root workspace config
└── README.md                               # Project overview
```

## Directory Purposes

**`src/routes/`:**
- Purpose: SvelteKit filesystem-based router (Next.js style)
- Contains: Page components (`+page.svelte`), API endpoints (`+server.ts`), layouts (`+layout.svelte`)
- Key files: `convert/+page.svelte` (main app), format-specific pages for SEO
- Pattern: Each route folder = URL path; `+page.svelte` renders as page; `+page.ts` is page load handler

**`src/lib/conversion/`:**
- Purpose: Core conversion orchestration and configuration
- Contains: Manager (singleton), format configs, types, utilities
- Key files: `manager.ts` (central orchestrator), `config.ts` (format registry), `types.ts` (shared types)
- Pattern: Centralized system for all conversion workflows

**`src/lib/components/`:**
- Purpose: Reusable Svelte UI components
- Contains: Layout components (Header, Footer), form components (FileDropZone), status displays
- Key files: `SEOHead.svelte` (metadata/schemas), `DownloadManager.svelte` (result delivery)
- Pattern: Single-file components with scoped styles

**`src/lib/stores/`:**
- Purpose: Svelte reactive stores for global state
- Contains: Notification store with typed message system
- Key files: `notifications.ts` (show/error/warning/info/dismiss methods)
- Pattern: Custom store factory functions

**`src/lib/utils/`:**
- Purpose: Shared utility functions and registries
- Contains: File validation, conversion registry/paths, service worker registration
- Key files: `conversion-registry.ts` (supported formats + conversion graph), `file-validation.ts` (validation rules)
- Pattern: Pure functions and configuration objects

**`static/workers/`:**
- Purpose: Web Worker scripts executing in separate threads
- Contains: Format-specific converters using WASM libraries
- Key files: Each `*-worker.js` file handles one category (image, audio, etc.)
- Pattern: Event listeners receiving `ConversionJob` via postMessage, responding with result/progress
- Import pattern: Workers import libraries via `self.importScripts('https://cdn.../library.js')`
- Comlink integration: Uses `comlink` for remote procedure calls

**`src/lib/types/`:**
- Purpose: TypeScript type definitions
- Key files: `worker-types.ts` (Worker-related types)

**`tests/`:**
- Purpose: End-to-end tests using Playwright
- Pattern: Describe user workflows (upload file, select format, convert, download)

## Key File Locations

**Entry Points:**

- `src/routes/+layout.svelte` - Root layout initializing app shell, service worker, notification system
- `src/routes/convert/+page.svelte` - Main conversion interface (file upload + format selection)
- `apps/frontend/package.json` - Build scripts: `bun run dev` (development), `bun run build` (production)

**Configuration:**

- `src/lib/conversion/config.ts` - Format definitions (FILE_TYPES registry), validation rules, supported conversions
- `src/lib/utils/conversion-registry.ts` - Conversion paths graph (from → to relationships), format helpers
- `svelte.config.js` - SvelteKit/Vercel adapter configuration
- `vite.config.ts` - Vite build and dev server configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript compiler options (strict mode enabled)

**Core Logic:**

- `src/lib/conversion/manager.ts` - ConversionManager singleton (queue, worker pool, state tracking)
- `src/lib/conversion/types.ts` - Type definitions (ConversionJob, ConversionResult, ConversionState)
- `src/lib/conversion/utils.ts` - Utilities (detectFileType, downloadFile, file encoding/decoding)
- `src/lib/stores/notifications.ts` - Notification store with methods (error, success, warning, dismiss)

**Testing:**

- `tests/file-conversion-e2e.spec.ts` - E2E conversion workflow tests
- `src/lib/conversion/*.test.ts` - Unit tests for conversion logic
- `vitest.config.ts` - Vitest test runner configuration
- `playwright.config.ts` - Playwright E2E configuration

**Workers (WASM Execution):**

- `static/workers/base-worker.js` - Base class with setup/message handling
- `static/workers/image-worker.js` - Image conversions (ImageMagick/Sharp via WASM)
- `static/workers/audio-worker.js` - Audio conversions (FFmpeg/Lamejs via WASM)
- `static/workers/document-worker.js` - PDF/DOCX conversions (pdf-lib, mammoth)
- `static/workers/spreadsheet-worker.js` - CSV/XLSX conversions (SheetJS via CDN)
- `static/workers/archive-worker.js` - ZIP/TAR operations (fflate, jszip)
- `static/workers/text-worker.js` - Text format conversions (JSON, YAML, XML, MD, HTML)
- `static/workers/universal-worker.js` - Fallback for unknown formats

## Naming Conventions

**Files:**

- Components: `PascalCase.svelte` (e.g., `FileDropZone.svelte`, `ConversionProgress.svelte`)
- TypeScript: `kebab-case.ts` (e.g., `conversion-manager.ts` not `manager.ts`)
- Tests: `*.test.ts` or `*.spec.ts` (e.g., `conversion-registry.spec.ts`)
- Workers: `[category]-worker.js` (e.g., `image-worker.js`, `audio-worker.js`)
- Routes: `+layout.svelte`, `+page.svelte`, `+page.ts`, `+server.ts` (SvelteKit convention)

**Directories:**

- `kebab-case` for most directories: `src/lib/conversion/`, `src/lib/components/`
- Exception: Route directories match URL path names, can have hyphens: `/convert/pdf-to-excel/`

**Variables:**

- camelCase for all variables, functions, methods: `conversionManager`, `activeConversions`, `handleConversionComplete()`
- UPPER_SNAKE_CASE for constants: `MAX_CONCURRENT` (if exposed), `FILE_TYPES` (registry object)
- Private fields: `#fieldName` (TypeScript private fields)

**Types & Interfaces:**

- PascalCase: `ConversionJob`, `ConversionState`, `FileTypeConfig`
- Suffixes: `Config` for configuration objects, `State` for state objects, `Job` for work items, `Result` for outputs, `Progress` for status updates

## Where to Add New Code

**New Conversion Format (e.g., HEIC to JPEG):**

1. Add format definition to `src/lib/conversion/config.ts`:
   ```typescript
   heic: {
     id: 'heic',
     name: 'HEIC Image',
     extensions: ['heic'],
     mimeTypes: ['image/heic'],
     category: 'image',
     icon: '🖼️',
     maxSize: 50 * 1024 * 1024,
     supportedOutputs: ['jpeg', 'png', 'webp'],
     workerType: 'image'
   }
   ```

2. Add conversion path to `src/lib/utils/conversion-registry.ts`:
   ```typescript
   { from: 'heic', to: 'jpeg', converter: 'image' }
   ```

3. Update appropriate worker to handle format (e.g., `static/workers/image-worker.js`)

4. Create SEO page: `src/routes/convert/heic-to-jpeg/+page.svelte` with FAQ schema

**New Component/Module:**

- UI components: `src/lib/components/[ComponentName].svelte`
- Conversion logic: `src/lib/conversion/[feature-name].ts`
- Utilities: `src/lib/utils/[utility-name].ts`
- Stores: `src/lib/stores/[store-name].ts`

**New Route/Page:**

- Simple page: Create `src/routes/[route-name]/+page.svelte`
- With data loading: Add `src/routes/[route-name]/+page.ts` with `load` function
- API endpoint: Create `src/routes/[route-name]/+server.ts` with GET/POST handlers

**New Web Worker:**

1. Create `static/workers/[category]-worker.js`
2. Extend base worker class or implement message handler
3. Export conversion function that receives `ConversionJob`
4. Send progress updates: `self.postMessage({ type: 'progress', id, progress, message })`
5. Send result: `self.postMessage({ type: 'RESULT', result: ConversionResult })`
6. Reference in `src/lib/conversion/manager.ts` worker selection logic

**New E2E Test:**

1. Create test file: `tests/[feature]-e2e.spec.ts`
2. Use Playwright fixtures and page object patterns
3. Test user workflow: upload → configure → convert → download
4. Run: `bun run test:e2e` or `bun run test:conversion`

## Special Directories

**`static/`:**
- Purpose: Static assets served by Vercel/web server
- Generated: No
- Committed: Yes
- Contents: Worker scripts, public images, icons, etc.

**`tests/`:**
- Purpose: E2E tests using Playwright
- Generated: No (tests are source code)
- Committed: Yes
- Run: `bun run test:e2e` or `bun run test:e2e:ui` for debugging

**`.svelte-kit/`** (not shown, generated):
- Purpose: SvelteKit build artifacts
- Generated: Yes (by `svelte-kit sync` and during build)
- Committed: No (in .gitignore)

**`build/`** (not shown, generated):
- Purpose: Production build output
- Generated: Yes (by `bun run build` or `vite build`)
- Committed: No (in .gitignore)
- Deploy this directory to Vercel/static hosts

**`dist/`** (not shown, generated):
- Purpose: Alternative build output directory
- Generated: Yes (if using `vite build`)
- Committed: No

**`node_modules/`** (not shown):
- Purpose: Installed dependencies
- Generated: Yes (by `bun install` or `npm install`)
- Committed: No (in .gitignore)

## Import Paths & Aliases

**Alias Configuration** (in `svelte.config.js` and `tsconfig.json`):
- `$lib` → `src/lib/`
- `$app` → SvelteKit internal app APIs

**Usage Examples:**
```typescript
import { conversionManager } from '$lib/conversion/manager';
import { FILE_TYPES } from '$lib/conversion/config';
import { notifications } from '$lib/stores/notifications';
import { goto } from '$app/navigation';
```

---

*Structure analysis: 2026-01-23*
