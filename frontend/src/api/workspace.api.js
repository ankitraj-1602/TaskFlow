import apiClient from './client';

export const workspaceApi = {
  create: (data) => {
    return apiClient.post('/workspaces', data).then(res => res.data.data);
  },

  getAll: () => {
    return apiClient.get('/workspaces').then(res => res.data.data);
  },

  getById: (id) => {
    return apiClient.get(`/workspaces/${id}`).then(res => res.data.data);
  },

  update: (id, data) => {
    return apiClient.patch(`/workspaces/${id}`, data).then(res => res.data.data);
  },

  delete: (id) => {
    return apiClient.delete(`/workspaces/${id}`).then(res => res.data.data);
  },

  addMember: (workspaceId, data) => {
    return apiClient.post(`/workspaces/${workspaceId}/members`, data).then(res => res.data.data);
  },

  getMembers: (workspaceId) => {
    return apiClient.get(`/workspaces/${workspaceId}/members`).then(res => res.data.data);
  },

  removeMember: (workspaceId, memberId) => {
    return apiClient.delete(`/workspaces/${workspaceId}/members/${memberId}`).then(res => res.data.data);
  },

  updateMemberRole: (workspaceId, memberId, role) => {
    return apiClient.patch(`/workspaces/${workspaceId}/members/${memberId}/role`, { role }).then(res => res.data.data);
  },

  getPendingInvitations: (workspaceId) => {
  return apiClient.get(`/workspaces/${workspaceId}/invitations`).then(res => res.data.data);
},

cancelInvitation: (workspaceId, invitationId) => {
  return apiClient.delete(`/workspaces/${workspaceId}/invitations/${invitationId}`).then(res => res.data.data);
},
};