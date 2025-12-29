/**
 * File Conversion System Configuration
 * Centralized configuration for all conversion operations
 */

export interface FileTypeConfig {
  id: string;
  name: string;
  extensions: string[];
  mimeTypes: string[];
  category: 'image' | 'audio' | 'video' | 'document' | 'archive' | 'text' | 'spreadsheet';
  icon: string;
  maxSize: number; // in bytes
  supportedOutputs: string[];
  workerType: string;
  validationRules?: ValidationRule[];
}

export interface ValidationRule {
  type: 'size' | 'format' | 'dimension' | 'custom';
  check: (file: File) => Promise<boolean>;
  message: string;
}

export interface ConversionOption {
  id: string;
  name: string;
  description: string;
  type: 'number' | 'string' | 'boolean' | 'select';
  default: any;
  options?: Array<{ value: any; label: string }>;
  validation?: (value: any) => boolean;
}

export interface ConversionRoute {
  from: string;
  to: string;
  handler: string;
  options?: ConversionOption[];
  transform?: (input: File, options: Record<string, any>) => Promise<File>;
  validate?: (file: File) => Promise<{ valid: boolean; reason?: string }>;
}

// Maximum file size: 10 GB
const MAX_FILE_SIZE = 10 * 1024 * 1024 * 1024;

// File Type Configurations
export const FILE_TYPES: Record<string, FileTypeConfig> = {
  // Images
  png: {
    id: 'png',
    name: 'PNG Image',
    extensions: ['png'],
    mimeTypes: ['image/png'],
    category: 'image',
    icon: '🖼️',
    maxSize: MAX_FILE_SIZE,
    supportedOutputs: ['jpeg', 'webp', 'tiff', 'bmp', 'gif', 'ico', 'pnm'],
    workerType: 'image'
  },
  jpeg: {
    id: 'jpeg',
    name: 'JPEG Image',
    extensions: ['jpg', 'jpeg'],
    mimeTypes: ['image/jpeg'],
    category: 'image',
    icon: '📷',
    maxSize: MAX_FILE_SIZE,
    supportedOutputs: ['png', 'webp', 'tiff', 'bmp', 'gif', 'pnm'],
    workerType: 'image'
  },
  webp: {
    id: 'webp',
    name: 'WebP Image',
    extensions: ['webp'],
    mimeTypes: ['image/webp'],
    category: 'image',
    icon: '🌐',
    maxSize: MAX_FILE_SIZE,
    supportedOutputs: ['png', 'jpeg', 'tiff', 'bmp'],
    workerType: 'image'
  },
  gif: {
    id: 'gif',
    name: 'GIF Animation',
    extensions: ['gif'],
    mimeTypes: ['image/gif'],
    category: 'image',
    icon: '🎬',
    maxSize: MAX_FILE_SIZE,
    supportedOutputs: ['png', 'jpeg', 'webp'],
    workerType: 'image'
  },
  bmp: {
    id: 'bmp',
    name: 'Bitmap Image',
    extensions: ['bmp'],
    mimeTypes: ['image/bmp', 'image/x-ms-bmp'],
    category: 'image',
    icon: '🖌️',
    maxSize: MAX_FILE_SIZE,
    supportedOutputs: ['png', 'jpeg', 'webp'],
    workerType: 'image'
  },
  tiff: {
    id: 'tiff',
    name: 'TIFF Image',
    extensions: ['tif', 'tiff'],
    mimeTypes: ['image/tiff'],
    category: 'image',
    icon: '📐',
    maxSize: MAX_FILE_SIZE,
    supportedOutputs: ['png', 'jpeg', 'webp'],
    workerType: 'image'
  },
  ico: {
    id: 'ico',
    name: 'Icon',
    extensions: ['ico'],
    mimeTypes: ['image/x-icon', 'image/vnd.microsoft.icon'],
    category: 'image',
    icon: '🎯',
    maxSize: MAX_FILE_SIZE,
    supportedOutputs: ['png'],
    workerType: 'image'
  },
  
  // Audio
  wav: {
    id: 'wav',
    name: 'WAV Audio',
    extensions: ['wav'],
    mimeTypes: ['audio/wav', 'audio/wave'],
    category: 'audio',
    icon: '🎵',
    maxSize: MAX_FILE_SIZE,
    supportedOutputs: ['mp3', 'wav'], // WAV to MP3 and WAV to WAV (quality adjustment)
    workerType: 'audio'
  },
  mp3: {
    id: 'mp3',
    name: 'MP3 Audio',
    extensions: ['mp3'],
    mimeTypes: ['audio/mpeg', 'audio/mp3'],
    category: 'audio',
    icon: '🎧',
    maxSize: MAX_FILE_SIZE,
    supportedOutputs: ['wav', 'mp3'], // MP3 decoded in main thread using AudioContext, then converted in worker
    workerType: 'audio'
  },
  flac: {
    id: 'flac',
    name: 'FLAC Audio',
    extensions: ['flac'],
    mimeTypes: ['audio/flac'],
    category: 'audio',
    icon: '🎼',
    maxSize: MAX_FILE_SIZE,
    supportedOutputs: ['wav', 'mp3'], // FLAC decoded in main thread using AudioContext, then converted in worker
    workerType: 'audio'
  },
  ogg: {
    id: 'ogg',
    name: 'Ogg Vorbis',
    extensions: ['ogg', 'oga'],
    mimeTypes: ['audio/ogg', 'audio/vorbis'],
    category: 'audio',
    icon: '🔊',
    maxSize: MAX_FILE_SIZE,
    supportedOutputs: ['wav', 'mp3'], // OGG decoded in main thread using AudioContext, then converted in worker
    workerType: 'audio'
  },
  
  // Documents
  pdf: {
    id: 'pdf',
    name: 'PDF Document',
    extensions: ['pdf'],
    mimeTypes: ['application/pdf'],
    category: 'document',
    icon: '📄',
    maxSize: MAX_FILE_SIZE,
    supportedOutputs: ['png', 'jpeg'],
    workerType: 'document'
  },
  // Text Files
  md: {
    id: 'md',
    name: 'Markdown',
    extensions: ['md', 'markdown'],
    mimeTypes: ['text/markdown', 'text/x-markdown'],
    category: 'text',
    icon: '📋',
    maxSize: MAX_FILE_SIZE,
    supportedOutputs: ['html', 'pdf', 'txt'],
    workerType: 'text'
  },
  html: {
    id: 'html',
    name: 'HTML',
    extensions: ['html', 'htm'],
    mimeTypes: ['text/html'],
    category: 'text',
    icon: '🌐',
    maxSize: MAX_FILE_SIZE,
    supportedOutputs: ['pdf', 'md', 'txt'],
    workerType: 'text'
  },
  txt: {
    id: 'txt',
    name: 'Plain Text',
    extensions: ['txt'],
    mimeTypes: ['text/plain'],
    category: 'text',
    icon: '📝',
    maxSize: MAX_FILE_SIZE,
    supportedOutputs: ['html', 'md'],
    workerType: 'text'
  },
  json: {
    id: 'json',
    name: 'JSON',
    extensions: ['json'],
    mimeTypes: ['application/json', 'text/json', 'text/x-json'],
    category: 'text',
    icon: '{}',
    maxSize: MAX_FILE_SIZE,
    supportedOutputs: ['yaml', 'xml', 'csv', 'xlsx'],
    workerType: 'text'
  },
  yaml: {
    id: 'yaml',
    name: 'YAML',
    extensions: ['yaml', 'yml'],
    mimeTypes: ['text/yaml', 'application/x-yaml', 'text/x-yaml'],
    category: 'text',
    icon: '📦',
    maxSize: MAX_FILE_SIZE,
    supportedOutputs: ['json', 'xml'],
    workerType: 'text'
  },
  xml: {
    id: 'xml',
    name: 'XML',
    extensions: ['xml'],
    mimeTypes: ['text/xml', 'application/xml', 'application/x-xml'],
    category: 'text',
    icon: '🏷️',
    maxSize: MAX_FILE_SIZE,
    supportedOutputs: ['json', 'yaml', 'csv'],
    workerType: 'text'
  },
  
  // Spreadsheets
  csv: {
    id: 'csv',
    name: 'CSV',
    extensions: ['csv'],
    mimeTypes: ['text/csv', 'application/csv', 'text/x-csv'],
    category: 'spreadsheet',
    icon: '📊',
    maxSize: MAX_FILE_SIZE,
    supportedOutputs: ['xlsx', 'json', 'tsv'],
    workerType: 'spreadsheet'
  },
  tsv: {
    id: 'tsv',
    name: 'TSV',
    extensions: ['tsv'],
    mimeTypes: ['text/tab-separated-values', 'text/tsv'],
    category: 'spreadsheet',
    icon: '📈',
    maxSize: MAX_FILE_SIZE,
    supportedOutputs: ['csv', 'xlsx', 'json'],
    workerType: 'spreadsheet'
  },
  xlsx: {
    id: 'xlsx',
    name: 'Excel',
    extensions: ['xlsx'],
    mimeTypes: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    category: 'spreadsheet',
    icon: '📉',
    maxSize: MAX_FILE_SIZE,
    supportedOutputs: ['csv', 'tsv', 'json'],
    workerType: 'spreadsheet'
  },
  
  // Archives
  zip: {
    id: 'zip',
    name: 'ZIP Archive',
    extensions: ['zip'],
    mimeTypes: ['application/zip'],
    category: 'archive',
    icon: '📁',
    maxSize: MAX_FILE_SIZE,
    supportedOutputs: ['tar', 'tgz', '7z'],
    workerType: 'archive'
  },
  tar: {
    id: 'tar',
    name: 'TAR Archive',
    extensions: ['tar'],
    mimeTypes: ['application/x-tar'],
    category: 'archive',
    icon: '📦',
    maxSize: MAX_FILE_SIZE,
    supportedOutputs: ['zip', 'tgz'],
    workerType: 'archive'
  },
  tgz: {
    id: 'tgz',
    name: 'Gzipped TAR',
    extensions: ['tar.gz', 'tgz'],
    mimeTypes: ['application/gzip', 'application/x-gzip'],
    category: 'archive',
    icon: '🗜️',
    maxSize: MAX_FILE_SIZE,
    supportedOutputs: ['zip', 'tar'],
    workerType: 'archive'
  },
  '7z': {
    id: '7z',
    name: '7-Zip Archive',
    extensions: ['7z'],
    mimeTypes: ['application/x-7z-compressed'],
    category: 'archive',
    icon: '🗂️',
    maxSize: MAX_FILE_SIZE,
    supportedOutputs: ['zip', 'tar'],
    workerType: 'archive'
  }
};

// Conversion Options
export const CONVERSION_OPTIONS: Record<string, ConversionOption[]> = {
  'image': [
    {
      id: 'quality',
      name: 'Quality',
      description: 'Output quality (1-100)',
      type: 'number',
      default: 90,
      validation: (v) => v >= 1 && v <= 100
    },
    {
      id: 'resize',
      name: 'Resize',
      description: 'Resize image',
      type: 'boolean',
      default: false
    },
    {
      id: 'width',
      name: 'Width',
      description: 'Target width in pixels',
      type: 'number',
      default: null,
      validation: (v) => !v || v > 0
    },
    {
      id: 'height',
      name: 'Height',
      description: 'Target height in pixels',
      type: 'number',
      default: null,
      validation: (v) => !v || v > 0
    }
  ],
  'audio': [
    {
      id: 'bitrate',
      name: 'Bitrate',
      description: 'Audio bitrate',
      type: 'select',
      default: '128k',
      options: [
        { value: '64k', label: '64 kbps' },
        { value: '128k', label: '128 kbps' },
        { value: '192k', label: '192 kbps' },
        { value: '256k', label: '256 kbps' },
        { value: '320k', label: '320 kbps' }
      ]
    },
    {
      id: 'sampleRate',
      name: 'Sample Rate',
      description: 'Audio sample rate',
      type: 'select',
      default: 44100,
      options: [
        { value: 22050, label: '22.05 kHz' },
        { value: 44100, label: '44.1 kHz' },
        { value: 48000, label: '48 kHz' }
      ]
    }
  ],
  'document': [
    {
      id: 'dpi',
      name: 'DPI',
      description: 'Resolution for image output',
      type: 'select',
      default: 150,
      options: [
        { value: 72, label: '72 DPI (Screen)' },
        { value: 150, label: '150 DPI (Normal)' },
        { value: 300, label: '300 DPI (High)' }
      ]
    }
  ]
};

// Helper Functions
export function detectFileType(file: File): FileTypeConfig | null {
  // Get file extension for fallback
  const ext = file.name.split('.').pop()?.toLowerCase();
  
  console.log(`[detectFileType] File: ${file.name}, MIME: ${file.type || 'none'}, Extension: ${ext}`);
  
  // Check by MIME type first, but be more flexible for text files
  for (const config of Object.values(FILE_TYPES)) {
    if (file.type && config.mimeTypes.includes(file.type)) {
      console.log(`[detectFileType] Matched by MIME type: ${config.name}`);
      return config;
    }
  }
  
  // Special handling for common text files that browsers might not set MIME type correctly
  if (ext && (!file.type || file.type === 'application/octet-stream')) {
    // Common text file extensions that browsers might not set MIME types for
    const textExtensions = ['csv', 'tsv', 'json', 'yaml', 'yml', 'xml', 'md', 'markdown'];
    if (textExtensions.includes(ext)) {
      console.log(`[detectFileType] No/generic MIME type for ${file.name}, using extension-based detection for text file`);
    }
  }
  
  // Fallback to extension (enhanced)
  if (!ext) {
    console.warn(`[detectFileType] No extension found for ${file.name}`);
    return null;
  }
  
  for (const config of Object.values(FILE_TYPES)) {
    if (config.extensions.includes(ext)) {
      console.log(`[detectFileType] Matched by extension: ${ext} -> ${config.name}`);
      return config;
    }
  }
  
  console.warn(`[detectFileType] Unknown file type for ${file.name} (MIME: ${file.type}, ext: ${ext})`);
  return null;
}

export function getAvailableOutputFormats(inputType: string): FileTypeConfig[] {
  const config = FILE_TYPES[inputType];
  if (!config) return [];
  
  return config.supportedOutputs
    .map(id => FILE_TYPES[id])
    .filter(Boolean);
}

export function validateFile(file: File, config: FileTypeConfig): { valid: boolean; reason?: string } {
  // Check file size
  if (file.size > config.maxSize) {
    return {
      valid: false,
      reason: `File too large. Maximum size is ${config.maxSize >= 1024 * 1024 * 1024 ? Math.round(config.maxSize / 1024 / 1024 / 1024) + 'GB' : Math.round(config.maxSize / 1024 / 1024) + 'MB'}`
    };
  }
  
  // Check MIME type
  if (config.mimeTypes.length > 0 && !config.mimeTypes.includes(file.type)) {
    // Check extension as fallback
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !config.extensions.includes(ext)) {
      return {
        valid: false,
        reason: `Invalid file type. Expected ${config.name}`
      };
    }
  }
  
  return { valid: true };
}

export function getConversionOptions(fromType: string, toType: string): ConversionOption[] {
  const fromConfig = FILE_TYPES[fromType];
  const toConfig = FILE_TYPES[toType];
  
  if (!fromConfig || !toConfig) return [];
  
  // Get options based on category
  const categoryOptions = CONVERSION_OPTIONS[fromConfig.category] || [];
  
  // Filter options based on specific conversion
  return categoryOptions.filter(option => {
    // Add specific logic for filtering options per conversion type
    if (fromConfig.category === 'image' && toConfig.category === 'image') {
      return true; // All image options apply
    }
    if (fromConfig.category === 'audio' && toConfig.category === 'audio') {
      return true; // All audio options apply
    }
    // Add more specific filtering as needed
    return true;
  });
}

// Export convenience functions
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export function getMimeType(format: string): string {
  const config = FILE_TYPES[format];
  return config?.mimeTypes[0] || 'application/octet-stream';
}

export function getFileExtension(format: string): string {
  const config = FILE_TYPES[format];
  return config?.extensions[0] || 'bin';
}