import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/common/Sidebar';
import { budgetService } from '../services/budgetService';
import { categoryService } from '../services/categoryService';

const Budget = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    categoryId: '',
    amount: '',
    period: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0] // End of current month
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [budgetsData, categoriesData] = await Promise.all([
        budgetService.getBudgets(),
        categoryService.getCategories()
      ]);

      setBudgets(budgetsData);
      setCategories(categoriesData.filter(cat => cat.type === 'expense')); // Only expense categories for budgets
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePeriodChange = (period) => {
    const now = new Date();
    let startDate, endDate;

    switch (period) {
      case 'weekly':
        startDate = new Date(now.setDate(now.getDate() - now.getDay()));
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'yearly':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      default:
        startDate = new Date();
        endDate = new Date();
    }

    setFormData(prev => ({
      ...prev,
      period,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const budgetData = {
        ...formData,
        amount: parseFloat(formData.amount)
      };

      await budgetService.createBudget(budgetData);
      setFormData({
        categoryId: '',
        amount: '',
        period: 'monthly',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
      });
      setShowAddForm(false);
      loadData(); // Reload data
    } catch (err) {
      setError('Failed to create budget');
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(t('budget.confirmDelete', 'Are you sure you want to delete this budget?'))) {
      try {
        await budgetService.deleteBudget(id);
        loadData(); // Reload data
      } catch (err) {
        setError('Failed to delete budget');
        console.error(err);
      }
    }
  };

  const calculateSpent = (budget) => {
    return parseFloat(budget.spent || 0);
  };

  const totalBudget = budgets.reduce((sum, b) => sum + parseFloat(b.amount), 0);
  const totalSpent = budgets.reduce((sum, b) => sum + calculateSpent(b), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 max-w-7xl mx-auto p-4 md:mr-64">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{t('budget.title', 'Budget Management')}</h1>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-primary hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            {showAddForm ? t('common.cancel', 'Cancel') : t('budget.add', 'Add Budget')}
          </button>
        </div>

        {/* Budget Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">{t('budget.totalBudget', 'Total Budget')}</p>
                <p className="text-2xl font-bold text-gray-900">{totalBudget.toLocaleString()} {user?.currency || 'SAR'}</p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">{t('budget.totalSpent', 'Total Spent')}</p>
                <p className="text-2xl font-bold text-gray-900">{totalSpent.toLocaleString()} {user?.currency || 'SAR'}</p>
              </div>
              <div className="bg-red-100 rounded-full p-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20V4m8 8l-8-8-8 8" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">{t('budget.remaining', 'Remaining')}</p>
                <p className={`text-2xl font-bold ${totalBudget - totalSpent >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                  {(totalBudget - totalSpent).toLocaleString()} {user?.currency || 'SAR'}
                </p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Add Budget Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('budget.addNew', 'Add New Budget')}</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('transactions.category', 'Category')}</label>
                  <select
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleFormChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  >
                    <option value="">{t('budget.selectCategory', 'Select Category')}</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {user?.language === 'ar' ? category.nameAr : category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('transactions.amount', 'Amount')}</label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleFormChange}
                    required
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('budget.period', 'Period')}</label>
                  <select
                    name="period"
                    value={formData.period}
                    onChange={(e) => handlePeriodChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  >
                    <option value="weekly">{t('budget.weekly', 'Weekly')}</option>
                    <option value="monthly">{t('budget.monthly', 'Monthly')}</option>
                    <option value="yearly">{t('budget.yearly', 'Yearly')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('budget.startDate', 'Start Date')}</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleFormChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('budget.endDate', 'End Date')}</label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleFormChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 space-x-reverse">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  {t('common.cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  {t('common.save', 'Save')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Budgets List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">{t('budget.currentBudgets', 'Current Budgets')} ({budgets.length})</h2>
          </div>

          <div className="divide-y divide-gray-200">
            {budgets.length > 0 ? (
              budgets.map(budget => {
                const spent = calculateSpent(budget);
                const percentage = (spent / parseFloat(budget.amount)) * 100;
                const isOverBudget = percentage > 100;
                const isNearLimit = percentage > 80 && percentage <= 100;
                const remaining = parseFloat(budget.amount) - spent;

                return (
                  <div key={budget.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {user?.language === 'ar' ? budget.category.nameAr : budget.category.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {t('budget.periodLabel', 'Period: {{period}}', { period: t(`budget.${budget.period}`, budget.period) })} • {new Date(budget.startDate).toLocaleDateString()} - {new Date(budget.endDate).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2 space-x-reverse">
                        <button
                          onClick={() => handleDelete(budget.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">{t('budget.label', 'Budget')}</span>
                        <span className="text-gray-900 font-medium">{parseFloat(budget.amount).toLocaleString()} {user?.currency || 'SAR'}</span>
                      </div>

                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">{t('budget.spent', 'Spent')}</span>
                        <span className="text-gray-900 font-medium">{spent.toLocaleString()} {user?.currency || 'SAR'}</span>
                      </div>

                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">{t('budget.remaining', 'Remaining')}</span>
                        <span className={`${remaining >= 0 ? 'text-gray-900' : 'text-red-600'} font-medium`}>
                          {remaining.toLocaleString()} {user?.currency || 'SAR'}
                        </span>
                      </div>

                      <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                        <div
                          className={`h-2 rounded-full ${isOverBudget ? 'bg-red-500' : isNearLimit ? 'bg-yellow-500' : 'bg-green-500'}`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        ></div>
                      </div>

                      <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
                        <span>{t('budget.usedPercentage', 'Used {{percentage}}% of budget', { percentage: Math.round(percentage) })}</span>
                        {isOverBudget && (
                          <span className="text-red-600 font-medium">{t('budget.overBudget', 'Over budget!')}</span>
                        )}
                        {isNearLimit && (
                          <span className="text-yellow-600 font-medium">{t('budget.nearLimit', 'Near limit')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-6 text-center text-gray-500">
                {t('budget.noBudgets', 'No budgets found. Create your first budget to get started.')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Budget;