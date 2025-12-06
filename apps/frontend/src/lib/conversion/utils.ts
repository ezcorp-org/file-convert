import type { ConversionJob } from './types';
import { FILE_TYPES } from './config';

/**
 * Detect file type from a File object
 */
export function detectFileType(file: File) {
  const extension = getFileExtension(file.name);
  
  // Try to match by extension first
  if (extension) {
    const typeByExt = Object.values(FILE_TYPES).find(type => 
      type.extensions.includes(extension)
    );
    if (typeByExt) return typeByExt;
  }
  
  // Fall back to MIME type
  if (file.type) {
    const typeByMime = Object.values(FILE_TYPES).find(type => 
      type.mimeTypes.includes(file.type)
    );
    if (typeByMime) return typeByMime;
  }
  
  return null;
}

/**
 * Create a conversion job
 */
export function createConversionJob(
  file: File, 
  fromFormat: string, 
  toFormat: string,
  options: Record<string, any> = {}
): ConversionJob {
  return {
    id: generateJobId(),
    file,
    fromFormat,
    toFormat,
    options,
    timestamp: Date.now()
  };
}

/**
 * Download a file
 */
export function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/**
 * Convert blob to base64
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/**
 * Convert base64 to blob
 */
export function base64ToBlob(base64: string, mimeType: string): Blob {
  // Remove data URI prefix if present
  const base64Data = base64.replace(/^data:.*?;base64,/, '');
  
  // Decode base64
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) return '';
  
  // Handle hidden files like .gitignore
  if (lastDot === 0) {
    // If filename starts with dot, treat everything after as extension
    return filename.slice(1).toLowerCase();
  }
  
  return filename.slice(lastDot + 1).toLowerCase();
}

/**
 * Sanitize filename for safe download
 */
export function sanitizeFilename(filename: string): string {
  // Remove or replace invalid characters
  let sanitized = filename.replace(/[<>:"/\\|?*]/g, '_');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  // If filename is empty after sanitization, provide default
  if (!sanitized) {
    return 'unnamed';
  }
  
  return sanitized;
}

/**
 * Generate unique job ID
 */
export function generateJobId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(16).slice(2, 10);
  return `job_${random}_${timestamp}`;
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  return function debounced(...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return function throttled(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}