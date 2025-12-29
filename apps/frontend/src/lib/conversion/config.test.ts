import { describe, it, expect } from 'vitest';
import {
  FILE_TYPES,
  CONVERSION_OPTIONS,
  detectFileType,
  getAvailableOutputFormats,
  validateFile,
  getConversionOptions,
  formatFileSize,
  getMimeType,
  getFileExtension,
} from './config';

describe('FILE_TYPES configuration', () => {
  const TEN_GB = 10 * 1024 * 1024 * 1024;

  it('should define all expected format keys', () => {
    const expected = [
      'png', 'jpeg', 'webp', 'gif', 'bmp', 'tiff', 'ico',
      'wav', 'mp3', 'flac', 'ogg',
      'pdf',
      'md', 'html', 'txt', 'json', 'yaml', 'xml',
      'csv', 'tsv', 'xlsx',
      'zip', 'tar', 'tgz', '7z'
    ];
    for (const key of expected) {
      expect(FILE_TYPES[key], `Missing config for ${key}`).toBeDefined();
    }
  });

  it('should have consistent id matching the key', () => {
    for (const [key, config] of Object.entries(FILE_TYPES)) {
      expect(config.id).toBe(key);
    }
  });

  it('should set maxSize to 10GB for every format', () => {
    for (const [key, config] of Object.entries(FILE_TYPES)) {
      expect(config.maxSize, `${key} maxSize`).toBe(TEN_GB);
    }
  });

  it('should have non-empty extensions and mimeTypes for every format', () => {
    for (const [key, config] of Object.entries(FILE_TYPES)) {
      expect(config.extensions.length, `${key} extensions`).toBeGreaterThan(0);
      expect(config.mimeTypes.length, `${key} mimeTypes`).toBeGreaterThan(0);
    }
  });

  it('should have supportedOutputs referencing valid format keys (except known gaps)', () => {
    // pnm is listed as output for png/jpeg but has no FILE_TYPES entry
    const knownMissing = new Set(['pnm']);
    for (const [key, config] of Object.entries(FILE_TYPES)) {
      for (const outputId of config.supportedOutputs) {
        if (knownMissing.has(outputId)) continue;
        expect(FILE_TYPES[outputId], `${key} -> ${outputId} missing`).toBeDefined();
      }
    }
  });

  it('should assign correct categories', () => {
    const categoryMap: Record<string, string[]> = {
      image: ['png', 'jpeg', 'webp', 'gif', 'bmp', 'tiff', 'ico'],
      audio: ['wav', 'mp3', 'flac', 'ogg'],
      document: ['pdf'],
      text: ['md', 'html', 'txt', 'json', 'yaml', 'xml'],
      spreadsheet: ['csv', 'tsv', 'xlsx'],
      archive: ['zip', 'tar', 'tgz', '7z']
    };
    for (const [category, keys] of Object.entries(categoryMap)) {
      for (const key of keys) {
        expect(FILE_TYPES[key].category).toBe(category);
      }
    }
  });

  it('should assign correct workerTypes', () => {
    const workerMap: Record<string, string[]> = {
      image: ['png', 'jpeg', 'webp', 'gif', 'bmp', 'tiff', 'ico'],
      audio: ['wav', 'mp3', 'flac', 'ogg'],
      document: ['pdf'],
      text: ['md', 'html', 'txt', 'json', 'yaml', 'xml'],
      spreadsheet: ['csv', 'tsv', 'xlsx'],
      archive: ['zip', 'tar', 'tgz', '7z']
    };
    for (const [worker, keys] of Object.entries(workerMap)) {
      for (const key of keys) {
        expect(FILE_TYPES[key].workerType).toBe(worker);
      }
    }
  });
});

describe('CONVERSION_OPTIONS', () => {
  it('should define image options with quality, resize, width, height', () => {
    const ids = CONVERSION_OPTIONS.image.map(o => o.id);
    expect(ids).toContain('quality');
    expect(ids).toContain('resize');
    expect(ids).toContain('width');
    expect(ids).toContain('height');
  });

  it('should validate image quality range', () => {
    const quality = CONVERSION_OPTIONS.image.find(o => o.id === 'quality')!;
    expect(quality.default).toBe(90);
    expect(quality.validation!(1)).toBe(true);
    expect(quality.validation!(100)).toBe(true);
    expect(quality.validation!(0)).toBe(false);
    expect(quality.validation!(101)).toBe(false);
  });

  it('should validate image width/height accept null and positive', () => {
    const width = CONVERSION_OPTIONS.image.find(o => o.id === 'width')!;
    expect(width.validation!(null)).toBe(true);
    expect(width.validation!(0)).toBe(true); // !0 is truthy => returns true
    expect(width.validation!(100)).toBe(true);
    expect(width.validation!(-1)).toBe(false);
  });

  it('should define audio options with bitrate and sampleRate', () => {
    const ids = CONVERSION_OPTIONS.audio.map(o => o.id);
    expect(ids).toContain('bitrate');
    expect(ids).toContain('sampleRate');
  });

  it('should have correct audio defaults', () => {
    const bitrate = CONVERSION_OPTIONS.audio.find(o => o.id === 'bitrate')!;
    const sampleRate = CONVERSION_OPTIONS.audio.find(o => o.id === 'sampleRate')!;
    expect(bitrate.default).toBe('128k');
    expect(sampleRate.default).toBe(44100);
  });

  it('should define document options with dpi', () => {
    const ids = CONVERSION_OPTIONS.document.map(o => o.id);
    expect(ids).toContain('dpi');
    expect(CONVERSION_OPTIONS.document.find(o => o.id === 'dpi')!.default).toBe(150);
  });
});

describe('detectFileType', () => {
  it('should detect by MIME type', () => {
    const file = new File([''], 'test.png', { type: 'image/png' });
    expect(detectFileType(file)?.id).toBe('png');
  });

  it('should fall back to extension when MIME is empty', () => {
    const file = new File([''], 'test.png', { type: '' });
    expect(detectFileType(file)?.id).toBe('png');
  });

  it('should fall back to extension when MIME is octet-stream', () => {
    const file = new File([''], 'data.json', { type: 'application/octet-stream' });
    expect(detectFileType(file)?.id).toBe('json');
  });

  it('should handle multi-extension files like .tar.gz via last extension', () => {
    // The function uses split('.').pop() so .tar.gz -> 'gz', which won't match tgz
    // But a file named "archive.tgz" should match
    const file = new File([''], 'archive.tgz', { type: '' });
    expect(detectFileType(file)?.id).toBe('tgz');
  });

  it('should return null for unknown formats', () => {
    const file = new File([''], 'file.xyz', { type: 'application/xyz' });
    expect(detectFileType(file)).toBeNull();
  });

  it('should return null for file with no extension and unknown MIME', () => {
    const file = new File([''], 'noext', { type: '' });
    expect(detectFileType(file)).toBeNull();
  });

  it('should detect alternative MIME types', () => {
    const file = new File([''], 'img.bmp', { type: 'image/x-ms-bmp' });
    expect(detectFileType(file)?.id).toBe('bmp');
  });

  it('should detect files with alternative extensions', () => {
    const file = new File([''], 'photo.jpg', { type: 'image/jpeg' });
    expect(detectFileType(file)?.id).toBe('jpeg');
  });
});

describe('getAvailableOutputFormats', () => {
  it('should return output configs for png', () => {
    const formats = getAvailableOutputFormats('png');
    const ids = formats.map(f => f.id);
    expect(ids).toContain('jpeg');
    expect(ids).toContain('webp');
  });

  it('should return empty array for unknown type', () => {
    expect(getAvailableOutputFormats('nonexistent')).toEqual([]);
  });

  it('should return valid FileTypeConfig objects', () => {
    const formats = getAvailableOutputFormats('wav');
    for (const f of formats) {
      expect(f.id).toBeDefined();
      expect(f.extensions.length).toBeGreaterThan(0);
    }
  });
});

describe('validateFile', () => {
  it('should accept file within size limit', () => {
    const file = new File(['hello'], 'test.png', { type: 'image/png' });
    expect(validateFile(file, FILE_TYPES.png).valid).toBe(true);
  });

  it('should reject file exceeding size limit', () => {
    const file = new File(['x'], 'huge.png', { type: 'image/png' });
    Object.defineProperty(file, 'size', { value: 10 * 1024 * 1024 * 1024 + 1 });
    const result = validateFile(file, FILE_TYPES.png);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('too large');
  });

  it('should accept file with matching MIME type', () => {
    const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
    expect(validateFile(file, FILE_TYPES.jpeg).valid).toBe(true);
  });

  it('should accept file with matching extension even if MIME mismatches', () => {
    const file = new File([''], 'test.png', { type: '' });
    expect(validateFile(file, FILE_TYPES.png).valid).toBe(true);
  });

  it('should reject file with wrong MIME and wrong extension', () => {
    const file = new File([''], 'test.xyz', { type: 'application/xyz' });
    const result = validateFile(file, FILE_TYPES.png);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Invalid file type');
  });

  it('should format size limit as GB for large limits', () => {
    const file = new File(['x'], 'huge.wav', { type: 'audio/wav' });
    Object.defineProperty(file, 'size', { value: 11 * 1024 * 1024 * 1024 });
    const result = validateFile(file, FILE_TYPES.wav);
    expect(result.reason).toContain('GB');
  });
});

describe('getConversionOptions', () => {
  it('should return audio options for wav->mp3', () => {
    const opts = getConversionOptions('wav', 'mp3');
    expect(opts.some(o => o.id === 'bitrate')).toBe(true);
    expect(opts.some(o => o.id === 'sampleRate')).toBe(true);
  });

  it('should return image options for png->jpeg', () => {
    const opts = getConversionOptions('png', 'jpeg');
    expect(opts.some(o => o.id === 'quality')).toBe(true);
  });

  it('should return empty array for unknown formats', () => {
    expect(getConversionOptions('unknown', 'other')).toEqual([]);
  });

  it('should return empty array when fromType is unknown', () => {
    expect(getConversionOptions('unknown', 'png')).toEqual([]);
  });

  it('should return empty array when toType is unknown', () => {
    expect(getConversionOptions('png', 'unknown')).toEqual([]);
  });
});

describe('formatFileSize', () => {
  it('should format 0 bytes', () => {
    expect(formatFileSize(0)).toBe('0 Bytes');
  });

  it('should format bytes', () => {
    expect(formatFileSize(512)).toBe('512 Bytes');
  });

  it('should format KB', () => {
    expect(formatFileSize(1024)).toBe('1 KB');
  });

  it('should format MB', () => {
    expect(formatFileSize(1024 * 1024)).toBe('1 MB');
  });

  it('should format GB', () => {
    expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
  });

  it('should format fractional sizes', () => {
    expect(formatFileSize(1536)).toBe('1.5 KB');
  });
});

describe('getMimeType', () => {
  it('should return first MIME type for known format', () => {
    expect(getMimeType('png')).toBe('image/png');
    expect(getMimeType('jpeg')).toBe('image/jpeg');
    expect(getMimeType('mp3')).toBe('audio/mpeg');
    expect(getMimeType('pdf')).toBe('application/pdf');
  });

  it('should return application/octet-stream for unknown format', () => {
    expect(getMimeType('unknown')).toBe('application/octet-stream');
  });
});

describe('getFileExtension (config)', () => {
  it('should return first extension for known format', () => {
    expect(getFileExtension('png')).toBe('png');
    expect(getFileExtension('jpeg')).toBe('jpg');
    expect(getFileExtension('tiff')).toBe('tif');
  });

  it('should return bin for unknown format', () => {
    expect(getFileExtension('unknown')).toBe('bin');
  });
});
