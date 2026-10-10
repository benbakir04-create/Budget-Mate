import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useState, useEffect } from 'react';

const Sidebar = () => {
  const { t } = useTranslation();
  const { user, logout, isDemoMode } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Dark mode logic
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const isActive = (path) => {
    return location.pathname === path;
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="md:hidden fixed top-4 right-4 z-50 p-3 rounded-2xl bg-white dark:bg-[#0f172a] shadow-lg shadow-black/5 dark:shadow-none border border-slate-100 dark:border-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 focus:outline-none transition-all duration-300"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Floating Sidebar Container for Desktop, Full height for mobile */}
      <div className={`fixed inset-y-0 right-0 z-40 w-72 md:w-64 transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] md:translate-x-0 ${
        isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
      } md:bg-transparent md:border-none md:shadow-none md:p-4`}>
        
        {/* Inner Card (Floating effect) */}
        <div className="flex flex-col h-full bg-white dark:bg-[#0f172a] md:rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none md:border md:border-slate-100 dark:border-white/[0.05] overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 md:p-7 border-b border-slate-50 dark:border-white/[0.02]">
            <Link to="/dashboard" className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center group">
              <div className="bg-primary/10 dark:bg-primary/20 p-2 rounded-xl ml-3 group-hover:scale-110 transition-transform duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.64-2.1 1.64-1.54 0-2.21-.91-2.26-1.7H8.04c.05 1.86 1.31 2.92 2.86 3.27V19h2.34v-1.64c1.65-.37 2.86-1.36 2.86-2.99 0-2.15-1.84-2.83-3.79-3.23z"/>
                </svg>
              </div>
              {localStorage.getItem('appName') || import.meta.env.VITE_APP_NAME || 'وازن'}
            </Link>
            <button
              onClick={toggleSidebar}
              className="md:hidden p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 focus:outline-none transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* User Info Minimal */}
          <div className="p-6 mx-4 mt-4 bg-slate-50 dark:bg-white/[0.02] rounded-2xl border border-slate-100 dark:border-white/[0.05]">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="w-12 h-12 rounded-xl luxury-gradient flex items-center justify-center text-white font-extrabold text-lg shadow-md shadow-primary/20">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">{user?.name || t('auth.name', 'User')}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{user?.email || 'demo@budgetmate.com'}</p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            <Link
              to="/dashboard"
              className={`flex items-center px-4 py-3.5 rounded-2xl text-sm font-extrabold transition-all duration-300 ${
                isActive('/dashboard')
                  ? 'bg-primary text-white shadow-lg shadow-primary/30'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
              }`}
              onClick={() => setIsSidebarOpen(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ml-4 ${isActive('/dashboard') ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              {t('dashboard.title', 'Dashboard')}
            </Link>
            
            <Link
              to="/transactions"
              className={`flex items-center px-4 py-3.5 rounded-2xl text-sm font-extrabold transition-all duration-300 ${
                isActive('/transactions')
                  ? 'bg-primary text-white shadow-lg shadow-primary/30'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
              }`}
              onClick={() => setIsSidebarOpen(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ml-4 ${isActive('/transactions') ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              {t('transactions.title', 'Transactions')}
            </Link>
            
            <Link
              to="/budget"
              className={`flex items-center px-4 py-3.5 rounded-2xl text-sm font-extrabold transition-all duration-300 ${
                isActive('/budget')
                  ? 'bg-primary text-white shadow-lg shadow-primary/30'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
              }`}
              onClick={() => setIsSidebarOpen(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ml-4 ${isActive('/budget') ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              {t('budget.title', 'Budgets')}
            </Link>

            <div className="py-2">
              <div className="h-px w-full bg-slate-100 dark:bg-white/5"></div>
            </div>

            <Link
              to="/funds"
              className={`flex items-center px-4 py-3.5 rounded-2xl text-sm font-extrabold transition-all duration-300 ${
                isActive('/funds')
                  ? 'bg-primary text-white shadow-lg shadow-primary/30'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
              }`}
              onClick={() => setIsSidebarOpen(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ml-4 ${isActive('/funds') ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              الصناديق المشتركة
            </Link>
          </nav>

          {/* Footer Actions */}
          <div className="p-4 border-t border-slate-50 dark:border-white/[0.02]">
            <div className="space-y-1">
              {isDemoMode ? (
                <Link
                  to="/register"
                  className="flex items-center px-4 py-3.5 rounded-2xl text-sm font-extrabold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-all duration-300"
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-4 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  {t('auth.register', 'Register')}
                </Link>
              ) : (
                <>
                  <Link
                    to="/profile"
                    className="flex items-center px-4 py-3.5 rounded-2xl text-sm font-extrabold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-all duration-300"
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-4 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {t('profile.title', 'Profile')}
                  </Link>
                  <Link
                    to="/settings"
                    className={`flex items-center px-4 py-3.5 rounded-2xl text-sm font-extrabold transition-all duration-300 ${
                      isActive('/settings')
                        ? 'bg-primary text-white shadow-lg shadow-primary/30'
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ml-4 ${isActive('/settings') ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {t('settings.title', 'Settings')}
                  </Link>
                </>
              )}
              
              <button
                onClick={toggleDarkMode}
                className="flex items-center w-full px-4 py-3.5 rounded-2xl text-sm font-extrabold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 focus:outline-none transition-all duration-300"
              >
                {darkMode ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75-.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18.75a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-1.5a.75.75 0 01.75-.75zM6.166 18.894a.75.75 0 001.06 1.06l1.59-1.591a.75.75 0 10-1.06-1.061l-1.591 1.59zM4.5 12a.75.75 0 01-.75-.75H1.5a.75.75 0 010 1.5h2.25a.75.75 0 01.75-.75zM6.166 5.106a.75.75 0 00-1.06 1.06l1.591 1.59a.75.75 0 101.06-1.06l-1.59-1.59z" />
                    </svg>
                    <span>الوضع الفاتح</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-4 text-indigo-500" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clipRule="evenodd" />
                    </svg>
                    <span>الوضع الداكن</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  logout();
                  setIsSidebarOpen(false);
                }}
                className="flex items-center w-full px-4 py-3.5 rounded-2xl text-sm font-extrabold text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 focus:outline-none transition-all duration-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                {t('auth.logout', 'Logout')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm transition-opacity"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
};

export default Sidebar;
