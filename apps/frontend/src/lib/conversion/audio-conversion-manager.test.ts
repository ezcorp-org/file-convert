/**
 * Integration Tests for Audio Conversion Configuration
 * Tests audio-specific configuration and conversion paths
 */

import { describe, it, expect } from 'vitest';
import { FILE_TYPES, detectFileType, validateFile, getAvailableOutputFormats } from './config';

describe('Audio Conversion Configuration Integration', () => {
  describe('Audio Format Detection and Validation', () => {
    it('should correctly identify audio file types', () => {
      const files = [
        { name: 'test.wav', type: 'audio/wav', expectedId: 'wav' },
        { name: 'song.mp3', type: 'audio/mpeg', expectedId: 'mp3' },
        { name: 'music.flac', type: 'audio/flac', expectedId: 'flac' },
        { name: 'voice.ogg', type: 'audio/ogg', expectedId: 'ogg' },
      ];

      files.forEach(({ name, type, expectedId }) => {
        const file = new File(['test data'], name, { type });
        const config = detectFileType(file);
        expect(config).toBeDefined();
        expect(config?.id).toBe(expectedId);
        expect(config?.category).toBe('audio');
      });
    });

    it('should validate conversion paths between audio formats', () => {
      // WAV can convert to MP3 (and WAV for quality adjustment)
      const wavConfig = FILE_TYPES.wav;
      expect(wavConfig.supportedOutputs).toContain('mp3');
      expect(wavConfig.supportedOutputs).toContain('wav');

      // MP3 can convert to WAV and MP3
      const mp3Config = FILE_TYPES.mp3;
      expect(mp3Config.supportedOutputs).toContain('wav');
      expect(mp3Config.supportedOutputs).toContain('mp3');

      // FLAC can convert to WAV, MP3
      const flacConfig = FILE_TYPES.flac;
      expect(flacConfig.supportedOutputs).toContain('wav');
      expect(flacConfig.supportedOutputs).toContain('mp3');

      // OGG can convert to WAV, MP3
      const oggConfig = FILE_TYPES.ogg;
      expect(oggConfig.supportedOutputs).toContain('wav');
      expect(oggConfig.supportedOutputs).toContain('mp3');
    });

    it('should validate audio file sizes correctly', () => {
      const testCases = [
        { format: 'wav', size: 100 * 1024 * 1024, shouldPass: true },  // 100MB WAV (within 10GB limit)
        { format: 'mp3', size: 50 * 1024 * 1024, shouldPass: true },   // 50MB MP3 (within 10GB limit)
        { format: 'flac', size: 150 * 1024 * 1024, shouldPass: true }, // 150MB FLAC (within 10GB limit)
        { format: 'wav', size: 300 * 1024 * 1024, shouldPass: true },  // 300MB WAV (within 10GB limit)
        { format: 'mp3', size: 150 * 1024 * 1024, shouldPass: true },  // 150MB MP3 (within 10GB limit)
      ];

      testCases.forEach(({ format, size, shouldPass }) => {
        const config = FILE_TYPES[format];
        const file = new File([new Uint8Array(size)], `test.${format}`, {
          type: config.mimeTypes[0]
        });
        const validation = validateFile(file, config);
        expect(validation.valid).toBe(shouldPass);
        if (!shouldPass) {
          expect(validation.reason).toContain('too large');
        }
      });
    });

    it('should provide correct available output formats', () => {
      // Test WAV output formats - mp3 and wav are supported
      const wavOutputs = getAvailableOutputFormats('wav');
      expect(wavOutputs.length).toBeGreaterThan(0);
      expect(wavOutputs.some(f => f.id === 'mp3')).toBe(true);

      // Test MP3 output formats - wav and mp3 are supported
      const mp3Outputs = getAvailableOutputFormats('mp3');
      expect(mp3Outputs.length).toBeGreaterThan(0);
      expect(mp3Outputs.some(f => f.id === 'wav')).toBe(true);

      // Test FLAC output formats - wav and mp3 are supported
      const flacOutputs = getAvailableOutputFormats('flac');
      expect(flacOutputs.length).toBeGreaterThan(0);
      expect(flacOutputs.some(f => f.id === 'wav')).toBe(true);
      expect(flacOutputs.some(f => f.id === 'mp3')).toBe(true);

      // Test OGG output formats - wav and mp3 are supported
      const oggOutputs = getAvailableOutputFormats('ogg');
      expect(oggOutputs.length).toBeGreaterThan(0);
      expect(oggOutputs.some(f => f.id === 'wav')).toBe(true);
      expect(oggOutputs.some(f => f.id === 'mp3')).toBe(true);
    });
  });

  describe('Audio Worker Type Assignment', () => {
    it('should assign audio worker to all audio formats', () => {
      const audioFormats = ['wav', 'mp3', 'flac', 'ogg'];

      audioFormats.forEach(format => {
        const config = FILE_TYPES[format];
        expect(config).toBeDefined();
        expect(config.workerType).toBe('audio');
        expect(config.category).toBe('audio');
      });
    });
  });

  describe('Audio Conversion Compatibility Matrix', () => {
    it('should verify all audio formats can convert to WAV', () => {
      const audioFormats = ['mp3', 'flac', 'ogg'];

      audioFormats.forEach(format => {
        const config = FILE_TYPES[format];
        expect(config.supportedOutputs).toContain('wav');
      });
    });

    it('should verify WAV can convert to MP3', () => {
      const wavConfig = FILE_TYPES.wav;
      expect(wavConfig.supportedOutputs).toContain('mp3');
    });

    it('should verify bidirectional WAV/MP3 conversion paths', () => {
      // WAV -> MP3 and MP3 -> WAV should be supported
      expect(FILE_TYPES.wav.supportedOutputs).toContain('mp3');
      expect(FILE_TYPES.mp3.supportedOutputs).toContain('wav');
      // FLAC -> WAV is also supported
      expect(FILE_TYPES.flac.supportedOutputs).toContain('wav');
    });
  });

  describe('Audio File Edge Cases', () => {
    it('should handle audio files with alternative extensions', () => {
      // OGG has alternate .oga extension
      const ogaFile = new File(['test'], 'audio.oga', { type: 'audio/ogg' });
      const config = detectFileType(ogaFile);
      expect(config).toBeDefined();
      expect(config?.id).toBe('ogg');
    });

    it('should handle audio files with missing MIME type', () => {
      const file = new File(['test'], 'audio.wav', { type: '' });
      const config = detectFileType(file);
      expect(config).toBeDefined();
      expect(config?.id).toBe('wav');
    });

    it('should handle audio files with generic MIME type', () => {
      const file = new File(['test'], 'audio.mp3', { type: 'application/octet-stream' });
      const config = detectFileType(file);
      expect(config).toBeDefined();
      expect(config?.id).toBe('mp3');
    });
  });

  describe('Audio File Size Limits', () => {
    it('should allow files up to 10GB for all audio formats', () => {
      const tenGB = 10 * 1024 * 1024 * 1024;
      expect(FILE_TYPES.wav.maxSize).toBe(tenGB);
      expect(FILE_TYPES.flac.maxSize).toBe(tenGB);
      expect(FILE_TYPES.mp3.maxSize).toBe(tenGB);
      expect(FILE_TYPES.ogg.maxSize).toBe(tenGB);
    });
  });
});
