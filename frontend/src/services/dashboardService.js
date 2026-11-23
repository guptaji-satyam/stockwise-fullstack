import api from './api';

export const dashboardService = {
  getStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },

  getSalesAnalytics: async (days = 7) => {
    const response = await api.get(`/dashboard/sales?days=${days}`);
    return response.data;
  },

  getRecentOrders: async (limit = 6) => {
    const response = await api.get(`/dashboard/recent-orders?limit=${limit}`);
    return response.data;
  },
};
