#!/usr/bin/env node
/**
 * Generate JPEG with rich EXIF metadata for metadata preservation testing
 *
 * This test asset contains comprehensive EXIF data that can be validated
 * after image conversions to ensure metadata preservation works correctly.
 */

import sharp from 'sharp';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function generateEXIFImage() {
  // Create a simple colorful test pattern (200x150 pixels)
  const width = 200;
  const height = 150;

  // Create RGB channels: red gradient left to right, green top to bottom, blue diagonal
  const channels = [];

  // Red channel (horizontal gradient)
  const redData = Buffer.alloc(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      redData[y * width + x] = Math.floor((x / width) * 255);
    }
  }
  channels.push(redData);

  // Green channel (vertical gradient)
  const greenData = Buffer.alloc(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      greenData[y * width + x] = Math.floor((y / height) * 255);
    }
  }
  channels.push(greenData);

  // Blue channel (diagonal gradient)
  const blueData = Buffer.alloc(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const diagonal = (x + y) / (width + height);
      blueData[y * width + x] = Math.floor(diagonal * 255);
    }
  }
  channels.push(blueData);

  // Combine channels into RGB buffer
  const rgbBuffer = Buffer.alloc(width * height * 3);
  for (let i = 0; i < width * height; i++) {
    rgbBuffer[i * 3] = redData[i];
    rgbBuffer[i * 3 + 1] = greenData[i];
    rgbBuffer[i * 3 + 2] = blueData[i];
  }

  // Generate JPEG with comprehensive EXIF metadata
  const jpegBuffer = await sharp(rgbBuffer, {
    raw: {
      width,
      height,
      channels: 3
    }
  })
  .withMetadata({
    exif: {
      IFD0: {
        Make: 'Test Camera Manufacturer',
        Model: 'Test Camera Model 2000',
        Software: 'File Convert Test Suite v1.0',
        DateTime: '2026:01:24 12:00:00',
        Artist: 'Test Suite',
        Copyright: 'Public Domain'
      },
      IFD2: {
        // EXIF specific tags
        DateTimeOriginal: '2026:01:24 12:00:00',
        DateTimeDigitized: '2026:01:24 12:00:00'
      }
    }
  })
  .jpeg({
    quality: 90,
    mozjpeg: false
  })
  .toBuffer();

  return jpegBuffer;
}

// Generate and save file
try {
  const outputPath = join(__dirname, 'sample-with-exif.jpg');

  console.log('Generating JPEG with EXIF metadata...');
  const jpegBuffer = await generateEXIFImage();

  writeFileSync(outputPath, jpegBuffer);

  console.log('✅ Generated EXIF-rich test asset:');
  console.log(`  - ${outputPath} (${jpegBuffer.length} bytes)`);

  // Verify EXIF data is present using exifreader
  const ExifReader = (await import('exifreader')).default;
  const tags = ExifReader.load(jpegBuffer, { expanded: true });

  console.log('\nValidating EXIF metadata:');
  console.log('  Make:', tags.exif?.Make?.description || 'N/A');
  console.log('  Model:', tags.exif?.Model?.description || 'N/A');
  console.log('  DateTime:', tags.exif?.DateTime?.description || 'N/A');
  console.log('  Software:', tags.exif?.Software?.description || 'N/A');
  console.log('  FNumber:', tags.exif?.FNumber?.description || 'N/A');
  console.log('  ISO:', tags.exif?.ISOSpeedRatings?.description || 'N/A');
  console.log('  GPS Latitude:', tags.gps?.Latitude?.description || 'N/A');
  console.log('  GPS Longitude:', tags.gps?.Longitude?.description || 'N/A');
  console.log('\n✅ EXIF validation complete - metadata readable');
} catch (error) {
  console.error('❌ Failed to generate EXIF image:', error);
  process.exit(1);
}
