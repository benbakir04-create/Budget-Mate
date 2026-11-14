import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useQuickAdd } from '../contexts/QuickAddContext';
import Sidebar from '../components/common/Sidebar';
import Money from '../components/common/Money';
import Icon from '../components/common/Icon';
import CategoryIcon from '../components/common/CategoryIcon';
import { budgetService } from '../services/budgetService';
import { categoryService } from '../services/categoryService';
import { currencyLabel } from '../utils/currency';
import { budgetStatus, formatAmount } from '../utils/money';
import { formatDate } from '../utils/dates';

const PERIODS = [
  ['weekly', 'أسبوعية'],
  ['monthly', 'شهرية'],
  ['yearly', 'سنوية'],
];
const PERIOD_LABEL = Object.fromEntries(PERIODS);

const STATE_STYLE = {
  ok: {
    label: 'مريح',
    pill: 'bg-mint-100 text-mint-700 dark:bg-mint-500/15 dark:text-mint-300',
    bar: 'bg-brand-500',
  },
  near: {
    label: 'اقترب',
    pill: 'bg-sun-100 text-sun-700 dark:bg-sun-500/15 dark:text-sun-300',
    bar: 'bg-sun-500',
  },
  over: {
    label: 'تجاوز',
    pill: 'bg-alert-50 text-alert-600 dark:bg-alert-500/15 dark:text-alert-400',
    bar: 'bg-alert-500',
  },
};
const STATE_ORDER = { over: 0, near: 1, ok: 2 };

// Local YYYY-MM-DD, so the 1st of the month stays the 1st whatever the time zone.
const dayInput = date => {
  const pad = n => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

// The current week (Saturday to Friday, as in Algeria), month or year.
const periodRange = period => {
  const now = new Date();
  if (period === 'weekly') {
    const start = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - ((now.getDay() + 1) % 7)
    );
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
    return { startDate: dayInput(start), endDate: dayInput(end) };
  }
  if (period === 'yearly') {
    return {
      startDate: dayInput(new Date(now.getFullYear(), 0, 1)),
      endDate: dayInput(new Date(now.getFullYear(), 11, 31)),
    };
  }
  return {
    startDate: dayInput(new Date(now.getFullYear(), now.getMonth(), 1)),
    endDate: dayInput(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  };
};

const categoryName = category => category?.nameAr || category?.name || '';

// One plain sentence under each budget: how much is left, or by how much it went over.
const BudgetLine = ({ status, currency }) => {
  if (status.state === 'over' && status.left < 0) {
    return (
      <>
        تجاوزتم بـ{' '}
        <Money amount={-status.left} currency={currency} className="font-semibold text-alert-600" />
      </>
    );
  }
  return (
    <>
      بقي{' '}
      <Money
        amount={status.left}
        currency={currency}
        className="font-semibold text-ink dark:text-white"
      />
    </>
  );
};

const ERROR_MESSAGES = {
  BUDGET_EXISTS: 'لهذا القسم ميزانية في هذه الفترة.',
};

const Budget = () => {
  const { user } = useAuth();
  const { savedCount } = useQuickAdd();
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [budgetsData, categoriesData] = await Promise.all([
        budgetService.getBudgets(),
        categoryService.getCategories(),
      ]);
      setBudgets(budgetsData);
      setCategories(categoriesData.filter(c => c.type === 'expense'));
    } catch (err) {
      setNotice({ tone: 'error', text: 'تعذّر تحميل الميزانيات، حاول مرة أخرى.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData, savedCount]);

  const handleDelete = async budget => {
    if (!window.confirm(`حذف ميزانية «${categoryName(budget.category)}»؟`)) return;
    try {
      await budgetService.deleteBudget(budget.id);
      setNotice({ tone: 'success', text: 'حُذفت الميزانية.' });
      loadData();
    } catch (err) {
      setNotice({ tone: 'error', text: 'تعذّر حذف الميزانية.' });
    }
  };

  const currency = user?.currency;
  const rows = budgets
    .map(budget => ({ budget, status: budgetStatus(budget) }))
    .sort(
      (a, b) =>
        STATE_ORDER[a.status.state] - STATE_ORDER[b.status.state] || b.status.pct - a.status.pct
    );
  const totalLimit = rows.reduce((sum, r) => sum + r.status.limit, 0);
  const totalSpent = rows.reduce((sum, r) => sum + r.status.spent, 0);
  const total = budgetStatus({ amount: totalLimit, spent: totalSpent });
  const overCount = rows.filter(r => r.status.state === 'over').length;
  const nearCount = rows.filter(r => r.status.state === 'near').length;

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 md:mr-64 p-4 md:p-8 pt-20 md:pt-8 w-full max-w-5xl">
        <header className="flex items-center justify-between gap-3 mb-5">
          <h1 className="text-2xl font-bold text-ink dark:text-white">الميزانيات</h1>
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="min-h-[44px] px-4 inline-flex items-center gap-1.5 rounded-full bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold shadow-lg shadow-brand-500/25"
          >
            <Icon name="plus" className="h-4 w-4" strokeWidth={2.6} />
            ميزانية جديدة
          </button>
        </header>

        {notice && (
          <p
            role="status"
            className={`mb-4 rounded-2xl px-4 py-3 text-sm font-medium ${
              notice.tone === 'success'
                ? 'bg-mint-100 text-mint-700 dark:bg-mint-500/15 dark:text-mint-300'
                : 'bg-alert-50 text-alert-600 dark:bg-alert-500/15 dark:text-alert-400'
            }`}
          >
            {notice.text}
          </p>
        )}

        {loading ? (
          <div className="space-y-3" aria-busy="true">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="h-28 rounded-[24px] bg-white dark:bg-night-card animate-pulse"
              />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="premium-card p-8 text-center">
            <span className="mx-auto mb-4 h-16 w-16 grid place-items-center rounded-3xl bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
              <Icon name="target" className="h-8 w-8" />
            </span>
            <h2 className="text-lg font-bold text-ink dark:text-white mb-1">لا ميزانيات بعد</h2>
            <p className="text-sm text-stone-500 dark:text-stone-400 mb-5">
              حدّد سقفًا لقسم مثل البقالة أو الفواتير، ونخبرك حين تقتربون منه.
            </p>
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="min-h-[48px] px-6 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-semibold"
            >
              أضف أول ميزانية
            </button>
          </div>
        ) : (
          <>
            {/* Summary */}
            <section className="luxury-gradient rounded-[28px] p-5 md:p-6 text-white mb-5 shadow-xl shadow-brand-700/20">
              <p className="text-sm text-white/80 mb-1">صرفتم من مجموع الميزانيات</p>
              <p className="text-3xl md:text-4xl font-bold mb-1">
                <Money
                  amount={totalSpent}
                  currency={currency}
                  currencyClassName="text-lg text-white/80"
                />
              </p>
              <p className="text-sm text-white/80 mb-4">
                من{' '}
                <Money amount={totalLimit} currency={currency} currencyClassName="text-white/70" />
              </p>
              <div className="h-2.5 rounded-full bg-white/25 overflow-hidden mb-3">
                <div
                  className={`h-full rounded-full ${total.state === 'over' ? 'bg-alert-500' : 'bg-sun-300'}`}
                  style={{ width: `${Math.min(total.pct, 100)}%` }}
                />
              </div>
              <p className="text-sm font-medium">
                {overCount > 0
                  ? `${overCount === 1 ? 'ميزانية واحدة تجاوزت' : `${overCount} ميزانيات تجاوزت`} سقفها${nearCount > 0 ? `، و${nearCount} تقترب منه` : ''}.`
                  : nearCount > 0
                    ? `${nearCount === 1 ? 'ميزانية واحدة تقترب' : `${nearCount} ميزانيات تقترب`} من سقفها، والباقي مريح.`
                    : 'كل الميزانيات مريحة حتى الآن.'}
              </p>
            </section>

            {/* Budgets */}
            <div className="grid gap-3 md:grid-cols-2">
              {rows.map(({ budget, status }) => {
                const style = STATE_STYLE[status.state];
                return (
                  <article key={budget.id} className="premium-card p-4 group">
                    <div className="flex items-start gap-3 mb-3">
                      <CategoryIcon category={budget.category} className="h-12 w-12 text-2xl" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-ink dark:text-white truncate">
                          {categoryName(budget.category)}
                        </h3>
                        <p className="text-xs text-stone-500 dark:text-stone-400">
                          {PERIOD_LABEL[budget.period] || budget.period} · حتى{' '}
                          {formatDate(budget.endDate)}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${style.pill}`}
                      >
                        {style.label}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDelete(budget)}
                        aria-label={`حذف ميزانية ${categoryName(budget.category)}`}
                        className="h-8 w-8 -mt-1 -ml-1 grid place-items-center rounded-full text-stone-300 hover:text-alert-600 hover:bg-alert-50 dark:hover:bg-alert-500/10 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 transition"
                      >
                        <Icon name="trash" className="h-4 w-4" />
                      </button>
                    </div>
                    <div
                      className="h-2.5 rounded-full bg-soft dark:bg-white/5 overflow-hidden mb-2"
                      role="progressbar"
                      aria-valuenow={status.pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`صُرف ${status.pct}%`}
                    >
                      <div
                        className={`h-full rounded-full ${style.bar}`}
                        style={{ width: `${Math.min(status.pct, 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-sm text-stone-500 dark:text-stone-400">
                      <span>
                        <BudgetLine status={status} currency={currency} />
                      </span>
                      <span className="text-xs">
                        <span className="num">{formatAmount(status.spent)}</span> /{' '}
                        <Money amount={status.limit} currency={currency} /> ·{' '}
                        <span className="num">{status.pct}%</span>
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </main>

      <BudgetSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        categories={categories}
        budgets={budgets}
        currency={currency}
        onSaved={category => {
          setSheetOpen(false);
          setNotice({ tone: 'success', text: `أُضيفت ميزانية ${categoryName(category)}.` });
          loadData();
        }}
      />
    </div>
  );
};

// New budget in the same sheet style as quick add: amount, category, period.
const BudgetSheet = ({ open, onClose, categories, budgets, currency, onSaved }) => {
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [period, setPeriod] = useState('monthly');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const amountRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    setAmount('');
    setCategoryId('');
    setPeriod('monthly');
    setError(null);
    const focus = setTimeout(() => amountRef.current?.focus(), 50);
    const onKey = e => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(focus);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  // A category that already has a budget of this period can't take a second one.
  const taken = new Set(budgets.filter(b => b.period === period).map(b => b.categoryId));
  const canSave = parseFloat(amount) > 0 && categoryId && !taken.has(categoryId) && !saving;

  const handleSubmit = async e => {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      await budgetService.createBudget({
        categoryId,
        amount: parseFloat(amount),
        period,
        ...periodRange(period),
      });
      onSaved(categories.find(c => c.id === categoryId));
    } catch (err) {
      const code = err.response?.data?.error?.code;
      setError(ERROR_MESSAGES[code] || 'تعذّر الحفظ، حاول مرة أخرى.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center">
      <button
        type="button"
        aria-label="إغلاق"
        onClick={onClose}
        className="absolute inset-0 bg-ink/40 backdrop-blur-[2px] cursor-default"
      />
      <form
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="budget-sheet-title"
        className="relative w-full md:max-w-lg bg-white dark:bg-night-card rounded-t-[30px] md:rounded-[30px] px-5 pt-3 pb-6 shadow-2xl max-h-[92vh] overflow-y-auto"
      >
        <span className="block md:hidden mx-auto mb-3 h-1.5 w-11 rounded-full bg-stone-200 dark:bg-white/10" />
        <div className="flex items-center justify-between mb-4">
          <h2 id="budget-sheet-title" className="text-lg font-bold text-ink dark:text-white">
            ميزانية جديدة
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="h-10 w-10 grid place-items-center rounded-full bg-soft dark:bg-white/5 text-stone-500"
          >
            <Icon name="close" className="h-5 w-5" />
          </button>
        </div>

        <label className="block text-center mb-4">
          <span className="block text-sm text-stone-500 mb-1">السقف</span>
          <span className="flex items-baseline justify-center gap-2">
            <input
              ref={amountRef}
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0"
              style={{ width: `${Math.max(String(amount).length, 1) + 0.6}ch` }}
              className="num max-w-[11ch] bg-transparent text-center text-5xl font-bold text-ink dark:text-white placeholder:text-stone-300 focus:outline-none"
            />
            <span className="text-lg text-stone-500">{currencyLabel(currency)}</span>
          </span>
        </label>

        <div
          role="group"
          aria-label="الفترة"
          className="grid grid-cols-3 bg-soft dark:bg-white/5 rounded-2xl p-1 mb-4"
        >
          {PERIODS.map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={period === value}
              onClick={() => setPeriod(value)}
              className={`min-h-[38px] rounded-xl text-sm font-medium transition-colors ${
                period === value
                  ? 'bg-white dark:bg-night text-ink dark:text-white shadow-sm'
                  : 'text-stone-500 dark:text-stone-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-2 mb-5" role="group" aria-label="القسم">
          {categories.map(category => {
            const selected = category.id === categoryId;
            const isTaken = taken.has(category.id);
            return (
              <button
                key={category.id}
                type="button"
                aria-pressed={selected}
                disabled={isTaken}
                title={isTaken ? 'لهذا القسم ميزانية بالفعل' : undefined}
                onClick={() => setCategoryId(selected ? '' : category.id)}
                className={`flex flex-col items-center gap-1.5 rounded-2xl p-2 text-xs font-medium leading-tight border-2 transition-all disabled:opacity-35 ${
                  selected
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10 text-ink dark:text-white'
                    : 'border-transparent text-stone-600 dark:text-stone-300'
                }`}
              >
                <CategoryIcon category={category} className="h-11 w-11 text-xl" />
                <span className="line-clamp-2">{categoryName(category)}</span>
              </button>
            );
          })}
        </div>

        <button
          type="submit"
          disabled={!canSave}
          className="w-full min-h-[52px] rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-semibold shadow-lg shadow-brand-500/30 disabled:opacity-40 disabled:shadow-none transition-all"
        >
          {saving ? 'جارٍ الحفظ...' : 'حفظ الميزانية'}
        </button>

        {error && (
          <p role="alert" className="mt-4 text-center text-sm font-medium text-alert-500">
            {error}
          </p>
        )}
      </form>
    </div>
  );
};

export default Budget;
