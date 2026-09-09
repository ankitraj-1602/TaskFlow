import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '../api/auth.api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      accessToken: null,
      refreshToken: null,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const response = await authApi.login({ email, password });
          const { user, tokens } = response;

          localStorage.setItem('accessToken', tokens.accessToken);
          localStorage.setItem('refreshToken', tokens.refreshToken);
          localStorage.setItem('user', JSON.stringify(user));

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          const response = await authApi.register(data);
          const { user, tokens } = response;

          localStorage.setItem('accessToken', tokens.accessToken);
          localStorage.setItem('refreshToken', tokens.refreshToken);
          localStorage.setItem('user', JSON.stringify(user));

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await authApi.logout();
        } catch (error) {
          // Ignore logout errors
        } finally {
          get().clearAuth();
        }
      },

      logoutAll: async () => {
        try {
          await authApi.logoutAll();
        } catch (error) {
          // Ignore logout errors
        } finally {
          get().clearAuth();
        }
      },

      loadUser: async () => {
        const { isAuthenticated, accessToken } = get();
        
        if (!isAuthenticated || !accessToken) {
          return;
        }

        set({ isLoading: true });
        try {
          const user = await authApi.getProfile();
          localStorage.setItem('user', JSON.stringify(user));
          set({ user, isLoading: false });
        } catch (error) {
          set({ isLoading: false, isAuthenticated: false });
          throw error;
        }
      },

      updateUser: async (data) => {
        set({ isLoading: true });
        try {
          const updatedUser = await authApi.updateProfile(data);
          localStorage.setItem('user', JSON.stringify(updatedUser));
          set({ user: updatedUser, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      clearAuth: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          accessToken: null,
          refreshToken: null,
        });
      },

      setTokens: (accessToken, refreshToken) => {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        set({ accessToken, refreshToken });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);