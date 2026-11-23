import api from './api';

export const inventoryService = {
  getTransactions: async (params = {}) => {
    const response = await api.get('/inventory/transactions', { params });
    return response.data;
  },

  getSummary: async () => {
    const response = await api.get('/inventory/summary');
    return response.data;
  },

  adjustStock: async (adjustmentData) => {
    const response = await api.post('/inventory/adjust', adjustmentData);
    return response.data;
  },
};
