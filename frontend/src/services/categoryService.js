import api from './api';
import { DEMO_CATEGORIES } from './demoData';

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

export const categoryService = {
  async getCategories() {
    if (DEMO_MODE) {
      const stored = localStorage.getItem('demo_categories');
      if (!stored) {
        localStorage.setItem('demo_categories', JSON.stringify(DEMO_CATEGORIES));
        return DEMO_CATEGORIES;
      }
      return JSON.parse(stored);
    }
    const response = await api.get('/categories');
    return response.data.data.categories;
  },

  async createCategory(data) {
    if (DEMO_MODE) {
      const categories = await this.getCategories();
      const newCat = { 
        id: 'cat-' + Date.now(), 
        isPrivate: false, 
        icon: 'folder', 
        color: '#10B981', 
        subcategories: [], 
        ...data 
      };
      categories.push(newCat);
      localStorage.setItem('demo_categories', JSON.stringify(categories));
      return newCat;
    }
    const response = await api.post('/categories', data);
    return response.data.data.category;
  },

  async updateCategory(id, data) {
    if (DEMO_MODE) {
      const categories = await this.getCategories();
      const index = categories.findIndex(c => c.id === id);
      if (index !== -1) {
        categories[index] = { ...categories[index], ...data };
        localStorage.setItem('demo_categories', JSON.stringify(categories));
        return categories[index];
      }
      return null;
    }
    const response = await api.put(`/categories/${id}`, data);
    return response.data.data.category;
  },

  async deleteCategory(id) {
    if (DEMO_MODE) {
      const categories = await this.getCategories();
      const filtered = categories.filter(c => c.id !== id);
      localStorage.setItem('demo_categories', JSON.stringify(filtered));
      return;
    }
    await api.delete(`/categories/${id}`);
  }
};