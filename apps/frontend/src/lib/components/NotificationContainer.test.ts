import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { get } from 'svelte/store';
import { notifications } from '$lib/stores/notifications';

describe('NotificationContainer (store integration)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    notifications.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('notifications store starts empty', () => {
    expect(get(notifications)).toHaveLength(0);
  });

  it('can add notifications that would appear in container', () => {
    notifications.show('First message', 'info');
    notifications.show('Second message', 'error');
    const items = get(notifications);
    expect(items).toHaveLength(2);
    expect(items[0].message).toBe('First message');
    expect(items[0].type).toBe('info');
    expect(items[1].message).toBe('Second message');
    expect(items[1].type).toBe('error');
  });

  it('dismiss removes a notification by id', () => {
    const id1 = notifications.show('Stay');
    const id2 = notifications.show('Remove');
    notifications.dismiss(id2);
    const items = get(notifications);
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe(id1);
  });

  it('clear removes all notifications', () => {
    notifications.show('A');
    notifications.show('B');
    notifications.show('C');
    notifications.clear();
    expect(get(notifications)).toHaveLength(0);
  });

  it('notifications have correct structure for container rendering', () => {
    notifications.show('Test', 'warning', 'Detail text', true, 3000);
    const n = get(notifications)[0];
    expect(n).toHaveProperty('id');
    expect(n).toHaveProperty('type', 'warning');
    expect(n).toHaveProperty('message', 'Test');
    expect(n).toHaveProperty('detail', 'Detail text');
    expect(n).toHaveProperty('autoClose', true);
    expect(n).toHaveProperty('duration', 3000);
    expect(n).toHaveProperty('timestamp');
  });

  it('each notification gets a unique id for keyed each block', () => {
    const ids = [
      notifications.show('A'),
      notifications.show('B'),
      notifications.show('C')
    ];
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(3);
  });

  it('auto-close notifications are removed after their duration', () => {
    notifications.show('Fast', 'info', undefined, true, 2000);
    notifications.show('Slow', 'info', undefined, true, 5000);
    expect(get(notifications)).toHaveLength(2);

    vi.advanceTimersByTime(2000);
    expect(get(notifications)).toHaveLength(1);
    expect(get(notifications)[0].message).toBe('Slow');

    vi.advanceTimersByTime(3000);
    expect(get(notifications)).toHaveLength(0);
  });

  it('non-autoClose notifications persist indefinitely', () => {
    notifications.error('Persistent error');
    vi.advanceTimersByTime(60000);
    expect(get(notifications)).toHaveLength(1);
  });
});
