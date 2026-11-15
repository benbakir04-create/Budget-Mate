import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useQuickAdd } from '../contexts/QuickAddContext';
import Sidebar from '../components/common/Sidebar';
import Money from '../components/common/Money';
import Icon from '../components/common/Icon';
import CategoryIcon from '../components/common/CategoryIcon';
import Sheet, { AmountInput, TextField, SubmitButton } from '../components/common/Sheet';
import { jointFundService } from '../services/jointFundService';
import { shoppingOrderService } from '../services/shoppingOrderService';
import { categoryService } from '../services/categoryService';
import { transactionService } from '../services/transactionService';
import { authService } from '../services/authService';
import { currencyLabel } from '../utils/currency';
import { fundOutlook } from '../utils/money';
import { formatDate, formatDay } from '../utils/dates';

const MONTH = new Intl.DateTimeFormat('ar-DZ-u-nu-latn', { month: 'long' });

const firstOfMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
};

const outlookText = outlook => {
  if (outlook.remainingPct === 0) return 'الصندوق فارغ. موّله لتكمل الشهر.';
  if (outlook.coversMonth) return 'بهذا المعدّل يكفي حتى آخر الشهر';
  return `بهذا المعدّل يكفي حتى ${formatDate(outlook.runsOutOn)}`;
};

const apiError = (err, fallback) => {
  const code = err.response?.data?.error?.code;
  const messages = {
    INSUFFICIENT_FUNDS: 'رصيد الصندوق لا يكفي لهذا المبلغ.',
    FORBIDDEN: 'لا تملك صلاحية هذا الإجراء.',
    EMAIL_EXISTS: 'هذا البريد مستعمل في حساب آخر.',
  };
  return messages[code] || fallback;
};

const TABS = [
  ['fund', 'الصندوق'],
  ['orders', 'الطلبيات'],
  ['partners', 'الشركاء'],
];

// The fund page: the shared fund and its latest movements, the shopping orders a partner sends
// for approval, and (for the owner) adding a partner.
const Funds = () => {
  const { user } = useAuth();
  const { savedCount } = useQuickAdd();
  const [params, setParams] = useSearchParams();
  const isOwner = user?.role !== 'partner';
  const currency = user?.currency;
  const tab = TABS.some(([key]) => key === params.get('tab')) ? params.get('tab') : 'fund';

  const [funds, setFunds] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [fundId, setFundId] = useState('');
  const [details, setDetails] = useState(null);
  const [fundSpent, setFundSpent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [sheet, setSheet] = useState(null); // 'create' | 'deposit' | 'order' | order (to buy)
  const [saving, setSaving] = useState(false);

  const fund = funds.find(f => f.id === fundId) || null;

  const loadFund = useCallback(async id => {
    if (!id) return;
    const [fundDetails, month] = await Promise.all([
      jointFundService.getJointFund(id),
      transactionService.getSummary({ fundId: id, startDate: firstOfMonth() }),
    ]);
    setDetails(fundDetails);
    setFundSpent(month?.expense || 0);
  }, []);

  const loadAll = useCallback(async () => {
    try {
      const [fundsList, ordersList, cats] = await Promise.all([
        jointFundService.getJointFunds(),
        shoppingOrderService.getShoppingOrders(),
        categoryService.getCategories(),
      ]);
      setFunds(fundsList);
      setOrders(ordersList);
      setCategories(cats.filter(c => c.type === 'expense'));
      const current = fundsList.find(f => f.id === fundId) ? fundId : fundsList[0]?.id || '';
      setFundId(current);
      await loadFund(current);
    } catch (err) {
      setNotice({ tone: 'error', text: 'تعذّر تحميل الصندوق، حاول مرة أخرى.' });
    } finally {
      setLoading(false);
    }
    // fundId is read on purpose without being a dependency: it keeps the selection across reloads.
  }, [loadFund]);

  useEffect(() => {
    loadAll();
  }, [loadAll, savedCount]);

  // Links from the home screen open a sheet directly (?do=deposit, ?do=order).
  useEffect(() => {
    if (loading) return;
    const action = params.get('do');
    if (action === 'deposit' && isOwner && fund) setSheet('deposit');
    if (action === 'order' && funds.length) setSheet('order');
    if (action) {
      const next = new URLSearchParams(params);
      next.delete('do');
      setParams(next, { replace: true });
    }
  }, [loading, params, setParams, isOwner, fund, funds.length]);

  const setTab = key => {
    const next = new URLSearchParams(params);
    if (key === 'fund') next.delete('tab');
    else next.set('tab', key);
    setParams(next, { replace: true });
  };

  const selectFund = async id => {
    setFundId(id);
    await loadFund(id);
  };

  const run = async (action, success, fallback) => {
    setSaving(true);
    setNotice(null);
    try {
      await action();
      setSheet(null);
      setNotice({ tone: 'success', text: success });
      await loadAll();
    } catch (err) {
      setNotice({ tone: 'error', text: apiError(err, fallback) });
    } finally {
      setSaving(false);
    }
  };

  const pending = orders.filter(o => o.status === 'pending_approval');
  const approved = orders.filter(o => o.status === 'approved');
  const outlook = fund ? fundOutlook({ balance: fund.balance, spent: fundSpent }) : null;
  const movements = details?.transactions || [];
  const visibleTabs = TABS.filter(([key]) => key !== 'partners' || isOwner);

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 min-w-0 md:mr-64 p-4 md:p-8 pt-20 md:pt-8 w-full max-w-5xl">
        <header className="flex items-center justify-between gap-3 mb-4">
          <h1 className="text-2xl font-bold text-ink dark:text-white">الصندوق</h1>
          {isOwner && funds.length > 0 && (
            <button
              type="button"
              onClick={() => setSheet('create')}
              className="min-h-[44px] px-4 inline-flex items-center gap-1.5 rounded-full bg-white dark:bg-night-card text-sm font-medium text-stone-700 dark:text-stone-200 shadow-[0_4px_14px_rgba(20,24,60,0.07)]"
            >
              <Icon name="plus" className="h-4 w-4" strokeWidth={2.4} />
              صندوق جديد
            </button>
          )}
        </header>

        <div
          role="tablist"
          aria-label="أقسام الصندوق"
          className={`grid ${visibleTabs.length === 3 ? 'grid-cols-3' : 'grid-cols-2'} bg-white dark:bg-night-card rounded-2xl p-1.5 mb-5 shadow-[0_4px_14px_rgba(20,24,60,0.05)]`}
        >
          {visibleTabs.map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={`min-h-[40px] rounded-xl text-sm font-medium transition-colors inline-flex items-center justify-center gap-1.5 ${
                tab === key
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-stone-500 dark:text-stone-400'
              }`}
            >
              {label}
              {key === 'orders' && pending.length > 0 && (
                <span
                  className={`num min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-semibold grid place-items-center ${
                    tab === key ? 'bg-white text-brand-600' : 'bg-sun-400 text-ink'
                  }`}
                >
                  {pending.length}
                </span>
              )}
            </button>
          ))}
        </div>

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
          <div className="space-y-4 animate-pulse" aria-label="جارٍ التحميل">
            <div className="h-52 rounded-[30px] bg-soft dark:bg-white/5" />
            <div className="h-24 rounded-[24px] bg-soft dark:bg-white/5" />
          </div>
        ) : funds.length === 0 ? (
          <EmptyState
            icon="wallet"
            title="لا صندوق بعد"
            text={
              isOwner
                ? 'أنشئ صندوق البيت وموّله، فيصرف منه شريكك وتظهر كل عملية هنا.'
                : 'لم يُنشئ المالك صندوقًا بعد. حين ينشئه سيظهر هنا.'
            }
            action={isOwner ? ['أنشئ أول صندوق', () => setSheet('create')] : null}
          />
        ) : (
          <>
            {tab === 'fund' && (
              <div className="grid gap-5 lg:grid-cols-[1.05fr_1fr] items-start">
                <div className="space-y-4 min-w-0">
                  {funds.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1">
                      {funds.map(f => (
                        <button
                          key={f.id}
                          type="button"
                          aria-pressed={f.id === fundId}
                          onClick={() => selectFund(f.id)}
                          className={`shrink-0 min-h-[38px] px-4 rounded-full text-sm font-medium transition-colors ${
                            f.id === fundId
                              ? 'bg-ink text-white dark:bg-white dark:text-ink'
                              : 'bg-white dark:bg-night-card text-stone-600 dark:text-stone-300 shadow-[0_3px_10px_rgba(20,24,60,0.05)]'
                          }`}
                        >
                          {f.name}
                        </button>
                      ))}
                    </div>
                  )}

                  <section className="luxury-gradient rounded-[30px] p-5 md:p-6 text-white shadow-[0_18px_34px_rgba(18,162,110,0.30)]">
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span className="text-[13px] bg-white/20 rounded-full px-3 py-1 truncate">
                        {fund.name} · {MONTH.format(new Date())}
                      </span>
                      <span className="text-[12px] text-white/85 shrink-0">
                        {isOwner ? 'أنت المالك' : 'تصرف منه'}
                      </span>
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
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-3 text-xs text-white/90">
                        <span>
                          صُرف <Money amount={fundSpent} currency={currency} /> هذا الشهر
                        </span>
                        <span className="flex items-center gap-1">
                          <Icon name="clock" className="h-3.5 w-3.5" />
                          {outlookText(outlook)}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-5">
                      {isOwner && (
                        <button
                          type="button"
                          onClick={() => setSheet('deposit')}
                          className="min-h-[46px] rounded-2xl bg-white text-brand-700 font-semibold inline-flex items-center justify-center gap-1.5"
                        >
                          <Icon name="down" className="h-4 w-4 rotate-180" strokeWidth={2.4} />
                          تمويل
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setSheet('order')}
                        className={`min-h-[46px] rounded-2xl bg-white/20 hover:bg-white/25 text-white font-semibold inline-flex items-center justify-center gap-1.5 ${isOwner ? '' : 'col-span-2'}`}
                      >
                        <Icon name="bag" className="h-4 w-4" />
                        طلبية
                      </button>
                    </div>
                  </section>

                  <div className="grid grid-cols-3 gap-2">
                    <Stat label="عمليات" value={fund._count?.transactions ?? movements.length} />
                    <Stat
                      label="بانتظار الموافقة"
                      value={pending.filter(o => o.fundId === fund.id).length}
                      tone="sun"
                    />
                    <Stat
                      label="معتمدة للشراء"
                      value={approved.filter(o => o.fundId === fund.id).length}
                      tone="brand"
                    />
                  </div>

                  {isOwner && pending.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setTab('orders')}
                      className="w-full flex items-center gap-3 rounded-[24px] bg-sun-100 dark:bg-sun-500/15 p-4 text-right"
                    >
                      <span className="h-11 w-11 grid place-items-center rounded-2xl bg-white/70 dark:bg-white/10 text-sun-700 dark:text-sun-300">
                        <Icon name="bag" className="h-5 w-5" />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block font-semibold text-ink dark:text-white">
                          {pending.length === 1
                            ? 'طلبية واحدة تنتظر موافقتك'
                            : `${pending.length} طلبيات تنتظر موافقتك`}
                        </span>
                        <span className="block text-sm text-stone-600 dark:text-stone-300 truncate">
                          {pending[0].title}
                        </span>
                      </span>
                      <Icon name="chevron" className="h-5 w-5 text-stone-500" />
                    </button>
                  )}
                </div>

                <section className="min-w-0">
                  <h2 className="font-semibold text-ink dark:text-white mb-2 px-1">
                    آخر الحركات على الصندوق
                  </h2>
                  {movements.length ? (
                    <div className="premium-card divide-y divide-stone-100 dark:divide-white/5 overflow-hidden">
                      {movements.map(tx => {
                        const isIn = tx.type !== 'expense';
                        return (
                          <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
                            {tx.type === 'transfer' ? (
                              <span className="h-11 w-11 shrink-0 grid place-items-center rounded-2xl bg-brand-50 dark:bg-brand-500/10 text-brand-600">
                                <Icon name="down" className="h-5 w-5 rotate-180" />
                              </span>
                            ) : (
                              <CategoryIcon category={tx.category} />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-ink dark:text-white truncate">
                                {tx.type === 'transfer'
                                  ? tx.description || 'تمويل الصندوق'
                                  : tx.description || tx.category?.nameAr || tx.category?.name}
                              </p>
                              <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
                                {[tx.user?.name, formatDay(tx.date)].filter(Boolean).join(' · ')}
                              </p>
                            </div>
                            <Money
                              amount={tx.amount}
                              currency={currency}
                              sign={isIn ? '+' : '-'}
                              className={`font-semibold ${isIn ? 'text-mint-600 dark:text-mint-400' : 'text-ink dark:text-white'}`}
                              currencyClassName="text-stone-400"
                            />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="premium-card p-6 text-center text-sm text-stone-500 dark:text-stone-400">
                      لا حركات على هذا الصندوق بعد. أول مصروف من «+» يظهر هنا.
                    </div>
                  )}
                </section>
              </div>
            )}

            {tab === 'orders' && (
              <div className="space-y-5 max-w-3xl">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-stone-500 dark:text-stone-400">
                    {isOwner
                      ? 'يطلب شريكك شراء شيء، فتوافق، ثم يُخصم من الصندوق حين يشتريه.'
                      : 'اطلب شراء شيء من الصندوق، وحين يوافق المالك تشتريه وتسجّل ثمنه.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setSheet('order')}
                    className="shrink-0 min-h-[44px] px-4 inline-flex items-center gap-1.5 rounded-full bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold shadow-lg shadow-brand-500/25"
                  >
                    <Icon name="plus" className="h-4 w-4" strokeWidth={2.6} />
                    طلبية جديدة
                  </button>
                </div>

                {pending.length === 0 && approved.length === 0 ? (
                  <EmptyState
                    icon="bag"
                    title="لا طلبيات مفتوحة"
                    text="كل الطلبيات اشتُريت أو لم يُطلب شيء بعد."
                  />
                ) : (
                  <>
                    {pending.length > 0 && (
                      <OrderGroup title={isOwner ? 'تنتظر موافقتك' : 'تنتظر موافقة المالك'}>
                        {pending.map(order => (
                          <OrderRow key={order.id} order={order} currency={currency} tone="sun">
                            {isOwner ? (
                              <>
                                <RowButton
                                  primary
                                  onClick={() =>
                                    run(
                                      () => shoppingOrderService.approveShoppingOrder(order.id),
                                      `وافقتَ على «${order.title}».`,
                                      'تعذّرت الموافقة على الطلبية.'
                                    )
                                  }
                                >
                                  موافقة
                                </RowButton>
                                <RowButton
                                  onClick={() =>
                                    window.confirm(`رفض طلبية «${order.title}»؟`) &&
                                    run(
                                      () => shoppingOrderService.deleteShoppingOrder(order.id),
                                      'رُفضت الطلبية.',
                                      'تعذّر رفض الطلبية.'
                                    )
                                  }
                                >
                                  رفض
                                </RowButton>
                              </>
                            ) : (
                              <RowButton
                                onClick={() =>
                                  window.confirm(`إلغاء طلبية «${order.title}»؟`) &&
                                  run(
                                    () => shoppingOrderService.deleteShoppingOrder(order.id),
                                    'أُلغيت الطلبية.',
                                    'تعذّر إلغاء الطلبية.'
                                  )
                                }
                              >
                                إلغاء
                              </RowButton>
                            )}
                          </OrderRow>
                        ))}
                      </OrderGroup>
                    )}
                    {approved.length > 0 && (
                      <OrderGroup title="معتمدة، بانتظار الشراء">
                        {approved.map(order => (
                          <OrderRow key={order.id} order={order} currency={currency} tone="brand">
                            <RowButton primary onClick={() => setSheet(order)}>
                              اشتريتُها
                            </RowButton>
                            <RowButton
                              onClick={() =>
                                window.confirm(`حذف طلبية «${order.title}»؟`) &&
                                run(
                                  () => shoppingOrderService.deleteShoppingOrder(order.id),
                                  'حُذفت الطلبية.',
                                  'تعذّر حذف الطلبية.'
                                )
                              }
                            >
                              حذف
                            </RowButton>
                          </OrderRow>
                        ))}
                      </OrderGroup>
                    )}
                  </>
                )}
              </div>
            )}

            {tab === 'partners' && isOwner && (
              <PartnerForm
                saving={saving}
                onSubmit={(name, email, password) =>
                  run(
                    () => authService.registerPartner(name, email, password),
                    `أُضيف «${name}». يدخل الآن ببريده وكلمة المرور التي اخترتها.`,
                    'تعذّرت إضافة الشريك.'
                  )
                }
              />
            )}
          </>
        )}
      </main>

      <CreateFundSheet
        open={sheet === 'create'}
        onClose={() => setSheet(null)}
        currency={currencyLabel(currency)}
        saving={saving}
        onSubmit={(name, amount) =>
          run(
            () => jointFundService.createJointFund({ name, initialBalance: amount || 0 }),
            `أُنشئ «${name}».`,
            'تعذّر إنشاء الصندوق.'
          )
        }
      />
      <DepositSheet
        open={sheet === 'deposit'}
        onClose={() => setSheet(null)}
        fund={fund}
        currency={currencyLabel(currency)}
        saving={saving}
        onSubmit={(amount, description) =>
          run(
            () => jointFundService.addMoneyToFund(fund.id, { amount, description }),
            `موّلتَ «${fund.name}» بـ ${amount.toLocaleString('en-US')} ${currencyLabel(currency)}.`,
            'تعذّر التمويل.'
          )
        }
      />
      <OrderSheet
        open={sheet === 'order'}
        onClose={() => setSheet(null)}
        funds={funds}
        defaultFundId={fundId}
        currency={currencyLabel(currency)}
        saving={saving}
        onSubmit={(title, estAmount, orderFundId) =>
          run(
            () =>
              shoppingOrderService.createShoppingOrder({ title, estAmount, fundId: orderFundId }),
            isOwner ? `أُضيفت طلبية «${title}».` : `أُرسلت «${title}» إلى المالك للموافقة.`,
            'تعذّر إرسال الطلبية.'
          )
        }
      />
      <PurchaseSheet
        order={sheet && typeof sheet === 'object' ? sheet : null}
        onClose={() => setSheet(null)}
        categories={categories}
        currency={currencyLabel(currency)}
        saving={saving}
        onSubmit={(order, actualAmount, categoryId, description) =>
          run(
            () =>
              shoppingOrderService.purchaseShoppingOrder(order.id, {
                actualAmount,
                categoryId,
                description,
              }),
            `سُجّل شراء «${order.title}» وخُصم من الصندوق.`,
            'تعذّر تسجيل الشراء.'
          )
        }
      />
    </div>
  );
};

const EmptyState = ({ icon, title, text, action }) => (
  <div className="premium-card p-8 text-center">
    <span className="mx-auto mb-4 h-16 w-16 grid place-items-center rounded-3xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
      <Icon name={icon} className="h-8 w-8" />
    </span>
    <h2 className="text-lg font-bold text-ink dark:text-white mb-1">{title}</h2>
    <p className="text-sm text-stone-500 dark:text-stone-400 mb-5 max-w-sm mx-auto">{text}</p>
    {action && (
      <button
        type="button"
        onClick={action[1]}
        className="min-h-[48px] px-6 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-semibold"
      >
        {action[0]}
      </button>
    )}
  </div>
);

const STAT_TONE = {
  ink: 'text-ink dark:text-white',
  sun: 'text-sun-700 dark:text-sun-300',
  brand: 'text-brand-600 dark:text-brand-300',
};

const Stat = ({ label, value, tone = 'ink' }) => (
  <div className="premium-card p-3 text-center">
    <p className={`num text-2xl font-bold ${STAT_TONE[tone]}`}>{value}</p>
    <p className="text-[11px] leading-tight text-stone-500 dark:text-stone-400">{label}</p>
  </div>
);

const OrderGroup = ({ title, children }) => (
  <section>
    <h2 className="font-semibold text-ink dark:text-white mb-2 px-1">{title}</h2>
    <div className="premium-card divide-y divide-stone-100 dark:divide-white/5 overflow-hidden">
      {children}
    </div>
  </section>
);

const ORDER_TILE = {
  sun: 'bg-sun-100 text-sun-700 dark:bg-sun-500/15 dark:text-sun-300',
  brand: 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300',
};

const OrderRow = ({ order, currency, tone, children }) => (
  <div className="p-4">
    <div className="flex items-center gap-3">
      <span
        className={`h-11 w-11 shrink-0 grid place-items-center rounded-2xl ${ORDER_TILE[tone]}`}
      >
        <Icon name="bag" className="h-5 w-5" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-ink dark:text-white truncate">{order.title}</p>
        <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
          {[order.fund?.name, formatDay(order.createdAt)].filter(Boolean).join(' · ')}
        </p>
      </div>
      <Money
        amount={order.estAmount}
        currency={currency}
        className="font-semibold text-ink dark:text-white"
        currencyClassName="text-stone-400"
      />
    </div>
    <div className="flex gap-2 mt-3 pr-14">{children}</div>
  </div>
);

const RowButton = ({ primary, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`min-h-[38px] px-4 rounded-xl text-sm font-semibold transition-colors ${
      primary
        ? 'bg-brand-500 hover:bg-brand-600 text-white'
        : 'bg-soft dark:bg-white/5 text-stone-600 dark:text-stone-300 hover:bg-alert-50 hover:text-alert-600'
    }`}
  >
    {children}
  </button>
);

const PartnerForm = ({ saving, onSubmit }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const canSave = name.trim() && email.trim() && password.length >= 8 && !saving;

  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        if (canSave) onSubmit(name.trim(), email.trim(), password);
      }}
      className="premium-card p-5 md:p-6 max-w-lg"
    >
      <div className="flex items-center gap-3 mb-5">
        <span className="h-12 w-12 grid place-items-center rounded-2xl bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300 text-xl font-bold">
          +
        </span>
        <div>
          <h2 className="font-bold text-ink dark:text-white">أضف شريكك</h2>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            يصرف من الصندوق ويطلب طلبيات، ولا يرى أقسامك الخاصة.
          </p>
        </div>
      </div>
      <TextField
        label="الاسم"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="مثال: سارة"
        autoComplete="off"
      />
      <TextField
        label="البريد الإلكتروني"
        type="email"
        dir="ltr"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="name@example.com"
        autoComplete="off"
      />
      <TextField
        label="كلمة المرور (8 أحرف على الأقل)"
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        autoComplete="new-password"
      />
      <SubmitButton disabled={!canSave}>{saving ? 'جارٍ الإضافة...' : 'أضف الشريك'}</SubmitButton>
    </form>
  );
};

const CreateFundSheet = ({ open, onClose, currency, saving, onSubmit }) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  useEffect(() => {
    if (open) {
      setName('');
      setAmount('');
    }
  }, [open]);
  const canSave = name.trim() && !saving;
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="صندوق جديد"
      onSubmit={e => {
        e.preventDefault();
        if (canSave) onSubmit(name.trim(), parseFloat(amount) || 0);
      }}
    >
      <TextField
        label="اسم الصندوق"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="مثال: مصروف البيت"
        autoFocus
      />
      <AmountInput
        value={amount}
        onChange={setAmount}
        currency={currency}
        label="تمويل أولي (اختياري)"
        autoFocus={false}
      />
      <SubmitButton disabled={!canSave}>{saving ? 'جارٍ الإنشاء...' : 'أنشئ الصندوق'}</SubmitButton>
    </Sheet>
  );
};

const DepositSheet = ({ open, onClose, fund, currency, saving, onSubmit }) => {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  useEffect(() => {
    if (open) {
      setAmount('');
      setNote('');
    }
  }, [open]);
  const value = parseFloat(amount);
  const canSave = value > 0 && !saving;
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={`تمويل ${fund?.name || 'الصندوق'}`}
      onSubmit={e => {
        e.preventDefault();
        if (canSave) onSubmit(value, note.trim() || undefined);
      }}
    >
      <AmountInput value={amount} onChange={setAmount} currency={currency} />
      <TextField
        label="ملاحظة (اختياري)"
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder="مثال: مصروف أول الشهر"
        maxLength={200}
      />
      <SubmitButton disabled={!canSave}>{saving ? 'جارٍ التمويل...' : 'موّل الصندوق'}</SubmitButton>
    </Sheet>
  );
};

const OrderSheet = ({ open, onClose, funds, defaultFundId, currency, saving, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [orderFundId, setOrderFundId] = useState('');
  useEffect(() => {
    if (open) {
      setTitle('');
      setAmount('');
      setOrderFundId(defaultFundId || funds[0]?.id || '');
    }
  }, [open, defaultFundId, funds]);
  const value = parseFloat(amount);
  const canSave = title.trim() && value > 0 && orderFundId && !saving;
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="طلبية جديدة"
      onSubmit={e => {
        e.preventDefault();
        if (canSave) onSubmit(title.trim(), value, orderFundId);
      }}
    >
      <AmountInput value={amount} onChange={setAmount} currency={currency} label="الثمن التقريبي" />
      <TextField
        label="ماذا تحتاج؟"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="مثال: حليب أطفال، علبتان"
        maxLength={120}
      />
      {funds.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-3" role="group" aria-label="من أي صندوق">
          {funds.map(f => (
            <button
              key={f.id}
              type="button"
              aria-pressed={orderFundId === f.id}
              onClick={() => setOrderFundId(f.id)}
              className={`min-h-[40px] px-4 rounded-full text-sm font-medium ${
                orderFundId === f.id
                  ? 'bg-ink text-white dark:bg-white dark:text-ink'
                  : 'bg-soft dark:bg-white/5 text-stone-600 dark:text-stone-300'
              }`}
            >
              {f.name}
            </button>
          ))}
        </div>
      )}
      <SubmitButton disabled={!canSave}>{saving ? 'جارٍ الإرسال...' : 'أرسل الطلبية'}</SubmitButton>
    </Sheet>
  );
};

const PurchaseSheet = ({ order, onClose, categories, currency, saving, onSubmit }) => {
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [note, setNote] = useState('');
  useEffect(() => {
    if (order) {
      setAmount(String(order.estAmount ?? ''));
      setCategoryId('');
      setNote(order.title);
    }
  }, [order]);
  const value = parseFloat(amount);
  const canSave = value > 0 && categoryId && !saving;
  return (
    <Sheet
      open={!!order}
      onClose={onClose}
      title="كم دفعتَ فعلًا؟"
      onSubmit={e => {
        e.preventDefault();
        if (canSave) onSubmit(order, value, categoryId, note.trim() || order.title);
      }}
    >
      <AmountInput value={amount} onChange={setAmount} currency={currency} />
      <div className="grid grid-cols-4 gap-2 mb-4" role="group" aria-label="القسم">
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
      <TextField
        label="الوصف"
        value={note}
        onChange={e => setNote(e.target.value)}
        maxLength={200}
      />
      <SubmitButton disabled={!canSave}>
        {saving ? 'جارٍ التسجيل...' : 'سجّل الشراء واخصم من الصندوق'}
      </SubmitButton>
    </Sheet>
  );
};

export default Funds;
