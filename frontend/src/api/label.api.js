import apiClient from './client';

export const labelApi = {
  // ─── Project labels ─────────────────────────────
  getByProject: (projectId) => {
    return apiClient
      .get(`/projects/${projectId}/labels`)
      .then((res) => res.data.data);
  },

  create: (projectId, data) => {
    return apiClient
      .post(`/projects/${projectId}/labels`, data)
      .then((res) => res.data.data);
  },

  update: (labelId, data) => {
    return apiClient
      .patch(`/labels/${labelId}`, data)
      .then((res) => res.data.data);
  },

  delete: (labelId) => {
    return apiClient
      .delete(`/labels/${labelId}`)
      .then((res) => res.data.data);
  },

  // ─── Task-label attach/detach ───────────────────
  attachToTask: (taskId, labelId) => {
    return apiClient
      .post(`/tasks/${taskId}/labels/${labelId}`)
      .then((res) => res.data.data);
  },

  detachFromTask: (taskId, labelId) => {
    return apiClient
      .delete(`/tasks/${taskId}/labels/${labelId}`)
      .then((res) => res.data.data);
  },
};