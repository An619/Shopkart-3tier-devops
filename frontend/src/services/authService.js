import apiClient from './apiClient.js';

export const authService = {
  async register({ name, email, password }) {
    const { data } = await apiClient.post('/auth/register', { name, email, password });
    return data;
  },

  async login({ email, password }) {
    const { data } = await apiClient.post('/auth/login', { email, password });
    return data;
  },

  async getProfile() {
    const { data } = await apiClient.get('/users/profile');
    return data;
  },

  async updateProfile(payload) {
    const { data } = await apiClient.put('/users/profile', payload);
    return data;
  },

  async changePassword(payload) {
    const { data } = await apiClient.put('/users/password', payload);
    return data;
  },
};

export default authService;
