import apiClient from './client';

export const attachmentApi = {
  getByTask: (taskId) => {
    return apiClient
      .get(`/tasks/${taskId}/attachments`)
      .then((res) => res.data.data);
  },

  upload: (taskId, file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    return apiClient
      .post(`/tasks/${taskId}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (event) => {
          if (onProgress && event.total) {
            const percent = Math.round((event.loaded * 100) / event.total);
            onProgress(percent);
          }
        },
      })
      .then((res) => res.data.data);
  },

  delete: (id) => {
    return apiClient.delete(`/attachments/${id}`).then((res) => res.data.data);
  },

  /**
   * Get the full URL for a file (uses backend base URL).
   */
  getFileUrl: (fileUrl) => {
    const base = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    // strip /api if present
    const cleanBase = base.replace(/\/api\/?$/, '');
    return `${cleanBase}${fileUrl}`;
  },
};