import { Link, NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useQuickAdd } from '../../contexts/QuickAddContext';
import BrandMark from './BrandMark';
import BottomNav from './BottomNav';
import Icon from './Icon';
import { APP_NAME } from '../../brand';
import { saveTheme, watchTheme } from '../../utils/theme';

const LINKS = [
  { to: '/dashboard', icon: 'home', label: 'الرئيسية' },
  { to: '/transactions', icon: 'list', label: 'العمليات' },
  { to: '/budget', icon: 'target', label: 'الميزانيات' },
  { to: '/funds', icon: 'wallet', label: 'الصندوق' },
];

const rowClass = active =>
  `flex items-center gap-3 px-4 min-h-[48px] rounded-2xl text-sm font-medium transition-colors ${
    active
      ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300 font-semibold'
      : 'text-stone-500 dark:text-stone-400 hover:bg-soft dark:hover:bg-white/5 hover:text-ink dark:hover:text-white'
  }`;

// On a wide screen: a fixed white panel with the main pages and a «مصروف جديد» button.
// On the phone the pages live in the bottom bar, so the panel only holds the account,
// settings, night mode and sign out, and opens from the round account button at the top.
const Sidebar = () => {
  const { user, logout, isDemoMode } = useAuth();
  const { openQuickAdd } = useQuickAdd();
  const [open, setOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() =>
    document.documentElement.classList.contains('dark')
  );

  // Follows the saved choice, the phone's own setting, and changes made in Settings.
  useEffect(() => watchTheme(({ dark }) => setDarkMode(dark)), []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = e => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const initial = user?.name?.trim().charAt(0) || '؟';
  const close = () => setOpen(false);

  return (
    <>
      {/* Phone: the account button sits at the top of the page and scrolls away with it. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="حسابي والإعدادات"
        aria-expanded={open}
        className="md:hidden absolute top-4 left-4 z-30 h-11 w-11 rounded-full grid place-items-center bg-sun-300 text-sun-900 font-semibold text-lg ring-4 ring-white dark:ring-night-card shadow-[0_4px_12px_rgba(20,24,60,0.12)]"
      >
        {initial}
      </button>

      <aside
        className={`fixed inset-y-0 right-0 z-50 w-72 md:w-64 md:p-4 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] md:translate-x-0 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-label="القائمة"
      >
        <div className="flex flex-col h-full bg-white dark:bg-night-card md:rounded-[28px] shadow-[0_8px_30px_rgba(20,24,60,0.06)] overflow-hidden">
          <div className="flex items-center justify-between px-6 pt-6 pb-4">
            <Link
              to="/dashboard"
              onClick={close}
              className="flex items-center gap-2.5 text-2xl font-bold text-ink dark:text-white"
            >
              <BrandMark className="h-8 w-8" />
              {APP_NAME}
            </Link>
            <button
              type="button"
              onClick={close}
              aria-label="إغلاق القائمة"
              className="md:hidden h-10 w-10 grid place-items-center rounded-full bg-soft dark:bg-white/5 text-stone-500"
            >
              <Icon name="close" className="h-5 w-5" />
            </button>
          </div>

          <div className="mx-4 flex items-center gap-3 rounded-2xl bg-soft dark:bg-white/5 p-3">
            <span className="h-11 w-11 shrink-0 rounded-full grid place-items-center bg-sun-300 text-sun-900 font-semibold text-lg">
              {initial}
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-ink dark:text-white truncate">{user?.name}</p>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {user?.role === 'partner' ? 'شريك' : 'المالك'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => openQuickAdd('expense')}
            className="hidden md:flex mx-4 mt-4 min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-semibold shadow-lg shadow-brand-500/25"
          >
            <Icon name="plus" className="h-5 w-5" strokeWidth={2.4} />
            مصروف جديد
          </button>

          <nav className="hidden md:block flex-1 px-4 py-5 space-y-1 overflow-y-auto">
            {LINKS.map(link => (
              <NavLink key={link.to} to={link.to} className={({ isActive }) => rowClass(isActive)}>
                {({ isActive }) => (
                  <>
                    <Icon name={link.icon} className="h-5 w-5" filled={isActive} />
                    {link.label}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="p-4 mt-2 md:mt-0 space-y-1 border-t border-stone-100 dark:border-white/5">
            {isDemoMode ? (
              <Link to="/register" onClick={close} className={rowClass(false)}>
                <Icon name="user" className="h-5 w-5" />
                أنشئ حسابك
              </Link>
            ) : (
              <NavLink
                to="/settings"
                onClick={close}
                className={({ isActive }) => rowClass(isActive)}
              >
                <Icon name="gear" className="h-5 w-5" />
                الإعدادات
              </NavLink>
            )}
            <button
              type="button"
              onClick={() => saveTheme(darkMode ? 'light' : 'dark')}
              className={`${rowClass(false)} w-full`}
            >
              <Icon name={darkMode ? 'sun' : 'moon'} className="h-5 w-5" />
              {darkMode ? 'الوضع الفاتح' : 'الوضع الليلي'}
            </button>
            <button
              type="button"
              onClick={() => {
                close();
                logout();
              }}
              className="flex items-center gap-3 px-4 min-h-[48px] w-full rounded-2xl text-sm font-medium text-alert-500 hover:bg-alert-50 dark:hover:bg-alert-500/10"
            >
              <Icon name="logout" className="h-5 w-5" />
              تسجيل الخروج
            </button>
          </div>
        </div>
      </aside>

      {open && (
        <button
          type="button"
          aria-label="إغلاق القائمة"
          onClick={close}
          className="md:hidden fixed inset-0 z-[45] bg-ink/40 backdrop-blur-[2px] cursor-default"
        />
      )}

      <BottomNav />
    </>
  );
};

export default Sidebar;
