import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/common/Sidebar';
import Icon from '../components/common/Icon';
import CategoryIcon, { CATEGORY_COLORS, CATEGORY_EMOJIS } from '../components/common/CategoryIcon';
import Sheet, { TextField, SubmitButton } from '../components/common/Sheet';
import { categoryService } from '../services/categoryService';
import { CURRENCIES, DEFAULT_CURRENCY } from '../utils/currency';
import { readTheme, saveTheme, watchTheme } from '../utils/theme';

const THEME_OPTIONS = [
  { value: 'light', label: 'فاتح', icon: 'sun' },
  { value: 'dark', label: 'ليلي', icon: 'moon' },
  { value: 'system', label: 'حسب الهاتف', icon: 'phone' },
];

const TYPE_LABEL = {
  income: 'قسم دخل',
  expense: 'قسم مصروف',
  transfer: 'تمويل الصندوق (تلقائي)',
};

const Section = ({ title, action, children }) => (
  <section className="premium-card p-4 md:p-5">
    <div className="flex items-center justify-between gap-3 mb-3">
      <h2 className="font-bold text-ink dark:text-white">{title}</h2>
      {action}
    </div>
    {children}
  </section>
);

const Chip = ({ active, onClick, children, className = '' }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={`min-h-[44px] rounded-2xl text-sm font-semibold transition-colors ${
      active
        ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/25'
        : 'bg-soft dark:bg-white/5 text-stone-600 dark:text-stone-300 hover:text-ink dark:hover:text-white'
    } ${className}`}
  >
    {children}
  </button>
);

const EMPTY_CATEGORY = {
  nameAr: '',
  type: 'expense',
  icon: CATEGORY_EMOJIS[0],
  color: CATEGORY_COLORS[0],
};

const Settings = () => {
  const { user, updateUser } = useAuth();
  const [theme, setTheme] = useState(() => readTheme(localStorage));
  const [currency, setCurrency] = useState(user?.currency || DEFAULT_CURRENCY);
  const [categories, setCategories] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [subName, setSubName] = useState('');
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draft, setDraft] = useState(EMPTY_CATEGORY);

  useEffect(() => watchTheme(({ theme: current }) => setTheme(current)), []);

  const say = (tone, text) => {
    setNotice({ tone, text });
    window.setTimeout(() => setNotice(null), 3000);
  };

  const loadCategories = useCallback(async () => {
    try {
      setCategories(await categoryService.getCategories());
    } catch {
      setNotice({ tone: 'error', text: 'تعذّر تحميل الأقسام، حاول مرة أخرى.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // The currency is saved on the server, so it follows the user to every device.
  const changeCurrency = async code => {
    const previous = currency;
    setCurrency(code);
    try {
      await updateUser({ currency: code });
      say('success', 'حُفظت العملة.');
    } catch {
      setCurrency(previous);
      say('error', 'تعذّر حفظ العملة، حاول مرة أخرى.');
    }
  };

  const addCategory = async e => {
    e.preventDefault();
    const nameAr = draft.nameAr.trim();
    if (!nameAr) return;
    try {
      const created = await categoryService.createCategory({ ...draft, nameAr, name: nameAr });
      setSheetOpen(false);
      setDraft(EMPTY_CATEGORY);
      await loadCategories();
      setOpenId(created?.id ?? null);
      say('success', `أُضيف قسم «${nameAr}».`);
    } catch {
      say('error', 'تعذّر إضافة القسم، حاول مرة أخرى.');
    }
  };

  const deleteCategory = async category => {
    if (!window.confirm(`حذف قسم «${category.nameAr}» وكل أصنافه الفرعية؟`)) return;
    try {
      await categoryService.deleteCategory(category.id);
      setOpenId(null);
      await loadCategories();
      say('success', 'حُذف القسم.');
    } catch {
      say('error', 'تعذّر حذف القسم. ربما عليه عمليات مسجّلة.');
    }
  };

  const saveSubcategories = async (category, subcategories, text) => {
    try {
      await categoryService.updateCategory(category.id, { subcategories });
      await loadCategories();
      say('success', text);
    } catch {
      say('error', 'تعذّر الحفظ، حاول مرة أخرى.');
    }
  };

  const addSub = (e, category) => {
    e.preventDefault();
    const nameAr = subName.trim();
    if (!nameAr) return;
    setSubName('');
    saveSubcategories(
      category,
      [...(category.subcategories || []), { id: `sub-${Date.now()}`, nameAr }],
      `أُضيف «${nameAr}».`
    );
  };

  const removeSub = (category, sub) =>
    saveSubcategories(
      category,
      (category.subcategories || []).filter(s => s.id !== sub.id),
      `حُذف «${sub.nameAr}».`
    );

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 min-w-0 md:mr-64 p-4 md:p-8 pt-20 md:pt-8 w-full max-w-5xl">
        <header className="mb-5">
          <h1 className="text-2xl font-bold text-ink dark:text-white">الإعدادات</h1>
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

        <div className="grid gap-4 lg:grid-cols-[1fr_1.5fr] items-start">
          <div className="space-y-4">
            <Section title="المظهر">
              <div className="grid grid-cols-3 gap-2">
                {THEME_OPTIONS.map(option => (
                  <Chip
                    key={option.value}
                    active={theme === option.value}
                    onClick={() => saveTheme(option.value)}
                    className="flex flex-col items-center justify-center gap-1 py-3"
                  >
                    <Icon name={option.icon} className="h-5 w-5" />
                    {option.label}
                  </Chip>
                ))}
              </div>
              <p className="mt-3 text-xs text-stone-500 dark:text-stone-400">
                «حسب الهاتف» يجعل التطبيق ليليًا متى صار هاتفك ليليًا.
              </p>
            </Section>

            <Section title="العملة">
              <label className="block">
                <span className="sr-only">العملة</span>
                <select
                  value={currency}
                  onChange={e => changeCurrency(e.target.value)}
                  className="w-full min-h-[48px] px-4 rounded-2xl bg-soft dark:bg-white/5 text-ink dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {CURRENCIES.map(c => (
                    <option key={c.code} value={c.code} className="text-ink">
                      {c.name} ({c.symbol})
                    </option>
                  ))}
                </select>
              </label>
              <p className="mt-3 text-xs text-stone-500 dark:text-stone-400">
                تُعرض بها كل المبالغ، وتُحفظ في حسابك.
              </p>
            </Section>
          </div>

          <Section
            title="الأقسام"
            action={
              <button
                type="button"
                onClick={() => setSheetOpen(true)}
                className="min-h-[40px] px-3.5 inline-flex items-center gap-1.5 rounded-full bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold shadow-lg shadow-brand-500/25"
              >
                <Icon name="plus" className="h-4 w-4" strokeWidth={2.6} />
                قسم جديد
              </button>
            }
          >
            {loading ? (
              <div className="space-y-2 animate-pulse" aria-label="جارٍ التحميل">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className="h-16 rounded-2xl bg-soft dark:bg-white/5" />
                ))}
              </div>
            ) : categories.length === 0 ? (
              <p className="py-8 text-center text-sm text-stone-500 dark:text-stone-400">
                لا أقسام بعد. أضف أول قسم لتصنّف به مصاريفك.
              </p>
            ) : (
              <ul className="divide-y divide-stone-100 dark:divide-white/5 -mx-1">
                {categories.map(category => {
                  const open = openId === category.id;
                  const subs = category.subcategories || [];
                  return (
                    <li key={category.id} className="px-1">
                      <button
                        type="button"
                        onClick={() => {
                          setOpenId(open ? null : category.id);
                          setSubName('');
                        }}
                        aria-expanded={open}
                        className="w-full flex items-center gap-3 py-3 text-right"
                      >
                        <CategoryIcon category={category} />
                        <span className="flex-1 min-w-0">
                          <span className="block font-semibold text-ink dark:text-white truncate">
                            {category.nameAr}
                          </span>
                          <span className="block text-xs text-stone-500 dark:text-stone-400">
                            {TYPE_LABEL[category.type] || TYPE_LABEL.expense}
                            {subs.length > 0 && ` · ${subs.length} أصناف`}
                          </span>
                        </span>
                        <Icon
                          name="chevron"
                          className={`h-5 w-5 text-stone-400 transition-transform ${
                            open ? '-rotate-90' : ''
                          }`}
                        />
                      </button>

                      {open && (
                        <div className="pb-4 pr-14">
                          <div className="flex flex-wrap gap-2 mb-3">
                            {subs.length === 0 && (
                              <span className="text-xs text-stone-500 dark:text-stone-400">
                                لا أصناف فرعية. أضف واحدًا لتفصيل الصرف أكثر.
                              </span>
                            )}
                            {subs.map(sub => (
                              <span
                                key={sub.id}
                                className="inline-flex items-center gap-1 rounded-full bg-soft dark:bg-white/5 pr-3 pl-1 py-1 text-sm text-ink dark:text-stone-200"
                              >
                                {sub.nameAr}
                                <button
                                  type="button"
                                  onClick={() => removeSub(category, sub)}
                                  aria-label={`حذف ${sub.nameAr}`}
                                  className="h-7 w-7 grid place-items-center rounded-full text-stone-400 hover:text-alert-500 hover:bg-alert-50 dark:hover:bg-alert-500/10"
                                >
                                  <Icon name="close" className="h-3.5 w-3.5" />
                                </button>
                              </span>
                            ))}
                          </div>
                          <form onSubmit={e => addSub(e, category)} className="flex gap-2">
                            <input
                              value={subName}
                              onChange={e => setSubName(e.target.value)}
                              placeholder="صنف فرعي، مثل: خضر وفواكه"
                              aria-label="اسم الصنف الفرعي"
                              className="flex-1 min-w-0 min-h-[44px] px-4 rounded-2xl bg-soft dark:bg-white/5 text-sm text-ink dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                            />
                            <button
                              type="submit"
                              disabled={!subName.trim()}
                              className="min-h-[44px] px-4 rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300 text-sm font-semibold disabled:opacity-40"
                            >
                              إضافة
                            </button>
                          </form>
                          {category.type !== 'transfer' && (
                            <button
                              type="button"
                              onClick={() => deleteCategory(category)}
                              className="mt-3 inline-flex items-center gap-1.5 min-h-[40px] text-sm font-medium text-alert-500 hover:text-alert-600"
                            >
                              <Icon name="trash" className="h-4 w-4" />
                              حذف القسم
                            </button>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>
        </div>
      </main>

      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="قسم جديد"
        onSubmit={addCategory}
      >
        <TextField
          label="اسم القسم"
          value={draft.nameAr}
          onChange={e => setDraft({ ...draft, nameAr: e.target.value })}
          placeholder="مثال: إيجار، دواء"
          autoFocus
          required
        />
        <p className="text-sm font-medium text-stone-600 dark:text-stone-300 mb-1.5">النوع</p>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <Chip
            active={draft.type === 'expense'}
            onClick={() => setDraft({ ...draft, type: 'expense' })}
          >
            مصروف
          </Chip>
          <Chip
            active={draft.type === 'income'}
            onClick={() => setDraft({ ...draft, type: 'income' })}
          >
            دخل
          </Chip>
        </div>
        <p className="text-sm font-medium text-stone-600 dark:text-stone-300 mb-1.5">الرمز</p>
        <div className="grid grid-cols-5 gap-2 mb-4">
          {CATEGORY_EMOJIS.map(emoji => (
            <button
              key={emoji}
              type="button"
              onClick={() => setDraft({ ...draft, icon: emoji })}
              aria-pressed={draft.icon === emoji}
              aria-label={`الرمز ${emoji}`}
              className={`h-12 rounded-2xl text-xl grid place-items-center transition ${
                draft.icon === emoji
                  ? 'bg-brand-50 dark:bg-brand-500/15 ring-2 ring-brand-500'
                  : 'bg-soft dark:bg-white/5'
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
        <p className="text-sm font-medium text-stone-600 dark:text-stone-300 mb-1.5">اللون</p>
        <div className="grid grid-cols-8 gap-2 mb-5 px-1">
          {CATEGORY_COLORS.map(color => (
            <button
              key={color}
              type="button"
              onClick={() => setDraft({ ...draft, color })}
              aria-pressed={draft.color === color}
              aria-label={`اللون ${color}`}
              className={`aspect-square w-full max-w-[36px] mx-auto rounded-full transition ${
                draft.color === color
                  ? 'ring-2 ring-offset-2 ring-brand-500 ring-offset-white dark:ring-offset-night-card scale-110'
                  : ''
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <SubmitButton disabled={!draft.nameAr.trim()}>إضافة القسم</SubmitButton>
      </Sheet>
    </div>
  );
};

export default Settings;
