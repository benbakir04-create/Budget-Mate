import api from './api';

export const authService = {
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    const { token, user } = response.data.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    return { token, user };
  },

  async register(name, email, password) {
    const response = await api.post('/auth/register', { name, email, password });
    const { token, user } = response.data.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    return { token, user };
  },

  async getCurrentUser() {
    const response = await api.get('/auth/me');
    return response.data.data.user;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Fire and forget - don't wait for server response
    api.post('/auth/logout').catch(() => {
      // Silently ignore errors
    });
  },

  getToken() {
    return localStorage.getItem('token');
  },

  getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  async registerPartner(name, email, password) {
    const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';
    if (DEMO_MODE) {
      return {
        id: 'demo-partner-' + Date.now(),
        name,
        email,
        role: 'partner',
        parentId: 'demo-user',
      };
    }
    const response = await api.post('/auth/register-partner', { name, email, password });
    return response.data.data.partner;
  },
};
