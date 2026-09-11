import apiClient from './client';

export const invitationApi = {
  getDetails: (token) => {
    return apiClient.get(`/invitations/${token}`).then(res => res.data.data);
  },

  accept: (token) => {
    return apiClient.post(`/invitations/${token}/accept`).then(res => res.data.data);
  },
};