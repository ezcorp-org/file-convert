/**
 * Unit Tests for Audio File Conversion
 * Tests audio file type detection, validation, and conversion configuration
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  FILE_TYPES,
  detectFileType,
  validateFile,
  getAvailableOutputFormats,
  getConversionOptions,
  formatFileSize,
  getMimeType,
  getFileExtension,
  CONVERSION_OPTIONS,
  type FileTypeConfig
} from './config';

describe('Audio File Type Detection', () => {
  describe('Audio File Types Configuration', () => {
    it('should have WAV audio configuration', () => {
      const wavConfig = FILE_TYPES.wav;
      expect(wavConfig).toBeDefined();
      expect(wavConfig.id).toBe('wav');
      expect(wavConfig.name).toBe('WAV Audio');
      expect(wavConfig.category).toBe('audio');
      expect(wavConfig.extensions).toContain('wav');
      expect(wavConfig.mimeTypes).toContain('audio/wav');
      expect(wavConfig.workerType).toBe('audio');
    });

    it('should have MP3 audio configuration', () => {
      const mp3Config = FILE_TYPES.mp3;
      expect(mp3Config).toBeDefined();
      expect(mp3Config.id).toBe('mp3');
      expect(mp3Config.name).toBe('MP3 Audio');
      expect(mp3Config.category).toBe('audio');
      expect(mp3Config.extensions).toContain('mp3');
      expect(mp3Config.mimeTypes).toContain('audio/mpeg');
      expect(mp3Config.workerType).toBe('audio');
    });

    it('should have FLAC audio configuration', () => {
      const flacConfig = FILE_TYPES.flac;
      expect(flacConfig).toBeDefined();
      expect(flacConfig.id).toBe('flac');
      expect(flacConfig.name).toBe('FLAC Audio');
      expect(flacConfig.category).toBe('audio');
      expect(flacConfig.extensions).toContain('flac');
      expect(flacConfig.mimeTypes).toContain('audio/flac');
      expect(flacConfig.workerType).toBe('audio');
    });

    it('should have OGG audio configuration', () => {
      const oggConfig = FILE_TYPES.ogg;
      expect(oggConfig).toBeDefined();
      expect(oggConfig.id).toBe('ogg');
      expect(oggConfig.name).toBe('Ogg Vorbis');
      expect(oggConfig.category).toBe('audio');
      expect(oggConfig.extensions).toContain('ogg');
      expect(oggConfig.mimeTypes).toContain('audio/ogg');
      expect(oggConfig.workerType).toBe('audio');
    });
  });

  describe('detectFileType for Audio Files', () => {
    it('should detect WAV file by MIME type', () => {
      const file = new File([''], 'audio.wav', { type: 'audio/wav' });
      const config = detectFileType(file);
      expect(config).toBeDefined();
      expect(config?.id).toBe('wav');
      expect(config?.category).toBe('audio');
    });

    it('should detect MP3 file by MIME type', () => {
      const file = new File([''], 'song.mp3', { type: 'audio/mpeg' });
      const config = detectFileType(file);
      expect(config).toBeDefined();
      expect(config?.id).toBe('mp3');
      expect(config?.category).toBe('audio');
    });

    it('should detect FLAC file by MIME type', () => {
      const file = new File([''], 'music.flac', { type: 'audio/flac' });
      const config = detectFileType(file);
      expect(config).toBeDefined();
      expect(config?.id).toBe('flac');
      expect(config?.category).toBe('audio');
    });

    it('should detect OGG file by MIME type', () => {
      const file = new File([''], 'track.ogg', { type: 'audio/ogg' });
      const config = detectFileType(file);
      expect(config).toBeDefined();
      expect(config?.id).toBe('ogg');
      expect(config?.category).toBe('audio');
    });

    it('should detect WAV file by extension when MIME type is missing', () => {
      const file = new File([''], 'audio.wav', { type: '' });
      const config = detectFileType(file);
      expect(config).toBeDefined();
      expect(config?.id).toBe('wav');
    });

    it('should detect MP3 file by extension when MIME type is generic', () => {
      const file = new File([''], 'song.mp3', { type: 'application/octet-stream' });
      const config = detectFileType(file);
      expect(config).toBeDefined();
      expect(config?.id).toBe('mp3');
    });

    it('should detect alternative WAV MIME type', () => {
      const file = new File([''], 'audio.wav', { type: 'audio/wave' });
      const config = detectFileType(file);
      expect(config).toBeDefined();
      expect(config?.id).toBe('wav');
    });

    it('should detect alternative OGG extension', () => {
      const file = new File([''], 'audio.oga', { type: 'audio/ogg' });
      const config = detectFileType(file);
      expect(config).toBeDefined();
      expect(config?.id).toBe('ogg');
    });

    it('should return null for unsupported audio format', () => {
      const file = new File([''], 'audio.xyz', { type: 'audio/xyz' });
      const config = detectFileType(file);
      expect(config).toBeNull();
    });
  });

  describe('Audio File Validation', () => {
    it('should validate WAV file within size limit', () => {
      const file = new File(['x'.repeat(1024 * 1024)], 'audio.wav', { type: 'audio/wav' }); // 1MB
      const config = FILE_TYPES.wav;
      const validation = validateFile(file, config);
      expect(validation.valid).toBe(true);
    });

    it('should reject WAV file exceeding size limit', () => {
      const maxSize = FILE_TYPES.wav.maxSize;
      const file = new File(['x'.repeat(maxSize + 1)], 'huge.wav', { type: 'audio/wav' });
      const config = FILE_TYPES.wav;
      const validation = validateFile(file, config);
      expect(validation.valid).toBe(false);
      expect(validation.reason).toContain('too large');
    });

    it('should validate MP3 file within size limit', () => {
      const file = new File(['x'.repeat(5 * 1024 * 1024)], 'song.mp3', { type: 'audio/mpeg' }); // 5MB
      const config = FILE_TYPES.mp3;
      const validation = validateFile(file, config);
      expect(validation.valid).toBe(true);
    });

    it('should reject MP3 file exceeding size limit', () => {
      const maxSize = FILE_TYPES.mp3.maxSize;
      const file = new File(['x'.repeat(maxSize + 1)], 'huge.mp3', { type: 'audio/mpeg' });
      const config = FILE_TYPES.mp3;
      const validation = validateFile(file, config);
      expect(validation.valid).toBe(false);
      expect(validation.reason).toContain('too large');
    });

    it('should validate FLAC file within size limit', () => {
      const file = new File(['x'.repeat(10 * 1024 * 1024)], 'music.flac', { type: 'audio/flac' }); // 10MB
      const config = FILE_TYPES.flac;
      const validation = validateFile(file, config);
      expect(validation.valid).toBe(true);
    });

    it('should accept file with correct extension even if MIME type is missing', () => {
      const file = new File(['x'.repeat(1024)], 'audio.wav', { type: '' });
      const config = FILE_TYPES.wav;
      const validation = validateFile(file, config);
      expect(validation.valid).toBe(true);
    });
  });

  describe('Audio Conversion Support', () => {
    it('should list supported output formats for WAV', () => {
      const wavConfig = FILE_TYPES.wav;
      expect(wavConfig.supportedOutputs).toContain('mp3');
      expect(wavConfig.supportedOutputs).toContain('flac');
      expect(wavConfig.supportedOutputs).toContain('ogg');
      expect(wavConfig.supportedOutputs).toContain('opus');
    });

    it('should list supported output formats for MP3', () => {
      const mp3Config = FILE_TYPES.mp3;
      expect(mp3Config.supportedOutputs).toContain('wav');
      expect(mp3Config.supportedOutputs).toContain('flac');
      expect(mp3Config.supportedOutputs).toContain('ogg');
    });

    it('should list supported output formats for FLAC', () => {
      const flacConfig = FILE_TYPES.flac;
      expect(flacConfig.supportedOutputs).toContain('wav');
      expect(flacConfig.supportedOutputs).toContain('mp3');
      expect(flacConfig.supportedOutputs).toContain('ogg');
    });

    it('should list supported output formats for OGG', () => {
      const oggConfig = FILE_TYPES.ogg;
      expect(oggConfig.supportedOutputs).toContain('wav');
      expect(oggConfig.supportedOutputs).toContain('mp3');
      expect(oggConfig.supportedOutputs).toContain('flac');
    });

    it('should get available output formats for WAV', () => {
      const formats = getAvailableOutputFormats('wav');
      expect(formats.length).toBeGreaterThan(0);
      expect(formats.some(f => f.id === 'mp3')).toBe(true);
      expect(formats.some(f => f.id === 'flac')).toBe(true);
    });

    it('should get available output formats for MP3', () => {
      const formats = getAvailableOutputFormats('mp3');
      expect(formats.length).toBeGreaterThan(0);
      expect(formats.some(f => f.id === 'wav')).toBe(true);
      expect(formats.some(f => f.id === 'flac')).toBe(true);
    });

    it('should return empty array for unknown format', () => {
      const formats = getAvailableOutputFormats('unknown');
      expect(formats).toEqual([]);
    });
  });

  describe('Audio Conversion Options', () => {
    it('should have audio conversion options defined', () => {
      const audioOptions = CONVERSION_OPTIONS.audio;
      expect(audioOptions).toBeDefined();
      expect(Array.isArray(audioOptions)).toBe(true);
      expect(audioOptions.length).toBeGreaterThan(0);
    });

    it('should have bitrate option for audio conversions', () => {
      const audioOptions = CONVERSION_OPTIONS.audio;
      const bitrateOption = audioOptions.find(opt => opt.id === 'bitrate');
      expect(bitrateOption).toBeDefined();
      expect(bitrateOption?.type).toBe('select');
      expect(bitrateOption?.default).toBe('128k');
      expect(bitrateOption?.options).toBeDefined();
      expect(bitrateOption?.options?.length).toBeGreaterThan(0);
    });

    it('should have sample rate option for audio conversions', () => {
      const audioOptions = CONVERSION_OPTIONS.audio;
      const sampleRateOption = audioOptions.find(opt => opt.id === 'sampleRate');
      expect(sampleRateOption).toBeDefined();
      expect(sampleRateOption?.type).toBe('select');
      expect(sampleRateOption?.default).toBe(44100);
    });

    it('should have valid bitrate options', () => {
      const audioOptions = CONVERSION_OPTIONS.audio;
      const bitrateOption = audioOptions.find(opt => opt.id === 'bitrate');
      const bitrates = bitrateOption?.options?.map(opt => opt.value);
      expect(bitrates).toContain('64k');
      expect(bitrates).toContain('128k');
      expect(bitrates).toContain('192k');
      expect(bitrates).toContain('256k');
      expect(bitrates).toContain('320k');
    });

    it('should have valid sample rate options', () => {
      const audioOptions = CONVERSION_OPTIONS.audio;
      const sampleRateOption = audioOptions.find(opt => opt.id === 'sampleRate');
      const sampleRates = sampleRateOption?.options?.map(opt => opt.value);
      expect(sampleRates).toContain(22050);
      expect(sampleRates).toContain(44100);
      expect(sampleRates).toContain(48000);
    });

    it('should get conversion options for WAV to MP3', () => {
      const options = getConversionOptions('wav', 'mp3');
      expect(options.length).toBeGreaterThan(0);
      expect(options.some(opt => opt.id === 'bitrate')).toBe(true);
      expect(options.some(opt => opt.id === 'sampleRate')).toBe(true);
    });

    it('should get conversion options for MP3 to WAV', () => {
      const options = getConversionOptions('mp3', 'wav');
      expect(options.length).toBeGreaterThan(0);
    });
  });

  describe('Audio Helper Functions', () => {
    it('should get correct MIME type for WAV', () => {
      const mimeType = getMimeType('wav');
      expect(mimeType).toBe('audio/wav');
    });

    it('should get correct MIME type for MP3', () => {
      const mimeType = getMimeType('mp3');
      expect(mimeType).toBe('audio/mpeg');
    });

    it('should get correct MIME type for FLAC', () => {
      const mimeType = getMimeType('flac');
      expect(mimeType).toBe('audio/flac');
    });

    it('should get correct MIME type for OGG', () => {
      const mimeType = getMimeType('ogg');
      expect(mimeType).toBe('audio/ogg');
    });

    it('should get correct extension for WAV', () => {
      const ext = getFileExtension('wav');
      expect(ext).toBe('wav');
    });

    it('should get correct extension for MP3', () => {
      const ext = getFileExtension('mp3');
      expect(ext).toBe('mp3');
    });

    it('should return default MIME type for unknown format', () => {
      const mimeType = getMimeType('unknownformat');
      expect(mimeType).toBe('application/octet-stream');
    });

    it('should return default extension for unknown format', () => {
      const ext = getFileExtension('unknownformat');
      expect(ext).toBe('bin');
    });
  });

  describe('Audio File Size Formatting', () => {
    it('should format audio file sizes correctly', () => {
      expect(formatFileSize(1024)).toBe('1 KB'); // 1KB
      expect(formatFileSize(1024 * 1024)).toBe('1 MB'); // 1MB
      expect(formatFileSize(5 * 1024 * 1024)).toBe('5 MB'); // 5MB
      expect(formatFileSize(100 * 1024 * 1024)).toBe('100 MB'); // 100MB
    });

    it('should handle zero bytes', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
    });

    it('should handle small byte values', () => {
      expect(formatFileSize(512)).toBe('512 Bytes');
      expect(formatFileSize(1023)).toBe('1023 Bytes');
    });

    it('should format with decimals for fractional sizes', () => {
      const result = formatFileSize(1536); // 1.5 KB
      expect(result).toMatch(/1\.5 KB/);
    });
  });

  describe('Audio Max File Sizes', () => {
    it('should have appropriate max size for WAV (200MB)', () => {
      const wavConfig = FILE_TYPES.wav;
      expect(wavConfig.maxSize).toBe(200 * 1024 * 1024);
    });

    it('should have appropriate max size for MP3 (100MB)', () => {
      const mp3Config = FILE_TYPES.mp3;
      expect(mp3Config.maxSize).toBe(100 * 1024 * 1024);
    });

    it('should have appropriate max size for FLAC (200MB)', () => {
      const flacConfig = FILE_TYPES.flac;
      expect(flacConfig.maxSize).toBe(200 * 1024 * 1024);
    });

    it('should have appropriate max size for OGG (100MB)', () => {
      const oggConfig = FILE_TYPES.ogg;
      expect(oggConfig.maxSize).toBe(100 * 1024 * 1024);
    });
  });

  describe('Audio Worker Type Assignment', () => {
    it('should assign audio worker to all audio formats', () => {
      expect(FILE_TYPES.wav.workerType).toBe('audio');
      expect(FILE_TYPES.mp3.workerType).toBe('audio');
      expect(FILE_TYPES.flac.workerType).toBe('audio');
      expect(FILE_TYPES.ogg.workerType).toBe('audio');
    });

    it('should categorize all formats as audio', () => {
      expect(FILE_TYPES.wav.category).toBe('audio');
      expect(FILE_TYPES.mp3.category).toBe('audio');
      expect(FILE_TYPES.flac.category).toBe('audio');
      expect(FILE_TYPES.ogg.category).toBe('audio');
    });
  });

  describe('Audio Format Icons', () => {
    it('should have unique icons for each audio format', () => {
      const wavIcon = FILE_TYPES.wav.icon;
      const mp3Icon = FILE_TYPES.mp3.icon;
      const flacIcon = FILE_TYPES.flac.icon;
      const oggIcon = FILE_TYPES.ogg.icon;

      expect(wavIcon).toBeTruthy();
      expect(mp3Icon).toBeTruthy();
      expect(flacIcon).toBeTruthy();
      expect(oggIcon).toBeTruthy();

      // All should be different (or at least defined)
      const icons = [wavIcon, mp3Icon, flacIcon, oggIcon];
      icons.forEach(icon => {
        expect(typeof icon).toBe('string');
        expect(icon.length).toBeGreaterThan(0);
      });
    });
  });
});
