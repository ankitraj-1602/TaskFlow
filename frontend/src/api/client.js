// import axios from 'axios';
// import toast from 'react-hot-toast';

// const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// // Normalize base URL — ensure it ends with /api exactly once
// const getApiBase = () => {
//   const base = API_URL.replace(/\/+$/, ''); // strip trailing slashes
//   return base.endsWith('/api') ? base : `${base}/api`;
// };

// const API_BASE = getApiBase();

// console.log('🔗 API base:', API_BASE);

// const apiClient = axios.create({
//   baseURL: API_BASE,
//   timeout: 30000,
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// // ─── Request interceptor: attach access token ─────
// apiClient.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem('accessToken');
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// // ─── Refresh queue: prevent concurrent refreshes ─
// let isRefreshing = false;
// let failedQueue = [];

// const processQueue = (error, token = null) => {
//   failedQueue.forEach((prom) => {
//     if (error) prom.reject(error);
//     else prom.resolve(token);
//   });
//   failedQueue = [];
// };

// const clearAuthAndRedirect = () => {
//   localStorage.removeItem('accessToken');
//   localStorage.removeItem('refreshToken');
//   localStorage.removeItem('user');
//   if (
//     window.location.pathname !== '/login' &&
//     window.location.pathname !== '/register'
//   ) {
//     window.location.href = '/login';
//   }
// };

// // ─── Response interceptor: refresh on 401 ────────
// apiClient.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config;

//     // Don't retry auth endpoints (prevents infinite loops)
//     const isAuthEndpoint =
//       originalRequest?.url?.includes('/auth/refresh-token') ||
//       originalRequest?.url?.includes('/auth/login') ||
//       originalRequest?.url?.includes('/auth/register');

//     if (
//       error.response?.status === 401 &&
//       !originalRequest._retry &&
//       !isAuthEndpoint
//     ) {
//       // If already refreshing → queue this request
//       if (isRefreshing) {
//         return new Promise((resolve, reject) => {
//           failedQueue.push({ resolve, reject });
//         })
//           .then((token) => {
//             originalRequest.headers.Authorization = `Bearer ${token}`;
//             return apiClient(originalRequest);
//           })
//           .catch((err) => Promise.reject(err));
//       }

//       originalRequest._retry = true;
//       isRefreshing = true;

//       const refreshToken = localStorage.getItem('refreshToken');

//       if (!refreshToken) {
//         isRefreshing = false;
//         clearAuthAndRedirect();
//         return Promise.reject(error);
//       }

//       try {
//         console.log('🔄 Access token expired — refreshing...');

//         // ⬇️ FIX: use API_BASE + /auth/refresh-token
//         // API_BASE already includes /api, so no double prefix
//         const response = await axios.post(
//           `${API_BASE}/auth/refresh-token`,
//           { refreshToken }
//         );

//         // Handle multiple possible response shapes
//         const payload = response.data?.data || response.data;
//         const tokens = payload?.tokens || payload;

//         const newAccessToken = tokens.accessToken || tokens.access_token;
//         const newRefreshToken = tokens.refreshToken || tokens.refresh_token;

//         if (!newAccessToken) {
//           throw new Error('Refresh response missing accessToken');
//         }

//         console.log('✅ Token refreshed');

//         localStorage.setItem('accessToken', newAccessToken);
//         if (newRefreshToken) {
//           localStorage.setItem('refreshToken', newRefreshToken);
//         }

//         // Retry all queued requests with new token
//         processQueue(null, newAccessToken);
//         isRefreshing = false;

//         originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
//         return apiClient(originalRequest);
//       } catch (refreshError) {
//         console.error('❌ Refresh failed:', refreshError);
//         processQueue(refreshError, null);
//         isRefreshing = false;
//         clearAuthAndRedirect();
//         return Promise.reject(refreshError);
//       }
//     }

//     // Show error message (skip noise)
//     const silentPaths = [
//       '/auth/refresh-token',
//       '/auth/verify-email',
//       '/auth/forgot-password',
//       '/auth/reset-password',
//       '/auth/login',
//       '/auth/register',
//       '/notifications/unread-count',
//     ];
//     const isSilent = silentPaths.some((p) => originalRequest?.url?.includes(p));

//     if (!isSilent && error.response?.status !== 401) {
//       if (error.response?.data?.message) {
//         toast.error(error.response.data.message);
//       } else if (error.message && error.code !== 'ERR_CANCELED') {
//         toast.error(error.message);
//       }
//     }

//     return Promise.reject(error);
//   }
// );

// export default apiClient;


import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Normalize base URL — ensure it ends with /api exactly once
const getApiBase = () => {
  const base = API_URL.replace(/\/+$/, ''); // strip trailing slashes
  return base.endsWith('/api') ? base : `${base}/api`;
};

const API_BASE = getApiBase();

console.log('🔗 API base:', API_BASE);

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request interceptor: attach access token ─────
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Refresh queue: prevent concurrent refreshes ─
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

const clearAuthAndRedirect = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  if (
    window.location.pathname !== '/login' &&
    window.location.pathname !== '/register'
  ) {
    window.location.href = '/login';
  }
};

// ─── Response interceptor: refresh on 401 + track correlation ID ─────
apiClient.interceptors.response.use(
  (response) => {
    // ⬇️ NEW: capture correlation ID from successful responses
    const correlationId = response.headers['x-correlation-id'];
    if (correlationId) {
      response.correlationId = correlationId;
      // Keep the last one for error reporting
      window.__lastCorrelationId = correlationId;
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // ⬇️ NEW: capture correlation ID from failed responses too
    const correlationId =
      error.response?.headers['x-correlation-id'] ||
      error.response?.data?.correlationId;

    if (correlationId) {
      error.correlationId = correlationId;
      window.__lastCorrelationId = correlationId;
      // Attach to the response body so toasts/UI can read it
      if (error.response?.data) {
        error.response.data.correlationId = correlationId;
      }
    }

    // Don't retry auth endpoints (prevents infinite loops)
    const isAuthEndpoint =
      originalRequest?.url?.includes('/auth/refresh-token') ||
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/register');

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      // If already refreshing → queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');

      if (!refreshToken) {
        isRefreshing = false;
        clearAuthAndRedirect();
        return Promise.reject(error);
      }

      try {
        console.log('🔄 Access token expired — refreshing...');

        // Use a bare axios call (no interceptor) for refresh
        const response = await axios.post(
          `${API_BASE}/auth/refresh-token`,
          { refreshToken }
        );

        // Handle multiple possible response shapes
        const payload = response.data?.data || response.data;
        const tokens = payload?.tokens || payload;

        const newAccessToken = tokens.accessToken || tokens.access_token;
        const newRefreshToken = tokens.refreshToken || tokens.refresh_token;

        if (!newAccessToken) {
          throw new Error('Refresh response missing accessToken');
        }

        console.log('✅ Token refreshed');

        localStorage.setItem('accessToken', newAccessToken);
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }

        // Retry all queued requests with new token
        processQueue(null, newAccessToken);
        isRefreshing = false;

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        console.error('❌ Refresh failed:', refreshError);
        processQueue(refreshError, null);
        isRefreshing = false;
        clearAuthAndRedirect();
        return Promise.reject(refreshError);
      }
    }

    // Show error message (skip noise)
    const silentPaths = [
      '/auth/refresh-token',
      '/auth/verify-email',
      '/auth/forgot-password',
      '/auth/reset-password',
      '/auth/login',
      '/auth/register',
      '/notifications/unread-count',
    ];
    const isSilent = silentPaths.some((p) => originalRequest?.url?.includes(p));

    if (!isSilent && error.response?.status !== 401) {
      const message =
        error.response?.data?.message ||
        (error.message && error.code !== 'ERR_CANCELED' ? error.message : null);

      if (message) {
        // ⬇️ NEW: append correlation ID to error toast for support
        // Users can report this ID and we can grep logs for it
        if (correlationId) {
          toast.error(`${message}\n\nReference: ${correlationId}`, {
            duration: 6000,
          });
        } else {
          toast.error(message);
        }
      }
    }

    return Promise.reject(error);
  }
);

// ⬇️ NEW: helper to expose the last correlation ID for error boundaries / support
export const getLastCorrelationId = () => window.__lastCorrelationId;

export default apiClient;