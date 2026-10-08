/**
 * Central API configuration.
 *
 * VITE_API_BASE_URL is baked at build time (see Dockerfile ARG).
 * It defaults to "/api" so that nginx can proxy the request to the
 * backend service. This value is IDENTICAL across:
 *   - Local dev   (Vite proxies /api → localhost:5000)
 *   - Compose     (nginx proxies /api → backend:5000)
 *   - Killercoda  (nginx proxies /api → shopkart-backend:5000)
 *   - EKS         (nginx proxies /api → shopkart-backend:5000)
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const API_CONFIG = {
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
};

export const TOKEN_STORAGE_KEY = 'shopkart_token';
export const USER_STORAGE_KEY = 'shopkart_user';

export default API_CONFIG;
