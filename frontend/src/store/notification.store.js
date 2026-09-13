import { create } from 'zustand';
import { notificationApi } from '../api/notification.api';
import toast from 'react-hot-toast';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  pollingInterval: null,

  loadNotifications: async (filters = {}) => {
    set({ isLoading: true });
    try {
      const notifications = await notificationApi.getAll({
        limit: 30,
        ...filters,
      });
      set({ notifications, isLoading: false });
      return notifications;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  loadUnreadCount: async () => {
    try {
      const count = await notificationApi.getUnreadCount();
      set({ unreadCount: count });
      return count;
    } catch (error) {
      // Silent fail — unread count is non-critical
      return 0;
    }
  },

  markAsRead: async (id) => {
    try {
      await notificationApi.markAsRead(id);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error) {
      throw error;
    }
  },

  markAllAsRead: async () => {
    try {
      await notificationApi.markAllAsRead();
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    } catch (error) {
      throw error;
    }
  },

  deleteNotification: async (id) => {
    try {
      const target = get().notifications.find((n) => n.id === id);
      await notificationApi.delete(id);

      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
        unreadCount:
          target && !target.isRead
            ? Math.max(0, state.unreadCount - 1)
            : state.unreadCount,
      }));
    } catch (error) {
      throw error;
    }
  },

  clearAll: async () => {
    try {
      await notificationApi.clearAll();
      set({ notifications: [], unreadCount: 0 });
    } catch (error) {
      throw error;
    }
  },

  /**
   * Start polling for unread count every N seconds.
   * Cleanup-friendly: calling twice won't create duplicate intervals.
   */
  startPolling: (intervalMs = 30000) => {
    const existing = get().pollingInterval;
    if (existing) clearInterval(existing);

    // Immediate first call
    get().loadUnreadCount();

    const id = setInterval(() => {
      get().loadUnreadCount();
    }, intervalMs);

    set({ pollingInterval: id });
  },

  stopPolling: () => {
    const id = get().pollingInterval;
    if (id) clearInterval(id);
    set({ pollingInterval: null });
  },
  addFromSocket: (notification) => {
  set((state) => {
    // Avoid dupe
    if (state.notifications.find((n) => n.id === notification.id)) return state;

    // Show toast
    toast.success(notification.content, { icon: '🔔' });

    return {
      notifications: [notification, ...state.notifications].slice(0, 30),
      unreadCount: state.unreadCount + 1,
    };
  });
},
}));