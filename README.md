# File Convert - Privacy-First File Conversion

A modern, open-source file conversion app with complete privacy - all conversions happen locally in your browser. No uploads, no servers, your files never leave your device.

## Features

- Drop files or click to browse
- Natural language commands ("convert to webp", "make it a PDF")
- Batch conversion support
- Progress tracking
- 100% client-side processing

## Supported Conversions

### Images
- PNG ↔ JPEG ↔ WebP
- PNG ↔ TIFF
- BMP ↔ PNG/JPEG
- GIF → PNG/JPEG/WebP
- ICO → PNG

### Audio
- WAV ↔ FLAC
- WAV ↔ MP3
- WAV ↔ Ogg Vorbis
- WAV ↔ Opus

### Archives
- Extract: ZIP, 7Z, TAR, TGZ, TBZ2, TXZ
- Create: ZIP, TAR, TGZ, TBZ2, TXZ, 7Z
- Repack between formats

### Documents/PDF
- DOCX → HTML/TXT
- PDF → PNG/JPEG/TXT
- PDF split/merge

### Spreadsheets
- XLSX ↔ CSV
- XLSX/CSV ↔ JSON

### Text/Code
- Markdown ↔ HTML
- YAML ↔ JSON
- XML ↔ JSON
- CSV ↔ TSV

## Quick Start

### Prerequisites
- [Bun](https://bun.sh) or Node.js 20+

### Setup

```bash
# Clone the repository
git clone https://github.com/your-repo/file-convert.git
cd file-convert

# Install dependencies
bun install
cd apps/frontend && bun install

# Start development server
bun run dev
```

Open http://localhost:5173 in your browser.

### Using Docker

```bash
docker compose up
```

## Project Structure

```
file-convert/
├── apps/
│   └── frontend/        # SvelteKit app
│       ├── src/         # Source code
│       └── static/      # Static assets & workers
├── docker-compose.yml   # Docker configuration
└── Makefile            # Development commands
```

## Architecture

### Web Workers
All conversions run in Web Workers to keep the UI responsive.

### WASM Integration
Heavy lifting is done by WebAssembly modules:
- Image processing: mozjpeg, libwebp
- Audio: LAME, libFLAC, libVorbis, libOpus
- Archives: libarchive-wasm, 7z-wasm
- Documents: pdf.js, Mammoth, SheetJS

## Deployment

Build for production:
```bash
cd apps/frontend
bun run build
```

Deploy the `build/` directory to any static host (Vercel, Netlify, Cloudflare Pages, etc.)

## License

MIT

## Privacy

- No server uploads
- All processing happens in your browser
- No tracking or analytics
- Your files never leave your device
