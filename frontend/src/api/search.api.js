import apiClient from './client';

export const searchApi = {
  search: (query, { workspaceId, limit } = {}) => {
    const params = new URLSearchParams();
    params.append('q', query);
    if (workspaceId) params.append('workspaceId', workspaceId);
    if (limit) params.append('limit', limit);

    return apiClient
      .get(`/search?${params.toString()}`)
      .then((res) => res.data.data);
  },
};