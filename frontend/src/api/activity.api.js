import apiClient from './client';

export const activityApi = {
  getByTask: (taskId, options = {}) => {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit);
    if (options.page) params.append('page', options.page);
    if (options.action) params.append('action', options.action);

    const qs = params.toString();
    return apiClient
      .get(`/tasks/${taskId}/activities${qs ? `?${qs}` : ''}`)
      .then((res) => res.data.data);
  },

  getByProject: (projectId, options = {}) => {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit);
    if (options.page) params.append('page', options.page);
    if (options.action) params.append('action', options.action);
    if (options.userId) params.append('userId', options.userId);

    const qs = params.toString();
    return apiClient
      .get(`/projects/${projectId}/activities${qs ? `?${qs}` : ''}`)
      .then((res) => res.data.data);
  },

  getByWorkspace: (workspaceId, options = {}) => {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit);
    if (options.page) params.append('page', options.page);
    if (options.action) params.append('action', options.action);
    if (options.userId) params.append('userId', options.userId);

    const qs = params.toString();
    return apiClient
      .get(`/workspaces/${workspaceId}/activities${qs ? `?${qs}` : ''}`)
      .then((res) => res.data.data);
  },
};