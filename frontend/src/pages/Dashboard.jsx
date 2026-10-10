import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar';
import { transactionService } from '../services/transactionService';
import { budgetService } from '../services/budgetService';
import { DEMO_FUNDS } from '../services/demoData';

const Dashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    transactionCount: 0,
    budgetCount: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const transactionsData = await transactionService.getTransactions({ limit: 5 });
      const budgetsData = await budgetService.getBudgets();
      const transactions = transactionsData.transactions;

      const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      const balance = totalIncome - totalExpense;

      setStats({
        totalIncome,
        totalExpense,
        balance,
        transactionCount: transactions.length,
        budgetCount: budgetsData.length,
      });
      setRecentTransactions(transactions);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!user)
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-[#030712]">
        <div className="text-lg dark:text-white">Loading...</div>
      </div>
    );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#030712] flex transition-colors duration-500 ease-in-out">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-slate-500 dark:text-slate-400">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex transition-colors duration-500 ease-in-out">
      <Sidebar />
      <div className="flex-1 max-w-7xl mx-auto p-4 md:p-8 md:mr-64 pt-20 md:pt-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-1">
              {t('dashboard.title', 'Dashboard')}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm md:text-base">
              {t('dashboard.welcome', 'Welcome back, {{name}}!', { name: user.name })}
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="premium-card p-6 border-l-4 border-l-green-500 relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-green-500/10 rounded-full blur-2xl group-hover:bg-green-500/20 transition-all duration-500"></div>
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-bold mb-2">
                  {t('dashboard.totalIncome', 'Total Income')}
                </p>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {stats.totalIncome.toLocaleString()}{' '}
                  <span className="text-sm font-medium text-slate-400">
                    {user.currency || 'SAR'}
                  </span>
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-500/10 rounded-2xl p-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-7 w-7 text-green-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M12 4v16m8-8l-8 8-8-8"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="premium-card p-6 border-l-4 border-l-rose-500 relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-all duration-500"></div>
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-bold mb-2">
                  {t('dashboard.totalExpense', 'Total Expenses')}
                </p>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {stats.totalExpense.toLocaleString()}{' '}
                  <span className="text-sm font-medium text-slate-400">
                    {user.currency || 'SAR'}
                  </span>
                </p>
              </div>
              <div className="bg-rose-50 dark:bg-rose-500/10 rounded-2xl p-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-7 w-7 text-rose-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M12 20V4m8 8l-8-8-8 8"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="premium-card p-6 border-l-4 border-l-blue-500 relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all duration-500"></div>
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-bold mb-2">
                  {t('dashboard.balance', 'Balance')}
                </p>
                <p
                  className={`text-2xl font-extrabold ${stats.balance >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-500'}`}
                >
                  {stats.balance.toLocaleString()}{' '}
                  <span className="text-sm font-medium text-slate-400">
                    {user.currency || 'SAR'}
                  </span>
                </p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-500/10 rounded-2xl p-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-7 w-7 text-blue-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="premium-card p-6 border-l-4 border-l-purple-500 relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all duration-500"></div>
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-bold mb-2">
                  {t('dashboard.transactions', 'Transactions')}
                </p>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {stats.transactionCount}
                </p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-500/10 rounded-2xl p-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-7 w-7 text-purple-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Joint Funds Area (New Feature) */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center">
              الصناديق المشتركة
            </h2>
            <Link
              to="/funds"
              className="text-primary hover:text-green-500 dark:hover:text-green-400 text-sm font-bold transition-colors bg-green-50 dark:bg-green-500/10 px-4 py-2 rounded-full"
            >
              إدارة الصناديق
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {DEMO_FUNDS.map(fund => (
              <div
                key={fund.id}
                className="luxury-gradient rounded-[2rem] shadow-xl p-7 text-white relative overflow-hidden transition-transform duration-300 hover:-translate-y-2 group cursor-pointer"
              >
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4"></div>

                {/* NFC Icon / Chip */}
                <div className="relative z-10 flex justify-between items-start mb-8">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-10 w-10 text-white/80"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                  <div className="bg-white/20 backdrop-blur-md rounded-full px-3 py-1 text-xs font-bold tracking-wider">
                    نشط
                  </div>
                </div>

                <div className="relative z-10 mb-6">
                  <p className="text-white/70 text-xs font-bold tracking-widest uppercase mb-1">
                    الرصيد المتاح
                  </p>
                  <div className="flex items-end">
                    <p className="text-4xl font-extrabold tracking-tight">
                      {fund.balance.toLocaleString()}
                    </p>
                    <span className="text-lg font-medium ml-2 text-white/80 mb-1">
                      {user.currency || 'SAR'}
                    </span>
                  </div>
                </div>

                <div className="relative z-10 flex justify-between items-end">
                  <div>
                    <h3 className="text-xl font-bold">{fund.name}</h3>
                    <p className="text-white/60 text-xs mt-1 font-medium">
                      {fund._count.transactions} عمليات مسجلة
                    </p>
                  </div>
                  <div className="flex -space-x-2 space-x-reverse">
                    {[1, 2, 3].map(i => (
                      <div
                        key={i}
                        className="w-8 h-8 rounded-full bg-white/20 border-2 border-transparent backdrop-blur-sm flex items-center justify-center text-xs font-bold shadow-sm"
                      >
                        U
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {/* Create New Fund Card */}
            <div className="border-[3px] border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] flex flex-col items-center justify-center p-8 text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-[#0f172a]/50 hover:text-primary dark:hover:text-primary hover:border-primary/50 transition-all cursor-pointer group">
              <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-5 mb-4 group-hover:scale-110 transition-transform duration-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M12 4v16m8-8l-8 8-8-8"
                  />
                </svg>
              </div>
              <span className="font-extrabold text-lg text-slate-700 dark:text-slate-300 group-hover:text-primary transition-colors">
                إنشاء صندوق جديد
              </span>
              <span className="text-sm mt-2 font-medium">شارك ميزانيتك مع العائلة أو الشركاء</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Transactions */}
          <div className="premium-card lg:col-span-2 overflow-hidden">
            <div className="px-7 py-6 border-b border-slate-100 dark:border-white/[0.05]">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {t('dashboard.recentTransactions', 'Recent Transactions')}
                </h2>
                <Link
                  to="/transactions"
                  className="text-primary hover:text-green-600 dark:hover:text-green-400 text-sm font-bold transition-colors"
                >
                  {t('dashboard.viewAll', 'View All')} &rarr;
                </Link>
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-white/[0.05]">
              {recentTransactions.length > 0 ? (
                recentTransactions.map(transaction => (
                  <div
                    key={transaction.id}
                    className="p-6 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-5 space-x-reverse">
                        <div
                          className={`p-4 rounded-2xl transition-transform group-hover:scale-105 ${transaction.type === 'income' ? 'bg-green-50 dark:bg-green-500/10' : 'bg-rose-50 dark:bg-rose-500/10'}`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`h-6 w-6 ${transaction.type === 'income' ? 'text-green-500' : 'text-rose-500'}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            {transaction.type === 'income' ? (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2.5}
                                d="M12 4v16m8-8l-8 8-8-8"
                              />
                            ) : (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2.5}
                                d="M12 20V4m8 8l-8-8-8 8"
                              />
                            )}
                          </svg>
                        </div>
                        <div>
                          <p className="text-base font-bold text-slate-900 dark:text-white mb-1 group-hover:text-primary transition-colors">
                            {transaction.description}
                          </p>
                          <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 font-medium">
                            <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-xs mr-2">
                              {user.language === 'ar'
                                ? transaction.category?.nameAr || transaction.category?.name
                                : transaction.category?.name}
                            </span>
                            <span>{new Date(transaction.date).toLocaleDateString()}</span>
                            {transaction.fund && (
                              <>
                                <span className="mx-2">•</span>
                                <span className="text-primary">{transaction.fund.name}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div
                        className={`text-lg font-extrabold ${transaction.type === 'income' ? 'text-green-500' : 'text-slate-900 dark:text-white'}`}
                      >
                        {transaction.type === 'income' ? '+' : '-'}
                        {parseFloat(transaction.amount).toLocaleString()}{' '}
                        <span className="text-sm font-medium text-slate-400">
                          {user.currency || 'SAR'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-slate-500 dark:text-slate-400">
                  <div className="bg-slate-100 dark:bg-[#0f172a] h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-5 border border-slate-200 dark:border-white/[0.05]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-10 w-10 text-slate-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                      />
                    </svg>
                  </div>
                  <p className="font-medium text-lg">
                    {t('transactions.noTransactions', 'No transactions yet.')}
                  </p>
                  <Link
                    to="/transactions"
                    className="mt-4 inline-block bg-primary text-white px-6 py-2.5 rounded-full font-bold shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all"
                  >
                    {t('transactions.addFirstTransaction', 'Add your first transaction')}
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="premium-card h-max">
            <div className="px-7 py-6 border-b border-slate-100 dark:border-white/[0.05]">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                {t('dashboard.quickActions', 'Quick Actions')}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <Link
                to="/transactions"
                className="flex items-center justify-between p-5 bg-slate-50 dark:bg-[#0f172a] rounded-2xl hover:bg-green-50 dark:hover:bg-white/[0.02] border border-transparent dark:border-white/[0.05] hover:border-green-200 dark:hover:border-white/10 transition-all group"
              >
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className="bg-primary rounded-xl p-3 shadow-md shadow-primary/20 group-hover:scale-110 transition-transform duration-300">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M12 4v16m8-8l-8 8-8-8"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-extrabold text-slate-900 dark:text-white text-base">
                      {t('dashboard.addTransaction', 'Add Transaction')}
                    </p>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                      {t('dashboard.recordIncomeExpense', 'Record income or expense')}
                    </p>
                  </div>
                </div>
                <div className="bg-white dark:bg-white/5 rounded-full p-2 shadow-sm border border-slate-100 dark:border-transparent group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 rtl:rotate-180"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </Link>

              <Link
                to="/budget"
                className="flex items-center justify-between p-5 bg-slate-50 dark:bg-[#0f172a] rounded-2xl hover:bg-blue-50 dark:hover:bg-white/[0.02] border border-transparent dark:border-white/[0.05] hover:border-blue-200 dark:hover:border-white/10 transition-all group"
              >
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className="bg-blue-500 rounded-xl p-3 shadow-md shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-extrabold text-slate-900 dark:text-white text-base">
                      {t('dashboard.manageBudget', 'Manage Budget')}
                    </p>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                      {t('dashboard.setSpendingLimits', 'Set spending limits')}
                    </p>
                  </div>
                </div>
                <div className="bg-white dark:bg-white/5 rounded-full p-2 shadow-sm border border-slate-100 dark:border-transparent group-hover:bg-blue-500 group-hover:text-white group-hover:border-blue-500 transition-all">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 rtl:rotate-180"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </Link>

              <div className="pt-6 mt-6 border-t border-slate-100 dark:border-white/[0.05]">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-100 to-transparent dark:from-slate-800/50 rounded-2xl">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse mr-3 ml-3"></div>
                    <span className="text-sm font-extrabold text-slate-700 dark:text-slate-300">
                      {t('dashboard.activeBudgets', 'Active Budgets')}
                    </span>
                  </div>
                  <span className="px-4 py-1.5 bg-white dark:bg-[#0f172a] text-slate-900 dark:text-white rounded-full text-sm font-bold shadow-sm border border-slate-200 dark:border-white/10">
                    {stats.budgetCount} ميزانيات
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
