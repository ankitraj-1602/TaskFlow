import apiClient from './client';

export const notificationApi = {
  getAll: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.unreadOnly !== undefined) params.append('unreadOnly', filters.unreadOnly);
    if (filters.type) params.append('type', filters.type);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.page) params.append('page', filters.page);

    const qs = params.toString();
    return apiClient
      .get(`/notifications${qs ? `?${qs}` : ''}`)
      .then((res) => res.data.data);
  },

  getUnreadCount: () => {
    return apiClient
      .get('/notifications/unread-count')
      .then((res) => res.data.data.count);
  },

  markAsRead: (id) => {
    return apiClient
      .patch(`/notifications/${id}/read`)
      .then((res) => res.data.data);
  },

  markAllAsRead: () => {
    return apiClient
      .patch('/notifications/mark-all-read')
      .then((res) => res.data.data);
  },

  delete: (id) => {
    return apiClient.delete(`/notifications/${id}`).then((res) => res.data.data);
  },

  clearAll: () => {
    return apiClient.delete('/notifications').then((res) => res.data.data);
  },
};