# External Integrations

**Analysis Date:** 2026-01-23

## APIs & External Services

**None Required**
- This is a privacy-first, client-side only application
- Zero external API dependencies for core functionality
- All file conversions execute entirely in the browser using Web Workers
- No backend server required

## Data Storage

**Databases:**
- Not applicable - no backend database required
- Client-side state management only via browser localStorage

**File Storage:**
- Local filesystem only
- File conversions happen in-memory within Web Workers
- Output files generated as Blob objects and downloaded directly to user's device
- No server-side file storage or uploads

**Caching:**
- Browser cache via Service Worker registration (`src/lib/utils/service-worker-registration.ts`)
- LocalStorage for tracking statistics:
  - `lifetime_conversions` - Count of conversions performed locally
  - `last_conversion_date` - Timestamp of last conversion
- No CDN integration required for core app

## Authentication & Identity

**Auth Provider:**
- Not applicable - no user authentication required
- No login system or user accounts
- Completely anonymous usage model
- Privacy-first: No user data collected or transmitted

## Monitoring & Observability

**Error Tracking:**
- Not integrated
- Console logging for debugging (`console.log`, `console.error`)
- Error messages displayed to users via in-app notification system (`src/lib/stores/notifications.ts`)

**Logs:**
- Browser console logging only
- Development mode: Detailed worker messages and progress tracking
- Production: Minimal logging via CSP-allowed console methods

**Performance Monitoring:**
- Web Vitals integration: `web-vitals` 5.1.0 package imported
- Memory monitoring: `MemoryMonitor` class in `src/lib/converters/optimized-converter.ts`
- Performance metrics tracked for large files (> 50MB):
  - Processing time
  - Throughput (MB/s)
  - Memory usage

## CI/CD & Deployment

**Hosting:**
- Designed for static hosts: Vercel, Netlify, Cloudflare Pages, GitHub Pages
- Primary: Vercel Node.js 20.x serverless runtime

**CI Pipeline:**
- Not detected in codebase
- GitHub Actions likely supported but configuration not present
- Docker Compose available for local development

**Pre-deployment Scripts:**
- `prebuild`: Runs `svelte-kit sync` before building
- Build commands support both Bun and npm:
  - `bun run build` - Recommended
  - `npm run build:npm` - Node.js fallback

## Environment Configuration

**Required env vars:**
- `VITE_PUBLIC_URL` (optional) - Public base URL for SEO
- No authentication tokens required
- No API keys required
- No database connection strings

**Development vars:**
- `NODE_ENV=development` - Set in docker-compose.yml

**Secrets location:**
- `.env.example` - No actual secrets needed
- All sensitive operations (if any) stay client-side

## Webhooks & Callbacks

**Incoming:**
- Not applicable - no webhook endpoints

**Outgoing:**
- Not applicable - no external service calls

## Content Delivery

**CDN/External Resources:**
Allowed via Content Security Policy (production):
- `https://unpkg.com` - Package CDN (fallback for modules)
- `https://cdn.jsdelivr.net` - Package CDN
- `https://fonts.googleapis.com` - Google Fonts
- `https://fonts.gstatic.com` - Google Fonts static files
- `data:` and `blob:` URIs - For generated files and in-memory conversions

**CSP Configuration:**
Location: `src/hooks.server.ts`
- Inline scripts and WASM allowed (required for Svelte and Web Workers)
- No analytics or third-party trackers in CSP
- Strict Content Security Policy in production
- Development mode: CSP disabled to prevent blocking issues

## Web Worker Architecture

**Worker Files Location:**
- `apps/frontend/static/workers/*.js` - Web Worker scripts

**Supported Workers:**
- Image conversions (image-worker.js)
- Audio conversions (audio-worker.js)
- Archive operations (archive-worker.js)
- Document conversions (document-worker.js)
- Spreadsheet conversions (spreadsheet-worker.js)
- Text conversions (text-worker.js)

**Worker Communication:**
- Protocol: Comlink RPC library
- Message format: `{ type, method, args, id }`
- Progress updates via `postMessage`
- No network communication within workers

## Browser APIs Used

**Core APIs:**
- Web Workers API - Background conversion processing
- AudioContext API - Audio decoding and processing
- File API - File reading and Blob creation
- ArrayBuffer / TypedArray - Binary data handling
- ServiceWorker API - Optional offline caching

**Security APIs:**
- SubresourceIntegrity (optional) - For CDN resources
- Cross-Origin Resource Sharing (CORS) headers configured

## Font & Assets

**Google Fonts:**
- Configured in CSP for styling
- Not explicitly imported in code (likely via Tailwind CSS)

**Icons:**
- lucide-svelte 0.542.0 - SVG icon components (no image CDN needed)

---

*Integration audit: 2026-01-23*
