import apiClient from './client';

export const dashboardApi = {
  getStats: (workspaceId) => {
    return apiClient
      .get(`/workspaces/${workspaceId}/dashboard`)
      .then((res) => res.data.data);
  },

  getTrends: (workspaceId, days = 30) => {
    return apiClient
      .get(`/workspaces/${workspaceId}/dashboard/trends?days=${days}`)
      .then((res) => res.data.data);
  },

  getTeamProductivity: (workspaceId) => {
    return apiClient
      .get(`/workspaces/${workspaceId}/dashboard/team`)
      .then((res) => res.data.data);
  },

  getProjectProgress: (workspaceId) => {
    return apiClient
      .get(`/workspaces/${workspaceId}/dashboard/projects`)
      .then((res) => res.data.data);
  },

  getOverdueBreakdown: (workspaceId) => {
    return apiClient
      .get(`/workspaces/${workspaceId}/dashboard/overdue`)
      .then((res) => res.data.data);
  },
};