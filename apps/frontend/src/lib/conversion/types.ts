/**
 * Shared types for the conversion system
 */

export interface ConversionJob {
  id: string;
  file: File;
  fromFormat: string;
  toFormat: string;
  options: Record<string, any>;
}

export interface ConversionResult {
  id: string;
  outputFile: Blob;
  filename: string;
  mimeType: string;
  metadata?: {
    originalSize: number;
    outputSize: number;
    duration?: number;
    dimensions?: { width: number; height: number };
    pages?: number;
  };
}

export interface ConversionProgress {
  id: string;
  status: 'queued' | 'processing' | 'complete' | 'error';
  progress: number;
  message?: string;
  details?: {
    currentStep?: string;
    totalSteps?: number;
    estimatedTime?: number;
  };
}

export interface ConversionError {
  id: string;
  code: string;
  message: string;
  details?: any;
  recoverable?: boolean;
}

export interface WorkerMessage {
  type: 'convert' | 'cancel' | 'ping' | 'progress' | 'complete' | 'error' | 'ready';
  id?: string;
  job?: ConversionJob;
  progress?: number;
  message?: string;
  result?: ConversionResult;
  error?: string;
}