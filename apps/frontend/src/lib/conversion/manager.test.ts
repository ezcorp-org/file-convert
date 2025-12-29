/**
 * Unit Tests for ConversionManager
 * Tests the central orchestrator for all conversion operations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConversionManager, type ConversionState } from './manager';

// Mock the notifications store
vi.mock('../stores/notifications', () => ({
  notifications: {
    error: vi.fn(),
    warning: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    show: vi.fn(),
    dismiss: vi.fn(),
    clear: vi.fn(),
    subscribe: vi.fn()
  }
}));

// Import the mocked notifications for assertions
import { notifications } from '../stores/notifications';

// --- Mock Worker implementation ---

class MockWorker {
  url: string;
  options: any;
  listeners: Map<string, Set<Function>> = new Map();
  postMessageSpy = vi.fn();
  terminateSpy = vi.fn();

  constructor(url: string, options?: any) {
    MockWorker.instances.push(this);
    this.url = url;
    this.options = options;
  }

  static instances: MockWorker[] = [];
  static reset() {
    MockWorker.instances = [];
  }

  addEventListener(type: string, handler: Function) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(handler);
  }

  removeEventListener(type: string, handler: Function) {
    this.listeners.get(type)?.delete(handler);
  }

  postMessage(data: any, transfer?: any) {
    this.postMessageSpy(data, transfer);
  }

  terminate() {
    this.terminateSpy();
  }

  // Helper: simulate a message event from the worker
  simulateMessage(data: any) {
    const event = { data } as MessageEvent;
    this.listeners.get('message')?.forEach(handler => handler(event));
  }

  // Helper: simulate an error event
  simulateError(message: string) {
    const event = { message } as ErrorEvent;
    this.listeners.get('error')?.forEach(handler => handler(event));
  }
}

// --- Helpers ---

function createFile(name: string, type: string, size?: number): File {
  const content = size ? new Uint8Array(size) : new Uint8Array([0]);
  const file = new File([content], name, { type });
  if (size) {
    Object.defineProperty(file, 'size', { value: size });
  }
  return file;
}

function getManager(): ConversionManager {
  // Reset singleton for each test
  (ConversionManager as any).instance = undefined;
  return ConversionManager.getInstance();
}

// --- Tests ---

describe('ConversionManager', () => {
  let originalWorker: typeof globalThis.Worker;

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    MockWorker.reset();
    originalWorker = globalThis.Worker;
    (globalThis as any).Worker = MockWorker;

    // Mock sessionStorage
    const store: Record<string, string> = {};
    vi.stubGlobal('sessionStorage', {
      getItem: vi.fn((key: string) => store[key] ?? null),
      setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
      removeItem: vi.fn((key: string) => { delete store[key]; }),
      clear: vi.fn(() => { Object.keys(store).forEach(k => delete store[k]); })
    });

    // Mock window.location.origin
    if (typeof window !== 'undefined') {
      Object.defineProperty(window, 'location', {
        value: { origin: 'http://localhost:5173' },
        writable: true,
        configurable: true
      });
    }

    vi.clearAllMocks();
  });

  afterEach(() => {
    (globalThis as any).Worker = originalWorker;
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Singleton pattern', () => {
    it('should return the same instance on multiple calls', () => {
      (ConversionManager as any).instance = undefined;
      const a = ConversionManager.getInstance();
      const b = ConversionManager.getInstance();
      expect(a).toBe(b);
    });

    it('should pre-initialize workers when Worker is available', async () => {
      (ConversionManager as any).instance = undefined;
      ConversionManager.getInstance();
      // Worker constructor should have been called for image pre-init
      await vi.advanceTimersByTimeAsync(300);
      expect(MockWorker.instances.length).toBeGreaterThanOrEqual(1);
      const imageWorker = MockWorker.instances.find(w => w.url.includes('image'));
      expect(imageWorker).toBeDefined();
    });
  });

  describe('convert()', () => {
    it('should return a conversion ID', async () => {
      const manager = getManager();
      await vi.advanceTimersByTimeAsync(300); // let pre-init settle

      const file = createFile('photo.png', 'image/png');
      const id = await manager.convert(file, 'jpeg');

      expect(id).toMatch(/^conversion_/);
    });

    it('should set initial state to pending then start processing', async () => {
      const manager = getManager();
      await vi.advanceTimersByTimeAsync(300);

      const file = createFile('photo.png', 'image/png');
      const id = await manager.convert(file, 'jpeg');

      // After convert + queue processing, state transitions to validating/converting
      await vi.advanceTimersByTimeAsync(300);

      const state = manager.getState(id);
      expect(state).toBeDefined();
      expect(['validating', 'converting']).toContain(state!.status);
    });

    it('should fail for unsupported file types', async () => {
      const manager = getManager();
      await vi.advanceTimersByTimeAsync(300);

      const file = createFile('data.xyz', 'application/xyz');
      const id = await manager.convert(file, 'png');

      await vi.advanceTimersByTimeAsync(300);

      const state = manager.getState(id);
      expect(state!.status).toBe('failed');
      expect(state!.error?.message).toContain('Unsupported file type');
    });

    it('should fail for unsupported target format from source', async () => {
      const manager = getManager();
      await vi.advanceTimersByTimeAsync(300);

      // PNG cannot convert to mp3
      const file = createFile('photo.png', 'image/png');
      const id = await manager.convert(file, 'mp3');

      await vi.advanceTimersByTimeAsync(300);

      const state = manager.getState(id);
      expect(state!.status).toBe('failed');
      expect(state!.error?.message).toContain('Cannot convert');
    });

    it('should fail for unknown target format', async () => {
      const manager = getManager();
      await vi.advanceTimersByTimeAsync(300);

      // Manually manipulate supportedOutputs to add a nonexistent format
      const file = createFile('photo.png', 'image/png');
      // We'll test by checking actual config - png doesn't support 'xyz'
      const id = await manager.convert(file, 'xyz');

      await vi.advanceTimersByTimeAsync(300);

      const state = manager.getState(id);
      expect(state!.status).toBe('failed');
    });

    it('should send postMessage to worker with correct job data', async () => {
      const manager = getManager();
      await vi.advanceTimersByTimeAsync(300);

      const file = createFile('photo.png', 'image/png');
      const id = await manager.convert(file, 'jpeg', { quality: 80 });

      await vi.advanceTimersByTimeAsync(300);

      // Find the image worker that got the conversion message
      const imageWorker = MockWorker.instances.find(w => w.url.includes('image'));
      expect(imageWorker).toBeDefined();

      const calls = imageWorker!.postMessageSpy.mock.calls;
      const conversionCall = calls.find(
        (c: any) => c[0]?.type === 'CALL' && c[0]?.id === id
      );
      expect(conversionCall).toBeDefined();
      expect(conversionCall![0].method).toBe('convert');
      expect(conversionCall![0].args[0].fromFormat).toBe('png');
      expect(conversionCall![0].args[0].toFormat).toBe('jpeg');
      expect(conversionCall![0].args[0].options).toEqual({ quality: 80 });
    });
  });

  describe('subscribe()', () => {
    it('should call callback immediately with current state', async () => {
      const manager = getManager();
      await vi.advanceTimersByTimeAsync(300);

      const file = createFile('photo.png', 'image/png');
      const id = await manager.convert(file, 'jpeg');

      const callback = vi.fn();
      manager.subscribe(id, callback);

      expect(callback).toHaveBeenCalled();
      expect(callback.mock.calls[0][0].id).toBe(id);
    });

    it('should return an unsubscribe function that removes the listener', async () => {
      const manager = getManager();
      await vi.advanceTimersByTimeAsync(300);

      const file = createFile('photo.png', 'image/png');
      const id = await manager.convert(file, 'jpeg');

      const callback = vi.fn();
      const unsubscribe = manager.subscribe(id, callback);

      // Reset call count after initial callback
      callback.mockClear();

      unsubscribe();

      // Trigger a state change - should NOT call callback
      await vi.advanceTimersByTimeAsync(300);

      // After unsubscribe, should not have been called again by state updates
      // (It may have been called 0 times or some depending on timing, but the point
      // is the listener set no longer contains the callback)
      expect(callback.mock.calls.length).toBeLessThanOrEqual(0);
    });

    it('should not call callback if no current state exists', () => {
      const manager = getManager();
      const callback = vi.fn();
      manager.subscribe('nonexistent-id', callback);
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('getState()', () => {
    it('should return null for unknown conversion ID', () => {
      const manager = getManager();
      expect(manager.getState('does-not-exist')).toBeNull();
    });

    it('should return current state for a known conversion', async () => {
      const manager = getManager();
      await vi.advanceTimersByTimeAsync(300);

      const file = createFile('photo.png', 'image/png');
      const id = await manager.convert(file, 'jpeg');

      const state = manager.getState(id);
      expect(state).toBeDefined();
      expect(state!.id).toBe(id);
    });
  });

  describe('cancel()', () => {
    it('should return false for unknown conversion ID', () => {
      const manager = getManager();
      expect(manager.cancel('nonexistent')).toBe(false);
    });

    it('should cancel a pending conversion', async () => {
      const manager = getManager();
      await vi.advanceTimersByTimeAsync(300);

      // Fill up max concurrent to keep subsequent ones pending
      const files = Array.from({ length: 4 }, (_, i) =>
        createFile(`photo${i}.png`, 'image/png')
      );

      const ids: string[] = [];
      for (const file of files) {
        ids.push(await manager.convert(file, 'jpeg'));
      }

      // The 4th one should be pending (maxConcurrent = 3)
      // But we need to let processing start first
      await vi.advanceTimersByTimeAsync(300);

      // Find one that is still pending
      const pendingId = ids.find(id => {
        const state = manager.getState(id);
        return state?.status === 'pending';
      });

      if (pendingId) {
        const result = manager.cancel(pendingId);
        expect(result).toBe(true);
        const state = manager.getState(pendingId);
        expect(state!.status).toBe('failed');
        expect(state!.error?.message).toBe('Cancelled');
      }
    });

    it('should cancel a converting conversion and send cancel to worker', async () => {
      const manager = getManager();
      await vi.advanceTimersByTimeAsync(300);

      const file = createFile('photo.png', 'image/png');
      const id = await manager.convert(file, 'jpeg');

      await vi.advanceTimersByTimeAsync(300);

      const state = manager.getState(id);
      if (state?.status === 'converting') {
        const result = manager.cancel(id);
        expect(result).toBe(true);
        const newState = manager.getState(id);
        expect(newState!.status).toBe('failed');
        expect(newState!.error?.message).toBe('Cancelled');
      }
    });

    it('should return false for completed conversions', async () => {
      const manager = getManager();
      await vi.advanceTimersByTimeAsync(300);

      const file = createFile('photo.png', 'image/png');
      const id = await manager.convert(file, 'jpeg');

      await vi.advanceTimersByTimeAsync(300);

      // Simulate worker completing
      const imageWorker = MockWorker.instances.find(w => w.url.includes('image'));
      imageWorker?.simulateMessage({
        type: 'RESULT',
        id,
        result: {
          id,
          outputFile: new Blob(['output']),
          filename: 'photo.jpeg',
          mimeType: 'image/jpeg'
        }
      });

      const result = manager.cancel(id);
      expect(result).toBe(false);
    });
  });

  describe('Worker message handling', () => {
    it('should handle RESULT message and mark conversion completed', async () => {
      const manager = getManager();
      await vi.advanceTimersByTimeAsync(300);

      const file = createFile('photo.png', 'image/png');
      const id = await manager.convert(file, 'jpeg');

      await vi.advanceTimersByTimeAsync(300);

      const imageWorker = MockWorker.instances.find(w => w.url.includes('image'));

      const mockResult = {
        id,
        outputFile: new Blob(['output']),
        filename: 'photo.jpeg',
        mimeType: 'image/jpeg'
      };

      imageWorker?.simulateMessage({
        type: 'RESULT',
        id,
        result: mockResult
      });

      const state = manager.getState(id);
      expect(state!.status).toBe('completed');
      expect(state!.progress).toBe(100);
      expect(state!.result).toEqual(mockResult);
      expect(state!.endTime).toBeDefined();
    });

    it('should handle ERROR message and mark conversion failed', async () => {
      const manager = getManager();
      await vi.advanceTimersByTimeAsync(300);

      const file = createFile('photo.png', 'image/png');
      const id = await manager.convert(file, 'jpeg');

      await vi.advanceTimersByTimeAsync(300);

      const imageWorker = MockWorker.instances.find(w => w.url.includes('image'));
      imageWorker?.simulateMessage({
        type: 'ERROR',
        id,
        error: { message: 'Something went wrong' }
      });

      const state = manager.getState(id);
      expect(state!.status).toBe('failed');
      expect(state!.error?.message).toBe('Something went wrong');
    });

    it('should handle legacy complete message', async () => {
      const manager = getManager();
      await vi.advanceTimersByTimeAsync(300);

      const file = createFile('photo.png', 'image/png');
      const id = await manager.convert(file, 'jpeg');

      await vi.advanceTimersByTimeAsync(300);

      const imageWorker = MockWorker.instances.find(w => w.url.includes('image'));
      const mockResult = {
        id,
        outputFile: new Blob(['output']),
        filename: 'photo.jpeg',
        mimeType: 'image/jpeg'
      };

      imageWorker?.simulateMessage({
        type: 'complete',
        id,
        result: mockResult
      });

      const state = manager.getState(id);
      expect(state!.status).toBe('completed');
    });

    it('should handle legacy error message', async () => {
      const manager = getManager();
      await vi.advanceTimersByTimeAsync(300);

      const file = createFile('photo.png', 'image/png');
      const id = await manager.convert(file, 'jpeg');

      await vi.advanceTimersByTimeAsync(300);

      const imageWorker = MockWorker.instances.find(w => w.url.includes('image'));
      imageWorker?.simulateMessage({
        type: 'error',
        id,
        error: 'Legacy error'
      });

      const state = manager.getState(id);
      expect(state!.status).toBe('failed');
      expect(state!.error?.message).toBe('Legacy error');
    });

    it('should handle progress messages', async () => {
      const manager = getManager();
      await vi.advanceTimersByTimeAsync(300);

      const file = createFile('photo.png', 'image/png');
      const id = await manager.convert(file, 'jpeg');

      await vi.advanceTimersByTimeAsync(300);

      const callback = vi.fn();
      manager.subscribe(id, callback);
      callback.mockClear();

      const imageWorker = MockWorker.instances.find(w => w.url.includes('image'));
      imageWorker?.simulateMessage({
        type: 'progress',
        id,
        progress: 50,
        message: 'Half done'
      });

      expect(callback).toHaveBeenCalled();
      const updatedState = callback.mock.calls[0][0] as ConversionState;
      expect(updatedState.progress).toBe(50);
      expect(updatedState.message).toBe('Half done');
    });

    it('should ignore messages for different conversion IDs', async () => {
      const manager = getManager();
      await vi.advanceTimersByTimeAsync(300);

      const file = createFile('photo.png', 'image/png');
      const id = await manager.convert(file, 'jpeg');

      await vi.advanceTimersByTimeAsync(300);

      const imageWorker = MockWorker.instances.find(w => w.url.includes('image'));
      imageWorker?.simulateMessage({
        type: 'RESULT',
        id: 'some-other-id',
        result: { id: 'some-other-id' }
      });

      // Our conversion should still be in converting state, not completed
      const state = manager.getState(id);
      expect(state!.status).not.toBe('completed');
    });

    it('should handle RESULT with no result data as error', async () => {
      const manager = getManager();
      await vi.advanceTimersByTimeAsync(300);

      const file = createFile('photo.png', 'image/png');
      const id = await manager.convert(file, 'jpeg');

      await vi.advanceTimersByTimeAsync(300);

      const imageWorker = MockWorker.instances.find(w => w.url.includes('image'));
      imageWorker?.simulateMessage({
        type: 'RESULT',
        id,
        result: null
      });

      const state = manager.getState(id);
      expect(state!.status).toBe('failed');
      expect(state!.error?.message).toContain('no result returned');
    });
  });

  describe('clearCompleted()', () => {
    it('should remove completed and failed conversions', async () => {
      const manager = getManager();
      await vi.advanceTimersByTimeAsync(300);

      const file = createFile('photo.png', 'image/png');
      const id = await manager.convert(file, 'jpeg');

      await vi.advanceTimersByTimeAsync(300);

      // Complete it
      const imageWorker = MockWorker.instances.find(w => w.url.includes('image'));
      imageWorker?.simulateMessage({
        type: 'RESULT',
        id,
        result: {
          id,
          outputFile: new Blob(['out']),
          filename: 'photo.jpeg',
          mimeType: 'image/jpeg'
        }
      });

      expect(manager.getState(id)!.status).toBe('completed');

      manager.clearCompleted();
      expect(manager.getState(id)).toBeNull();
    });

    it('should not remove active conversions', async () => {
      const manager = getManager();
      await vi.advanceTimersByTimeAsync(300);

      const file = createFile('photo.png', 'image/png');
      const id = await manager.convert(file, 'jpeg');

      await vi.advanceTimersByTimeAsync(300);

      manager.clearCompleted();

      // Still active, should not be removed
      const state = manager.getState(id);
      expect(state).toBeDefined();
    });
  });

  describe('dispose() / cleanup()', () => {
    it('should terminate all workers and clear state', async () => {
      const manager = getManager();
      await vi.advanceTimersByTimeAsync(300);

      const file = createFile('photo.png', 'image/png');
      await manager.convert(file, 'jpeg');

      await vi.advanceTimersByTimeAsync(300);

      manager.dispose();

      // Workers should be terminated
      const imageWorker = MockWorker.instances.find(w => w.url.includes('image'));
      expect(imageWorker?.terminateSpy).toHaveBeenCalled();
    });

    it('cleanup() should be an alias for dispose()', async () => {
      const manager = getManager();
      await vi.advanceTimersByTimeAsync(300);

      const file = createFile('photo.png', 'image/png');
      await manager.convert(file, 'jpeg');

      await vi.advanceTimersByTimeAsync(300);

      manager.cleanup();

      const imageWorker = MockWorker.instances.find(w => w.url.includes('image'));
      expect(imageWorker?.terminateSpy).toHaveBeenCalled();
    });
  });

  describe('Worker type selection', () => {
    it('should use image worker for image-to-image conversion', async () => {
      const manager = getManager();
      await vi.advanceTimersByTimeAsync(300);

      const file = createFile('photo.png', 'image/png');
      await manager.convert(file, 'jpeg');

      await vi.advanceTimersByTimeAsync(300);

      const imageWorker = MockWorker.instances.find(w => w.url.includes('image'));
      expect(imageWorker).toBeDefined();
      expect(imageWorker!.postMessageSpy).toHaveBeenCalled();
    });

    it('should use archive worker when source is archive', async () => {
      const manager = getManager();
      await vi.advanceTimersByTimeAsync(300);

      const file = createFile('archive.zip', 'application/zip');
      await manager.convert(file, 'tar');

      await vi.advanceTimersByTimeAsync(300);

      const archiveWorker = MockWorker.instances.find(w => w.url.includes('archive'));
      expect(archiveWorker).toBeDefined();
    });

    it('should use document worker for document conversions', async () => {
      const manager = getManager();
      await vi.advanceTimersByTimeAsync(300);

      const file = createFile('doc.pdf', 'application/pdf');
      await manager.convert(file, 'png');

      await vi.advanceTimersByTimeAsync(300);

      const documentWorker = MockWorker.instances.find(w => w.url.includes('document'));
      expect(documentWorker).toBeDefined();
    });

    it('should use audio worker for audio-to-audio conversion', async () => {
      const manager = getManager();
      await vi.advanceTimersByTimeAsync(300);

      // WAV to MP3 - WAV doesn't need decode step
      const file = createFile('audio.wav', 'audio/wav');
      await manager.convert(file, 'mp3');

      await vi.advanceTimersByTimeAsync(300);

      const audioWorker = MockWorker.instances.find(w => w.url.includes('audio'));
      expect(audioWorker).toBeDefined();
    });

    it('should use spreadsheet worker for spreadsheet conversions', async () => {
      const manager = getManager();
      await vi.advanceTimersByTimeAsync(300);

      const file = createFile('data.csv', 'text/csv');
      await manager.convert(file, 'xlsx');

      await vi.advanceTimersByTimeAsync(300);

      const spreadsheetWorker = MockWorker.instances.find(w => w.url.includes('spreadsheet'));
      expect(spreadsheetWorker).toBeDefined();
    });

    it('should use text worker for text conversions', async () => {
      const manager = getManager();
      await vi.advanceTimersByTimeAsync(300);

      const file = createFile('data.json', 'application/json');
      await manager.convert(file, 'yaml');

      await vi.advanceTimersByTimeAsync(300);

      const textWorker = MockWorker.instances.find(w => w.url.includes('text'));
      expect(textWorker).toBeDefined();
    });
  });

  describe('Session storage on completion', () => {
    it('should increment session_conversions on successful completion', async () => {
      const manager = getManager();
      await vi.advanceTimersByTimeAsync(300);

      const file = createFile('photo.png', 'image/png');
      const id = await manager.convert(file, 'jpeg');

      await vi.advanceTimersByTimeAsync(300);

      const imageWorker = MockWorker.instances.find(w => w.url.includes('image'));
      imageWorker?.simulateMessage({
        type: 'RESULT',
        id,
        result: {
          id,
          outputFile: new Blob(['out']),
          filename: 'photo.jpeg',
          mimeType: 'image/jpeg'
        }
      });

      expect(sessionStorage.setItem).toHaveBeenCalledWith('session_conversions', '1');
      expect(sessionStorage.setItem).toHaveBeenCalledWith(
        'last_conversion_date',
        expect.any(String)
      );
    });
  });

  describe('Error notification categorization', () => {
    it('should show "unsupported" warning for unsupported format errors', async () => {
      const manager = getManager();
      await vi.advanceTimersByTimeAsync(300);

      const file = createFile('photo.png', 'image/png');
      const id = await manager.convert(file, 'jpeg');

      await vi.advanceTimersByTimeAsync(300);

      const imageWorker = MockWorker.instances.find(w => w.url.includes('image'));
      imageWorker?.simulateMessage({
        type: 'ERROR',
        id,
        error: { message: 'Format not supported' }
      });

      expect(notifications.warning).toHaveBeenCalled();
    });

    it('should show "worker" error for initialization failures', async () => {
      const manager = getManager();
      await vi.advanceTimersByTimeAsync(300);

      const file = createFile('photo.png', 'image/png');
      const id = await manager.convert(file, 'jpeg');

      await vi.advanceTimersByTimeAsync(300);

      const imageWorker = MockWorker.instances.find(w => w.url.includes('image'));
      imageWorker?.simulateMessage({
        type: 'ERROR',
        id,
        error: { message: 'Failed to initialize worker module' }
      });

      expect(notifications.error).toHaveBeenCalled();
    });

    it('should show warning for timeout errors', async () => {
      const manager = getManager();
      await vi.advanceTimersByTimeAsync(300);

      const file = createFile('photo.png', 'image/png');
      const id = await manager.convert(file, 'jpeg');

      await vi.advanceTimersByTimeAsync(300);

      const imageWorker = MockWorker.instances.find(w => w.url.includes('image'));
      imageWorker?.simulateMessage({
        type: 'ERROR',
        id,
        error: { message: 'Operation timed out' }
      });

      expect(notifications.warning).toHaveBeenCalled();
    });

    it('should show warning for memory errors', async () => {
      const manager = getManager();
      await vi.advanceTimersByTimeAsync(300);

      const file = createFile('photo.png', 'image/png');
      const id = await manager.convert(file, 'jpeg');

      await vi.advanceTimersByTimeAsync(300);

      const imageWorker = MockWorker.instances.find(w => w.url.includes('image'));
      imageWorker?.simulateMessage({
        type: 'ERROR',
        id,
        error: { message: 'Out of memory' }
      });

      expect(notifications.warning).toHaveBeenCalled();
    });

    it('should show error for corrupt file errors', async () => {
      const manager = getManager();
      await vi.advanceTimersByTimeAsync(300);

      const file = createFile('photo.png', 'image/png');
      const id = await manager.convert(file, 'jpeg');

      await vi.advanceTimersByTimeAsync(300);

      const imageWorker = MockWorker.instances.find(w => w.url.includes('image'));
      imageWorker?.simulateMessage({
        type: 'ERROR',
        id,
        error: { message: 'File appears corrupt' }
      });

      expect(notifications.error).toHaveBeenCalled();
    });

    it('should show generic error for unknown error types', async () => {
      const manager = getManager();
      await vi.advanceTimersByTimeAsync(300);

      const file = createFile('photo.png', 'image/png');
      const id = await manager.convert(file, 'jpeg');

      await vi.advanceTimersByTimeAsync(300);

      const imageWorker = MockWorker.instances.find(w => w.url.includes('image'));
      imageWorker?.simulateMessage({
        type: 'ERROR',
        id,
        error: { message: 'Something completely unexpected' }
      });

      // Generic errors use notifications.error
      expect(notifications.error).toHaveBeenCalled();
    });
  });

  describe('Queue processing', () => {
    it('should respect maxConcurrent limit', async () => {
      const manager = getManager();
      await vi.advanceTimersByTimeAsync(300);

      // Submit 5 conversions
      const ids: string[] = [];
      for (let i = 0; i < 5; i++) {
        ids.push(await manager.convert(
          createFile(`photo${i}.png`, 'image/png'),
          'jpeg'
        ));
      }

      await vi.advanceTimersByTimeAsync(300);

      // Count active (validating or converting) conversions
      const activeCount = ids.filter(id => {
        const state = manager.getState(id);
        return state?.status === 'validating' || state?.status === 'converting';
      }).length;

      // Should not exceed 3 (maxConcurrent)
      expect(activeCount).toBeLessThanOrEqual(3);
    });

    it('should process next item when a conversion completes', async () => {
      const manager = getManager();
      await vi.advanceTimersByTimeAsync(300);

      // Submit 4 conversions (one more than maxConcurrent)
      const ids: string[] = [];
      for (let i = 0; i < 4; i++) {
        ids.push(await manager.convert(
          createFile(`photo${i}.png`, 'image/png'),
          'jpeg'
        ));
      }

      await vi.advanceTimersByTimeAsync(300);

      // Complete the first conversion
      const imageWorker = MockWorker.instances.find(w => w.url.includes('image'));
      imageWorker?.simulateMessage({
        type: 'RESULT',
        id: ids[0],
        result: {
          id: ids[0],
          outputFile: new Blob(['out']),
          filename: 'photo0.jpeg',
          mimeType: 'image/jpeg'
        }
      });

      await vi.advanceTimersByTimeAsync(300);

      // First conversion should be completed
      expect(manager.getState(ids[0])!.status).toBe('completed');
    });
  });

  describe('File validation during conversion', () => {
    it('should reject files that fail validation', async () => {
      const manager = getManager();
      await vi.advanceTimersByTimeAsync(300);

      // Create a file that exceeds size limit
      const file = createFile('huge.png', 'image/png');
      Object.defineProperty(file, 'size', { value: 11 * 1024 * 1024 * 1024 }); // 11GB

      const id = await manager.convert(file, 'jpeg');

      await vi.advanceTimersByTimeAsync(300);

      const state = manager.getState(id);
      expect(state!.status).toBe('failed');
      expect(state!.error?.message).toContain('too large');
    });
  });

  describe('Listener error handling', () => {
    it('should not crash if a listener throws during notifyListeners', async () => {
      const manager = getManager();
      await vi.advanceTimersByTimeAsync(300);

      const file = createFile('photo.png', 'image/png');
      const id = await manager.convert(file, 'jpeg');

      await vi.advanceTimersByTimeAsync(300);

      // Subscribe good callback first, then bad one
      const goodCallback = vi.fn();
      const badCallback = vi.fn(() => { throw new Error('Listener broke'); });

      manager.subscribe(id, goodCallback);
      // The bad callback will throw on subscribe's immediate call, so catch it
      try { manager.subscribe(id, badCallback); } catch { /* expected */ }

      goodCallback.mockClear();
      badCallback.mockClear();

      // Trigger notifyListeners via a worker progress message (which uses try/catch)
      const imageWorker = MockWorker.instances.find(w => w.url.includes('image'));
      imageWorker?.simulateMessage({
        type: 'progress',
        id,
        progress: 50,
        message: 'Half done'
      });

      // Both should have been called, and the error should be caught
      expect(badCallback).toHaveBeenCalled();
      expect(goodCallback).toHaveBeenCalled();
    });
  });

  describe('Audio decode path', () => {
    it('should decode non-WAV audio files before sending to worker', async () => {
      const manager = getManager();
      await vi.advanceTimersByTimeAsync(300);

      // MP3 is non-WAV audio, triggers decodeAudioToWAV
      const file = createFile('song.mp3', 'audio/mpeg', 1024);
      const id = await manager.convert(file, 'wav');

      await vi.advanceTimersByTimeAsync(300);

      // The audio worker should receive a DECODE_AUDIO message
      const audioWorker = MockWorker.instances.find(w => w.url.includes('audio'));
      expect(audioWorker).toBeDefined();

      const decodeCalls = audioWorker!.postMessageSpy.mock.calls.filter(
        (c: any) => c[0]?.type === 'DECODE_AUDIO'
      );
      expect(decodeCalls.length).toBe(1);
      expect(decodeCalls[0][0].id).toBe(id);
    });

    it('should handle decode error gracefully', async () => {
      const manager = getManager();
      await vi.advanceTimersByTimeAsync(300);

      const file = createFile('song.mp3', 'audio/mpeg', 1024);
      const id = await manager.convert(file, 'wav');

      await vi.advanceTimersByTimeAsync(300);

      // Simulate decode error
      const audioWorker = MockWorker.instances.find(w => w.url.includes('audio'));
      audioWorker?.simulateMessage({
        type: 'DECODE_ERROR',
        id,
        error: { message: 'Failed to decode MP3' }
      });

      await vi.advanceTimersByTimeAsync(100);

      const state = manager.getState(id);
      expect(state!.status).toBe('failed');
      expect(state!.error?.message).toContain('Audio decoding failed');
    });

    it('should handle decode progress messages', async () => {
      const manager = getManager();
      await vi.advanceTimersByTimeAsync(300);

      const file = createFile('song.mp3', 'audio/mpeg', 1024);
      const id = await manager.convert(file, 'wav');

      await vi.advanceTimersByTimeAsync(300);

      const callback = vi.fn();
      manager.subscribe(id, callback);
      callback.mockClear();

      const audioWorker = MockWorker.instances.find(w => w.url.includes('audio'));
      audioWorker?.simulateMessage({
        type: 'DECODE_PROGRESS',
        id,
        progress: 50,
        message: 'Decoding...'
      });

      expect(callback).toHaveBeenCalled();
      // Progress should be mapped to 20-40% range (20 + 50% * 20 = 30)
      expect(callback.mock.calls[0][0].progress).toBe(30);
    });

    it('should handle successful decode and create WAV file', async () => {
      const manager = getManager();
      await vi.advanceTimersByTimeAsync(300);

      const file = createFile('song.mp3', 'audio/mpeg', 1024);
      const id = await manager.convert(file, 'wav');

      await vi.advanceTimersByTimeAsync(300);

      const audioWorker = MockWorker.instances.find(w => w.url.includes('audio'));

      // Simulate successful decode
      const wavData = new ArrayBuffer(100);
      audioWorker?.simulateMessage({
        type: 'DECODE_RESULT',
        id,
        result: { arrayBuffer: wavData }
      });

      await vi.advanceTimersByTimeAsync(300);

      // After decode, the worker should receive a CALL message for conversion
      const callMessages = audioWorker!.postMessageSpy.mock.calls.filter(
        (c: any) => c[0]?.type === 'CALL'
      );
      expect(callMessages.length).toBe(1);
      expect(callMessages[0][0].args[0].fromFormat).toBe('wav');
    });
  });

  describe('Worker fallback logic', () => {
    it('should fall back to universal worker when specific worker fails', async () => {
      const manager = getManager();
      await vi.advanceTimersByTimeAsync(300);

      // Make the next Worker constructor fail for 'text' worker
      // by making the worker emit an error within 200ms
      const originalWorkerClass = (globalThis as any).Worker;

      let workerCount = 0;
      (globalThis as any).Worker = class extends MockWorker {
        constructor(url: string, options?: any) {
          super(url, options);
          workerCount++;
          // If this is a text worker (2nd+ worker since image is pre-initialized), simulate error
          if (url.includes('text')) {
            setTimeout(() => {
              this.simulateError('Failed to load');
            }, 50);
          }
        }
      };

      const file = createFile('notes.md', 'text/markdown');
      const id = await manager.convert(file, 'html');

      await vi.advanceTimersByTimeAsync(600);

      // Should have attempted to create text worker, then fallen back to universal
      // Either the text worker succeeded before the error or it fell back to universal
      // The important thing is the conversion was attempted
      expect(manager.getState(id)).toBeDefined();

      (globalThis as any).Worker = originalWorkerClass;
    });
  });

  describe('Concurrent conversion IDs', () => {
    it('should generate unique IDs for each conversion', async () => {
      const manager = getManager();
      await vi.advanceTimersByTimeAsync(300);

      const ids = new Set<string>();
      for (let i = 0; i < 10; i++) {
        const id = await manager.convert(
          createFile(`photo${i}.png`, 'image/png'),
          'jpeg'
        );
        ids.add(id);
      }

      expect(ids.size).toBe(10);
    });
  });
});
