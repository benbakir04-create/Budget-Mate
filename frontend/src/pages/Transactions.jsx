import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/common/Sidebar';
import { transactionService } from '../services/transactionService';
import { categoryService } from '../services/categoryService';
import { currencyLabel, DEFAULT_CURRENCY } from '../utils/currency';
import { amountSign, typeLabel } from '../utils/money';
import Money from '../components/common/Money';
import { formatDay } from '../utils/dates';

// Income green, expense red, a deposit into a fund (transfer) blue: it is neither.
const TYPE_STYLE = {
  income: { badge: 'bg-mint-100', text: 'text-mint-600', path: 'M12 4v16m8-8l-8 8-8-8' },
  expense: { badge: 'bg-alert-100', text: 'text-alert-600', path: 'M12 20V4m8 8l-8-8-8 8' },
  transfer: {
    badge: 'bg-blue-100',
    text: 'text-blue-600',
    path: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
  },
};
const typeStyle = type => TYPE_STYLE[type] || TYPE_STYLE.transfer;

const Transactions = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({
    type: 'all',
    categoryId: 'all',
    search: '',
    scope: 'all', // 'all', 'personal', 'shared'
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    type: 'expense',
    categoryId: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [transactions, filter]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Totals come from the server over every transaction; fund deposits are excluded.
      const [transactionsData, categoriesData, summary] = await Promise.all([
        transactionService.getTransactions({ limit: 100 }),
        categoryService.getCategories(),
        transactionService.getSummary(),
      ]);

      setTransactions(transactionsData.transactions);
      setCategories(categoriesData);
      setTotalIncome(summary.income);
      setTotalExpense(summary.expense);
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...transactions];

    if (filter.type !== 'all') {
      filtered = filtered.filter(t => t.type === filter.type);
    }

    if (filter.categoryId !== 'all') {
      filtered = filtered.filter(t => t.categoryId === filter.categoryId);
    }

    if (filter.scope !== 'all') {
      if (filter.scope === 'personal') {
        filtered = filtered.filter(t => !t.fundId && t.userId === user.id);
      } else if (filter.scope === 'shared') {
        filtered = filtered.filter(t => !!t.fundId);
      }
    }

    if (filter.search) {
      filtered = filtered.filter(
        t =>
          t.description.toLowerCase().includes(filter.search.toLowerCase()) ||
          t.category.name.toLowerCase().includes(filter.search.toLowerCase()) ||
          t.category.nameAr.includes(filter.search.toLowerCase())
      );
    }

    setFilteredTransactions(filtered);
  };

  const exportToCSV = () => {
    const isAr = user?.language === 'ar';
    const headers = [
      isAr ? 'الوصف' : 'Description',
      isAr ? 'التصنيف' : 'Category',
      isAr
        ? `المبلغ (${currencyLabel(user?.currency)})`
        : `Amount (${user?.currency || DEFAULT_CURRENCY})`,
      isAr ? 'النوع' : 'Type',
      isAr ? 'التاريخ' : 'Date',
      isAr ? 'المصدر' : 'Source',
    ];

    const rows = filteredTransactions.map(tx => [
      tx.description,
      isAr ? tx.category.nameAr : tx.category.name,
      tx.amount,
      isAr ? typeLabel(tx.type) : tx.type,
      new Date(tx.date).toLocaleDateString(),
      tx.fund ? tx.fund.name : isAr ? 'شخصي' : 'Personal',
    ]);

    const csvContent =
      '\uFEFF' +
      [
        headers.join(','),
        ...rows.map(row => row.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(',')),
      ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `wazen_transactions_${new Date().toISOString().split('T')[0]}.csv`
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFilterChange = e => {
    const { name, value } = e.target;
    setFilter(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFormChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const transactionData = {
        ...formData,
        amount: parseFloat(formData.amount),
      };

      await transactionService.createTransaction(transactionData);
      setFormData({
        type: 'expense',
        categoryId: '',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
      });
      setShowAddForm(false);
      loadData(); // Reload data
    } catch (err) {
      setError('Failed to create transaction');
      console.error(err);
    }
  };

  const handleDelete = async id => {
    if (
      window.confirm(
        t('transactions.confirmDelete', 'Are you sure you want to delete this transaction?')
      )
    ) {
      try {
        await transactionService.deleteTransaction(id);
        loadData(); // Reload data
      } catch (err) {
        setError('Failed to delete transaction');
        console.error(err);
      }
    }
  };

  const getFilteredCategories = () => {
    return categories.filter(cat => formData.type === 'all' || cat.type === formData.type);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-stone-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex">
      <Sidebar />
      <div className="flex-1 max-w-7xl mx-auto p-4 md:mr-64">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-stone-900">
            {t('transactions.title', 'Transactions')}
          </h1>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-primary hover:bg-brand-800 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            {showAddForm ? t('common.cancel', 'Cancel') : t('transactions.add', 'Add Transaction')}
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-mint-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-stone-500 text-sm">
                  {t('dashboard.totalIncome', 'Total Income')}
                </p>
                <p className="text-2xl font-bold text-stone-900">
                  <Money amount={totalIncome} currency={user?.currency} />
                </p>
              </div>
              <div className="bg-mint-100 rounded-full p-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-mint-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8l-8 8-8-8"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-alert-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-stone-500 text-sm">
                  {t('dashboard.totalExpense', 'Total Expense')}
                </p>
                <p className="text-2xl font-bold text-stone-900">
                  <Money amount={totalExpense} currency={user?.currency} />
                </p>
              </div>
              <div className="bg-alert-100 rounded-full p-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-alert-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 20V4m8 8l-8-8-8 8"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Add Transaction Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-stone-900 mb-4">
              {t('transactions.addNew', 'Add New Transaction')}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    {t('transactions.type', 'Type')}
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  >
                    <option value="expense">{t('transactions.expense', 'Expense')}</option>
                    <option value="income">{t('transactions.income', 'Income')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    {t('transactions.category', 'Category')}
                  </label>
                  <select
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleFormChange}
                    required
                    className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  >
                    <option value="">{t('transactions.selectCategory', 'Select Category')}</option>
                    {getFilteredCategories().map(category => (
                      <option key={category.id} value={category.id}>
                        {user?.language === 'ar' ? category.nameAr : category.name}
                      </option>
                    ))}
                  </select>
                  {/* Quick Category Chips */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {getFilteredCategories()
                      .slice(0, 5)
                      .map(category => (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() =>
                            setFormData(prev => ({ ...prev, categoryId: category.id }))
                          }
                          className={`px-2.5 py-1 rounded-full text-xs font-bold border transition-all duration-200 ${
                            formData.categoryId === category.id
                              ? 'bg-brand-500 text-white border-brand-500 shadow-sm'
                              : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700 dark:hover:bg-stone-700'
                          }`}
                        >
                          {category.icon}{' '}
                          {user?.language === 'ar' ? category.nameAr : category.name}
                        </button>
                      ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    {t('transactions.amount', 'Amount')}
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleFormChange}
                    required
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  />
                  {/* Quick Amount Chips */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {[10, 50, 100, 200, 500, 1000].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, amount: amt.toString() }))}
                        className={`px-2 py-0.5 rounded-full text-xs font-bold border transition-all duration-200 ${
                          formData.amount === amt.toString()
                            ? 'bg-brand-500 text-white border-brand-500 shadow-sm'
                            : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700 dark:hover:bg-stone-700'
                        }`}
                      >
                        {amt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    {t('transactions.date', 'Date')}
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleFormChange}
                    required
                    className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  {t('transactions.description', 'Description')}
                </label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  required
                  placeholder={t('transactions.description', 'Description')}
                  className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                />
              </div>

              <div className="flex justify-end space-x-2 space-x-reverse">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-stone-300 rounded-md text-sm font-medium text-stone-700 hover:bg-stone-50"
                >
                  {t('common.cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-brand-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  {t('common.save', 'Save')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-stone-900 mb-4">
            {t('transactions.filterTitle', 'Filter Transactions')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                {t('transactions.type', 'Type')}
              </label>
              <select
                name="type"
                value={filter.type}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              >
                <option value="all">{t('transactions.all', 'All')}</option>
                <option value="income">{t('transactions.income', 'Income')}</option>
                <option value="expense">{t('transactions.expense', 'Expense')}</option>
                <option value="transfer">تحويل للصندوق</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                {t('transactions.category', 'Category')}
              </label>
              <select
                name="categoryId"
                value={filter.categoryId}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              >
                <option value="all">{t('transactions.all', 'All')}</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {user?.language === 'ar' ? category.nameAr : category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                {t('transactions.search', 'Search')}
              </label>
              <input
                type="text"
                name="search"
                value={filter.search}
                onChange={handleFilterChange}
                placeholder={t(
                  'transactions.searchPlaceholder',
                  'Search by description or category...'
                )}
                className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center justify-between w-full sm:w-auto">
              <h2 className="text-xl font-semibold text-stone-900">
                {t('transactions.title', 'Transactions')} ({filteredTransactions.length})
              </h2>

              {/* Mobile Export Button */}
              <button
                type="button"
                onClick={exportToCSV}
                className="sm:hidden flex items-center gap-1.5 px-3 py-1.5 bg-stone-50 hover:bg-stone-100 text-stone-700 hover:text-stone-900 border border-stone-200 rounded-lg text-xs font-bold transition-all duration-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                {user?.language === 'ar' ? 'تصدير' : 'Export'}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Privacy Filter for Owners */}
              {user?.role === 'owner' && (
                <div className="flex bg-stone-100 dark:bg-stone-800/50 p-1 rounded-xl w-fit border border-stone-200/50 dark:border-stone-700/50">
                  <button
                    type="button"
                    onClick={() => setFilter(prev => ({ ...prev, scope: 'all' }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                      filter.scope === 'all'
                        ? 'bg-white text-stone-800 shadow-sm dark:bg-stone-700 dark:text-white'
                        : 'text-stone-600 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200'
                    }`}
                  >
                    {user?.language === 'ar' ? 'الكل' : 'All'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilter(prev => ({ ...prev, scope: 'personal' }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                      filter.scope === 'personal'
                        ? 'bg-white text-stone-800 shadow-sm dark:bg-stone-700 dark:text-white'
                        : 'text-stone-600 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200'
                    }`}
                  >
                    {user?.language === 'ar' ? 'الشخصية' : 'Personal'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilter(prev => ({ ...prev, scope: 'shared' }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                      filter.scope === 'shared'
                        ? 'bg-white text-stone-800 shadow-sm dark:bg-stone-700 dark:text-white'
                        : 'text-stone-600 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200'
                    }`}
                  >
                    {user?.language === 'ar' ? 'المشتركة' : 'Joint'}
                  </button>
                </div>
              )}

              {/* Desktop Export Button */}
              <button
                type="button"
                onClick={exportToCSV}
                className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-stone-50 hover:bg-stone-100 text-stone-700 hover:text-stone-900 border border-stone-200 rounded-xl text-xs font-bold transition-all duration-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700 dark:hover:bg-stone-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-brand-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                {user?.language === 'ar' ? 'تصدير CSV' : 'Export CSV'}
              </button>
            </div>
          </div>

          <div className="divide-y divide-stone-200">
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map(transaction => (
                <div key={transaction.id} className="p-6 hover:bg-stone-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className={`p-2 rounded-full ${typeStyle(transaction.type).badge}`}>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className={`h-5 w-5 ${typeStyle(transaction.type).text}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d={typeStyle(transaction.type).path}
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-stone-900">
                          {transaction.description}
                        </p>
                        <p className="text-xs text-stone-500">
                          {user?.language === 'ar'
                            ? transaction.category.nameAr
                            : transaction.category.name}{' '}
                          • {formatDay(transaction.date)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <div className={`text-sm font-semibold ${typeStyle(transaction.type).text}`}>
                        <Money
                          amount={parseFloat(transaction.amount)}
                          currency={user?.currency}
                          sign={amountSign(transaction.type)}
                        />
                      </div>
                      <button
                        onClick={() => handleDelete(transaction.id)}
                        className="text-alert-600 hover:text-alert-800"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-stone-500">
                No transactions match the selected filters
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Transactions;
