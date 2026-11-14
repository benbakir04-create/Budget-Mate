import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useQuickAdd } from '../contexts/QuickAddContext';
import Sidebar from '../components/common/Sidebar';
import Money from '../components/common/Money';
import Icon from '../components/common/Icon';
import CategoryIcon from '../components/common/CategoryIcon';
import { transactionService } from '../services/transactionService';
import { currencyLabel, DEFAULT_CURRENCY } from '../utils/currency';
import { amountSign, typeLabel } from '../utils/money';
import { formatDay } from '../utils/dates';

const MONTH_YEAR = new Intl.DateTimeFormat('ar-DZ-u-nu-latn', { month: 'long', year: 'numeric' });
const PAGE_SIZE = 100;
const MAX_PAGES = 10;

const monthRange = offset => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0, 23, 59, 59, 999);
  return { start, end };
};

const dayKey = value => {
  const d = new Date(value);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

const amountTone = type => {
  if (type === 'income') return 'text-mint-600 dark:text-mint-400';
  if (type === 'transfer') return 'text-brand-600 dark:text-brand-300';
  return 'text-ink dark:text-white';
};

const firstName = name => name?.trim().split(/\s+/)[0] || '';

// The month's transactions, newest first. The server pages at 100, so fetch until done.
const loadMonth = async range => {
  const all = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const result = await transactionService.getTransactions({
      startDate: range.start.toISOString(),
      endDate: range.end.toISOString(),
      limit: PAGE_SIZE,
      page,
    });
    all.push(...(result.transactions || []));
    if (!result.pagination || page >= result.pagination.pages) break;
  }
  // Kept to the month and newest first here too, so the day groups hold whatever the source.
  return all
    .filter(tx => {
      const d = new Date(tx.date);
      return d >= range.start && d <= range.end;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));
};

const Chip = ({ active, onClick, children }) => (
  <button
    type="button"
    aria-pressed={active}
    onClick={onClick}
    className={`shrink-0 inline-flex items-center gap-1.5 min-h-[38px] px-4 rounded-full text-sm font-medium transition-colors ${
      active
        ? 'bg-ink text-white dark:bg-white dark:text-ink'
        : 'bg-white dark:bg-night-card text-stone-600 dark:text-stone-300 shadow-[0_3px_10px_rgba(20,24,60,0.05)]'
    }`}
  >
    {children}
  </button>
);

const Transactions = () => {
  const { user } = useAuth();
  const { openQuickAdd, savedCount } = useQuickAdd();
  const [offset, setOffset] = useState(0);
  const [transactions, setTransactions] = useState(null);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState('all');
  const [person, setPerson] = useState('all');
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [notice, setNotice] = useState(null);

  const range = useMemo(() => monthRange(offset), [offset]);

  const load = useCallback(async () => {
    try {
      const [list, totals] = await Promise.all([
        loadMonth(range),
        transactionService.getSummary({
          startDate: range.start.toISOString(),
          endDate: range.end.toISOString(),
        }),
      ]);
      setTransactions(list);
      setSummary(totals);
      setError(false);
    } catch (err) {
      console.error('Failed to load transactions', err);
      setError(true);
    }
  }, [range]);

  useEffect(() => {
    setTransactions(null);
    load();
  }, [load, savedCount]);

  const people = useMemo(() => {
    const seen = new Map();
    (transactions || []).forEach(tx => tx.user && seen.set(tx.user.id, tx.user));
    return [...seen.values()];
  }, [transactions]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (transactions || []).filter(tx => {
      if (filter === 'expense' && tx.type !== 'expense') return false;
      if (filter === 'income' && tx.type !== 'income') return false;
      if (filter === 'fund' && !tx.fund) return false;
      if (person !== 'all' && tx.user?.id !== person) return false;
      if (!q) return true;
      return [tx.description, tx.category?.nameAr, tx.category?.name, tx.fund?.name]
        .filter(Boolean)
        .some(text => text.toLowerCase().includes(q));
    });
  }, [transactions, filter, person, search]);

  const days = useMemo(() => {
    const groups = [];
    for (const tx of visible) {
      const key = dayKey(tx.date);
      let group = groups[groups.length - 1];
      if (!group || group.key !== key) {
        group = { key, date: tx.date, items: [], spent: 0 };
        groups.push(group);
      }
      group.items.push(tx);
      if (tx.type === 'expense') group.spent += Number(tx.amount) || 0;
    }
    return groups;
  }, [visible]);

  const handleDelete = async tx => {
    const label = tx.description || tx.category?.nameAr || tx.category?.name || 'هذه العملية';
    if (!window.confirm(`حذف «${label}»؟ لا يمكن التراجع عن الحذف.`)) return;
    try {
      await transactionService.deleteTransaction(tx.id);
      setNotice({ tone: 'success', text: `حُذفت «${label}».` });
      load();
    } catch (err) {
      console.error(err);
      setNotice({ tone: 'error', text: 'تعذّر الحذف. قد لا تملك صلاحية حذف هذه العملية.' });
    }
  };

  const exportToCSV = () => {
    const headers = [
      'الوصف',
      'القسم',
      `المبلغ (${currencyLabel(user?.currency)})`,
      'النوع',
      'التاريخ',
      'من',
      'المصدر',
    ];
    const rows = visible.map(tx => [
      tx.description || '',
      tx.category?.nameAr || tx.category?.name || '',
      tx.amount,
      typeLabel(tx.type),
      new Date(tx.date).toISOString().split('T')[0],
      tx.user?.name || '',
      tx.fund ? tx.fund.name : 'شخصي',
    ]);
    const csv =
      '﻿' +
      [headers, ...rows]
        .map(row => row.map(val => `"${String(val ?? '').replace(/"/g, '""')}"`).join(','))
        .join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `wazen_${range.start.getFullYear()}-${String(range.start.getMonth() + 1).padStart(2, '0')}_${user?.currency || DEFAULT_CURRENCY}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const currency = user?.currency;

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 md:mr-64 p-4 md:p-8 pt-20 md:pt-8 w-full max-w-4xl">
        <header className="flex items-center justify-between gap-3 mb-4">
          <h1 className="text-2xl font-bold text-ink dark:text-white">العمليات</h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSearch(v => !v)}
              aria-label="بحث"
              aria-expanded={showSearch}
              className="h-11 w-11 grid place-items-center rounded-full bg-white dark:bg-night-card text-stone-600 dark:text-stone-300 shadow-[0_4px_14px_rgba(20,24,60,0.07)]"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
            </button>
            <button
              type="button"
              onClick={exportToCSV}
              disabled={!visible.length}
              className="min-h-[44px] px-4 rounded-full bg-white dark:bg-night-card text-sm font-medium text-stone-700 dark:text-stone-200 shadow-[0_4px_14px_rgba(20,24,60,0.07)] disabled:opacity-40"
            >
              تصدير Excel
            </button>
          </div>
        </header>

        {showSearch && (
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ابحث في الوصف أو القسم أو الصندوق"
            aria-label="بحث"
            autoFocus
            className="w-full mb-4 min-h-[48px] px-4 rounded-2xl bg-white dark:bg-night-card text-ink dark:text-white shadow-[0_4px_14px_rgba(20,24,60,0.05)] focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        )}

        {/* Month switcher */}
        <div className="flex items-center justify-between bg-white dark:bg-night-card rounded-2xl p-1.5 mb-4 shadow-[0_4px_14px_rgba(20,24,60,0.05)]">
          <button
            type="button"
            onClick={() => setOffset(o => o - 1)}
            aria-label="الشهر السابق"
            className="h-10 w-10 grid place-items-center rounded-xl text-stone-600 dark:text-stone-300 hover:bg-soft dark:hover:bg-white/5"
          >
            <Icon name="chevron" className="h-5 w-5 rotate-180" />
          </button>
          <span className="font-semibold text-ink dark:text-white">
            {MONTH_YEAR.format(range.start)}
          </span>
          <button
            type="button"
            onClick={() => setOffset(o => Math.min(o + 1, 0))}
            disabled={offset === 0}
            aria-label="الشهر التالي"
            className="h-10 w-10 grid place-items-center rounded-xl text-stone-600 dark:text-stone-300 hover:bg-soft dark:hover:bg-white/5 disabled:opacity-30"
          >
            <Icon name="chevron" className="h-5 w-5" />
          </button>
        </div>

        {/* Month totals */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-[22px] p-4 bg-alert-50 dark:bg-alert-500/10">
            <p className="text-xs text-alert-800 dark:text-alert-200">صُرف هذا الشهر</p>
            <Money
              amount={summary?.expense || 0}
              currency={currency}
              className="text-xl font-bold text-alert-800 dark:text-alert-200"
            />
          </div>
          <div className="rounded-[22px] p-4 bg-mint-100 dark:bg-mint-500/10">
            <p className="text-xs text-mint-800 dark:text-mint-200">دخل هذا الشهر</p>
            <Money
              amount={summary?.income || 0}
              currency={currency}
              className="text-xl font-bold text-mint-800 dark:text-mint-200"
            />
          </div>
        </div>

        {/* Filters */}
        <div
          className="flex gap-2 overflow-x-auto pb-2 mb-2 -mx-4 px-4 md:mx-0 md:px-0"
          role="group"
          aria-label="تصفية"
        >
          <Chip active={filter === 'all'} onClick={() => setFilter('all')}>
            الكل
          </Chip>
          <Chip active={filter === 'expense'} onClick={() => setFilter('expense')}>
            مصروف
          </Chip>
          <Chip active={filter === 'income'} onClick={() => setFilter('income')}>
            دخل
          </Chip>
          <Chip active={filter === 'fund'} onClick={() => setFilter('fund')}>
            من الصندوق
          </Chip>
          {people.length > 1 &&
            people.map(p => (
              <Chip
                key={p.id}
                active={person === p.id}
                onClick={() => setPerson(person === p.id ? 'all' : p.id)}
              >
                <span className="h-5 w-5 rounded-full grid place-items-center bg-sun-300 text-sun-900 text-[10px] font-semibold">
                  {p.name?.trim().charAt(0) || '؟'}
                </span>
                {firstName(p.name)}
              </Chip>
            ))}
        </div>

        {notice && (
          <p
            role="status"
            className={`mb-3 text-sm font-medium ${notice.tone === 'success' ? 'text-mint-700 dark:text-mint-300' : 'text-alert-600'}`}
          >
            {notice.text}
          </p>
        )}

        {/* Grouped by day */}
        {error ? (
          <div className="premium-card p-6 text-center">
            <p className="text-ink dark:text-white font-medium mb-3">تعذّر تحميل العمليات.</p>
            <button
              type="button"
              onClick={load}
              className="px-5 min-h-[44px] rounded-2xl bg-brand-500 text-white font-medium"
            >
              حاول مرة أخرى
            </button>
          </div>
        ) : !transactions ? (
          <div className="space-y-3 animate-pulse" aria-label="جارٍ التحميل">
            <div className="h-24 rounded-[24px] bg-soft dark:bg-white/5" />
            <div className="h-24 rounded-[24px] bg-soft dark:bg-white/5" />
          </div>
        ) : days.length === 0 ? (
          <div className="premium-card p-8 text-center">
            <p className="text-stone-500 dark:text-stone-400 mb-4">
              {transactions.length ? 'لا عمليات تطابق التصفية.' : 'لا عمليات في هذا الشهر.'}
            </p>
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={() => openQuickAdd('expense')}
                className="px-5 min-h-[44px] rounded-2xl bg-brand-500 text-white font-medium"
              >
                سجّل مصروفًا
              </button>
              <button
                type="button"
                onClick={() => openQuickAdd('income')}
                className="px-5 min-h-[44px] rounded-2xl bg-mint-100 text-mint-800 font-medium"
              >
                سجّل دخلًا
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {days.map(day => (
              <section key={day.key} aria-label={formatDay(day.date)}>
                <div className="flex items-baseline justify-between px-1 mb-2 text-xs text-stone-500 dark:text-stone-400">
                  <span className="font-semibold">{formatDay(day.date)}</span>
                  {day.spent > 0 && (
                    <span>
                      صُرف <Money amount={day.spent} currency={currency} />
                    </span>
                  )}
                </div>
                <div className="premium-card divide-y divide-stone-100 dark:divide-white/5 overflow-hidden">
                  {day.items.map(tx => (
                    <div key={tx.id} className="group flex items-center gap-3 px-4 py-3">
                      <CategoryIcon category={tx.category} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink dark:text-white truncate">
                          {tx.description || tx.category?.nameAr || tx.category?.name}
                        </p>
                        <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
                          {[
                            firstName(tx.user?.name),
                            tx.description ? tx.category?.nameAr || tx.category?.name : null,
                            tx.fund?.name,
                          ]
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
                      {tx.type !== 'transfer' && (
                        <button
                          type="button"
                          onClick={() => handleDelete(tx)}
                          aria-label={`حذف ${tx.description || tx.category?.nameAr || ''}`}
                          className="h-9 w-9 grid place-items-center rounded-full text-stone-300 hover:text-alert-600 hover:bg-alert-50 dark:hover:bg-alert-500/10 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 transition"
                        >
                          <Icon name="close" className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Transactions;
