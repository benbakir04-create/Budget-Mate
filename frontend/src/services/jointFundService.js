import api from './api';
import { DEMO_FUNDS } from './demoData';

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

export const jointFundService = {
  async getJointFunds() {
    if (DEMO_MODE) {
      const stored = localStorage.getItem('demo_funds');
      if (!stored) {
        localStorage.setItem('demo_funds', JSON.stringify(DEMO_FUNDS));
        return DEMO_FUNDS;
      }
      return JSON.parse(stored);
    }
    const response = await api.get('/funds');
    return response.data.data.funds;
  },

  async getJointFund(id) {
    if (DEMO_MODE) {
      const funds = await this.getJointFunds();
      const fund = funds.find(f => f.id === id);
      if (!fund) return null;

      // Simulate transactions and orders for this fund
      const storedTransactions = localStorage.getItem('demo_transactions');
      const transactions = storedTransactions ? JSON.parse(storedTransactions) : [];
      // Normalize fund reference check
      const fundTransactions = transactions.filter(
        t => t.fund && (t.fund.id === id || t.fundId === id)
      );

      const storedOrders = localStorage.getItem('demo_orders');
      const orders = storedOrders ? JSON.parse(storedOrders) : [];
      const fundOrders = orders.filter(o => o.fundId === id && o.status === 'pending_approval');

      return {
        ...fund,
        transactions: fundTransactions.slice(0, 10),
        orders: fundOrders,
      };
    }
    const response = await api.get(`/funds/${id}`);
    return response.data.data.fund;
  },

  async createJointFund(data) {
    if (DEMO_MODE) {
      const funds = await this.getJointFunds();
      const newFund = {
        id: 'fund-' + Date.now(),
        name: data.name,
        balance: parseFloat(data.initialBalance || 0),
        ownerId: 'demo-user',
        createdAt: new Date().toISOString(),
        _count: { transactions: 0, orders: 0 },
      };
      funds.push(newFund);
      localStorage.setItem('demo_funds', JSON.stringify(funds));

      // If initial balance is greater than 0, simulate category and transaction
      if (newFund.balance > 0) {
        const storedTx = localStorage.getItem('demo_transactions');
        const transactions = storedTx ? JSON.parse(storedTx) : [];
        const fundingTx = {
          id: 'tx-' + Date.now(),
          amount: newFund.balance,
          type: 'income',
          description: `التمويل الأولي لصندوق: ${newFund.name}`,
          date: new Date().toISOString(),
          userId: 'demo-user',
          categoryId: 'cat-7', // Funding
          category: {
            id: 'cat-7',
            name: 'Funding',
            nameAr: 'تمويل العهدة',
            icon: 'account-balance-wallet',
            color: '#1D9E75',
          },
          user: { id: 'demo-user', name: 'المالك الرئيسي', role: 'owner' },
          fund: { id: newFund.id, name: newFund.name },
        };
        transactions.unshift(fundingTx);
        localStorage.setItem('demo_transactions', JSON.stringify(transactions));
      }

      return newFund;
    }
    const response = await api.post('/funds', data);
    return response.data.data.fund;
  },

  async updateJointFund(id, data) {
    if (DEMO_MODE) {
      const funds = await this.getJointFunds();
      const index = funds.findIndex(f => f.id === id);
      if (index !== -1) {
        funds[index] = { ...funds[index], name: data.name };
        localStorage.setItem('demo_funds', JSON.stringify(funds));
        return funds[index];
      }
      return null;
    }
    const response = await api.put(`/funds/${id}`, data);
    return response.data.data.fund;
  },

  async deleteJointFund(id) {
    if (DEMO_MODE) {
      const funds = await this.getJointFunds();
      const filtered = funds.filter(f => f.id !== id);
      localStorage.setItem('demo_funds', JSON.stringify(filtered));
      return;
    }
    await api.delete(`/funds/${id}`);
  },

  async addMoneyToFund(id, data) {
    if (DEMO_MODE) {
      const funds = await this.getJointFunds();
      const index = funds.findIndex(f => f.id === id);
      if (index !== -1) {
        funds[index].balance += parseFloat(data.amount);
        localStorage.setItem('demo_funds', JSON.stringify(funds));

        // Save transaction record
        const storedTx = localStorage.getItem('demo_transactions');
        const transactions = storedTx ? JSON.parse(storedTx) : [];
        const fundingTx = {
          id: 'tx-' + Date.now(),
          amount: parseFloat(data.amount),
          type: 'income',
          description: data.description || 'ضخ تمويل إضافي للصندوق المشترك',
          date: new Date().toISOString(),
          userId: 'demo-user',
          categoryId: 'cat-7',
          category: {
            id: 'cat-7',
            name: 'Funding',
            nameAr: 'تمويل العهدة',
            icon: 'account-balance-wallet',
            color: '#1D9E75',
          },
          user: { id: 'demo-user', name: 'المالك الرئيسي', role: 'owner' },
          fund: { id: funds[index].id, name: funds[index].name },
        };
        transactions.unshift(fundingTx);
        localStorage.setItem('demo_transactions', JSON.stringify(transactions));

        return { fund: funds[index], transaction: fundingTx };
      }
      throw new Error('Fund not found');
    }
    const response = await api.post(`/funds/${id}/deposit`, data);
    return response.data.data;
  },
};
