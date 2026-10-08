import apiClient from './apiClient.js';

export const reviewService = {
  async listForProduct(productId) {
    const { data } = await apiClient.get(`/products/${productId}/reviews`);
    return data;
  },

  async create(productId, { rating, title, comment }) {
    const { data } = await apiClient.post(`/products/${productId}/reviews`, {
      rating,
      title,
      comment,
    });
    return data;
  },

  async remove(reviewId) {
    const { data } = await apiClient.delete(`/reviews/${reviewId}`);
    return data;
  },
};

export default reviewService;
