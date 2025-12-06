/**
 * Conversion Manager
 * Central orchestrator for all conversion operations
 */

import { FILE_TYPES, detectFileType, validateFile, getConversionOptions, type FileTypeConfig } from './config';
import type { ConversionJob, ConversionResult, ConversionProgress } from './types';
import { notifications } from '../stores/notifications';

export interface ConversionRequest {
  id: string;
  file: File;
  targetFormat: string;
  options?: Record<string, any>;
  priority?: number;
}

export interface ConversionState {
  id: string;
  status: 'pending' | 'validating' | 'converting' | 'completed' | 'failed';
  progress: number;
  message?: string;
  result?: ConversionResult;
  error?: Error;
  startTime?: number;
  endTime?: number;
}

export class ConversionManager {
  private static instance: ConversionManager;
  private workers: Map<string, Worker> = new Map();
  private queue: ConversionRequest[] = [];
  private activeConversions: Map<string, ConversionState> = new Map();
  private maxConcurrent = 3;
  private listeners: Map<string, Set<(state: ConversionState) => void>> = new Map();
  private processingIds = new Set<string>(); // Track requests being processed

  private constructor() {
    // Private constructor for singleton
    // Pre-initialize common workers for faster conversions (only in browser)
    if (typeof window !== 'undefined' && window.Worker) {
      this.preInitializeWorkers();
    }
  }

  /**
   * Pre-initialize common workers to avoid delays
   */
  private async preInitializeWorkers(): Promise<void> {
    // Only initialize if we're in a browser environment
    if (typeof window === 'undefined' || !window.Worker) {
      console.warn('Workers not supported in this environment');
      return;
    }

    // Initialize image worker as it's most commonly used
    try {
      await this.getOrCreateWorker('image');
      console.log('Pre-initialized image worker');
    } catch (error) {
      console.warn('Failed to pre-initialize image worker:', error);
    }
  }

  static getInstance(): ConversionManager {
    if (!ConversionManager.instance) {
      ConversionManager.instance = new ConversionManager();
    }
    return ConversionManager.instance;
  }

  /**
   * Convert a file to the target format
   */
  async convert(
    file: File,
    targetFormat: string,
    options?: Record<string, any>
  ): Promise<string> {
    const id = this.generateId();

    // Create conversion request
    const request: ConversionRequest = {
      id,
      file,
      targetFormat,
      options: options || {},
      priority: 1
    };

    // Initialize state
    const state: ConversionState = {
      id,
      status: 'pending',
      progress: 0,
      startTime: Date.now()
    };

    this.activeConversions.set(id, state);
    this.notifyListeners(id, state);

    // Add to queue
    this.queue.push(request);

    // Process queue
    this.processQueue();

    return id;
  }

  /**
   * Subscribe to conversion updates
   */
  subscribe(id: string, callback: (state: ConversionState) => void): () => void {
    if (!this.listeners.has(id)) {
      this.listeners.set(id, new Set());
    }

    this.listeners.get(id)!.add(callback);

    // Send current state immediately
    const currentState = this.activeConversions.get(id);
    if (currentState) {
      callback(currentState);
    }

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(id);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.listeners.delete(id);
        }
      }
    };
  }

  /**
   * Get current state of a conversion
   */
  getState(id: string): ConversionState | null {
    return this.activeConversions.get(id) || null;
  }

  /**
   * Cancel a conversion
   */
  cancel(id: string): boolean {
    const state = this.activeConversions.get(id);
    if (!state) return false;

    // Find the request for tracking
    const request = this.queue.find(r => r.id === id);

    if (state.status === 'pending') {
      // Remove from queue and processing set
      this.queue = this.queue.filter(r => r.id !== id);
      this.processingIds.delete(id);
      this.updateState(id, { status: 'failed', error: new Error('Cancelled') });
      return true;
    }

    if (state.status === 'converting') {
      // Send cancel message to worker
      if (request) {
        const config = detectFileType(request.file);
        if (config) {
          const worker = this.workers.get(config.workerType);
          if (worker) {
            worker.postMessage({ type: 'cancel', id });
          }
        }
      }
      this.updateState(id, { status: 'failed', error: new Error('Cancelled') });
      return true;
    }

    return false;
  }

  /**
   * Clear completed conversions
   */
  clearCompleted(): void {
    const completed = Array.from(this.activeConversions.entries())
      .filter(([_, state]) => state.status === 'completed' || state.status === 'failed')
      .map(([id]) => id);

    completed.forEach(id => {
      this.activeConversions.delete(id);
      this.listeners.delete(id);
    });
  }

  /**
   * Process the conversion queue
   */
  private async processQueue(): Promise<void> {
    // Count active conversions
    const activeCount = Array.from(this.activeConversions.values())
      .filter(s => s.status === 'validating' || s.status === 'converting')
      .length;

    if (activeCount >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    // Get next request from queue (ensure it's not already being processed)
    const requestIndex = this.queue.findIndex(r => {
      const state = this.activeConversions.get(r.id);
      return state && state.status === 'pending' && !this.processingIds.has(r.id);
    });

    if (requestIndex === -1) return;

    const request = this.queue[requestIndex];
    this.queue.splice(requestIndex, 1);

    // Mark as being processed to prevent duplicates
    this.processingIds.add(request.id);

    // Start processing and wait for completion
    await this.processConversion(request);

    // Process next in queue after current one completes
    if (this.queue.length > 0) {
      // No delay for better responsiveness
      this.processQueue();
    }
  }

  /**
   * Process a single conversion
   */
  private async processConversion(request: ConversionRequest): Promise<void> {
    const { id, file, targetFormat, options } = request;

    try {
      // Immediately update status to show we're working on it
      this.updateState(id, {
        status: 'validating',
        progress: 5,
        message: 'Starting conversion...'
      });

      // Detect and validate file type
      const sourceConfig = detectFileType(file);
      if (!sourceConfig) {
        throw new Error(`Unsupported file type: ${file.name}`);
      }

      // Validate file
      const validation = validateFile(file, sourceConfig);
      if (!validation.valid) {
        throw new Error(validation.reason || 'File validation failed');
      }

      // Check if conversion is supported
      if (!sourceConfig.supportedOutputs.includes(targetFormat)) {
        throw new Error(`Cannot convert ${sourceConfig.name} to ${targetFormat}`);
      }

      // Get target config
      const targetConfig = FILE_TYPES[targetFormat];
      if (!targetConfig) {
        throw new Error(`Unknown target format: ${targetFormat}`);
      }

      // Update status to converting
      this.updateState(id, {
        status: 'converting',
        progress: 10,
        message: `Converting ${sourceConfig.name} to ${targetConfig.name}...`
      });

      // For audio files, decode in main thread if not WAV
      let fileToConvert = file;
      if (sourceConfig.category === 'audio' && sourceConfig.id !== 'wav') {
        this.updateState(id, {
          status: 'converting',
          progress: 20,
          message: `Decoding ${sourceConfig.name} audio...`
        });

        try {
          fileToConvert = await this.decodeAudioToWAV(file, id);
          this.updateState(id, {
            status: 'converting',
            progress: 40,
            message: `Converting to ${targetConfig.name}...`
          });
        } catch (error) {
          throw new Error(`Audio decoding failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Determine which worker to use based on file type
      // Priority order: archive > specialized workers > universal fallback
      let workerType: string;

      if (sourceConfig.workerType === 'archive' || targetConfig.workerType === 'archive') {
        workerType = 'archive';
      } else if (sourceConfig.workerType === 'image' && targetConfig.workerType === 'image') {
        workerType = 'image';
      } else if (sourceConfig.workerType === 'audio' && targetConfig.workerType === 'audio') {
        workerType = 'audio';
      } else if (sourceConfig.workerType === 'document' || targetConfig.workerType === 'document') {
        workerType = 'document';
      } else if (sourceConfig.workerType === 'spreadsheet' || targetConfig.workerType === 'spreadsheet') {
        // Use spreadsheet worker for CSV, TSV, XLSX conversions
        workerType = 'spreadsheet';
      } else if (sourceConfig.workerType === 'text' || targetConfig.workerType === 'text') {
        // Use text worker for TXT, JSON, XML, YAML, HTML, MD conversions
        workerType = 'text';
      } else {
        // Enhanced fallback logic for text/document files
        const textFormats = ['txt', 'json', 'xml', 'yaml', 'yml', 'html', 'md', 'markdown'];
        const spreadsheetFormats = ['csv', 'tsv', 'xlsx'];

        if (textFormats.includes(sourceConfig.id) || textFormats.includes(targetConfig.id)) {
          workerType = 'text';
        } else if (spreadsheetFormats.includes(sourceConfig.id) || spreadsheetFormats.includes(targetConfig.id)) {
          workerType = 'spreadsheet';
        } else {
          workerType = 'universal';
        }
      }

      console.log(`Selected worker type: ${workerType} for ${sourceConfig.name} -> ${targetConfig.name}`);

      const worker = await this.getOrCreateWorker(workerType);

      // Set up message handler
      const messageHandler = (event: MessageEvent) => {
        // Log all messages for debugging
        console.log(`Worker message for ${id}:`, event.data.type, event.data);

        // Handle both Comlink responses and progress updates
        // For progress messages, check the id in the data
        // For Comlink messages, the id is at the root level
        const messageId = event.data.id;

        // Skip messages not for this conversion (but be careful with undefined ids)
        if (messageId && messageId !== id) {
          console.log(`Skipping message for different conversion: ${messageId} !== ${id}`);
          return;
        }

        // If there's no messageId, check if it's a progress message for our conversion
        if (!messageId && event.data.type === 'progress' && event.data.id !== id) {
          console.log(`Skipping progress message for different conversion: ${event.data.id} !== ${id}`);
          return;
        }

        console.log(`Processing message for conversion ${id}:`, event.data.type);

        switch (event.data.type) {
          case 'progress':
            // Progress updates from worker
            this.updateState(id, {
              progress: event.data.progress,
              message: event.data.message
            });
            break;

          case 'RESULT':
            // Comlink success response
            worker.removeEventListener('message', messageHandler);
            // The result from Comlink contains the actual conversion result
            if (event.data.result) {
              this.handleConversionComplete(id, event.data.result);
            } else {
              this.handleConversionError(id, new Error('Conversion completed but no result returned'));
            }
            break;

          case 'ERROR':
            // Comlink error response
            worker.removeEventListener('message', messageHandler);
            const errorMessage = event.data.error?.message || event.data.error || 'Unknown error occurred';
            this.handleConversionError(id, new Error(errorMessage));
            break;

          case 'complete':
            // Legacy format support
            worker.removeEventListener('message', messageHandler);
            this.handleConversionComplete(id, event.data.result);
            break;

          case 'error':
            // Legacy format support
            worker.removeEventListener('message', messageHandler);
            this.handleConversionError(id, new Error(event.data.error));
            break;
        }
      };

      worker.addEventListener('message', messageHandler);

      // Create conversion job with the (possibly decoded) file
      // If audio was decoded in main thread, fileToConvert will be WAV
      const job: ConversionJob = {
        id,
        file: fileToConvert, // Use the decoded WAV file for audio conversions
        fromFormat: sourceConfig.category === 'audio' && sourceConfig.id !== 'wav' ? 'wav' : sourceConfig.id, // Worker receives WAV if we decoded
        toFormat: targetFormat,
        options: options || {}
      };

      // Send to worker using Comlink format
      console.log(`Sending conversion job ${id} to worker ${workerType}`, job);
      console.log(`Worker state: worker exists=${!!worker}, listeners=${this.listeners.has(id)}`);
      console.log(`Original file: ${file.name}, File to convert: ${fileToConvert.name}, fromFormat: ${job.fromFormat}`);

      worker.postMessage({
        id,
        type: 'CALL',
        method: 'convert',
        args: [job]
      });

      console.log(`Message sent to worker ${workerType} for job ${id}`);

      // Request is already tracked in activeConversions; no need to re-queue here

    } catch (error) {
      this.handleConversionError(id, error as Error);
    }
  }

  /**
   * Handle conversion completion
   */
  private handleConversionComplete(id: string, result: ConversionResult): void {
    this.updateState(id, {
      status: 'completed',
      progress: 100,
      message: 'Conversion completed successfully',
      result,
      endTime: Date.now()
    });

    // Update local conversion count
    const currentConversions = parseInt(localStorage.getItem('lifetime_conversions') || '0');
    const newConversions = currentConversions + 1;
    localStorage.setItem('lifetime_conversions', newConversions.toString());
    localStorage.setItem('last_conversion_date', new Date().toISOString());

    // Remove from queue and processing set
    this.queue = this.queue.filter(r => r.id !== id);
    this.processingIds.delete(id);

    // Process next in queue
    this.processQueue();
  }

  /**
   * Handle conversion error
   */
  private handleConversionError(id: string, error: Error): void {
    console.error(`Conversion ${id} failed:`, error);

    // Get file information for the error
    const request = this.queue.find(r => r.id === id);

    const fileName = request ? 'file' in request ? request.file?.name || 'Unknown file' : 'Unknown file' : 'Unknown file';

    // Categorize and display appropriate error notification
    const errorMessage = error.message.toLowerCase();
    let notificationTitle = 'Conversion failed';
    let notificationMessage = error.message;
    let notificationType: 'error' | 'warning' = 'error';

    // Worker initialization or loading errors
    if (errorMessage.includes('failed to initialize') || errorMessage.includes('worker')) {
      notificationTitle = 'Conversion service unavailable';
      notificationMessage = `Unable to start the conversion service for ${fileName}. Please refresh the page and try again.`;
      notificationType = 'error';
    }
    // File format or compatibility errors
    else if (errorMessage.includes('unsupported') || errorMessage.includes('not supported')) {
      notificationTitle = 'Unsupported conversion';
      notificationMessage = `Cannot convert ${fileName}: ${error.message}.\n\nThis conversion type may not be supported yet.`;
      notificationType = 'warning';
    }
    // File size or content errors
    else if (errorMessage.includes('too large') || errorMessage.includes('size limit')) {
      notificationTitle = 'File too large';
      notificationMessage = `${fileName} is too large to convert. Please try a smaller file or upgrade your plan for higher limits.`;
      notificationType = 'warning';
    }
    // File corruption or format errors
    else if (errorMessage.includes('corrupt') || errorMessage.includes('invalid') || errorMessage.includes('malformed')) {
      notificationTitle = 'File format error';
      notificationMessage = `${fileName} appears to be corrupted or in an invalid format. Please check the file and try again.`;
      notificationType = 'error';
    }
    // Network or external service errors
    else if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('cdn')) {
      notificationTitle = 'Network error';
      notificationMessage = `Network error while converting ${fileName}. Please check your internet connection and try again.`;
      notificationType = 'warning';
    }
    // Timeout errors
    else if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
      notificationTitle = 'Conversion timeout';
      notificationMessage = `Conversion of ${fileName} timed out. The file may be too complex or large. Please try again or use a smaller file.`;
      notificationType = 'warning';
    }
    // Memory or resource errors
    else if (errorMessage.includes('memory') || errorMessage.includes('resource')) {
      notificationTitle = 'Insufficient resources';
      notificationMessage = `Not enough resources to convert ${fileName}. Please close other tabs or try a smaller file.`;
      notificationType = 'warning';
    }
    // Permission or access errors
    else if (errorMessage.includes('permission') || errorMessage.includes('access')) {
      notificationTitle = 'Access denied';
      notificationMessage = `Access denied while converting ${fileName}. Please check your permissions and try again.`;
      notificationType = 'error';
    }
    // Generic conversion errors
    else {
      notificationTitle = `Conversion failed: ${fileName}`;
      notificationMessage = `Unable to convert ${fileName}: ${error.message}.\n\nPlease verify the file format is correct and try again.`;
    }

    // Show the appropriate notification
    if (notificationType === 'error') {
      notifications.error(notificationTitle, notificationMessage);
    } else {
      notifications.warning(notificationTitle, notificationMessage);
    }

    this.updateState(id, {
      status: 'failed',
      progress: 0,
      message: error.message,
      error,
      endTime: Date.now()
    });

    // Remove from queue and processing set
    this.queue = this.queue.filter(r => r.id !== id);
    this.processingIds.delete(id);

    // Process next in queue
    this.processQueue();
  }

  /**
   * Get or create a worker for the given type
   */
  private async getOrCreateWorker(type: string): Promise<Worker> {
    if (!this.workers.has(type)) {
      try {
        // Create worker URL - use the origin to construct absolute URL
        // This ensures the worker is loaded from the static directory
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        const workerUrl = `${baseUrl}/workers/${type}-worker.js`;

        console.log(`Creating worker from URL: ${workerUrl}`);

        // Create worker with explicit type to prevent DevTools blocking
        const worker = new Worker(workerUrl, {
          type: 'classic',
          credentials: 'same-origin'
        });

        // Simple initialization - just wait a brief moment for the worker to load
        // Don't wait for messages as workers may not send initial messages
        await new Promise((resolve, reject) => {
          let hasError = false;

          const errorHandler = (event: ErrorEvent) => {
            hasError = true;
            worker.removeEventListener('error', errorHandler);
            reject(new Error(`Worker initialization error: ${event.message}`));
          };

          worker.addEventListener('error', errorHandler);

          // Give worker 200ms to fail if there's a loading error, otherwise assume it's ready
          setTimeout(() => {
            worker.removeEventListener('error', errorHandler);
            if (!hasError) {
              console.log(`Worker ${type} initialized successfully`);
              resolve(true);
            }
          }, 200);
        });

        this.workers.set(type, worker);
      } catch (error) {
        console.error(`Failed to create ${type} worker:`, error);

        // Enhanced fallback logic
        if (type !== 'universal' && type !== 'archive') {
          // For text and spreadsheet workers, try each other as fallback
          if (type === 'text') {
            console.log(`Text worker failed, trying universal worker`);
            return this.getOrCreateWorker('universal');
          } else if (type === 'spreadsheet') {
            console.log(`Spreadsheet worker failed, trying text worker as fallback`);
            return this.getOrCreateWorker('text');
          } else {
            console.log(`Falling back to universal worker for ${type}`);
            return this.getOrCreateWorker('universal');
          }
        }

        throw new Error(`Failed to initialize converter`);
      }
    }

    return this.workers.get(type)!;
  }

  /**
   * Update conversion state
   */
  private updateState(id: string, updates: Partial<ConversionState>): void {
    const currentState = this.activeConversions.get(id);
    if (!currentState) return;

    const newState = { ...currentState, ...updates };
    this.activeConversions.set(id, newState);
    this.notifyListeners(id, newState);
  }

  /**
   * Notify listeners of state change
   */
  private notifyListeners(id: string, state: ConversionState): void {
    const listeners = this.listeners.get(id);
    if (!listeners) return;

    listeners.forEach(callback => {
      try {
        callback(state);
      } catch (error) {
        console.error('Listener error:', error);
      }
    });
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `conversion_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Decode audio file to WAV using AudioContext (main thread only)
   * This allows us to support MP3, FLAC, OGG as source formats
   */
  private async decodeAudioToWAV(file: File, conversionId: string): Promise<File> {
    // AudioContext is only available in the main thread (not in workers)
    if (typeof AudioContext === 'undefined' && typeof (window as any).webkitAudioContext === 'undefined') {
      throw new Error('AudioContext not available in this browser');
    }

    const audioContext = new (AudioContext || (window as any).webkitAudioContext)();

    try {
      // Read file as array buffer
      const arrayBuffer = await file.arrayBuffer();

      // Decode audio data using AudioContext
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // Create WAV file from decoded audio
      const wavBlob = this.audioBufferToWAV(audioBuffer);

      // Create a File object from the WAV blob
      const originalName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      const wavFile = new File([wavBlob], `${originalName}.wav`, { type: 'audio/wav' });

      return wavFile;
    } finally {
      // Close audio context to free resources
      await audioContext.close();
    }
  }

  /**
   * Convert AudioBuffer to WAV file blob
   */
  private audioBufferToWAV(audioBuffer: AudioBuffer): Blob {
    const numberOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    // Get audio data from all channels
    const length = audioBuffer.length * numberOfChannels;
    const samples = new Int16Array(length);

    // Interleave channels
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      for (let i = 0; i < audioBuffer.length; i++) {
        // Convert float32 [-1, 1] to int16 [-32768, 32767]
        const sample = Math.max(-1, Math.min(1, channelData[i]));
        samples[i * numberOfChannels + channel] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      }
    }

    // Calculate sizes
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numberOfChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = samples.length * bytesPerSample;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    // Helper to write strings
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    // Write WAV header
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // fmt chunk size
    view.setUint16(20, format, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);

    // Write sample data
    const samplesView = new Int16Array(buffer, 44);
    samplesView.set(samples);

    return new Blob([buffer], { type: 'audio/wav' });
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    // Terminate all workers
    this.workers.forEach(worker => worker.terminate());
    this.workers.clear();

    // Clear all state
    this.queue = [];
    this.activeConversions.clear();
    this.listeners.clear();
  }

  /**
   * Alias for dispose() - for backward compatibility with tests
   */
  cleanup(): void {
    this.dispose();
  }
}

// Export singleton instance getter
export const conversionManager = ConversionManager.getInstance();