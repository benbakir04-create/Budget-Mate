import { useEffect } from 'react';
import Icon from './Icon';

// A bottom sheet on the phone and a centered card on a wide screen, in the same style as quick
// add. Closes on Escape or a tap outside. The body is a form, so Enter submits.
const Sheet = ({ open, onClose, title, onSubmit, children }) => {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = e => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center">
      <button
        type="button"
        aria-label="إغلاق"
        onClick={onClose}
        className="absolute inset-0 bg-ink/40 backdrop-blur-[2px] cursor-default"
      />
      <form
        onSubmit={onSubmit}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full md:max-w-lg bg-white dark:bg-night-card rounded-t-[30px] md:rounded-[30px] px-5 pt-3 pb-6 shadow-2xl max-h-[92vh] overflow-y-auto"
      >
        <span className="block md:hidden mx-auto mb-3 h-1.5 w-11 rounded-full bg-stone-200 dark:bg-white/10" />
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-ink dark:text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="h-10 w-10 grid place-items-center rounded-full bg-soft dark:bg-white/5 text-stone-500"
          >
            <Icon name="close" className="h-5 w-5" />
          </button>
        </div>
        {children}
      </form>
    </div>
  );
};

// The big centered amount used by every money sheet: grows with the number, currency beside it.
export const AmountInput = ({ value, onChange, currency, label, autoFocus = true }) => (
  <label className="block text-center mb-4">
    <span className={label ? 'block text-sm text-stone-500 mb-1' : 'sr-only'}>
      {label || 'المبلغ'}
    </span>
    <span className="flex items-baseline justify-center gap-2">
      <input
        type="number"
        inputMode="decimal"
        min="0.01"
        step="0.01"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="0"
        autoFocus={autoFocus}
        style={{ width: `${Math.max(String(value).length, 1) + 0.6}ch` }}
        className="num max-w-[11ch] bg-transparent text-center text-5xl font-bold text-ink dark:text-white placeholder:text-stone-300 focus:outline-none"
      />
      <span className="text-lg text-stone-500">{currency}</span>
    </span>
  </label>
);

export const TextField = ({ label, ...props }) => (
  <label className="block mb-3">
    <span className="block text-sm font-medium text-stone-600 dark:text-stone-300 mb-1.5">
      {label}
    </span>
    <input
      {...props}
      className="w-full min-h-[48px] px-4 rounded-2xl bg-soft dark:bg-white/5 text-ink dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
    />
  </label>
);

export const SubmitButton = ({ disabled, children }) => (
  <button
    type="submit"
    disabled={disabled}
    className="w-full min-h-[52px] mt-2 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-semibold shadow-lg shadow-brand-500/30 disabled:opacity-40 disabled:shadow-none transition-all"
  >
    {children}
  </button>
);

export default Sheet;
