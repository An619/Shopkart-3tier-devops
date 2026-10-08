import apiClient from './apiClient.js';

export const orderService = {
  async list() {
    const { data } = await apiClient.get('/orders');
    return data;
  },

  async getById(id) {
    const { data } = await apiClient.get(`/orders/${id}`);
    return data;
  },

  async create({ shippingAddress, paymentMethod = 'MOCK' }) {
    const { data } = await apiClient.post('/orders', { shippingAddress, paymentMethod });
    return data;
  },

  async cancel(id) {
    const { data } = await apiClient.put(`/orders/${id}/cancel`);
    return data;
  },
};

export default orderService;
