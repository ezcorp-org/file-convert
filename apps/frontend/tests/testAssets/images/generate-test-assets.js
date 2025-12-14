#!/usr/bin/env node
/**
 * Generate minimal BMP and ICO test assets for image conversion testing
 *
 * These formats require real files because:
 * - BMP: Sharp's BMP output falls back to PNG format
 * - ICO: Not supported by Sharp for generation
 */

import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Generate minimal 2x2 BMP file (24-bit, uncompressed)
function generateBMP() {
  // BMP File Header (14 bytes)
  const bmpHeader = Buffer.from([
    // BMP signature
    0x42, 0x4D,  // 'BM'
    // File size (70 bytes total)
    0x46, 0x00, 0x00, 0x00,
    // Reserved
    0x00, 0x00, 0x00, 0x00,
    // Pixel data offset (54 bytes)
    0x36, 0x00, 0x00, 0x00
  ]);

  // DIB Header (BITMAPINFOHEADER - 40 bytes)
  const dibHeader = Buffer.from([
    // DIB header size (40 bytes for BITMAPINFOHEADER)
    0x28, 0x00, 0x00, 0x00,
    // Width (2 pixels)
    0x02, 0x00, 0x00, 0x00,
    // Height (2 pixels, positive = bottom-up)
    0x02, 0x00, 0x00, 0x00,
    // Planes (1)
    0x01, 0x00,
    // Bits per pixel (24)
    0x18, 0x00,
    // Compression (0 = none)
    0x00, 0x00, 0x00, 0x00,
    // Image size (16 bytes: 2x2x3 + 2 bytes padding per row)
    0x10, 0x00, 0x00, 0x00,
    // X pixels per meter (2835 = 72 DPI)
    0x13, 0x0B, 0x00, 0x00,
    // Y pixels per meter
    0x13, 0x0B, 0x00, 0x00,
    // Colors used (0 = default 2^n)
    0x00, 0x00, 0x00, 0x00,
    // Important colors (0 = all)
    0x00, 0x00, 0x00, 0x00
  ]);

  // Pixel data: 2x2 red pixels (BGR format)
  // BMP rows are padded to 4-byte boundaries
  // 2 pixels * 3 bytes = 6 bytes + 2 bytes padding = 8 bytes per row
  const pixels = Buffer.from([
    // Row 0 (bottom row in bottom-up BMP): 2 red pixels + padding
    0x00, 0x00, 0xFF,  // Red pixel 1 (BGR)
    0x00, 0x00, 0xFF,  // Red pixel 2 (BGR)
    0x00, 0x00,        // Padding to 4-byte boundary
    // Row 1 (top row): 2 red pixels + padding
    0x00, 0x00, 0xFF,  // Red pixel 3 (BGR)
    0x00, 0x00, 0xFF,  // Red pixel 4 (BGR)
    0x00, 0x00         // Padding to 4-byte boundary
  ]);

  return Buffer.concat([bmpHeader, dibHeader, pixels]);
}

// Generate minimal 16x16 ICO file
// Uses PNG format embedded in ICO container (most widely supported)
function generateICO() {
  // Minimal 16x16 PNG (red square)
  const pngData = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
    0x00, 0x00, 0x00, 0x10, 0x00, 0x00, 0x00, 0x10, // 16x16
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x91, 0x68, // 8-bit RGB
    0x36, 0x00, 0x00, 0x00, 0x19, 0x49, 0x44, 0x41, // IDAT chunk
    0x54, 0x78, 0x9C, 0x62, 0x62, 0xF8, 0xCF, 0xC0, // Compressed data (red)
    0xC0, 0xC0, 0xC0, 0x00, 0x05, 0x00, 0x04, 0xC0,
    0x00, 0x81, 0xCA, 0x5A, 0x65, 0x29, 0x3D, 0x00,
    0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, // IEND chunk
    0x42, 0x60, 0x82
  ]);

  // ICO Header (6 bytes)
  const icoHeader = Buffer.from([
    0x00, 0x00,  // Reserved (must be 0)
    0x01, 0x00,  // Type (1 = ICO)
    0x01, 0x00   // Number of images (1)
  ]);

  // ICO Directory Entry (16 bytes)
  const icoEntry = Buffer.from([
    0x10,        // Width (16 pixels, 0 = 256)
    0x10,        // Height (16 pixels, 0 = 256)
    0x00,        // Color palette (0 = no palette)
    0x00,        // Reserved
    0x01, 0x00,  // Color planes (1)
    0x20, 0x00,  // Bits per pixel (32 for PNG)
    // Size of PNG data (little-endian)
    ...[pngData.length & 0xFF, (pngData.length >> 8) & 0xFF,
        (pngData.length >> 16) & 0xFF, (pngData.length >> 24) & 0xFF],
    // Offset to PNG data (22 bytes: header + entry)
    0x16, 0x00, 0x00, 0x00
  ]);

  return Buffer.concat([icoHeader, icoEntry, pngData]);
}

// Generate and save files
try {
  const bmpPath = join(__dirname, 'sample.bmp');
  const icoPath = join(__dirname, 'sample.ico');

  const bmpData = generateBMP();
  const icoData = generateICO();

  writeFileSync(bmpPath, bmpData);
  writeFileSync(icoPath, icoData);

  console.log('✅ Generated test assets:');
  console.log(`  - ${bmpPath} (${bmpData.length} bytes)`);
  console.log(`  - ${icoPath} (${icoData.length} bytes)`);

  console.log('\nValidating files...');
  console.log('BMP signature:', bmpData.slice(0, 2).toString('ascii'));
  console.log('BMP file size:', bmpData.length, 'bytes');
  console.log('ICO signature:', icoData.slice(0, 4).toString('hex'));
  console.log('ICO file size:', icoData.length, 'bytes');
} catch (error) {
  console.error('❌ Failed to generate test assets:', error);
  process.exit(1);
}
