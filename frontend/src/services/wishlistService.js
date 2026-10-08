import apiClient from './apiClient.js';

export const wishlistService = {
  async get() {
    const { data } = await apiClient.get('/wishlist');
    return data;
  },

  async add(productId) {
    const { data } = await apiClient.post('/wishlist', { productId });
    return data;
  },

  async remove(itemId) {
    const { data } = await apiClient.delete(`/wishlist/${itemId}`);
    return data;
  },
};

export default wishlistService;
