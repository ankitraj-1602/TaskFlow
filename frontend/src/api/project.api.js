import apiClient from './client';

export const projectApi = {
  create: (workspaceId, data) => {
    return apiClient.post(`/workspaces/${workspaceId}/projects`, data).then(res => res.data.data);
  },

  getByWorkspace: (workspaceId, filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.isArchived !== undefined) params.append('isArchived', filters.isArchived);
    if (filters.search) params.append('search', filters.search);
    
    const query = params.toString();
    return apiClient
      .get(`/workspaces/${workspaceId}/projects${query ? `?${query}` : ''}`)
      .then(res => res.data.data);
  },

  getById: (id) => {
    return apiClient.get(`/projects/${id}`).then(res => res.data.data);
  },

  update: (id, data) => {
    return apiClient.patch(`/projects/${id}`, data).then(res => res.data.data);
  },

  delete: (id) => {
    return apiClient.delete(`/projects/${id}`).then(res => res.data.data);
  },

  archive: (id) => {
    return apiClient.patch(`/projects/${id}/archive`).then(res => res.data.data);
  },

  unarchive: (id) => {
    return apiClient.patch(`/projects/${id}/unarchive`).then(res => res.data.data);
  },

  getMembers: (id) => {
    return apiClient.get(`/projects/${id}/members`).then(res => res.data.data);
  },

  addMember: (id, data) => {
    return apiClient.post(`/projects/${id}/members`, data).then(res => res.data.data);
  },

  removeMember: (id, memberId) => {
    return apiClient.delete(`/projects/${id}/members/${memberId}`).then(res => res.data.data);
  },
};