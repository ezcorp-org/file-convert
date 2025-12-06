# File Convert - Open Source File Conversion App

## Overview

File Convert is a privacy-first, client-side file conversion app. All conversions happen in the browser using Web Workers and WebAssembly - no server required.

**Stack**: SvelteKit (TypeScript/Svelte)

## Architecture

```
/apps
└── frontend/          # SvelteKit application
    ├── src/
    │   ├── routes/    # SvelteKit routes
    │   ├── lib/       # Shared libraries
    │   │   ├── components/   # Svelte components
    │   │   ├── conversion/   # Conversion logic
    │   │   ├── converters/   # Format-specific converters
    │   │   ├── utils/        # Utilities
    │   │   └── workers/      # Web Worker management
    │   └── ...
    └── static/
        └── workers/   # Web Worker scripts (WASM-based)
```

## Development Setup

### Prerequisites
- Bun or Node.js 20+

### Quick Start

```bash
# Install dependencies
bun install
cd apps/frontend && bun install

# Start development server
bun run dev
```

Open http://localhost:5173

### Using Docker

```bash
docker compose up
```

## Key Files

### Conversion System
- `src/lib/conversion/manager.ts` - Conversion job manager
- `src/lib/utils/conversion-registry.ts` - Format registry
- `src/lib/workers/worker-manager.ts` - Web Worker pool

### Workers (in static/workers/)
- `image-worker.js` - Image conversions (PNG, JPEG, WebP, etc.)
- `audio-worker.js` - Audio conversions (WAV, MP3, FLAC, etc.)
- `archive-worker.js` - Archive operations (ZIP, 7Z, TAR, etc.)
- `document-worker.js` - Document conversions (PDF, DOCX, etc.)
- `spreadsheet-worker.js` - Spreadsheet conversions (XLSX, CSV, etc.)

### Routes
- `/` - Landing page
- `/convert` - Main conversion interface
- `/convert/[format]` - Format-specific pages (SEO)
- `/guides/` - How-to guides

## Development Guidelines

### Adding a New Format

1. Update `src/lib/utils/conversion-registry.ts` with format metadata
2. Add conversion logic to the appropriate worker in `static/workers/`
3. Optionally create an SEO page in `src/routes/convert/[format]/`

### Testing

```bash
cd apps/frontend
bun run test        # Unit tests
bun run test:e2e    # E2E tests with Playwright
```

## Deployment

Build for production:
```bash
cd apps/frontend
bun run build
```

Deploy `build/` to any static host (Vercel, Netlify, Cloudflare Pages).

## License

MIT
