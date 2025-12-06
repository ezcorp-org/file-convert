import { writable } from 'svelte/store';

export interface Notification {
  id: string;
  type: 'error' | 'warning' | 'success' | 'info' | 'upgrade';
  message: string;
  detail?: string;
  autoClose?: boolean;
  duration?: number;
  timestamp: number;
}

function createNotificationStore() {
  const { subscribe, update } = writable<Notification[]>([]);

  return {
    subscribe,
    
    show(
      message: string,
      type: 'error' | 'warning' | 'success' | 'info' | 'upgrade' = 'info',
      detail?: string,
      autoClose: boolean = true,
      duration: number = 5000
    ) {
      const notification: Notification = {
        id: `${Date.now()}-${Math.random()}`,
        type,
        message,
        detail,
        autoClose,
        duration,
        timestamp: Date.now()
      };

      update(notifications => [...notifications, notification]);

      if (autoClose) {
        setTimeout(() => {
          this.dismiss(notification.id);
        }, duration);
      }

      return notification.id;
    },

    success(message: string, detail?: string) {
      return this.show(message, 'success', detail, true, 5000);
    },

    error(message: string, detail?: string) {
      return this.show(message, 'error', detail, false);
    },

    warning(message: string, detail?: string) {
      return this.show(message, 'warning', detail, true, 7000);
    },

    info(message: string, detail?: string) {
      return this.show(message, 'info', detail, true, 5000);
    },

    dismiss(id: string) {
      update(notifications => 
        notifications.filter(n => n.id !== id)
      );
    },

    clear() {
      update(() => []);
    }
  };
}

export const notifications = createNotificationStore();