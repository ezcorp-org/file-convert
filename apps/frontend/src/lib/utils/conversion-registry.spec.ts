import { describe, it, expect } from 'vitest';
import { 
  formats, 
  conversionPaths, 
  getFormat, 
  getAvailableConversions, 
  getConversionPath 
} from './conversion-registry';

// Helper function to get conversion IDs from format objects
const getConversionIds = (conversions: any[]) => conversions.map(c => c.id);

describe('ConversionRegistry', () => {
  describe('formats', () => {
    it('should have all required format categories', () => {
      const categories = new Set(formats.map(f => f.category));
      expect(categories).toContain('image');
      expect(categories).toContain('audio');
      expect(categories).toContain('document');
      expect(categories).toContain('archive');
      expect(categories).toContain('spreadsheet');
      expect(categories).toContain('text');
    });

    it('should have correct MIME types for common formats', () => {
      const pngFormat = formats.find(f => f.id === 'png');
      expect(pngFormat?.mimeTypes).toContain('image/png');

      const mp3Format = formats.find(f => f.id === 'mp3');
      expect(mp3Format?.mimeTypes).toContain('audio/mpeg');

      const pdfFormat = formats.find(f => f.id === 'pdf');
      expect(pdfFormat?.mimeTypes).toContain('application/pdf');
    });
  });

  describe('getFormat', () => {
    it('should find format by ID', () => {
      const format = getFormat('png');
      expect(format).toBeDefined();
      expect(format?.id).toBe('png');
      expect(format?.name).toBe('PNG');
    });

    it('should find format by extension', () => {
      const format = getFormat('jpg');
      expect(format).toBeDefined();
      expect(format?.id).toBe('jpeg');
    });

    it('should be case-insensitive', () => {
      const format1 = getFormat('PNG');
      const format2 = getFormat('png');
      expect(format1).toEqual(format2);
    });

    it('should return undefined for unknown formats', () => {
      const format = getFormat('unknown');
      expect(format).toBeUndefined();
    });
  });

  describe('getAvailableConversions', () => {
    it('should return available conversions for PNG', () => {
      const conversions = getAvailableConversions('png');
      expect(getConversionIds(conversions)).toContain('jpeg');
      expect(getConversionIds(conversions)).toContain('webp');
      expect(getConversionIds(conversions)).toContain('tiff');
      expect(getConversionIds(conversions)).toContain('pnm');
    });

    it('should return available conversions for WAV', () => {
      const conversions = getAvailableConversions('wav');
      expect(getConversionIds(conversions)).toContain('flac');
      expect(getConversionIds(conversions)).toContain('mp3');
      expect(getConversionIds(conversions)).toContain('ogg');
      expect(getConversionIds(conversions)).toContain('opus');
    });

    it('should return empty array for formats with no conversions', () => {
      const conversions = getAvailableConversions('unknown');
      expect(conversions).toEqual([]);
    });
  });

  describe('getConversionPath', () => {
    it('should find valid conversion paths', () => {
      const path = getConversionPath('png', 'jpeg');
      expect(path).toBeDefined();
      expect(path?.from).toBe('png');
      expect(path?.to).toBe('jpeg');
      expect(path?.converter).toBe('image');
    });

    it('should return undefined for invalid conversion paths', () => {
      const path = getConversionPath('png', 'mp3');
      expect(path).toBeUndefined();
    });
  });
});