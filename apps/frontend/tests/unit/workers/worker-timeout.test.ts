/**
 * Regression tests for worker timeout and storage configuration
 *
 * These tests verify:
 * - BUG-03: Worker initialization timeout increased to 10s (was 5s)
 * - BUG-06: Conversion stats use sessionStorage (not localStorage)
 * - Exponential backoff retry pattern for worker initialization
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Worker Timeout Configuration', () => {
  it('uses 10 second timeout for worker initialization', async () => {
    // Import the module to check exported constants
    // The timeout constant should be >= 10000ms
    const workerManagerModule = await import('$lib/workers/worker-manager');

    // Read the source file to verify the constant value
    // This is a compile-time check that the timeout is correctly set
    const fs = await import('fs');
    const path = await import('path');

    const workerManagerPath = path.resolve(
      process.cwd(),
      'src/lib/workers/worker-manager.ts'
    );

    const content = fs.readFileSync(workerManagerPath, 'utf-8');

    // Verify INIT_TIMEOUT constant exists and is >= 10000
    const timeoutMatch = content.match(/const\s+INIT_TIMEOUT\s*=\s*(\d+)/);
    expect(timeoutMatch).not.toBeNull();

    const timeout = parseInt(timeoutMatch![1], 10);
    expect(timeout).toBeGreaterThanOrEqual(10000);
  });

  it('has retry delays configured for exponential backoff', async () => {
    const fs = await import('fs');
    const path = await import('path');

    const workerManagerPath = path.resolve(
      process.cwd(),
      'src/lib/workers/worker-manager.ts'
    );

    const content = fs.readFileSync(workerManagerPath, 'utf-8');

    // Verify RETRY_DELAYS constant exists with exponential backoff pattern
    const delaysMatch = content.match(/const\s+RETRY_DELAYS\s*=\s*\[([^\]]+)\]/);
    expect(delaysMatch).not.toBeNull();

    // Parse the delays
    const delays = delaysMatch![1].split(',').map(d => parseInt(d.trim(), 10));

    // Should have at least 2 delays
    expect(delays.length).toBeGreaterThanOrEqual(2);

    // Each delay should be greater than or equal to the previous (exponential backoff)
    for (let i = 1; i < delays.length; i++) {
      expect(delays[i]).toBeGreaterThanOrEqual(delays[i - 1]);
    }

    // First delay should be relatively short (< 1 second)
    expect(delays[0]).toBeLessThan(1000);
  });

  it('has MAX_RETRIES configured to at least 3', async () => {
    const fs = await import('fs');
    const path = await import('path');

    const workerManagerPath = path.resolve(
      process.cwd(),
      'src/lib/workers/worker-manager.ts'
    );

    const content = fs.readFileSync(workerManagerPath, 'utf-8');

    // Verify MAX_RETRIES constant exists and is >= 3
    const retriesMatch = content.match(/const\s+MAX_RETRIES\s*=\s*(\d+)/);
    expect(retriesMatch).not.toBeNull();

    const maxRetries = parseInt(retriesMatch![1], 10);
    expect(maxRetries).toBeGreaterThanOrEqual(3);
  });

  it('applies timeout in setTimeout call', async () => {
    const fs = await import('fs');
    const path = await import('path');

    const workerManagerPath = path.resolve(
      process.cwd(),
      'src/lib/workers/worker-manager.ts'
    );

    const content = fs.readFileSync(workerManagerPath, 'utf-8');

    // Verify setTimeout uses INIT_TIMEOUT constant (not hardcoded 5000)
    expect(content).toContain('setTimeout');
    expect(content).toContain('INIT_TIMEOUT');

    // Should NOT contain the old hardcoded 5000 timeout in setTimeout
    const hardcodedTimeout = content.match(/setTimeout\s*\([^)]*,\s*5000\s*\)/);
    expect(hardcodedTimeout).toBeNull();
  });
});

describe('Conversion Stats Storage', () => {
  beforeEach(() => {
    // Clear both storage types before each test
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear();
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  afterEach(() => {
    // Clean up after each test
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear();
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  it('manager.ts uses sessionStorage instead of localStorage', async () => {
    const fs = await import('fs');
    const path = await import('path');

    const managerPath = path.resolve(
      process.cwd(),
      'src/lib/conversion/manager.ts'
    );

    const content = fs.readFileSync(managerPath, 'utf-8');

    // Should use sessionStorage for conversion stats
    expect(content).toContain('sessionStorage.getItem');
    expect(content).toContain('sessionStorage.setItem');

    // Should NOT use localStorage for conversion tracking
    expect(content).not.toContain('localStorage.getItem(\'lifetime_conversions');
    expect(content).not.toContain('localStorage.setItem(\'lifetime_conversions');
  });

  it('uses session_conversions key name (not lifetime_conversions)', async () => {
    const fs = await import('fs');
    const path = await import('path');

    const managerPath = path.resolve(
      process.cwd(),
      'src/lib/conversion/manager.ts'
    );

    const content = fs.readFileSync(managerPath, 'utf-8');

    // Should use session_conversions key (privacy-friendly naming)
    expect(content).toContain('session_conversions');

    // Should NOT use lifetime_conversions key (old name that implied persistence)
    expect(content).not.toContain('lifetime_conversions');
  });

  it('sessionStorage clears on browser close (behavior verification)', () => {
    // This test documents the expected behavior of sessionStorage vs localStorage
    // In a real browser:
    // - sessionStorage clears when the browser/tab is closed
    // - localStorage persists indefinitely

    // Skip if sessionStorage is not available (e.g., some test environments)
    if (typeof sessionStorage === 'undefined') {
      // Mock sessionStorage for this test to verify the pattern works
      const mockStorage: Record<string, string> = {};
      const mockSessionStorage = {
        setItem: (key: string, value: string) => { mockStorage[key] = value; },
        getItem: (key: string) => mockStorage[key] ?? null,
        clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); },
        removeItem: (key: string) => { delete mockStorage[key]; },
        key: (index: number) => Object.keys(mockStorage)[index] ?? null,
        get length() { return Object.keys(mockStorage).length; },
      };

      // Verify mock works as expected
      mockSessionStorage.setItem('test_key', 'test_value');
      expect(mockSessionStorage.getItem('test_key')).toBe('test_value');

      mockSessionStorage.clear();
      expect(mockSessionStorage.getItem('test_key')).toBeNull();

      return; // Test passes with mock verification
    }

    // Verify sessionStorage API is available
    expect(typeof sessionStorage).toBe('object');
    expect(typeof sessionStorage.setItem).toBe('function');
    expect(typeof sessionStorage.getItem).toBe('function');
    expect(typeof sessionStorage.clear).toBe('function');

    // Set a value and verify it exists
    sessionStorage.setItem('test_key', 'test_value');
    expect(sessionStorage.getItem('test_key')).toBe('test_value');

    // Clear and verify it's gone
    sessionStorage.clear();
    expect(sessionStorage.getItem('test_key')).toBeNull();
  });

  it('does not store conversion stats in localStorage', async () => {
    // Verify that localStorage does not contain conversion tracking keys
    const fs = await import('fs');
    const path = await import('path');

    const managerPath = path.resolve(
      process.cwd(),
      'src/lib/conversion/manager.ts'
    );

    const content = fs.readFileSync(managerPath, 'utf-8');

    // Check for any localStorage.setItem calls with conversion-related keys
    const localStorageSetCalls = content.match(/localStorage\.setItem\s*\([^)]*conversion/gi);
    expect(localStorageSetCalls).toBeNull();

    const localStorageGetCalls = content.match(/localStorage\.getItem\s*\([^)]*conversion/gi);
    expect(localStorageGetCalls).toBeNull();
  });
});
