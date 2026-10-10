import api from './api';
import { DEMO_BUDGETS } from './demoData';

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

export const budgetService = {
  async getBudgets() {
    if (DEMO_MODE) return DEMO_BUDGETS;
    const response = await api.get('/budgets');
    return response.data.data.budgets;
  },

  async getBudget(id) {
    if (DEMO_MODE) return DEMO_BUDGETS.find(b => b.id === id) || null;
    const response = await api.get(`/budgets/${id}`);
    return response.data.data.budget;
  },

  async createBudget(budgetData) {
    if (DEMO_MODE) return { id: 'demo-bud-' + Date.now(), ...budgetData };
    const response = await api.post('/budgets', budgetData);
    return response.data.data.budget;
  },

  async updateBudget(id, budgetData) {
    if (DEMO_MODE) return { id, ...budgetData };
    const response = await api.put(`/budgets/${id}`, budgetData);
    return response.data.data.budget;
  },

  async deleteBudget(id) {
    if (DEMO_MODE) return;
    await api.delete(`/budgets/${id}`);
  }
};