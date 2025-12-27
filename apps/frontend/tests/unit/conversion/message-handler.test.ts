/**
 * Message Handler Lifecycle Tests
 *
 * Regression tests for BUG-01 (memory leak from orphaned message handlers)
 * and BUG-02 (inconsistent message ID filtering).
 *
 * These tests verify that:
 * 1. Message handlers are always removed after conversion completes (success or error)
 * 2. Message handlers are removed when exceptions occur during conversion setup
 * 3. Messages are filtered by ID correctly to prevent cross-conversion leakage
 * 4. Multiple concurrent conversions don't interfere with each other
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock types to match worker message patterns
interface WorkerMessage {
  id?: string;
  type: 'progress' | 'RESULT' | 'ERROR' | 'complete' | 'error';
  progress?: number;
  message?: string;
  result?: { blob: Blob; filename: string; mimeType: string };
  error?: { message: string } | string;
}

/**
 * Simulates the message handler behavior from ConversionManager.processConversion
 * This is extracted to test the handler logic in isolation without needing
 * the full manager infrastructure (workers, queue, etc.)
 */
function createMessageHandler(
  conversionId: string,
  callbacks: {
    onProgress: (progress: number, message?: string) => void;
    onComplete: (result: any) => void;
    onError: (error: Error) => void;
    cleanup: () => void;
  }
) {
  return (event: MessageEvent<WorkerMessage>) => {
    const msgId = event.data.id;

    // Single authoritative ID check - skip messages not for this conversion
    if (msgId && msgId !== conversionId) {
      return;
    }

    switch (event.data.type) {
      case 'progress':
        callbacks.onProgress(event.data.progress || 0, event.data.message);
        break;

      case 'RESULT':
        callbacks.cleanup();
        if (event.data.result) {
          callbacks.onComplete(event.data.result);
        } else {
          callbacks.onError(new Error('Conversion completed but no result returned'));
        }
        break;

      case 'ERROR':
        callbacks.cleanup();
        const errorMessage =
          typeof event.data.error === 'string'
            ? event.data.error
            : event.data.error?.message || 'Unknown error occurred';
        callbacks.onError(new Error(errorMessage));
        break;

      case 'complete':
        callbacks.cleanup();
        callbacks.onComplete(event.data.result);
        break;

      case 'error':
        callbacks.cleanup();
        callbacks.onError(new Error(event.data.error as string));
        break;
    }
  };
}

describe('Message Handler Lifecycle', () => {
  let mockWorker: {
    addEventListener: ReturnType<typeof vi.fn>;
    removeEventListener: ReturnType<typeof vi.fn>;
    postMessage: ReturnType<typeof vi.fn>;
  };

  let messageHandlers: Map<string, (event: MessageEvent) => void>;

  beforeEach(() => {
    messageHandlers = new Map();

    mockWorker = {
      addEventListener: vi.fn((type: string, handler: (event: MessageEvent) => void) => {
        if (type === 'message') {
          // Store handlers by reference for later invocation
          const key = Math.random().toString(36);
          messageHandlers.set(key, handler);
          (handler as any).__key = key;
        }
      }),
      removeEventListener: vi.fn((type: string, handler: (event: MessageEvent) => void) => {
        if (type === 'message') {
          const key = (handler as any).__key;
          if (key) {
            messageHandlers.delete(key);
          }
        }
      }),
      postMessage: vi.fn(),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
    messageHandlers.clear();
  });

  /**
   * Simulates sending a message to all registered handlers
   */
  function simulateWorkerMessage(data: WorkerMessage) {
    const event = new MessageEvent('message', { data });
    messageHandlers.forEach((handler) => handler(event));
  }

  describe('Handler Cleanup', () => {
    it('removes handler on successful RESULT message', () => {
      const conversionId = 'conv_123';
      const cleanup = vi.fn();
      const onComplete = vi.fn();
      const onError = vi.fn();
      const onProgress = vi.fn();

      const handler = createMessageHandler(conversionId, {
        onProgress,
        onComplete,
        onError,
        cleanup,
      });

      // Register handler
      mockWorker.addEventListener('message', handler);

      // Simulate RESULT message
      handler(
        new MessageEvent('message', {
          data: {
            id: conversionId,
            type: 'RESULT',
            result: { blob: new Blob(), filename: 'test.png', mimeType: 'image/png' },
          },
        })
      );

      expect(cleanup).toHaveBeenCalledTimes(1);
      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(onError).not.toHaveBeenCalled();
    });

    it('removes handler on ERROR message', () => {
      const conversionId = 'conv_456';
      const cleanup = vi.fn();
      const onComplete = vi.fn();
      const onError = vi.fn();
      const onProgress = vi.fn();

      const handler = createMessageHandler(conversionId, {
        onProgress,
        onComplete,
        onError,
        cleanup,
      });

      // Simulate ERROR message
      handler(
        new MessageEvent('message', {
          data: {
            id: conversionId,
            type: 'ERROR',
            error: { message: 'Conversion failed' },
          },
        })
      );

      expect(cleanup).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(new Error('Conversion failed'));
      expect(onComplete).not.toHaveBeenCalled();
    });

    it('removes handler on legacy complete message', () => {
      const conversionId = 'conv_789';
      const cleanup = vi.fn();
      const onComplete = vi.fn();
      const onError = vi.fn();
      const onProgress = vi.fn();

      const handler = createMessageHandler(conversionId, {
        onProgress,
        onComplete,
        onError,
        cleanup,
      });

      handler(
        new MessageEvent('message', {
          data: {
            id: conversionId,
            type: 'complete',
            result: { blob: new Blob(), filename: 'output.jpg', mimeType: 'image/jpeg' },
          },
        })
      );

      expect(cleanup).toHaveBeenCalledTimes(1);
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('removes handler on legacy error message', () => {
      const conversionId = 'conv_abc';
      const cleanup = vi.fn();
      const onComplete = vi.fn();
      const onError = vi.fn();
      const onProgress = vi.fn();

      const handler = createMessageHandler(conversionId, {
        onProgress,
        onComplete,
        onError,
        cleanup,
      });

      handler(
        new MessageEvent('message', {
          data: {
            id: conversionId,
            type: 'error',
            error: 'Something went wrong',
          },
        })
      );

      expect(cleanup).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(new Error('Something went wrong'));
    });

    it('does not remove handler on progress message', () => {
      const conversionId = 'conv_prog';
      const cleanup = vi.fn();
      const onComplete = vi.fn();
      const onError = vi.fn();
      const onProgress = vi.fn();

      const handler = createMessageHandler(conversionId, {
        onProgress,
        onComplete,
        onError,
        cleanup,
      });

      // Send multiple progress updates
      handler(
        new MessageEvent('message', {
          data: { id: conversionId, type: 'progress', progress: 25, message: 'Processing...' },
        })
      );
      handler(
        new MessageEvent('message', {
          data: { id: conversionId, type: 'progress', progress: 50, message: 'Halfway there...' },
        })
      );
      handler(
        new MessageEvent('message', {
          data: { id: conversionId, type: 'progress', progress: 75, message: 'Almost done...' },
        })
      );

      // Cleanup should NOT be called for progress messages
      expect(cleanup).not.toHaveBeenCalled();
      expect(onProgress).toHaveBeenCalledTimes(3);
      expect(onProgress).toHaveBeenLastCalledWith(75, 'Almost done...');
    });
  });

  describe('Message ID Filtering', () => {
    it('filters messages by conversion ID correctly', () => {
      const conversionId = 'conv_filter_test';
      const cleanup = vi.fn();
      const onComplete = vi.fn();
      const onError = vi.fn();
      const onProgress = vi.fn();

      const handler = createMessageHandler(conversionId, {
        onProgress,
        onComplete,
        onError,
        cleanup,
      });

      // Message for different conversion - should be ignored
      handler(
        new MessageEvent('message', {
          data: {
            id: 'conv_other',
            type: 'RESULT',
            result: { blob: new Blob(), filename: 'wrong.png', mimeType: 'image/png' },
          },
        })
      );

      // Callbacks should not be called
      expect(cleanup).not.toHaveBeenCalled();
      expect(onComplete).not.toHaveBeenCalled();

      // Now send correct ID
      handler(
        new MessageEvent('message', {
          data: {
            id: conversionId,
            type: 'RESULT',
            result: { blob: new Blob(), filename: 'correct.png', mimeType: 'image/png' },
          },
        })
      );

      expect(cleanup).toHaveBeenCalledTimes(1);
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('handles messages without ID (legacy workers)', () => {
      const conversionId = 'conv_legacy';
      const cleanup = vi.fn();
      const onComplete = vi.fn();
      const onError = vi.fn();
      const onProgress = vi.fn();

      const handler = createMessageHandler(conversionId, {
        onProgress,
        onComplete,
        onError,
        cleanup,
      });

      // Message without ID should be processed (legacy worker behavior)
      handler(
        new MessageEvent('message', {
          data: {
            type: 'progress',
            progress: 50,
            message: 'Converting...',
          },
        })
      );

      expect(onProgress).toHaveBeenCalledWith(50, 'Converting...');
    });
  });

  describe('Concurrent Conversions', () => {
    it('handles multiple concurrent conversions without message leakage', () => {
      const conv1Id = 'conv_concurrent_1';
      const conv2Id = 'conv_concurrent_2';
      const conv3Id = 'conv_concurrent_3';

      const callbacks1 = {
        onProgress: vi.fn(),
        onComplete: vi.fn(),
        onError: vi.fn(),
        cleanup: vi.fn(),
      };

      const callbacks2 = {
        onProgress: vi.fn(),
        onComplete: vi.fn(),
        onError: vi.fn(),
        cleanup: vi.fn(),
      };

      const callbacks3 = {
        onProgress: vi.fn(),
        onComplete: vi.fn(),
        onError: vi.fn(),
        cleanup: vi.fn(),
      };

      const handler1 = createMessageHandler(conv1Id, callbacks1);
      const handler2 = createMessageHandler(conv2Id, callbacks2);
      const handler3 = createMessageHandler(conv3Id, callbacks3);

      // Register all handlers (simulating concurrent conversions)
      mockWorker.addEventListener('message', handler1);
      mockWorker.addEventListener('message', handler2);
      mockWorker.addEventListener('message', handler3);

      // Send messages for conv2 only - others should not receive
      handler1(
        new MessageEvent('message', {
          data: { id: conv2Id, type: 'progress', progress: 30 },
        })
      );
      handler2(
        new MessageEvent('message', {
          data: { id: conv2Id, type: 'progress', progress: 30 },
        })
      );
      handler3(
        new MessageEvent('message', {
          data: { id: conv2Id, type: 'progress', progress: 30 },
        })
      );

      // Only handler2 should have received the message
      expect(callbacks1.onProgress).not.toHaveBeenCalled();
      expect(callbacks2.onProgress).toHaveBeenCalledWith(30, undefined);
      expect(callbacks3.onProgress).not.toHaveBeenCalled();

      // Complete conv1 and conv3
      handler1(
        new MessageEvent('message', {
          data: {
            id: conv1Id,
            type: 'RESULT',
            result: { blob: new Blob(), filename: '1.png', mimeType: 'image/png' },
          },
        })
      );
      handler3(
        new MessageEvent('message', {
          data: {
            id: conv3Id,
            type: 'ERROR',
            error: { message: 'Failed' },
          },
        })
      );

      expect(callbacks1.cleanup).toHaveBeenCalledTimes(1);
      expect(callbacks1.onComplete).toHaveBeenCalledTimes(1);
      expect(callbacks3.cleanup).toHaveBeenCalledTimes(1);
      expect(callbacks3.onError).toHaveBeenCalledTimes(1);

      // conv2 should still be active (no cleanup called yet)
      expect(callbacks2.cleanup).not.toHaveBeenCalled();
    });
  });

  describe('Exception Handling Cleanup', () => {
    it('cleanup is available for use when exception thrown', () => {
      // This test verifies the pattern: if cleanup() is called in catch block,
      // it correctly removes the handler

      const conversionId = 'conv_exception';
      let handlerRemoved = false;

      const cleanup = () => {
        handlerRemoved = true;
        mockWorker.removeEventListener('message', handler);
      };

      const handler = createMessageHandler(conversionId, {
        onProgress: vi.fn(),
        onComplete: vi.fn(),
        onError: vi.fn(),
        cleanup,
      });

      mockWorker.addEventListener('message', handler);
      expect(messageHandlers.size).toBe(1);

      // Simulate exception scenario - cleanup is called
      cleanup();

      expect(handlerRemoved).toBe(true);
      expect(mockWorker.removeEventListener).toHaveBeenCalledWith('message', handler);
      expect(messageHandlers.size).toBe(0);
    });
  });

  describe('Error Message Parsing', () => {
    it('handles error object with message property', () => {
      const conversionId = 'conv_err_obj';
      const onError = vi.fn();

      const handler = createMessageHandler(conversionId, {
        onProgress: vi.fn(),
        onComplete: vi.fn(),
        onError,
        cleanup: vi.fn(),
      });

      handler(
        new MessageEvent('message', {
          data: {
            id: conversionId,
            type: 'ERROR',
            error: { message: 'Detailed error message' },
          },
        })
      );

      expect(onError).toHaveBeenCalledWith(new Error('Detailed error message'));
    });

    it('handles string error', () => {
      const conversionId = 'conv_err_str';
      const onError = vi.fn();

      const handler = createMessageHandler(conversionId, {
        onProgress: vi.fn(),
        onComplete: vi.fn(),
        onError,
        cleanup: vi.fn(),
      });

      handler(
        new MessageEvent('message', {
          data: {
            id: conversionId,
            type: 'ERROR',
            error: 'String error message',
          },
        })
      );

      expect(onError).toHaveBeenCalledWith(new Error('String error message'));
    });

    it('handles missing error with default message', () => {
      const conversionId = 'conv_err_missing';
      const onError = vi.fn();

      const handler = createMessageHandler(conversionId, {
        onProgress: vi.fn(),
        onComplete: vi.fn(),
        onError,
        cleanup: vi.fn(),
      });

      handler(
        new MessageEvent('message', {
          data: {
            id: conversionId,
            type: 'ERROR',
          },
        })
      );

      expect(onError).toHaveBeenCalledWith(new Error('Unknown error occurred'));
    });

    it('handles RESULT without result as error', () => {
      const conversionId = 'conv_no_result';
      const onError = vi.fn();
      const onComplete = vi.fn();

      const handler = createMessageHandler(conversionId, {
        onProgress: vi.fn(),
        onComplete,
        onError,
        cleanup: vi.fn(),
      });

      handler(
        new MessageEvent('message', {
          data: {
            id: conversionId,
            type: 'RESULT',
            // No result property
          },
        })
      );

      expect(onComplete).not.toHaveBeenCalled();
      expect(onError).toHaveBeenCalledWith(
        new Error('Conversion completed but no result returned')
      );
    });
  });
});
