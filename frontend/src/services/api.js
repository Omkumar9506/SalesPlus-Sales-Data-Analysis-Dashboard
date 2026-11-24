import axios from 'axios';

// Create configured Axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const salesService = {
  // Health
  checkHealth: async () => {
    const res = await api.get('/health');
    return res.data;
  },

  // Overview KPIs
  getOverview: async (params = {}) => {
    const res = await api.get('/overview', { params });
    return res.data.data;
  },

  // Monthly Sales
  getMonthlySales: async (params = {}) => {
    const res = await api.get('/monthly-sales', { params });
    return res.data.data;
  },

  // Daily Sales
  getDailySales: async (params = {}) => {
    const res = await api.get('/daily-sales', { params });
    return res.data.data;
  },

  // Category Sales
  getCategorySales: async (params = {}) => {
    const res = await api.get('/category-sales', { params });
    return res.data.data;
  },

  // Top Products
  getTopProducts: async (params = {}) => {
    const res = await api.get('/top-products', { params });
    return res.data.data;
  },

  // Recent Transactions
  getRecentSales: async (params = {}) => {
    const res = await api.get('/recent-sales', { params });
    return res.data.data;
  },

  // Categories list
  getCategories: async () => {
    const res = await api.get('/categories');
    return res.data.data;
  },

  // ML Revenue Forecast
  getForecast: async (params = {}) => {
    const res = await api.get('/forecast', { params });
    return res.data.data;
  },

  // CSV Upload
  uploadCSV: async (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
    return res.data;
  },

  // Reset to default sample dataset
  resetDataset: async () => {
    const res = await api.post('/reset');
    return res.data;
  },

  // Database status
  getDatabaseStatus: async () => {
    const res = await api.get('/database/status');
    return res.data.data;
  },

  // Configure MySQL connection
  configureDatabase: async (config) => {
    const res = await api.post('/database/config', config);
    return res.data;
  },

  // Export CSV
  exportCSVUrl: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return `/api/export?${query}`;
  }
};

export default api;
