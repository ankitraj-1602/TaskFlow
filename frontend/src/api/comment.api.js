import apiClient from './client';

export const commentApi = {
  getByTask: (taskId) => {
    return apiClient.get(`/tasks/${taskId}/comments`).then((res) => res.data.data);
  },

  create: (taskId, data) => {
    return apiClient
      .post(`/tasks/${taskId}/comments`, data)
      .then((res) => res.data.data);
  },

  update: (commentId, content) => {
    return apiClient
      .patch(`/comments/${commentId}`, { content })
      .then((res) => res.data.data);
  },

  delete: (commentId) => {
    return apiClient.delete(`/comments/${commentId}`).then((res) => res.data.data);
  },
};