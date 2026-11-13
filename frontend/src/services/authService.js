import api, { setAccessToken, refreshAccessToken } from './api';

export const authService = {
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    const { token, user } = response.data.data;
    setAccessToken(token);
    return { token, user };
  },

  async register(name, email, password) {
    const response = await api.post('/auth/register', { name, email, password });
    const { token, user } = response.data.data;
    setAccessToken(token);
    return { token, user };
  },

  async getCurrentUser() {
    const response = await api.get('/auth/me');
    return response.data.data.user;
  },

  // Restores the session from the httpOnly refresh cookie after a page reload.
  async restoreSession() {
    const { user } = await refreshAccessToken();
    return user;
  },

  async logout() {
    try {
      // Clears the refresh cookie on the server
      await api.post('/auth/logout');
    } catch {
      // Ignore: the local session is cleared either way
    } finally {
      setAccessToken(null);
    }
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
