/**
 * Test fixture generator for file conversion tests
 * Creates sample files for testing various format conversions
 */

export class TestFixtureGenerator {
  /**
   * Generate a simple 1x1 pixel PNG image
   */
  static generatePNG(): Uint8Array {
    // PNG header and IHDR chunk for 1x1 pixel image
    const pngData = new Uint8Array([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, // IHDR length
      0x49, 0x48, 0x44, 0x52, // IHDR
      0x00, 0x00, 0x00, 0x01, // width: 1
      0x00, 0x00, 0x00, 0x01, // height: 1
      0x08, 0x02, // bit depth: 8, color type: 2 (RGB)
      0x00, 0x00, 0x00, // compression, filter, interlace
      0x90, 0x77, 0x53, 0xDE, // CRC
      0x00, 0x00, 0x00, 0x0C, // IDAT length
      0x49, 0x44, 0x41, 0x54, // IDAT
      0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0xFE, 0xFF, 0x00, 0x00, 0x00, 0x02, // compressed data
      0x00, 0x01, // CRC start
      0x49, 0xB4, 0xE8, 0xB7, // CRC
      0x00, 0x00, 0x00, 0x00, // IEND length
      0x49, 0x45, 0x4E, 0x44, // IEND
      0xAE, 0x42, 0x60, 0x82  // CRC
    ]);
    return pngData;
  }

  /**
   * Generate a simple JPEG image header
   */
  static generateJPEG(): Uint8Array {
    // Minimal JPEG with SOI, APP0, SOF0, and EOI markers
    const jpegData = new Uint8Array([
      0xFF, 0xD8, // SOI (Start of Image)
      0xFF, 0xE0, // APP0 marker
      0x00, 0x10, // Length
      0x4A, 0x46, 0x49, 0x46, 0x00, // JFIF identifier
      0x01, 0x01, // Version
      0x00, // Aspect ratio units
      0x00, 0x01, 0x00, 0x01, // X and Y density
      0x00, 0x00, // Thumbnail dimensions
      0xFF, 0xD9  // EOI (End of Image)
    ]);
    return jpegData;
  }

  /**
   * Generate a simple BMP image
   */
  static generateBMP(): Uint8Array {
    // 1x1 pixel BMP
    const bmpData = new Uint8Array([
      0x42, 0x4D, // BM signature
      0x3A, 0x00, 0x00, 0x00, // File size
      0x00, 0x00, 0x00, 0x00, // Reserved
      0x36, 0x00, 0x00, 0x00, // Offset to pixel data
      0x28, 0x00, 0x00, 0x00, // DIB header size
      0x01, 0x00, 0x00, 0x00, // Width
      0x01, 0x00, 0x00, 0x00, // Height
      0x01, 0x00, // Planes
      0x18, 0x00, // Bits per pixel
      0x00, 0x00, 0x00, 0x00, // Compression
      0x04, 0x00, 0x00, 0x00, // Image size
      0x00, 0x00, 0x00, 0x00, // X pixels per meter
      0x00, 0x00, 0x00, 0x00, // Y pixels per meter
      0x00, 0x00, 0x00, 0x00, // Colors used
      0x00, 0x00, 0x00, 0x00, // Important colors
      0xFF, 0xFF, 0xFF, 0x00  // Pixel data (white)
    ]);
    return bmpData;
  }

  /**
   * Generate a simple GIF image
   */
  static generateGIF(): Uint8Array {
    // 1x1 pixel GIF
    const gifData = new Uint8Array([
      0x47, 0x49, 0x46, 0x38, 0x39, 0x61, // GIF89a
      0x01, 0x00, 0x01, 0x00, // Width and height
      0x80, 0x00, 0x00, // Global color table flag
      0xFF, 0xFF, 0xFF, // Background color (white)
      0x00, 0x00, 0x00, // Black
      0x21, 0xF9, 0x04, // Graphic control extension
      0x00, 0x00, 0x00, 0x00, 0x00, // Delay and transparent color
      0x2C, // Image separator
      0x00, 0x00, 0x00, 0x00, // Image position
      0x01, 0x00, 0x01, 0x00, // Image dimensions
      0x00, // No local color table
      0x02, 0x02, 0x44, 0x01, 0x00, // LZW compressed data
      0x3B // Trailer
    ]);
    return gifData;
  }

  /**
   * Generate a simple WAV audio file
   */
  static generateWAV(): Uint8Array {
    // Minimal WAV header with 1 sample
    const wavData = new Uint8Array(44);
    const view = new DataView(wavData.buffer);
    
    // RIFF header
    wavData.set([0x52, 0x49, 0x46, 0x46], 0); // "RIFF"
    view.setUint32(4, 36, true); // File size - 8
    wavData.set([0x57, 0x41, 0x56, 0x45], 8); // "WAVE"
    
    // fmt chunk
    wavData.set([0x66, 0x6D, 0x74, 0x20], 12); // "fmt "
    view.setUint32(16, 16, true); // Chunk size
    view.setUint16(20, 1, true); // Audio format (PCM)
    view.setUint16(22, 1, true); // Number of channels
    view.setUint32(24, 44100, true); // Sample rate
    view.setUint32(28, 88200, true); // Byte rate
    view.setUint16(32, 2, true); // Block align
    view.setUint16(34, 16, true); // Bits per sample
    
    // data chunk
    wavData.set([0x64, 0x61, 0x74, 0x61], 36); // "data"
    view.setUint32(40, 0, true); // Data size
    
    return wavData;
  }

  /**
   * Generate a simple ZIP archive
   */
  static generateZIP(): Uint8Array {
    // Minimal ZIP with one empty file
    const zipData = new Uint8Array([
      0x50, 0x4B, 0x03, 0x04, // Local file header signature
      0x0A, 0x00, // Version needed
      0x00, 0x00, // General purpose bit flag
      0x00, 0x00, // Compression method
      0x00, 0x00, // Last mod time
      0x00, 0x00, // Last mod date
      0x00, 0x00, 0x00, 0x00, // CRC-32
      0x00, 0x00, 0x00, 0x00, // Compressed size
      0x00, 0x00, 0x00, 0x00, // Uncompressed size
      0x08, 0x00, // File name length
      0x00, 0x00, // Extra field length
      0x74, 0x65, 0x73, 0x74, 0x2E, 0x74, 0x78, 0x74, // "test.txt"
      
      0x50, 0x4B, 0x01, 0x02, // Central directory signature
      0x14, 0x00, // Version made by
      0x0A, 0x00, // Version needed
      0x00, 0x00, // General purpose bit flag
      0x00, 0x00, // Compression method
      0x00, 0x00, // Last mod time
      0x00, 0x00, // Last mod date
      0x00, 0x00, 0x00, 0x00, // CRC-32
      0x00, 0x00, 0x00, 0x00, // Compressed size
      0x00, 0x00, 0x00, 0x00, // Uncompressed size
      0x08, 0x00, // File name length
      0x00, 0x00, // Extra field length
      0x00, 0x00, // File comment length
      0x00, 0x00, // Disk number start
      0x00, 0x00, // Internal file attributes
      0x00, 0x00, 0x00, 0x00, // External file attributes
      0x00, 0x00, 0x00, 0x00, // Relative offset
      0x74, 0x65, 0x73, 0x74, 0x2E, 0x74, 0x78, 0x74, // "test.txt"
      
      0x50, 0x4B, 0x05, 0x06, // End of central directory signature
      0x00, 0x00, // Disk number
      0x00, 0x00, // Disk with central directory
      0x01, 0x00, // Central directory entries on this disk
      0x01, 0x00, // Total central directory entries
      0x36, 0x00, 0x00, 0x00, // Central directory size
      0x22, 0x00, 0x00, 0x00, // Central directory offset
      0x00, 0x00 // Comment length
    ]);
    return zipData;
  }

  /**
   * Generate sample text content
   */
  static generateTextContent(format: string): string {
    switch (format) {
      case 'txt':
        return 'This is a sample text file for testing conversions.';
      
      case 'md':
        return '# Test Document\n\nThis is a **sample** markdown file with:\n- Lists\n- **Bold** text\n- *Italic* text';
      
      case 'html':
        return '<!DOCTYPE html><html><head><title>Test</title></head><body><h1>Test Document</h1><p>Sample HTML content</p></body></html>';
      
      case 'json':
        return JSON.stringify({
          title: 'Test Document',
          content: 'Sample JSON content',
          metadata: {
            created: '2024-01-01',
            format: 'json'
          }
        }, null, 2);
      
      case 'yaml':
        return `title: Test Document
content: Sample YAML content
metadata:
  created: 2024-01-01
  format: yaml`;
      
      case 'xml':
        return `<?xml version="1.0" encoding="UTF-8"?>
<document>
  <title>Test Document</title>
  <content>Sample XML content</content>
  <metadata>
    <created>2024-01-01</created>
    <format>xml</format>
  </metadata>
</document>`;
      
      case 'csv':
        return 'Name,Age,City\nJohn Doe,30,New York\nJane Smith,25,Los Angeles';
      
      case 'tsv':
        return 'Name\tAge\tCity\nJohn Doe\t30\tNew York\nJane Smith\t25\tLos Angeles';
      
      default:
        return 'Sample content';
    }
  }

  /**
   * Create a File object from binary data
   */
  static createFile(data: Uint8Array | string, filename: string, mimeType: string): File {
    const blob = typeof data === 'string' 
      ? new Blob([data], { type: mimeType })
      : new Blob([data], { type: mimeType });
    return new File([blob], filename, { type: mimeType });
  }

  /**
   * Generate test files for each format category
   */
  static generateTestFiles(): Map<string, File> {
    const files = new Map<string, File>();

    // Image files
    files.set('png', this.createFile(this.generatePNG(), 'test.png', 'image/png'));
    files.set('jpeg', this.createFile(this.generateJPEG(), 'test.jpg', 'image/jpeg'));
    files.set('bmp', this.createFile(this.generateBMP(), 'test.bmp', 'image/bmp'));
    files.set('gif', this.createFile(this.generateGIF(), 'test.gif', 'image/gif'));

    // Audio files
    files.set('wav', this.createFile(this.generateWAV(), 'test.wav', 'audio/wav'));

    // Archive files
    files.set('zip', this.createFile(this.generateZIP(), 'test.zip', 'application/zip'));

    // Text files
    files.set('txt', this.createFile(this.generateTextContent('txt'), 'test.txt', 'text/plain'));
    files.set('md', this.createFile(this.generateTextContent('md'), 'test.md', 'text/markdown'));
    files.set('html', this.createFile(this.generateTextContent('html'), 'test.html', 'text/html'));
    files.set('json', this.createFile(this.generateTextContent('json'), 'test.json', 'application/json'));
    files.set('yaml', this.createFile(this.generateTextContent('yaml'), 'test.yaml', 'text/yaml'));
    files.set('xml', this.createFile(this.generateTextContent('xml'), 'test.xml', 'text/xml'));
    files.set('csv', this.createFile(this.generateTextContent('csv'), 'test.csv', 'text/csv'));
    files.set('tsv', this.createFile(this.generateTextContent('tsv'), 'test.tsv', 'text/tab-separated-values'));

    return files;
  }
}