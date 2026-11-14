import { useState, useEffect } from 'react';
import { categoryService } from '../services/categoryService';
import { transactionService } from '../services/transactionService';
import { currencyLabel } from '../utils/currency';
import { formatAmount } from '../utils/money';

const ERROR_MESSAGES = {
  FUND_EXPENSE_ONLY: 'الصندوق يقبل المصاريف فقط.',
  INVALID_CATEGORY: 'هذا القسم غير متاح، اختر قسمًا آخر.',
  INVALID_FUND: 'هذا الصندوق غير متاح.',
  FORBIDDEN: 'لا تملك صلاحية التسجيل في هذا القسم.',
};

// Records an expense in three taps: amount, category chip, save.
// A partner spends from the fund by default; the owner from their own pocket.
const QuickAdd = ({ funds, user, onSaved }) => {
  const [categories, setCategories] = useState([]);
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [fundId, setFundId] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    categoryService
      .getCategories()
      .then(all =>
        setCategories(
          all
            .filter(c => c.type === 'expense')
            // Arabic alphabetical order, with the catch-all "other" category last.
            .sort((a, b) => {
              const aOther = a.name?.startsWith('Other') ? 1 : 0;
              const bOther = b.name?.startsWith('Other') ? 1 : 0;
              if (aOther !== bOther) return aOther - bOther;
              return (a.nameAr || a.name).localeCompare(b.nameAr || b.name, 'ar');
            })
        )
      )
      .catch(err => console.error('Failed to load categories', err));
  }, []);

  useEffect(() => {
    if (user?.role === 'partner' && funds.length > 0 && !fundId) {
      setFundId(funds[0].id);
    }
  }, [funds, user, fundId]);

  const canSave = parseFloat(amount) > 0 && categoryId && !saving;

  const handleSubmit = async e => {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    setMessage(null);
    try {
      await transactionService.createTransaction({
        amount: parseFloat(amount),
        type: 'expense',
        categoryId,
        fundId: fundId || undefined,
        date: new Date().toISOString(),
      });
      const category = categories.find(c => c.id === categoryId);
      setMessage({
        tone: 'success',
        text: `سُجّل ${formatAmount(amount)} ${currencyLabel(user?.currency)} في ${category?.nameAr || category?.name}.`,
      });
      setAmount('');
      setCategoryId('');
      onSaved?.();
    } catch (err) {
      const code = err.response?.data?.error?.code;
      setMessage({ tone: 'error', text: ERROR_MESSAGES[code] || 'تعذّر الحفظ، حاول مرة أخرى.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="premium-card p-6 mb-10">
      <h2 className="text-xl font-extrabold text-stone-900 dark:text-white mb-1">إدخال سريع</h2>
      <p className="text-sm text-stone-500 dark:text-stone-400 font-medium mb-5">
        اكتب المبلغ، اختر القسم، ثم سجّل.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <input
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="المبلغ"
            aria-label="المبلغ"
            className="w-full text-2xl font-extrabold px-4 py-3 rounded-2xl border border-stone-200 dark:border-white/10 bg-white dark:bg-night-card text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500 font-bold">
            {currencyLabel(user?.currency)}
          </span>
        </div>
        {funds.length > 0 && (
          <select
            value={fundId}
            onChange={e => setFundId(e.target.value)}
            aria-label="مصدر المال"
            className="sm:w-56 px-4 py-3 rounded-2xl border border-stone-200 dark:border-white/10 bg-white dark:bg-night-card text-stone-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {user?.role !== 'partner' && <option value="">من جيبي</option>}
            {funds.map(fund => (
              <option key={fund.id} value={fund.id}>
                من صندوق: {fund.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-5" role="group" aria-label="القسم">
        {categories.map(category => {
          const selected = category.id === categoryId;
          return (
            <button
              key={category.id}
              type="button"
              aria-pressed={selected}
              onClick={() => setCategoryId(selected ? '' : category.id)}
              className={`min-h-[44px] px-4 py-2 rounded-full text-sm font-bold border transition-all ${
                selected
                  ? 'text-white border-transparent shadow-md scale-105'
                  : 'bg-stone-50 dark:bg-white/5 text-stone-700 dark:text-stone-200 border-stone-200 dark:border-white/10 hover:border-primary'
              }`}
              style={selected ? { backgroundColor: category.color || '#23336B' } : undefined}
            >
              {category.nameAr || category.name}
            </button>
          );
        })}
      </div>

      <button
        type="submit"
        disabled={!canSave}
        className="w-full sm:w-auto min-h-[48px] px-8 rounded-2xl bg-primary text-white font-extrabold shadow-lg shadow-primary/30 disabled:opacity-40 disabled:shadow-none transition-all"
      >
        {saving ? 'جارٍ الحفظ...' : 'سجّل المصروف'}
      </button>

      {message && (
        <p
          role="status"
          className={`mt-4 text-sm font-bold ${message.tone === 'success' ? 'text-mint-600 dark:text-mint-400' : 'text-brick-500'}`}
        >
          {message.text}
        </p>
      )}
    </form>
  );
};

export default QuickAdd;
