import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useQuickAdd } from '../contexts/QuickAddContext';
import Sidebar from '../components/common/Sidebar';
import Money from '../components/common/Money';
import Icon from '../components/common/Icon';
import CategoryIcon, { categoryTint } from '../components/common/CategoryIcon';
import { transactionService } from '../services/transactionService';
import { budgetService } from '../services/budgetService';
import { jointFundService } from '../services/jointFundService';
import { categoryService } from '../services/categoryService';
import { amountSign, fundOutlook } from '../utils/money';
import { formatDate, formatDay } from '../utils/dates';

const MONTH = new Intl.DateTimeFormat('ar-DZ-u-nu-latn', { month: 'long' });

const greeting = () => (new Date().getHours() < 12 ? 'صباح الخير' : 'مساء الخير');

const firstOfMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
};

const outlookText = outlook => {
  if (outlook.remainingPct === 0) return 'الصندوق فارغ. موّله لتكمل الشهر.';
  if (outlook.coversMonth) return 'بهذا المعدّل يكفي حتى آخر الشهر';
  return `بهذا المعدّل يكفي حتى ${formatDate(outlook.runsOutOn)}`;
};

// The badge on a category card: its share of the budget when it has one.
const budgetBadge = budget => {
  if (!budget || !(Number(budget.amount) > 0)) return null;
  const pct = Math.round((Number(budget.spent) / Number(budget.amount)) * 100);
  if (pct >= 100) return { text: 'تجاوز', className: 'bg-alert-500 text-white' };
  if (pct >= 75) return { text: `${pct}%`, className: 'bg-sun-400 text-ink' };
  return { text: `${pct}%`, className: 'bg-white/80 dark:bg-white/10 text-ink dark:text-white' };
};

const amountTone = type => {
  if (type === 'income') return 'text-mint-600 dark:text-mint-400';
  if (type === 'transfer') return 'text-brand-600 dark:text-brand-300';
  return 'text-ink dark:text-white';
};

const QuickAction = ({ icon, label, className, to, onClick }) => {
  const inner = (
    <>
      <span className={`h-14 w-14 rounded-[20px] grid place-items-center ${className}`}>
        <Icon name={icon} className="h-6 w-6" />
      </span>
      <span className="text-xs font-medium text-ink dark:text-stone-200">{label}</span>
    </>
  );
  const cls =
    'flex flex-col items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-2xl';
  return to ? (
    <Link to={to} className={cls}>
      {inner}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const { openQuickAdd, savedCount } = useQuickAdd();
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      const since = firstOfMonth();
      const [recent, month, budgets, funds, categories] = await Promise.all([
        transactionService.getTransactions({ limit: 5 }),
        transactionService.getSummary({ startDate: since }),
        budgetService.getBudgets(),
        jointFundService.getJointFunds(),
        categoryService.getCategories(),
      ]);
      const fund = funds[0] || null;
      const fundMonth = fund
        ? await transactionService.getSummary({ fundId: fund.id, startDate: since })
        : null;
      setData({
        recent: recent.transactions || [],
        month,
        budgets,
        funds,
        fund,
        fundSpent: fundMonth?.expense || 0,
        categories,
      });
      setError(false);
    } catch (err) {
      console.error('Failed to load the home screen', err);
      setError(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, savedCount]);

  const isPartner = user?.role === 'partner';
  const currency = user?.currency;

  if (!data) {
    return (
      <div className="min-h-screen flex">
        <Sidebar />
        <main className="flex-1 md:mr-64 p-4 md:p-8 pt-20 md:pt-8 max-w-6xl">
          {error ? (
            <div className="premium-card p-6 text-center">
              <p className="text-ink dark:text-white font-medium mb-3">تعذّر تحميل الرئيسية.</p>
              <button
                type="button"
                onClick={load}
                className="px-5 min-h-[44px] rounded-2xl bg-brand-500 text-white font-medium"
              >
                حاول مرة أخرى
              </button>
            </div>
          ) : (
            <div className="space-y-4 animate-pulse" aria-label="جارٍ التحميل">
              <div className="h-12 w-48 rounded-2xl bg-soft dark:bg-white/5" />
              <div className="h-48 rounded-[30px] bg-soft dark:bg-white/5" />
              <div className="h-20 rounded-[24px] bg-soft dark:bg-white/5" />
            </div>
          )}
        </main>
      </div>
    );
  }

  const { recent, month, budgets, funds, fund, fundSpent, categories } = data;
  const categoryById = new Map(categories.map(c => [c.id, c]));
  const budgetByCategory = new Map(budgets.map(b => [b.categoryId, b]));
  const topCategories = (month.expenseByCategory || []).slice(0, 4);
  const outlook = fund ? fundOutlook({ balance: fund.balance, spent: fundSpent }) : null;
  const firstName = user?.name?.trim().split(/\s+/)[0] || '';

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 md:mr-64 p-4 md:p-8 pt-20 md:pt-8 w-full max-w-6xl">
        <header className="flex items-center gap-3 mb-5">
          <span className="h-11 w-11 rounded-full grid place-items-center bg-sun-300 text-sun-900 font-semibold text-lg">
            {user?.name?.trim().charAt(0) || '؟'}
          </span>
          <div>
            <p className="text-sm text-stone-500 dark:text-stone-400">{greeting()}</p>
            <h1 className="text-xl font-semibold text-ink dark:text-white">{firstName}</h1>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr] items-start">
          <div className="space-y-6">
            {/* Balance hero */}
            <section className="luxury-gradient rounded-[30px] p-5 md:p-6 text-white shadow-[0_18px_34px_rgba(18,162,110,0.30)]">
              {fund ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[13px] bg-white/20 rounded-full px-3 py-1">
                      {fund.name} · {MONTH.format(new Date())}
                    </span>
                    {funds.length > 1 && (
                      <Link
                        to="/funds"
                        className="text-[13px] text-white/90 underline-offset-4 hover:underline"
                      >
                        كل الصناديق
                      </Link>
                    )}
                  </div>
                  <p className="text-sm text-white/85">متاح الآن</p>
                  <Money
                    amount={fund.balance}
                    currency={currency}
                    className="block text-[42px] leading-tight font-bold tracking-tight"
                    currencyClassName="text-white/85"
                  />
                  <div className="mt-4 space-y-1.5">
                    <div className="h-2.5 rounded-full bg-white/25 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-sun-300"
                        style={{ width: `${outlook.remainingPct}%` }}
                      />
                    </div>
                    <div className="flex justify-between gap-3 text-xs text-white/90">
                      <span>
                        بقي <span className="num">{outlook.remainingPct}%</span> من{' '}
                        <Money amount={outlook.total} currency={currency} />
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon name="clock" className="h-3.5 w-3.5" />
                        {outlookText(outlook)}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <span className="text-[13px] bg-white/20 rounded-full px-3 py-1">
                    {MONTH.format(new Date())}
                  </span>
                  <p className="text-sm text-white/85 mt-4">الباقي هذا الشهر</p>
                  <Money
                    amount={month.balance}
                    currency={currency}
                    sign={month.balance < 0 ? '-' : ''}
                    className="block text-[42px] leading-tight font-bold tracking-tight"
                    currencyClassName="text-white/85"
                  />
                  <p className="mt-3 text-xs text-white/90">
                    دخل <Money amount={month.income} currency={currency} /> · صُرف{' '}
                    <Money amount={month.expense} currency={currency} />
                  </p>
                </>
              )}
            </section>

            {/* Quick actions */}
            <nav aria-label="إجراءات سريعة" className="grid grid-cols-4 gap-2">
              <QuickAction
                icon="plus"
                label="مصروف"
                onClick={openQuickAdd}
                className="bg-brand-500 text-white shadow-[0_8px_18px_rgba(18,162,110,0.35)]"
              />
              {isPartner ? (
                <QuickAction
                  icon="list"
                  label="العمليات"
                  to="/transactions"
                  className="bg-sun-100 text-sun-700 dark:bg-sun-500/15 dark:text-sun-300"
                />
              ) : (
                <QuickAction
                  icon="down"
                  label="تمويل"
                  to="/funds"
                  className="bg-sun-100 text-sun-700 dark:bg-sun-500/15 dark:text-sun-300"
                />
              )}
              <QuickAction
                icon="bag"
                label="طلبية"
                to="/funds"
                className="bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-300"
              />
              <QuickAction
                icon="target"
                label="ميزانية"
                to="/budget"
                className="bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300"
              />
            </nav>

            {/* Categories this month */}
            <section aria-labelledby="h-cats">
              <div className="flex items-baseline justify-between mb-3">
                <h2 id="h-cats" className="text-base font-semibold text-ink dark:text-white">
                  أين ذهب المال هذا الشهر؟
                </h2>
                <Link
                  to="/budget"
                  className="text-sm text-brand-600 dark:text-brand-300 font-medium"
                >
                  الميزانيات
                </Link>
              </div>
              {topCategories.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {topCategories.map(({ categoryId, total }) => {
                    const category = categoryById.get(categoryId);
                    const badge = budgetBadge(budgetByCategory.get(categoryId));
                    return (
                      <Link
                        key={categoryId}
                        to="/transactions"
                        className="rounded-[24px] p-4 bg-soft dark:bg-white/5 flex flex-col gap-3 transition-transform hover:-translate-y-0.5"
                        style={{ backgroundColor: categoryTint(category?.color, '2E') }}
                      >
                        <div className="flex items-center justify-between">
                          <CategoryIcon
                            category={category}
                            tinted={false}
                            className="h-10 w-10 text-lg !bg-white/80 dark:!bg-white/10"
                          />
                          {badge && (
                            <span
                              className={`text-[11.5px] font-semibold px-2.5 py-0.5 rounded-full ${badge.className}`}
                            >
                              {badge.text}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-ink dark:text-white truncate">
                            {category?.nameAr || category?.name || 'بلا قسم'}
                          </p>
                          <Money
                            amount={total}
                            currency={currency}
                            className="text-lg font-bold text-ink dark:text-white"
                          />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="premium-card p-5 text-center">
                  <p className="text-stone-500 dark:text-stone-400 mb-3">
                    لا مصاريف هذا الشهر بعد.
                  </p>
                  <button
                    type="button"
                    onClick={openQuickAdd}
                    className="px-5 min-h-[44px] rounded-2xl bg-brand-500 text-white font-medium"
                  >
                    سجّل أول مصروف
                  </button>
                </div>
              )}
            </section>
          </div>

          {/* Recent transactions */}
          <section aria-labelledby="h-recent" className="lg:pt-0">
            <div className="flex items-baseline justify-between mb-3">
              <h2 id="h-recent" className="text-base font-semibold text-ink dark:text-white">
                آخر العمليات
              </h2>
              <Link
                to="/transactions"
                className="text-sm text-brand-600 dark:text-brand-300 font-medium"
              >
                عرض الكل
              </Link>
            </div>
            <div className="premium-card divide-y divide-stone-100 dark:divide-white/5">
              {recent.length > 0 ? (
                recent.map(tx => (
                  <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
                    <CategoryIcon category={tx.category} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink dark:text-white truncate">
                        {tx.description || tx.category?.nameAr || tx.category?.name}
                      </p>
                      <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
                        {[tx.user?.name?.trim().split(/\s+/)[0], formatDay(tx.date), tx.fund?.name]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>
                    <Money
                      amount={tx.amount}
                      currency={tx.currency || currency}
                      sign={amountSign(tx.type)}
                      className={`text-[15px] font-semibold ${amountTone(tx.type)}`}
                      currencyClassName="text-stone-400"
                    />
                  </div>
                ))
              ) : (
                <p className="p-6 text-center text-stone-500 dark:text-stone-400">لا عمليات بعد.</p>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
