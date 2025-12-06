/**
 * Base Worker Class
 * Provides common functionality for all conversion workers
 */

self.importScripts('https://unpkg.com/comlink@4.3.1/dist/umd/comlink.js');

class BaseWorker {
  constructor() {
    this.conversions = new Map();
    this.setupMessageHandler();
  }
  
  setupMessageHandler() {
    self.addEventListener('message', (event) => {
      const { type, id, job } = event.data;
      
      switch (type) {
        case 'ping':
          self.postMessage({ type: 'ready' });
          break;
          
        case 'convert':
          this.handleConversion(job);
          break;
          
        case 'cancel':
          this.cancelConversion(id);
          break;
          
        default:
          // Comlink messages will be handled separately
          break;
      }
    });
  }
  
  async handleConversion(job) {
    const { id, file, fromFormat, toFormat, options } = job;
    
    try {
      // Store conversion info
      this.conversions.set(id, {
        cancelled: false,
        startTime: Date.now()
      });
      
      // Send initial progress
      this.sendProgress(id, 10, 'Reading file...');
      
      // Read file
      const arrayBuffer = await this.readFile(file);
      
      if (this.isCancelled(id)) {
        throw new Error('Conversion cancelled');
      }
      
      // Send progress
      this.sendProgress(id, 30, 'Processing...');
      
      // Perform conversion (to be implemented by subclasses)
      const result = await this.convert(arrayBuffer, file, fromFormat, toFormat, options, id);
      
      if (this.isCancelled(id)) {
        throw new Error('Conversion cancelled');
      }
      
      // Send completion
      this.sendComplete(id, result);
      
    } catch (error) {
      this.sendError(id, error.message);
    } finally {
      this.conversions.delete(id);
    }
  }
  
  async convert(arrayBuffer, file, fromFormat, toFormat, options, id) {
    // To be implemented by subclasses
    throw new Error('Convert method must be implemented by subclass');
  }
  
  async readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }
  
  createBlob(data, mimeType) {
    if (data instanceof ArrayBuffer || data instanceof Uint8Array) {
      return new Blob([data], { type: mimeType });
    }
    return new Blob([data], { type: mimeType });
  }
  
  generateFilename(originalName, targetFormat) {
    const baseName = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
    return `${baseName}.${targetFormat}`;
  }
  
  sendProgress(id, progress, message) {
    self.postMessage({
      type: 'progress',
      id,
      progress: Math.min(100, Math.max(0, progress)),
      message
    });
  }
  
  sendComplete(id, result) {
    self.postMessage({
      type: 'complete',
      id,
      result
    });
  }
  
  sendError(id, error) {
    self.postMessage({
      type: 'error',
      id,
      error
    });
  }
  
  cancelConversion(id) {
    const conversion = this.conversions.get(id);
    if (conversion) {
      conversion.cancelled = true;
    }
  }
  
  isCancelled(id) {
    const conversion = this.conversions.get(id);
    return conversion?.cancelled || false;
  }
  
  // Utility functions
  getMimeType(format) {
    const mimeTypes = {
      // Images
      'png': 'image/png',
      'jpeg': 'image/jpeg',
      'jpg': 'image/jpeg',
      'webp': 'image/webp',
      'gif': 'image/gif',
      'bmp': 'image/bmp',
      'tiff': 'image/tiff',
      'ico': 'image/x-icon',
      
      // Audio
      'wav': 'audio/wav',
      'mp3': 'audio/mpeg',
      'flac': 'audio/flac',
      'ogg': 'audio/ogg',
      'opus': 'audio/opus',
      
      // Documents
      'pdf': 'application/pdf',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      
      // Text
      'txt': 'text/plain',
      'html': 'text/html',
      'md': 'text/markdown',
      'json': 'application/json',
      'yaml': 'text/yaml',
      'xml': 'text/xml',
      
      // Spreadsheets
      'csv': 'text/csv',
      'tsv': 'text/tab-separated-values',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      
      // Archives
      'zip': 'application/zip',
      'tar': 'application/x-tar',
      'gz': 'application/gzip',
      '7z': 'application/x-7z-compressed'
    };
    
    return mimeTypes[format] || 'application/octet-stream';
  }
}

// Export for use in specific workers
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BaseWorker;
}