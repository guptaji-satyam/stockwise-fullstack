import api from './api';

export const reportService = {
  getDailySales: async (days = 30) => {
    const response = await api.get(`/reports/daily?days=${days}`);
    return response.data;
  },

  getMonthlySales: async () => {
    const response = await api.get('/reports/monthly');
    return response.data;
  },

  getTopProducts: async (limit = 10) => {
    const response = await api.get(`/reports/top-products?limit=${limit}`);
    return response.data;
  },

  getInventoryValuation: async () => {
    const response = await api.get('/reports/inventory-valuation');
    return response.data;
  },
};
