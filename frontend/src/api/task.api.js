import apiClient from './client';

export const taskApi = {
  create: (projectId, data) => {
    return apiClient.post(`/projects/${projectId}/tasks`, data).then(res => res.data.data);
  },

  getByProject: (projectId, filters = {}) => {
    const params = new URLSearchParams();
    
    if (filters.status) params.append('status', Array.isArray(filters.status) ? filters.status.join(',') : filters.status);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.assigneeId) params.append('assigneeId', filters.assigneeId);
    if (filters.search) params.append('search', filters.search);
    if (filters.isArchived !== undefined) params.append('isArchived', filters.isArchived);
    if (filters.dueBefore) params.append('dueBefore', filters.dueBefore);
    if (filters.dueAfter) params.append('dueAfter', filters.dueAfter);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);

    const query = params.toString();
    return apiClient
      .get(`/projects/${projectId}/tasks${query ? `?${query}` : ''}`)
      .then(res => res.data);
  },

  getById: (id) => {
    return apiClient.get(`/tasks/${id}`).then(res => res.data.data);
  },

  update: (id, data) => {
    return apiClient.patch(`/tasks/${id}`, data).then(res => res.data.data);
  },

  updateStatus: (id, data) => {
    return apiClient.patch(`/tasks/${id}/status`, data).then(res => res.data.data);
  },

  reorder: (projectId, data) => {
    return apiClient.post(`/projects/${projectId}/tasks/reorder`, data).then(res => res.data.data);
  },

  delete: (id) => {
    return apiClient.delete(`/tasks/${id}`).then(res => res.data.data);
  },

  archive: (id) => {
    return apiClient.patch(`/tasks/${id}/archive`).then(res => res.data.data);
  },

  unarchive: (id) => {
    return apiClient.patch(`/tasks/${id}/unarchive`).then(res => res.data.data);
  },

  duplicate: (id) => {
    return apiClient.post(`/tasks/${id}/duplicate`).then(res => res.data.data);
  },

  getStats: (projectId) => {
    return apiClient.get(`/projects/${projectId}/tasks/stats`).then(res => res.data.data);
  },

  getMyTasks: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.projectId) params.append('projectId', filters.projectId);
    
    const query = params.toString();
    return apiClient
      .get(`/my-tasks${query ? `?${query}` : ''}`)
      .then(res => res.data.data);
  },
};