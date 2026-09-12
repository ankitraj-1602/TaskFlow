import apiClient from './client';

export const authApi = {
  register: (data) => {
    return apiClient.post('/auth/register', data).then(res => res.data.data);
  },

  login: (data) => {
    return apiClient.post('/auth/login', data).then(res => res.data.data);
  },

  refreshToken: (refreshToken) => {
    return apiClient.post('/auth/refresh-token', { refreshToken }).then(res => res.data.data);
  },

  logout: () => {
    return apiClient.post('/auth/logout');
  },

  logoutAll: () => {
    return apiClient.post('/auth/logout-all');
  },

  getProfile: () => {
    return apiClient.get('/auth/profile').then(res => res.data.data);
  },

  updateProfile: (data) => {
    return apiClient.patch('/auth/profile', data).then(res => res.data.data);
  },

  changePassword: (data) => {
    return apiClient.patch('/auth/change-password', data);
  },

  forgotPassword: (email) => {
    return apiClient.post('/auth/forgot-password', { email });
  },

  resetPassword: (data) => {
    return apiClient.post('/auth/reset-password', data);
  },

  verifyEmail: (token) => {
  return apiClient.post('/auth/verify-email', { token });
},

sendVerificationEmail: () => {
  return apiClient.post('/auth/send-verification');
},
deleteAccount: (password) => {
  return apiClient.delete('/auth/account', { data: { password } });
},
};
