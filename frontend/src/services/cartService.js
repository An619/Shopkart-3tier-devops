import apiClient from './apiClient.js';

export const cartService = {
  async get() {
    const { data } = await apiClient.get('/cart');
    return data;
  },

  async add({ productId, quantity }) {
    const { data } = await apiClient.post('/cart', { productId, quantity });
    return data;
  },

  async update(itemId, { quantity }) {
    const { data } = await apiClient.put(`/cart/${itemId}`, { quantity });
    return data;
  },

  async remove(itemId) {
    const { data } = await apiClient.delete(`/cart/${itemId}`);
    return data;
  },

  async clear() {
    const { data } = await apiClient.delete('/cart');
    return data;
  },
};

export default cartService;
