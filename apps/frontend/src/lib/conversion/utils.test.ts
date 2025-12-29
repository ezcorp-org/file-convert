import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  detectFileType,
  createConversionJob,
  downloadFile,
  blobToBase64,
  base64ToBlob,
  getFileExtension,
  sanitizeFilename,
  generateJobId,
  debounce,
  throttle
} from './utils';

describe('detectFileType (utils)', () => {
  it('should detect by extension first', () => {
    const file = new File([''], 'photo.png', { type: 'image/png' });
    const result = detectFileType(file);
    expect(result?.id).toBe('png');
  });

  it('should fall back to MIME type if extension unknown', () => {
    // Create file with unknown extension but valid MIME
    const file = new File([''], 'file.unknown', { type: 'image/png' });
    const result = detectFileType(file);
    expect(result?.id).toBe('png');
  });

  it('should return null for unrecognized file', () => {
    const file = new File([''], 'file.xyz', { type: 'application/xyz' });
    expect(detectFileType(file)).toBeNull();
  });

  it('should return null for file with no extension and no MIME', () => {
    const file = new File([''], 'noext', { type: '' });
    expect(detectFileType(file)).toBeNull();
  });

  it('should handle alternative extensions like jpg', () => {
    const file = new File([''], 'photo.jpg', { type: '' });
    const result = detectFileType(file);
    expect(result?.id).toBe('jpeg');
  });

  it('should handle yml extension for yaml', () => {
    const file = new File([''], 'config.yml', { type: '' });
    const result = detectFileType(file);
    expect(result?.id).toBe('yaml');
  });
});

describe('createConversionJob', () => {
  it('should create a job with correct properties', () => {
    const file = new File(['data'], 'test.png', { type: 'image/png' });
    const job = createConversionJob(file, 'png', 'jpeg', { quality: 90 });

    expect(job.id).toMatch(/^job_/);
    expect(job.file).toBe(file);
    expect(job.fromFormat).toBe('png');
    expect(job.toFormat).toBe('jpeg');
    expect(job.options).toEqual({ quality: 90 });
    expect((job as any).timestamp).toBeGreaterThan(0);
  });

  it('should default options to empty object', () => {
    const file = new File([''], 'test.wav', { type: 'audio/wav' });
    const job = createConversionJob(file, 'wav', 'mp3');
    expect(job.options).toEqual({});
  });

  it('should generate unique IDs', () => {
    const file = new File([''], 'test.png');
    const job1 = createConversionJob(file, 'png', 'jpeg');
    const job2 = createConversionJob(file, 'png', 'jpeg');
    expect(job1.id).not.toBe(job2.id);
  });
});

describe('downloadFile', () => {
  it('should create and click a download link', () => {
    const blob = new Blob(['hello'], { type: 'text/plain' });
    const clickSpy = vi.fn();
    const removeSpy = vi.fn();

    // jsdom may not have these on URL, so assign mocks directly
    const origCreateObjectURL = URL.createObjectURL;
    const origRevokeObjectURL = URL.revokeObjectURL;
    URL.createObjectURL = vi.fn(() => 'blob:test');
    URL.revokeObjectURL = vi.fn();

    const origCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = origCreateElement(tag);
      if (tag === 'a') {
        el.click = clickSpy;
        el.remove = removeSpy;
      }
      return el;
    });

    downloadFile(blob, 'test.txt');

    expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
    expect(clickSpy).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test');

    URL.createObjectURL = origCreateObjectURL;
    URL.revokeObjectURL = origRevokeObjectURL;
    vi.restoreAllMocks();
  });
});

describe('blobToBase64', () => {
  it('should convert blob to base64 data URL', async () => {
    const blob = new Blob(['hello'], { type: 'text/plain' });
    const result = await blobToBase64(blob);
    expect(result).toMatch(/^data:text\/plain;base64,/);
  });
});

describe('base64ToBlob', () => {
  it('should convert base64 string to blob', () => {
    const base64 = btoa('hello world');
    const blob = base64ToBlob(base64, 'text/plain');
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('text/plain');
    expect(blob.size).toBe(11);
  });

  it('should strip data URI prefix if present', () => {
    const base64 = 'data:text/plain;base64,' + btoa('test');
    const blob = base64ToBlob(base64, 'text/plain');
    expect(blob.size).toBe(4);
  });
});

describe('getFileExtension (utils)', () => {
  it('should extract extension from filename', () => {
    expect(getFileExtension('photo.png')).toBe('png');
    expect(getFileExtension('archive.tar.gz')).toBe('gz');
  });

  it('should return empty string for no extension', () => {
    expect(getFileExtension('noext')).toBe('');
  });

  it('should handle hidden files', () => {
    expect(getFileExtension('.gitignore')).toBe('gitignore');
  });

  it('should lowercase the extension', () => {
    expect(getFileExtension('image.PNG')).toBe('png');
    expect(getFileExtension('doc.TXT')).toBe('txt');
  });
});

describe('sanitizeFilename', () => {
  it('should replace invalid characters', () => {
    expect(sanitizeFilename('file<>:"/\\|?*.txt')).toBe('file_________.txt');
  });

  it('should trim whitespace', () => {
    expect(sanitizeFilename('  hello.txt  ')).toBe('hello.txt');
  });

  it('should return "unnamed" for empty result', () => {
    expect(sanitizeFilename('')).toBe('unnamed');
    expect(sanitizeFilename('   ')).toBe('unnamed');
  });

  it('should pass through valid filenames unchanged', () => {
    expect(sanitizeFilename('valid-file_name.txt')).toBe('valid-file_name.txt');
  });
});

describe('generateJobId', () => {
  it('should return string starting with job_', () => {
    const id = generateJobId();
    expect(id).toMatch(/^job_[0-9a-f]+_\d+$/);
  });

  it('should generate unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateJobId()));
    expect(ids.size).toBe(100);
  });
});

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should delay function execution', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should reset delay on repeated calls', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    vi.advanceTimersByTime(50);
    debounced();
    vi.advanceTimersByTime(50);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should pass arguments to the original function', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced('a', 'b');
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledWith('a', 'b');
  });

  afterEach(() => {
    vi.useRealTimers();
  });
});

describe('throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should execute immediately on first call', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);

    throttled();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should suppress calls within the throttle window', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);

    throttled();
    throttled();
    throttled();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should allow calls after the throttle window', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);

    throttled();
    vi.advanceTimersByTime(100);
    throttled();
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should pass arguments to the original function', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);

    throttled('x');
    expect(fn).toHaveBeenCalledWith('x');
  });

  afterEach(() => {
    vi.useRealTimers();
  });
});
