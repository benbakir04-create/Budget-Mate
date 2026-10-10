import api from './api';
import { DEMO_TRANSACTIONS } from './demoData';

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

export const transactionService = {
  async getTransactions(params = {}) {
    if (DEMO_MODE) {
      let data = [...DEMO_TRANSACTIONS];
      if (params.type) data = data.filter(t => t.type === params.type);
      if (params.categoryId) data = data.filter(t => t.categoryId === params.categoryId);
      const limit = params.limit ? parseInt(params.limit) : data.length;
      const page = params.page ? parseInt(params.page) : 1;
      const paginated = data.slice((page - 1) * limit, page * limit);
      return {
        transactions: paginated,
        pagination: { page, limit, total: data.length, pages: Math.ceil(data.length / limit) }
      };
    }

    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const response = await api.get(`/transactions?${queryParams}`);
    return response.data.data;
  },

  async getTransaction(id) {
    if (DEMO_MODE) {
      const tx = DEMO_TRANSACTIONS.find(t => t.id === id);
      return tx || null;
    }
    const response = await api.get(`/transactions/${id}`);
    return response.data.data.transaction;
  },

  async createTransaction(transactionData) {
    if (DEMO_MODE) {
      // في Demo mode نحاكي الإنشاء فقط
      return { id: 'demo-new-' + Date.now(), ...transactionData };
    }
    const response = await api.post('/transactions', transactionData);
    return response.data.data.transaction;
  },

  async updateTransaction(id, transactionData) {
    if (DEMO_MODE) {
      return { id, ...transactionData };
    }
    const response = await api.put(`/transactions/${id}`, transactionData);
    return response.data.data.transaction;
  },

  async deleteTransaction(id) {
    if (DEMO_MODE) return;
    await api.delete(`/transactions/${id}`);
  }
};