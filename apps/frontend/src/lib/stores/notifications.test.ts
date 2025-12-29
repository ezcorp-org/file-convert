import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { get } from 'svelte/store';
import { notifications } from './notifications';

describe('Notification Store', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    notifications.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('show()', () => {
    it('should add a notification with default parameters', () => {
      notifications.show('Test message');
      const items = get(notifications);
      expect(items).toHaveLength(1);
      expect(items[0].message).toBe('Test message');
      expect(items[0].type).toBe('info');
      expect(items[0].autoClose).toBe(true);
      expect(items[0].duration).toBe(5000);
    });

    it('should return the notification id', () => {
      const id = notifications.show('Test');
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('should add multiple notifications', () => {
      notifications.show('First');
      notifications.show('Second');
      notifications.show('Third');
      expect(get(notifications)).toHaveLength(3);
    });

    it('should set custom type, detail, autoClose, and duration', () => {
      notifications.show('Msg', 'error', 'Details here', false, 10000);
      const n = get(notifications)[0];
      expect(n.type).toBe('error');
      expect(n.detail).toBe('Details here');
      expect(n.autoClose).toBe(false);
      expect(n.duration).toBe(10000);
    });

    it('should generate unique ids for each notification', () => {
      const id1 = notifications.show('A');
      const id2 = notifications.show('B');
      expect(id1).not.toBe(id2);
    });
  });

  describe('success()', () => {
    it('should add a success notification with autoClose', () => {
      notifications.success('Done!', 'All good');
      const n = get(notifications)[0];
      expect(n.type).toBe('success');
      expect(n.message).toBe('Done!');
      expect(n.detail).toBe('All good');
      expect(n.autoClose).toBe(true);
      expect(n.duration).toBe(5000);
    });
  });

  describe('error()', () => {
    it('should add an error notification without autoClose', () => {
      notifications.error('Failed', 'Something broke');
      const n = get(notifications)[0];
      expect(n.type).toBe('error');
      expect(n.message).toBe('Failed');
      expect(n.detail).toBe('Something broke');
      expect(n.autoClose).toBe(false);
    });

    it('should not auto-dismiss error notifications', () => {
      notifications.error('Persistent error');
      vi.advanceTimersByTime(60000);
      expect(get(notifications)).toHaveLength(1);
    });
  });

  describe('warning()', () => {
    it('should add a warning notification with 7s duration', () => {
      notifications.warning('Watch out');
      const n = get(notifications)[0];
      expect(n.type).toBe('warning');
      expect(n.autoClose).toBe(true);
      expect(n.duration).toBe(7000);
    });
  });

  describe('info()', () => {
    it('should add an info notification with 5s duration', () => {
      notifications.info('FYI', 'Some detail');
      const n = get(notifications)[0];
      expect(n.type).toBe('info');
      expect(n.message).toBe('FYI');
      expect(n.detail).toBe('Some detail');
      expect(n.autoClose).toBe(true);
      expect(n.duration).toBe(5000);
    });
  });

  describe('dismiss()', () => {
    it('should remove a notification by id', () => {
      const id = notifications.show('To remove');
      notifications.show('To keep');
      notifications.dismiss(id);
      const items = get(notifications);
      expect(items).toHaveLength(1);
      expect(items[0].message).toBe('To keep');
    });

    it('should handle dismissing a non-existent id gracefully', () => {
      notifications.show('Exists');
      notifications.dismiss('non-existent-id');
      expect(get(notifications)).toHaveLength(1);
    });

    it('should handle dismissing from an empty store', () => {
      notifications.dismiss('any-id');
      expect(get(notifications)).toHaveLength(0);
    });

    it('should not affect other notifications when dismissing', () => {
      const id1 = notifications.show('First');
      const id2 = notifications.show('Second');
      const id3 = notifications.show('Third');
      notifications.dismiss(id2);
      const items = get(notifications);
      expect(items).toHaveLength(2);
      expect(items[0].id).toBe(id1);
      expect(items[1].id).toBe(id3);
    });
  });

  describe('clear()', () => {
    it('should remove all notifications', () => {
      notifications.show('A');
      notifications.show('B');
      notifications.show('C');
      notifications.clear();
      expect(get(notifications)).toHaveLength(0);
    });

    it('should handle clearing an already empty store', () => {
      notifications.clear();
      expect(get(notifications)).toHaveLength(0);
    });
  });

  describe('auto-dismiss', () => {
    it('should auto-dismiss after default duration (5000ms)', () => {
      notifications.show('Auto dismiss');
      expect(get(notifications)).toHaveLength(1);
      vi.advanceTimersByTime(5000);
      expect(get(notifications)).toHaveLength(0);
    });

    it('should auto-dismiss warning after 7000ms', () => {
      notifications.warning('Warn');
      vi.advanceTimersByTime(6999);
      expect(get(notifications)).toHaveLength(1);
      vi.advanceTimersByTime(1);
      expect(get(notifications)).toHaveLength(0);
    });

    it('should auto-dismiss with custom duration', () => {
      notifications.show('Custom', 'info', undefined, true, 3000);
      vi.advanceTimersByTime(2999);
      expect(get(notifications)).toHaveLength(1);
      vi.advanceTimersByTime(1);
      expect(get(notifications)).toHaveLength(0);
    });

    it('should not auto-dismiss when autoClose is false', () => {
      notifications.show('Stay', 'info', undefined, false);
      vi.advanceTimersByTime(60000);
      expect(get(notifications)).toHaveLength(1);
    });

    it('should auto-dismiss each notification independently', () => {
      notifications.show('First', 'info', undefined, true, 2000);
      notifications.show('Second', 'info', undefined, true, 4000);
      vi.advanceTimersByTime(2000);
      expect(get(notifications)).toHaveLength(1);
      expect(get(notifications)[0].message).toBe('Second');
      vi.advanceTimersByTime(2000);
      expect(get(notifications)).toHaveLength(0);
    });
  });

  describe('store reactivity', () => {
    it('should notify subscribers on add', () => {
      const values: number[] = [];
      const unsub = notifications.subscribe(items => values.push(items.length));
      notifications.show('Test');
      expect(values).toEqual([0, 1]);
      unsub();
    });

    it('should notify subscribers on dismiss', () => {
      const values: number[] = [];
      const id = notifications.show('Test');
      const unsub = notifications.subscribe(items => values.push(items.length));
      notifications.dismiss(id);
      expect(values).toEqual([1, 0]);
      unsub();
    });

    it('should notify subscribers on clear', () => {
      notifications.show('A');
      notifications.show('B');
      const values: number[] = [];
      const unsub = notifications.subscribe(items => values.push(items.length));
      notifications.clear();
      expect(values).toEqual([2, 0]);
      unsub();
    });
  });
});
