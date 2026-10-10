import api from './api';
import { DEMO_ORDERS } from './demoData';

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

export const shoppingOrderService = {
  async getShoppingOrders(params = {}) {
    if (DEMO_MODE) {
      const stored = localStorage.getItem('demo_orders');
      let orders = stored ? JSON.parse(stored) : null;
      if (!orders) {
        localStorage.setItem('demo_orders', JSON.stringify(DEMO_ORDERS));
        orders = DEMO_ORDERS;
      }
      
      let filtered = [...orders];
      if (params.fundId) {
        filtered = filtered.filter(o => o.fundId === params.fundId);
      }
      if (params.status) {
        filtered = filtered.filter(o => o.status === params.status);
      } else {
        filtered = filtered.filter(o => ['pending_approval', 'approved'].includes(o.status));
      }
      return filtered;
    }
    
    const queryParams = new URLSearchParams();
    if (params.fundId) queryParams.append('fundId', params.fundId);
    if (params.status) queryParams.append('status', params.status);
    
    const response = await api.get(`/orders?${queryParams}`);
    return response.data.data.orders;
  },

  async createShoppingOrder(data) {
    if (DEMO_MODE) {
      const storedOrders = localStorage.getItem('demo_orders');
      const orders = storedOrders ? JSON.parse(storedOrders) : [];
      
      const storedFunds = localStorage.getItem('demo_funds');
      const funds = storedFunds ? JSON.parse(storedFunds) : [];
      const fund = funds.find(f => f.id === data.fundId) || { id: data.fundId, name: 'الصندوق المشترك' };

      const newOrder = {
        id: 'ord-' + Date.now(),
        title: data.title,
        estAmount: parseFloat(data.estAmount),
        status: 'pending_approval',
        requestedBy: 'demo-partner',
        fundId: data.fundId,
        fund: { id: fund.id, name: fund.name, balance: fund.balance },
        createdAt: new Date().toISOString()
      };
      
      orders.push(newOrder);
      localStorage.setItem('demo_orders', JSON.stringify(orders));
      return newOrder;
    }
    const response = await api.post('/orders', data);
    return response.data.data.order;
  },

  async approveShoppingOrder(id) {
    if (DEMO_MODE) {
      const stored = localStorage.getItem('demo_orders');
      const orders = stored ? JSON.parse(stored) : [];
      const index = orders.findIndex(o => o.id === id);
      if (index !== -1) {
        orders[index].status = 'approved';
        localStorage.setItem('demo_orders', JSON.stringify(orders));
        return orders[index];
      }
      throw new Error('Order not found');
    }
    const response = await api.post(`/orders/${id}/approve`);
    return response.data.data.order;
  },

  async purchaseShoppingOrder(id, data) {
    if (DEMO_MODE) {
      const stored = localStorage.getItem('demo_orders');
      const orders = stored ? JSON.parse(stored) : [];
      const orderIndex = orders.findIndex(o => o.id === id);
      if (orderIndex === -1) throw new Error('Order not found');
      
      const order = orders[orderIndex];
      order.status = 'purchased';
      
      // Deduct from fund balance
      const finalAmount = parseFloat(data.actualAmount || order.estAmount);
      const storedFunds = localStorage.getItem('demo_funds');
      const funds = storedFunds ? JSON.parse(storedFunds) : [];
      const fundIndex = funds.findIndex(f => f.id === order.fundId);
      let fund = null;
      if (fundIndex !== -1) {
        funds[fundIndex].balance -= finalAmount;
        fund = funds[fundIndex];
        localStorage.setItem('demo_funds', JSON.stringify(funds));
      }
      
      // Create transaction
      const storedTx = localStorage.getItem('demo_transactions');
      const transactions = storedTx ? JSON.parse(storedTx) : [];
      
      const storedCategories = localStorage.getItem('demo_categories');
      const categories = storedCategories ? JSON.parse(storedCategories) : [];
      const category = categories.find(c => c.id === data.categoryId) || { id: data.categoryId, name: 'Expense', nameAr: 'مصروف', icon: 'shopping-cart', color: '#EF4444' };
      
      const newTx = {
        id: 'tx-' + Date.now(),
        amount: finalAmount,
        type: 'expense',
        description: data.description || `شراء طلب: ${order.title}`,
        date: new Date().toISOString(),
        userId: 'demo-partner',
        categoryId: data.categoryId,
        category,
        user: { id: 'demo-partner', name: 'الشريك', role: 'partner' },
        fund: fund ? { id: fund.id, name: fund.name } : null,
        receiptUrl: data.receiptUrl || null
      };
      
      transactions.unshift(newTx);
      localStorage.setItem('demo_transactions', JSON.stringify(transactions));
      localStorage.setItem('demo_orders', JSON.stringify(orders));
      
      return { order, fund, transaction: newTx };
    }
    const response = await api.post(`/orders/${id}/purchase`, data);
    return response.data.data;
  },

  async deleteShoppingOrder(id) {
    if (DEMO_MODE) {
      const stored = localStorage.getItem('demo_orders');
      const orders = stored ? JSON.parse(stored) : [];
      const filtered = orders.filter(o => o.id !== id);
      localStorage.setItem('demo_orders', JSON.stringify(filtered));
      return;
    }
    await api.delete(`/orders/${id}`);
  }
};
