/**
 * Universal Conversion Worker
 * Handles all file conversions without external dependencies
 */

// Respond to ping immediately
self.addEventListener('message', function(e) {
  if (e.data.type === 'ping') {
    self.postMessage({ type: 'ready' });
  }
});

class UniversalConverter {
  constructor() {
    this.setupMessageHandler();
  }
  
  setupMessageHandler() {
    self.addEventListener('message', async (event) => {
      const { type, job } = event.data;
      
      if (type === 'ping') {
        self.postMessage({ type: 'ready' });
        return;
      }
      
      if (type === 'convert') {
        await this.handleConversion(job);
      }
    });
  }
  
  async handleConversion(job) {
    const { id, file, fromFormat, toFormat, options } = job;
    
    try {
      this.sendProgress(id, 10, 'Starting conversion...');
      
      // Route to appropriate converter
      let result;
      const conversion = `${fromFormat}_to_${toFormat}`;
      
      // Image conversions
      if (this.isImageFormat(fromFormat) && this.isImageFormat(toFormat)) {
        result = await this.convertImage(job);
      }
      // Text/Document conversions
      else if (this.isTextFormat(fromFormat) || this.isTextFormat(toFormat)) {
        result = await this.convertText(job);
      }
      // Spreadsheet conversions
      else if (this.isSpreadsheetFormat(fromFormat) || this.isSpreadsheetFormat(toFormat)) {
        result = await this.convertSpreadsheet(job);
      }
      // Audio conversions (basic)
      else if (this.isAudioFormat(fromFormat) && this.isAudioFormat(toFormat)) {
        result = await this.convertAudio(job);
      }
      // Archive conversions - should be handled by archive worker
      else if (this.isArchiveFormat(fromFormat) || this.isArchiveFormat(toFormat)) {
        throw new Error(`Archive conversions should be routed to the archive worker. This conversion (${fromFormat} to ${toFormat}) requires specialized archive handling.`);
      }
      else {
        throw new Error(`Unsupported conversion: ${fromFormat} to ${toFormat}`);
      }
      
      this.sendComplete(id, result);
      
    } catch (error) {
      console.error('Conversion error:', error);
      this.sendError(id, error.message);
    }
  }
  
  // Format checkers
  isImageFormat(format) {
    return ['png', 'jpeg', 'jpg', 'webp', 'gif', 'bmp', 'tiff', 'ico'].includes(format);
  }
  
  isTextFormat(format) {
    return ['txt', 'md', 'html', 'json', 'yaml', 'xml'].includes(format);
  }
  
  isSpreadsheetFormat(format) {
    return ['csv', 'tsv', 'xlsx'].includes(format);
  }
  
  isAudioFormat(format) {
    return ['wav', 'mp3', 'flac', 'ogg', 'opus'].includes(format);
  }
  
  isArchiveFormat(format) {
    return ['zip', 'tar', 'tgz', '7z'].includes(format);
  }
  
  // Image conversion
  async convertImage(job) {
    const { id, file, fromFormat, toFormat, options } = job;
    
    this.sendProgress(id, 20, 'Processing image...');
    
    // Create image from file
    const blob = new Blob([await file.arrayBuffer()], { type: file.type });
    const imageBitmap = await createImageBitmap(blob);
    
    this.sendProgress(id, 40, 'Converting image format...');
    
    // Create canvas
    const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
    const ctx = canvas.getContext('2d');
    
    // Handle resizing if specified
    if (options?.resize && (options.width || options.height)) {
      let targetWidth = imageBitmap.width;
      let targetHeight = imageBitmap.height;
      
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
      ctx.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight);
    } else {
      ctx.drawImage(imageBitmap, 0, 0);
    }
    
    this.sendProgress(id, 60, 'Encoding image...');
    
    // Convert to target format
    let outputBlob;
    const quality = (options?.quality || 90) / 100;
    
    switch (toFormat) {
      case 'png':
        outputBlob = await canvas.convertToBlob({ type: 'image/png' });
        break;
      case 'jpeg':
      case 'jpg':
        outputBlob = await canvas.convertToBlob({ type: 'image/jpeg', quality });
        break;
      case 'webp':
        outputBlob = await canvas.convertToBlob({ type: 'image/webp', quality });
        break;
      default:
        // Fallback to PNG for unsupported formats
        outputBlob = await canvas.convertToBlob({ type: 'image/png' });
        break;
    }
    
    this.sendProgress(id, 90, 'Finalizing...');
    
    return {
      id,
      outputFile: outputBlob,
      filename: this.changeExtension(file.name, toFormat),
      mimeType: this.getMimeType(toFormat),
      metadata: {
        originalSize: file.size,
        outputSize: outputBlob.size,
        dimensions: {
          width: canvas.width,
          height: canvas.height
        }
      }
    };
  }
  
  // Text conversion
  async convertText(job) {
    const { id, file, fromFormat, toFormat } = job;
    
    this.sendProgress(id, 20, 'Reading text file...');
    
    const text = await file.text();
    let output = text;
    let mimeType = 'text/plain';
    
    this.sendProgress(id, 50, 'Converting format...');
    
    // Handle specific conversions
    const conversion = `${fromFormat}_to_${toFormat}`;
    
    switch (conversion) {
      case 'json_to_csv':
        output = this.jsonToCsv(text);
        mimeType = 'text/csv';
        break;
      case 'csv_to_json':
        output = this.csvToJson(text);
        mimeType = 'application/json';
        break;
      case 'json_to_yaml':
        output = this.jsonToYaml(text);
        mimeType = 'text/yaml';
        break;
      case 'yaml_to_json':
        output = this.yamlToJson(text);
        mimeType = 'application/json';
        break;
      case 'md_to_html':
        output = this.markdownToHtml(text);
        mimeType = 'text/html';
        break;
      case 'html_to_md':
        output = this.htmlToMarkdown(text);
        mimeType = 'text/markdown';
        break;
      case 'txt_to_html':
        output = this.textToHtml(text);
        mimeType = 'text/html';
        break;
      case 'html_to_txt':
        output = this.htmlToText(text);
        mimeType = 'text/plain';
        break;
      default:
        // Default passthrough
        output = text;
        mimeType = this.getMimeType(toFormat);
    }
    
    this.sendProgress(id, 80, 'Creating output file...');
    
    const outputBlob = new Blob([output], { type: mimeType });
    
    this.sendProgress(id, 90, 'Finalizing...');
    
    return {
      id,
      outputFile: outputBlob,
      filename: this.changeExtension(file.name, toFormat),
      mimeType,
      metadata: {
        originalSize: file.size,
        outputSize: outputBlob.size
      }
    };
  }
  
  // Spreadsheet conversion
  async convertSpreadsheet(job) {
    const { id, file, fromFormat, toFormat } = job;
    
    this.sendProgress(id, 20, 'Reading spreadsheet...');
    
    const text = await file.text();
    let output = text;
    let mimeType = 'text/plain';
    
    this.sendProgress(id, 50, 'Converting data...');
    
    const conversion = `${fromFormat}_to_${toFormat}`;
    
    switch (conversion) {
      case 'csv_to_json':
        output = this.csvToJson(text);
        mimeType = 'application/json';
        break;
      case 'csv_to_tsv':
        output = this.csvToTsv(text);
        mimeType = 'text/tab-separated-values';
        break;
      case 'tsv_to_csv':
        output = this.tsvToCsv(text);
        mimeType = 'text/csv';
        break;
      case 'tsv_to_json':
        output = this.tsvToJson(text);
        mimeType = 'application/json';
        break;
      case 'json_to_csv':
        output = this.jsonToCsv(text);
        mimeType = 'text/csv';
        break;
      case 'xlsx_to_csv':
        // For XLSX, we'd need a library - for now, return error
        throw new Error('XLSX conversion requires external library - please use CSV format');
      default:
        output = text;
        mimeType = this.getMimeType(toFormat);
    }
    
    this.sendProgress(id, 80, 'Creating output file...');
    
    const outputBlob = new Blob([output], { type: mimeType });
    
    this.sendProgress(id, 90, 'Finalizing...');
    
    return {
      id,
      outputFile: outputBlob,
      filename: this.changeExtension(file.name, toFormat),
      mimeType,
      metadata: {
        originalSize: file.size,
        outputSize: outputBlob.size
      }
    };
  }
  
  // Basic audio conversion (WAV only for now)
  async convertAudio(job) {
    const { id, file, fromFormat, toFormat } = job;
    
    // For now, just pass through the file
    // Real audio conversion would require WebAudio API or external library
    this.sendProgress(id, 50, 'Processing audio...');
    
    const arrayBuffer = await file.arrayBuffer();
    const outputBlob = new Blob([arrayBuffer], { type: this.getMimeType(toFormat) });
    
    this.sendProgress(id, 90, 'Finalizing...');
    
    return {
      id,
      outputFile: outputBlob,
      filename: this.changeExtension(file.name, toFormat),
      mimeType: this.getMimeType(toFormat),
      metadata: {
        originalSize: file.size,
        outputSize: outputBlob.size
      }
    };
  }
  
  // Archive conversion
  async convertArchive(job) {
    const { id, file, fromFormat, toFormat } = job;
    
    // For archive conversions, we need to delegate to the archive worker
    // since it requires fflate library
    this.sendProgress(id, 10, 'Processing archive...');
    
    // Since we can't load external libraries in this worker,
    // we'll return an error with helpful message
    throw new Error(
      `Archive conversion from ${fromFormat} to ${toFormat} requires the archive worker. ` +
      `Please ensure the archive worker is loaded. The conversion manager should route ` +
      `archive files to the appropriate worker.`
    );
  }
  
  // Conversion utilities
  csvToJson(csv) {
    const lines = csv.trim().split('\n');
    if (lines.length === 0) return '[]';
    
    const headers = this.parseCSVLine(lines[0]);
    const result = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length === headers.length) {
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = values[index];
        });
        result.push(obj);
      }
    }
    
    return JSON.stringify(result, null, 2);
  }
  
  jsonToCsv(jsonText) {
    try {
      const data = JSON.parse(jsonText);
      if (!Array.isArray(data) || data.length === 0) return '';
      
      const keys = Object.keys(data[0]);
      const csv = [keys.join(',')];
      
      for (const obj of data) {
        const row = keys.map(key => {
          const value = obj[key] || '';
          if (String(value).includes(',') || String(value).includes('"')) {
            return `"${String(value).replace(/"/g, '""')}"`;
          }
          return String(value);
        });
        csv.push(row.join(','));
      }
      
      return csv.join('\n');
    } catch (e) {
      throw new Error('Invalid JSON data');
    }
  }
  
  csvToTsv(csv) {
    const lines = csv.split('\n');
    return lines.map(line => {
      const values = this.parseCSVLine(line);
      return values.join('\t');
    }).join('\n');
  }
  
  tsvToCsv(tsv) {
    const lines = tsv.split('\n');
    return lines.map(line => {
      const values = line.split('\t');
      return values.map(value => {
        if (value.includes(',') || value.includes('"')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',');
    }).join('\n');
  }
  
  tsvToJson(tsv) {
    const lines = tsv.trim().split('\n');
    if (lines.length === 0) return '[]';
    
    const headers = lines[0].split('\t');
    const result = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split('\t');
      if (values.length === headers.length) {
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = values[index];
        });
        result.push(obj);
      }
    }
    
    return JSON.stringify(result, null, 2);
  }
  
  jsonToYaml(jsonText) {
    try {
      const data = JSON.parse(jsonText);
      return this.objectToYaml(data, 0);
    } catch (e) {
      throw new Error('Invalid JSON data');
    }
  }
  
  objectToYaml(obj, indent) {
    let yaml = '';
    const spaces = '  '.repeat(indent);
    
    if (Array.isArray(obj)) {
      obj.forEach(item => {
        if (typeof item === 'object' && item !== null) {
          yaml += `${spaces}- \n${this.objectToYaml(item, indent + 1)}`;
        } else {
          yaml += `${spaces}- ${item}\n`;
        }
      });
    } else if (typeof obj === 'object' && obj !== null) {
      Object.entries(obj).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          yaml += `${spaces}${key}:\n${this.objectToYaml(value, indent + 1)}`;
        } else {
          yaml += `${spaces}${key}: ${value}\n`;
        }
      });
    } else {
      yaml = `${spaces}${obj}\n`;
    }
    
    return yaml;
  }
  
  yamlToJson(yamlText) {
    // Very basic YAML parsing
    const lines = yamlText.split('\n');
    const result = {};
    
    for (const line of lines) {
      if (line.trim() === '' || line.trim().startsWith('#')) continue;
      
      const content = line.trim();
      if (content.includes(':')) {
        const [key, ...valueParts] = content.split(':');
        const value = valueParts.join(':').trim();
        
        if (value) {
          result[key.trim()] = value.replace(/^['"]|['"]$/g, '');
        }
      }
    }
    
    return JSON.stringify(result, null, 2);
  }
  
  markdownToHtml(markdown) {
    let html = markdown;
    
    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    
    // Bold and italic
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    
    // Line breaks
    html = html.replace(/\n\n/g, '</p><p>');
    html = '<p>' + html + '</p>';
    
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: system-ui, sans-serif; line-height: 1.6; padding: 20px; max-width: 800px; margin: 0 auto; }
  </style>
</head>
<body>${html}</body>
</html>`;
  }
  
  htmlToMarkdown(html) {
    let md = html;
    
    // Remove HTML tags
    md = md.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    md = md.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    
    // Convert headers
    md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n');
    md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n');
    md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n');
    
    // Convert formatting
    md = md.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
    md = md.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
    
    // Convert links
    md = md.replace(/<a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/gi, '[$2]($1)');
    
    // Remove remaining tags
    md = md.replace(/<[^>]+>/g, '');
    
    return md.trim();
  }
  
  textToHtml(text) {
    const escaped = text.replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    const paragraphs = escaped.split(/\n\n+/);
    const html = paragraphs.map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('\n');
    
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: system-ui, sans-serif; line-height: 1.6; padding: 20px; max-width: 800px; margin: 0 auto; }
  </style>
</head>
<body>${html}</body>
</html>`;
  }
  
  htmlToText(html) {
    // Simple HTML to text
    let text = html;
    
    // Remove scripts and styles
    text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    
    // Replace breaks with newlines
    text = text.replace(/<br[^>]*>/gi, '\n');
    text = text.replace(/<\/p>/gi, '\n\n');
    
    // Remove all tags
    text = text.replace(/<[^>]+>/g, '');
    
    // Unescape entities
    text = text.replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    
    return text.trim();
  }
  
  parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  }
  
  // Helper functions
  changeExtension(filename, newExt) {
    const lastDot = filename.lastIndexOf('.');
    const base = lastDot > 0 ? filename.substring(0, lastDot) : filename;
    return `${base}.${newExt}`;
  }
  
  getMimeType(format) {
    const mimeTypes = {
      // Images
      'png': 'image/png',
      'jpeg': 'image/jpeg',
      'jpg': 'image/jpeg',
      'webp': 'image/webp',
      'gif': 'image/gif',
      'bmp': 'image/bmp',
      
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
      
      // Audio
      'wav': 'audio/wav',
      'mp3': 'audio/mpeg',
      'flac': 'audio/flac',
      'ogg': 'audio/ogg'
    };
    
    return mimeTypes[format] || 'application/octet-stream';
  }
  
  // Message helpers
  sendProgress(id, progress, message) {
    self.postMessage({
      type: 'progress',
      id,
      progress,
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
}

// Create and start converter
const converter = new UniversalConverter();