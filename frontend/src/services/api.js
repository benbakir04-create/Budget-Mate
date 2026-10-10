import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  withCredentials: true,
});

// The access token lives in memory only (never in localStorage, so XSS cannot read it).
// The long-lived refresh token is an httpOnly cookie set by the server.
let accessToken = null;

export const setAccessToken = token => {
  accessToken = token;
};

// Tokens from older versions of the app were kept in localStorage; drop them.
localStorage.removeItem('token');
localStorage.removeItem('user');

api.interceptors.request.use(
  config => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// One refresh request shared by every call that fails with 401 at the same time.
let refreshPromise = null;

export const refreshAccessToken = () => {
  if (!refreshPromise) {
    refreshPromise = api
      .post('/auth/refresh')
      .then(response => {
        const { token, user } = response.data.data;
        setAccessToken(token);
        return { token, user };
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

api.interceptors.response.use(
  response => response,
  async error => {
    const original = error.config;
    const isAuthCall = original?.url?.startsWith('/auth/');

    if (error.response?.status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true;
      try {
        await refreshAccessToken();
        return api(original);
      } catch (refreshError) {
        setAccessToken(null);
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
