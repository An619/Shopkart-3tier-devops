import axios from 'axios';
import API_CONFIG, { TOKEN_STORAGE_KEY } from '../config/api.js';

/**
 * Shared axios instance.
 * - Injects JWT from localStorage automatically.
 * - Converts axios errors into a consistent shape.
 * - Handles 401 by clearing auth state (so the UI can redirect).
 */
const apiClient = axios.create(API_CONFIG);

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem('shopkart_user');
    }

    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Something went wrong';

    return Promise.reject({
      status: error.response?.status || 0,
      message,
      raw: error,
    });
  }
);

export default apiClient;
