import { useState, useEffect, useRef } from 'react';
import { categoryService } from '../services/categoryService';
import { transactionService } from '../services/transactionService';
import { jointFundService } from '../services/jointFundService';
import { currencyLabel } from '../utils/currency';
import { formatAmount } from '../utils/money';
import CategoryIcon from './common/CategoryIcon';
import Icon from './common/Icon';

const ERROR_MESSAGES = {
  FUND_EXPENSE_ONLY: 'الصندوق يقبل المصاريف فقط.',
  INVALID_CATEGORY: 'هذا القسم غير متاح، اختر قسمًا آخر.',
  INVALID_FUND: 'هذا الصندوق غير متاح.',
  FORBIDDEN: 'لا تملك صلاحية التسجيل في هذا القسم.',
};

// Arabic alphabetical order, with the catch-all "other" category last.
const byName = (a, b) => {
  const aOther = a.name?.startsWith('Other') ? 1 : 0;
  const bOther = b.name?.startsWith('Other') ? 1 : 0;
  if (aOther !== bOther) return aOther - bOther;
  return (a.nameAr || a.name).localeCompare(b.nameAr || b.name, 'ar');
};

const todayInput = () => {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

// Records an expense (or income) in three taps: amount, category, save. Opens as a bottom
// sheet on the phone and a centered card on a wide screen. A partner spends from the fund by
// default; the owner from their own pocket. Income never goes into a fund.
const QuickAdd = ({ open, initialKind = 'expense', onClose, onSaved, user }) => {
  const [kind, setKind] = useState(initialKind);
  const [allCategories, setAllCategories] = useState([]);
  const [funds, setFunds] = useState([]);
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [fundId, setFundId] = useState('');
  const [note, setNote] = useState('');
  const [day, setDay] = useState(todayInput());
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const amountRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    setMessage(null);
    setKind(initialKind);
    setCategoryId('');
    setDay(todayInput());
    Promise.all([categoryService.getCategories(), jointFundService.getJointFunds()])
      .then(([allCategories, allFunds]) => {
        setAllCategories(allCategories.filter(c => c.type !== 'transfer').sort(byName));
        setFunds(allFunds);
        if (user?.role === 'partner' && allFunds.length > 0) {
          setFundId(current => current || allFunds[0].id);
        }
      })
      .catch(err => console.error('Failed to load quick add data', err));
    const focus = setTimeout(() => amountRef.current?.focus(), 50);
    const onKey = e => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(focus);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, initialKind, user, onClose]);

  if (!open) return null;

  const isIncome = kind === 'income';
  const categories = allCategories.filter(c => c.type === kind);
  const switchKind = next => {
    setKind(next);
    setCategoryId('');
  };

  const canSave = parseFloat(amount) > 0 && categoryId && !saving;

  const handleSubmit = async e => {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    setMessage(null);
    try {
      await transactionService.createTransaction({
        amount: parseFloat(amount),
        type: kind,
        categoryId,
        fundId: isIncome ? undefined : fundId || undefined,
        description: note.trim() || undefined,
        // Today keeps the current time so the newest entry sorts first; another day gets noon.
        date:
          day === todayInput() ? new Date().toISOString() : new Date(`${day}T12:00`).toISOString(),
      });
      const category = categories.find(c => c.id === categoryId);
      setMessage({
        tone: 'success',
        text: `سُجّل ${formatAmount(amount)} ${currencyLabel(user?.currency)} في ${category?.nameAr || category?.name}.`,
      });
      setAmount('');
      setCategoryId('');
      setNote('');
      onSaved?.();
    } catch (err) {
      const code = err.response?.data?.error?.code;
      setMessage({ tone: 'error', text: ERROR_MESSAGES[code] || 'تعذّر الحفظ، حاول مرة أخرى.' });
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
        aria-labelledby="quick-add-title"
        className="relative w-full md:max-w-lg bg-white dark:bg-night-card rounded-t-[30px] md:rounded-[30px] px-5 pt-3 pb-6 shadow-2xl max-h-[92vh] overflow-y-auto"
      >
        <span className="block md:hidden mx-auto mb-3 h-1.5 w-11 rounded-full bg-stone-200 dark:bg-white/10" />
        <div className="flex items-center justify-between mb-4">
          <h2 id="quick-add-title" className="sr-only">
            {isIncome ? 'دخل جديد' : 'مصروف جديد'}
          </h2>
          <div
            role="group"
            aria-label="النوع"
            className="grid grid-cols-2 bg-soft dark:bg-white/5 rounded-2xl p-1 w-56"
          >
            {[
              ['expense', 'مصروف'],
              ['income', 'دخل'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={kind === value}
                onClick={() => switchKind(value)}
                className={`min-h-[38px] rounded-xl text-sm font-medium transition-colors ${
                  kind === value
                    ? 'bg-white dark:bg-night text-ink dark:text-white shadow-sm'
                    : 'text-stone-500 dark:text-stone-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
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
          <span className="sr-only">المبلغ</span>
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
              // Grows with the number so the currency stays right next to it.
              style={{ width: `${Math.max(String(amount).length, 1) + 0.6}ch` }}
              className="num max-w-[11ch] bg-transparent text-center text-5xl font-bold text-ink dark:text-white placeholder:text-stone-300 focus:outline-none"
            />
            <span className="text-lg text-stone-500">{currencyLabel(user?.currency)}</span>
          </span>
        </label>

        {!isIncome && funds.length > 0 && (
          <div
            className="flex flex-wrap justify-center gap-2 mb-4"
            role="group"
            aria-label="من أين"
          >
            {user?.role !== 'partner' && (
              <button
                type="button"
                aria-pressed={fundId === ''}
                onClick={() => setFundId('')}
                className={`min-h-[40px] px-4 rounded-full text-sm font-medium transition-colors ${
                  fundId === ''
                    ? 'bg-ink text-white dark:bg-white dark:text-ink'
                    : 'bg-soft dark:bg-white/5 text-stone-600 dark:text-stone-300'
                }`}
              >
                من جيبي
              </button>
            )}
            {funds.map(fund => (
              <button
                key={fund.id}
                type="button"
                aria-pressed={fundId === fund.id}
                onClick={() => setFundId(fund.id)}
                className={`min-h-[40px] px-4 rounded-full text-sm font-medium transition-colors ${
                  fundId === fund.id
                    ? 'bg-ink text-white dark:bg-white dark:text-ink'
                    : 'bg-soft dark:bg-white/5 text-stone-600 dark:text-stone-300'
                }`}
              >
                {fund.name}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-4 gap-2 mb-5" role="group" aria-label="القسم">
          {categories.map(category => {
            const selected = category.id === categoryId;
            return (
              <button
                key={category.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setCategoryId(selected ? '' : category.id)}
                className={`flex flex-col items-center gap-1.5 rounded-2xl p-2 text-xs font-medium leading-tight border-2 transition-all ${
                  selected
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10 text-ink dark:text-white'
                    : 'border-transparent text-stone-600 dark:text-stone-300'
                }`}
              >
                <CategoryIcon category={category} className="h-11 w-11 text-xl" />
                <span className="line-clamp-2">{category.nameAr || category.name}</span>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 mb-4">
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="ملاحظة (اختياري): بقالة الأسبوع"
            aria-label="ملاحظة"
            maxLength={200}
            className="min-h-[46px] px-4 rounded-2xl bg-soft dark:bg-white/5 text-ink dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <input
            type="date"
            value={day}
            max={todayInput()}
            onChange={e => setDay(e.target.value || todayInput())}
            aria-label="التاريخ"
            className="w-[9.5rem] min-w-0 min-h-[46px] px-3 rounded-2xl bg-soft dark:bg-white/5 text-ink dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <button
          type="submit"
          disabled={!canSave}
          className="w-full min-h-[52px] rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-semibold shadow-lg shadow-brand-500/30 disabled:opacity-40 disabled:shadow-none transition-all"
        >
          {saving ? 'جارٍ الحفظ...' : isIncome ? 'حفظ الدخل' : 'حفظ المصروف'}
        </button>

        {message && (
          <p
            role="status"
            className={`mt-4 text-center text-sm font-medium ${message.tone === 'success' ? 'text-mint-600 dark:text-mint-400' : 'text-alert-500'}`}
          >
            {message.text}
          </p>
        )}
      </form>
    </div>
  );
};

export default QuickAdd;
