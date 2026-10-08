import apiClient from './apiClient.js';

export const productService = {
  async list(params = {}) {
    const { data } = await apiClient.get('/products', { params });
    return data;
  },

  async getById(id) {
    const { data } = await apiClient.get(`/products/${id}`);
    return data;
  },

  async search(query, params = {}) {
    const { data } = await apiClient.get('/products', {
      params: { search: query, ...params },
    });
    return data;
  },

  async getReviews(productId) {
    const { data } = await apiClient.get(`/products/${productId}/reviews`);
    return data;
  },

  async createReview(productId, payload) {
    const { data } = await apiClient.post(`/products/${productId}/reviews`, payload);
    return data;
  },
};

export default productService;
