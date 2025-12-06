/**
 * Enhanced Image Conversion Worker
 * Handles image format conversions with better error handling and progress tracking
 */

self.importScripts('/workers/base-worker.js');

class EnhancedImageWorker extends BaseWorker {
  async convert(arrayBuffer, file, fromFormat, toFormat, options, id) {
    try {
      // Create image bitmap
      this.sendProgress(id, 40, 'Decoding image...');
      const blob = new Blob([arrayBuffer], { type: file.type });
      const imageBitmap = await createImageBitmap(blob);
      
      if (this.isCancelled(id)) {
        throw new Error('Conversion cancelled');
      }
      
      // Create canvas
      this.sendProgress(id, 50, 'Processing image...');
      const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
      const ctx = canvas.getContext('2d');
      
      // Apply options if any
      let targetWidth = imageBitmap.width;
      let targetHeight = imageBitmap.height;
      
      if (options.resize && (options.width || options.height)) {
        if (options.width && options.height) {
          targetWidth = options.width;
          targetHeight = options.height;
        } else if (options.width) {
          const ratio = options.width / imageBitmap.width;
          targetWidth = options.width;
          targetHeight = Math.round(imageBitmap.height * ratio);
        } else if (options.height) {
          const ratio = options.height / imageBitmap.height;
          targetHeight = options.height;
          targetWidth = Math.round(imageBitmap.width * ratio);
        }
        
        canvas.width = targetWidth;
        canvas.height = targetHeight;
      }
      
      // Draw image
      ctx.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight);
      
      if (this.isCancelled(id)) {
        throw new Error('Conversion cancelled');
      }
      
      // Convert to target format
      this.sendProgress(id, 70, 'Encoding image...');
      
      let outputBlob;
      const quality = (options.quality || 90) / 100;
      
      switch (toFormat) {
        case 'png':
          outputBlob = await canvas.convertToBlob({ type: 'image/png' });
          break;
          
        case 'jpeg':
        case 'jpg':
          outputBlob = await canvas.convertToBlob({ 
            type: 'image/jpeg',
            quality 
          });
          break;
          
        case 'webp':
          outputBlob = await canvas.convertToBlob({ 
            type: 'image/webp',
            quality 
          });
          break;
          
        case 'bmp':
          // BMP conversion using canvas
          outputBlob = await this.canvasToBMP(canvas);
          break;
          
        default:
          // Fallback to PNG
          outputBlob = await canvas.convertToBlob({ type: 'image/png' });
          break;
      }
      
      if (this.isCancelled(id)) {
        throw new Error('Conversion cancelled');
      }
      
      this.sendProgress(id, 90, 'Finalizing...');
      
      // Create result
      const result = {
        id,
        outputFile: outputBlob,
        filename: this.generateFilename(file.name, toFormat),
        mimeType: this.getMimeType(toFormat),
        metadata: {
          originalSize: file.size,
          outputSize: outputBlob.size,
          dimensions: {
            width: targetWidth,
            height: targetHeight
          }
        }
      };
      
      return result;
      
    } catch (error) {
      console.error('Image conversion error:', error);
      throw new Error(`Failed to convert image: ${error.message}`);
    }
  }
  
  async canvasToBMP(canvas) {
    // Get image data
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const { width, height, data } = imageData;
    
    // BMP file header (14 bytes)
    const fileHeaderSize = 14;
    const infoHeaderSize = 40;
    const bytesPerPixel = 4;
    const paddedWidth = Math.ceil(width * 3 / 4) * 4;
    const imageSize = paddedWidth * height;
    const fileSize = fileHeaderSize + infoHeaderSize + imageSize;
    
    const buffer = new ArrayBuffer(fileSize);
    const view = new DataView(buffer);
    
    // File header
    view.setUint8(0, 0x42); // 'B'
    view.setUint8(1, 0x4D); // 'M'
    view.setUint32(2, fileSize, true); // File size
    view.setUint32(6, 0, true); // Reserved
    view.setUint32(10, fileHeaderSize + infoHeaderSize, true); // Offset to pixel data
    
    // Info header
    view.setUint32(14, infoHeaderSize, true); // Info header size
    view.setInt32(18, width, true); // Width
    view.setInt32(22, height, true); // Height
    view.setUint16(26, 1, true); // Planes
    view.setUint16(28, 24, true); // Bits per pixel
    view.setUint32(30, 0, true); // Compression (none)
    view.setUint32(34, imageSize, true); // Image size
    view.setInt32(38, 2835, true); // X pixels per meter
    view.setInt32(42, 2835, true); // Y pixels per meter
    view.setUint32(46, 0, true); // Colors used
    view.setUint32(50, 0, true); // Important colors
    
    // Pixel data (BMP stores pixels bottom-to-top, BGR format)
    let offset = fileHeaderSize + infoHeaderSize;
    for (let y = height - 1; y >= 0; y--) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        view.setUint8(offset++, data[i + 2]); // B
        view.setUint8(offset++, data[i + 1]); // G
        view.setUint8(offset++, data[i]);     // R
      }
      // Padding
      while (offset % 4 !== 0) {
        view.setUint8(offset++, 0);
      }
    }
    
    return new Blob([buffer], { type: 'image/bmp' });
  }
}

// Create worker instance
const worker = new EnhancedImageWorker();

// Set up Comlink
Comlink.expose({
  convert: async (job) => {
    return await worker.handleConversion(job);
  }
}, self);