import { create } from 'zustand';
import toast from 'react-hot-toast';
import { notificationApi } from '../api/notification.api';

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

  // ─── Socket-driven ─────────────────────────────────
  addFromSocket: (notification) => {
    // Idempotent — skip duplicates
    const exists = get().notifications.find((n) => n.id === notification.id);
    if (exists) return;

    // Show toast
    toast.success(notification.content, {
      icon: '🔔',
      duration: 5000,
    });

    // Update state
    set((state) => ({
      notifications: [notification, ...state.notifications].slice(0, 30),
      unreadCount: state.unreadCount + 1,
    }));
  },

  // ─── Polling (optional fallback) ──────────────────
  startPolling: (intervalMs = 300000) => {
    const existing = get().pollingInterval;
    if (existing) clearInterval(existing);

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
}));