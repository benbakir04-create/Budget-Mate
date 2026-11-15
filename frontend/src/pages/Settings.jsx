import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/common/Sidebar';
import Icon from '../components/common/Icon';
import CategoryIcon, { categoryEmoji } from '../components/common/CategoryIcon';
import Sheet, { TextField, SubmitButton } from '../components/common/Sheet';
import { categoryService } from '../services/categoryService';
import { CURRENCIES, DEFAULT_CURRENCY } from '../utils/currency';
import {
  CATEGORY_COLORS,
  CATEGORY_EMOJIS,
  categoryErrorMessage,
  categoryName,
  manageableCategories,
} from '../utils/categories';

const TYPES = [
  ['expense', 'المصروف'],
  ['income', 'الدخل'],
];

const SectionTitle = ({ children, hint }) => (
  <div className="mb-3 px-1">
    <h2 className="text-base font-bold text-ink dark:text-white">{children}</h2>
    {hint && <p className="text-sm text-stone-500 dark:text-stone-400">{hint}</p>}
  </div>
);

const Settings = () => {
  const { user, updateUser } = useAuth();
  const isOwner = user?.role !== 'partner';
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('expense');
  const [notice, setNotice] = useState(null);
  const [savingCurrency, setSavingCurrency] = useState(null);
  // null: closed. {}: a new category. A category: editing it.
  const [editing, setEditing] = useState(null);

  const loadCategories = useCallback(async () => {
    try {
      setCategories(await categoryService.getCategories());
    } catch (err) {
      setNotice({ tone: 'error', text: 'تعذّر تحميل الأقسام، حاول مرة أخرى.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(null), 3500);
    return () => clearTimeout(timer);
  }, [notice]);

  const currency = user?.currency || DEFAULT_CURRENCY;

  // A tap saves at once: the currency lives on the server and follows the user to every device.
  const chooseCurrency = async code => {
    if (code === currency || savingCurrency) return;
    setSavingCurrency(code);
    try {
      await updateUser({ currency: code });
      const chosen = CURRENCIES.find(c => c.code === code);
      setNotice({ tone: 'success', text: `صارت المبالغ تُعرض بـ${chosen?.name || code}.` });
    } catch (err) {
      setNotice({ tone: 'error', text: 'تعذّر حفظ العملة، حاول مرة أخرى.' });
    } finally {
      setSavingCurrency(null);
    }
  };

  const shown = manageableCategories(categories, type);
  const initial = user?.name?.trim().charAt(0) || '؟';

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 md:mr-64 p-4 md:p-8 pt-20 md:pt-8 w-full max-w-3xl">
        <h1 className="text-2xl font-bold text-ink dark:text-white mb-5">الإعدادات</h1>

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

        {/* Account */}
        <section className="premium-card p-4 flex items-center gap-4 mb-7">
          <span className="h-14 w-14 shrink-0 rounded-full grid place-items-center bg-sun-300 text-sun-900 font-bold text-2xl">
            {initial}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-lg text-ink dark:text-white truncate">{user?.name}</p>
            <p className="text-sm text-stone-500 dark:text-stone-400 truncate" dir="ltr">
              {user?.email}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
              isOwner
                ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300'
                : 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300'
            }`}
          >
            {isOwner ? 'المالك' : 'شريك'}
          </span>
        </section>

        {/* Currency */}
        <section className="mb-7">
          <SectionTitle hint="كل المبالغ في التطبيق تُعرض بها.">العملة</SectionTitle>
          <div className="premium-card p-2" role="radiogroup" aria-label="العملة">
            {CURRENCIES.map(c => {
              const selected = c.code === currency;
              return (
                <button
                  key={c.code}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={Boolean(savingCurrency)}
                  onClick={() => chooseCurrency(c.code)}
                  className={`w-full flex items-center gap-3 min-h-[56px] px-3 rounded-2xl text-start transition-colors ${
                    selected
                      ? 'bg-brand-50 dark:bg-brand-500/10'
                      : 'hover:bg-soft dark:hover:bg-white/5'
                  }`}
                >
                  <span
                    className={`h-11 w-11 shrink-0 grid place-items-center rounded-2xl text-base font-bold ${
                      selected
                        ? 'bg-brand-500 text-white'
                        : 'bg-soft dark:bg-white/5 text-stone-600 dark:text-stone-300'
                    }`}
                  >
                    {c.symbol}
                  </span>
                  <span className="flex-1 font-medium text-ink dark:text-white">{c.name}</span>
                  {savingCurrency === c.code ? (
                    <span className="text-xs text-stone-500">جارٍ الحفظ...</span>
                  ) : (
                    <span
                      aria-hidden="true"
                      className={`h-6 w-6 grid place-items-center rounded-full border-2 ${
                        selected
                          ? 'border-brand-500 bg-brand-500 text-white'
                          : 'border-stone-300 dark:border-white/20'
                      }`}
                    >
                      {selected && <Icon name="check" className="h-3.5 w-3.5" strokeWidth={3} />}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Categories */}
        <section>
          <SectionTitle
            hint={
              isOwner
                ? 'اضغط على قسم لتغيير اسمه أو شكله.'
                : 'صاحب الحساب وحده يضيف الأقسام ويعدّلها.'
            }
          >
            الأقسام
          </SectionTitle>

          <div
            role="group"
            aria-label="نوع الأقسام"
            className="grid grid-cols-2 bg-white dark:bg-night-card shadow-[0_4px_16px_rgba(20,24,60,0.05)] rounded-2xl p-1 mb-3"
          >
            {TYPES.map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={type === value}
                onClick={() => setType(value)}
                className={`min-h-[40px] rounded-xl text-sm font-semibold transition-colors ${
                  type === value
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'text-stone-500 dark:text-stone-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3" aria-busy="true">
              {[0, 1, 2, 3, 4, 5].map(i => (
                <div
                  key={i}
                  className="h-28 rounded-[22px] bg-white dark:bg-night-card animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {shown.map(category => (
                <button
                  key={category.id}
                  type="button"
                  disabled={!isOwner}
                  onClick={() => setEditing(category)}
                  aria-label={`${categoryName(category)}${category.isPrivate ? '، خاص' : ''}`}
                  className="relative premium-card p-3 flex flex-col items-center gap-2 text-center enabled:hover:-translate-y-0.5 transition-transform disabled:cursor-default"
                >
                  <CategoryIcon category={category} className="h-12 w-12 text-2xl" />
                  <span className="text-xs font-medium leading-tight text-ink dark:text-white line-clamp-2">
                    {categoryName(category)}
                  </span>
                  {category.isPrivate && (
                    <span
                      className="absolute top-2 left-2 text-[11px]"
                      title="خاص: لا يراه الشركاء"
                      aria-hidden="true"
                    >
                      🔒
                    </span>
                  )}
                </button>
              ))}
              {isOwner && (
                <button
                  type="button"
                  onClick={() => setEditing({})}
                  className="min-h-[112px] rounded-[22px] border-2 border-dashed border-brand-200 dark:border-brand-500/30 text-brand-700 dark:text-brand-300 flex flex-col items-center justify-center gap-2 text-xs font-semibold hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"
                >
                  <span className="h-12 w-12 grid place-items-center rounded-2xl bg-brand-50 dark:bg-brand-500/15">
                    <Icon name="plus" className="h-6 w-6" strokeWidth={2.4} />
                  </span>
                  قسم جديد
                </button>
              )}
            </div>
          )}
          {!loading && shown.length === 0 && !isOwner && (
            <p className="text-sm text-stone-500 text-center py-6">لا أقسام هنا بعد.</p>
          )}
        </section>
      </main>

      <CategorySheet
        category={editing}
        type={type}
        onClose={() => setEditing(null)}
        onDone={text => {
          setEditing(null);
          setNotice({ tone: 'success', text });
          loadCategories();
        }}
      />
    </div>
  );
};

// Add or edit one category: name, picture, color, and whether partners can see it.
const CategorySheet = ({ category, type, onClose, onDone }) => {
  const open = category !== null;
  const isNew = open && !category.id;
  const [name, setName] = useState('');
  const [icon, setIcon] = useState(CATEGORY_EMOJIS[0]);
  const [color, setColor] = useState(CATEGORY_COLORS[0]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setName(category.nameAr || category.name || '');
    setIcon(category.icon ? categoryEmoji(category.icon) : CATEGORY_EMOJIS[0]);
    setColor(category.color || CATEGORY_COLORS[0]);
    setIsPrivate(Boolean(category.isPrivate));
    setError(null);
  }, [open, category]);

  const failed = err => {
    const data = err.response?.data?.error;
    setError(categoryErrorMessage(data?.code, data?.details));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setError(null);
    try {
      if (isNew) {
        // The English name must be unique per family; the Arabic one is what people see.
        await categoryService.createCategory({
          name: trimmed,
          nameAr: trimmed,
          icon,
          color,
          type,
          isPrivate,
        });
        onDone(`أُضيف قسم «${trimmed}».`);
      } else {
        await categoryService.updateCategory(category.id, {
          nameAr: trimmed,
          icon,
          color,
          isPrivate,
        });
        onDone(`حُفظ قسم «${trimmed}».`);
      }
    } catch (err) {
      failed(err);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`حذف قسم «${categoryName(category)}»؟ تُحذف معه ميزانياته.`)) return;
    setBusy(true);
    setError(null);
    try {
      await categoryService.deleteCategory(category.id);
      onDone(`حُذف قسم «${categoryName(category)}».`);
    } catch (err) {
      failed(err);
    } finally {
      setBusy(false);
    }
  };

  const preview = { icon, color };
  // A category made earlier may carry a color outside the palette: keep it as the first choice.
  const own = category?.color;
  const palette =
    own && !CATEGORY_COLORS.includes(own)
      ? [own, ...CATEGORY_COLORS.slice(0, -1)]
      : CATEGORY_COLORS;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={isNew ? (type === 'income' ? 'قسم دخل جديد' : 'قسم مصروف جديد') : 'تعديل القسم'}
      onSubmit={handleSubmit}
    >
      <div className="flex justify-center mb-4">
        <CategoryIcon category={preview} className="h-20 w-20 text-4xl rounded-[26px]" />
      </div>

      <TextField
        label="اسم القسم"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="مثال: إيجار، دواء، مدرسة"
        maxLength={40}
        required
        autoFocus={isNew}
      />

      <p className="text-sm font-medium text-stone-600 dark:text-stone-300 mb-1.5">الصورة</p>
      <div
        className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 mb-4"
        role="radiogroup"
        aria-label="الصورة"
      >
        {CATEGORY_EMOJIS.map(emoji => (
          <button
            key={emoji}
            type="button"
            role="radio"
            aria-checked={icon === emoji}
            onClick={() => setIcon(emoji)}
            className={`h-11 rounded-xl text-xl grid place-items-center border-2 transition-colors ${
              icon === emoji
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10'
                : 'border-transparent bg-soft dark:bg-white/5'
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>

      <p className="text-sm font-medium text-stone-600 dark:text-stone-300 mb-1.5">اللون</p>
      <div className="flex justify-between gap-1.5 mb-4" role="radiogroup" aria-label="اللون">
        {palette.map(value => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={color === value}
            aria-label={value}
            onClick={() => setColor(value)}
            className={`h-8 w-8 shrink-0 rounded-full grid place-items-center text-white ring-offset-2 ring-offset-white dark:ring-offset-night-card transition-transform ${
              color === value ? 'ring-2 ring-ink dark:ring-white scale-110' : ''
            }`}
            style={{ backgroundColor: value }}
          >
            {color === value && <Icon name="check" className="h-4 w-4" strokeWidth={3} />}
          </button>
        ))}
      </div>

      <label className="flex items-center gap-3 rounded-2xl bg-soft dark:bg-white/5 px-4 min-h-[60px] mb-4 cursor-pointer">
        <span className="flex-1">
          <span className="block text-sm font-semibold text-ink dark:text-white">قسم خاص</span>
          <span className="block text-xs text-stone-500 dark:text-stone-400">
            لا يراه الشركاء ولا عملياته.
          </span>
        </span>
        <input
          type="checkbox"
          checked={isPrivate}
          onChange={e => setIsPrivate(e.target.checked)}
          className="peer sr-only"
        />
        <span
          aria-hidden="true"
          className="relative h-7 w-12 shrink-0 rounded-full bg-stone-300 dark:bg-white/20 peer-checked:bg-brand-500 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500 ring-offset-2 transition-colors after:absolute after:top-1 after:right-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:-translate-x-5"
        />
      </label>

      <SubmitButton disabled={!name.trim() || busy}>
        {busy ? 'جارٍ الحفظ...' : isNew ? 'إضافة القسم' : 'حفظ التغييرات'}
      </SubmitButton>

      {!isNew && open && (
        <button
          type="button"
          onClick={handleDelete}
          disabled={busy}
          className="w-full min-h-[48px] mt-2 inline-flex items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-alert-600 hover:bg-alert-50 dark:hover:bg-alert-500/10 disabled:opacity-40"
        >
          <Icon name="trash" className="h-4 w-4" />
          حذف القسم
        </button>
      )}

      {error && (
        <p role="alert" className="mt-3 text-center text-sm font-medium text-alert-600">
          {error}
        </p>
      )}
    </Sheet>
  );
};

export default Settings;
