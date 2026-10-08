import apiClient from './apiClient.js';

export const adminService = {
  // ---------- Dashboard ----------
  async getDashboard() {
    const { data } = await apiClient.get('/admin/dashboard');
    return data;
  },

  // ---------- Products ----------
  async listProducts(params = {}) {
    const { data } = await apiClient.get('/products', { params });
    return data;
  },

  async createProduct(payload) {
    const { data } = await apiClient.post('/products', payload);
    return data;
  },

  async updateProduct(id, payload) {
    const { data } = await apiClient.put(`/products/${id}`, payload);
    return data;
  },

  async deleteProduct(id) {
    const { data } = await apiClient.delete(`/products/${id}`);
    return data;
  },

  // ---------- Categories ----------
  async listCategories() {
    const { data } = await apiClient.get('/categories');
    return data;
  },

  async createCategory(payload) {
    const { data } = await apiClient.post('/categories', payload);
    return data;
  },

  async updateCategory(id, payload) {
    const { data } = await apiClient.put(`/categories/${id}`, payload);
    return data;
  },

  async deleteCategory(id) {
    const { data } = await apiClient.delete(`/categories/${id}`);
    return data;
  },

  // ---------- Orders ----------
  async listOrders(params = {}) {
    const { data } = await apiClient.get('/admin/orders', { params });
    return data;
  },

  async updateOrderStatus(id, status) {
    const { data } = await apiClient.put(`/admin/orders/${id}/status`, { status });
    return data;
  },

  // ---------- Users ----------
  async listUsers(params = {}) {
    const { data } = await apiClient.get('/admin/users', { params });
    return data;
  },
};

export default adminService;
