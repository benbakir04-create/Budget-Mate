import Money from '../common/Money';

// A small bar per day of the month. Touching a bar shows that day's transactions only;
// touching it again shows the whole month.
const DailyChart = ({ totals, today, selected, onSelect, currency }) => {
  const max = Math.max(...totals, 1);
  const marks = [1, 5, 10, 15, 20, 25, totals.length];
  return (
    <section className="premium-card p-4 mb-4" aria-label="الصرف اليومي">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-sm font-semibold text-ink dark:text-white">الصرف يومًا بيوم</h2>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          {selected ? (
            <>
              يوم <span className="num">{selected}</span>:{' '}
              <Money amount={totals[selected - 1]} currency={currency} />
            </>
          ) : (
            'المس يومًا لترى عملياته'
          )}
        </p>
      </div>
      <div className="flex items-end gap-[3px] h-20" dir="ltr">
        {totals.map((total, i) => {
          const day = i + 1;
          const future = today && day > today;
          const active = selected === day;
          const isToday = today === day;
          return (
            <button
              key={day}
              type="button"
              disabled={future}
              onClick={() => onSelect(active ? null : day)}
              aria-pressed={active}
              aria-label={`يوم ${day}`}
              className="flex-1 h-full flex items-end group disabled:cursor-default"
            >
              <span
                className={`w-full rounded-t-[4px] rounded-b-[2px] transition-all motion-safe:duration-500 ${
                  active
                    ? 'bg-brand-500'
                    : selected
                      ? 'bg-stone-200 dark:bg-white/10'
                      : isToday
                        ? 'bg-sun-400'
                        : total > 0
                          ? 'bg-brand-300 dark:bg-brand-500/60 group-hover:bg-brand-500'
                          : 'bg-soft dark:bg-white/5'
                }`}
                style={{ height: `${total > 0 ? Math.max((total / max) * 100, 8) : 4}%` }}
              />
            </button>
          );
        })}
      </div>
      <div className="relative h-4 mt-1 text-[10px] text-stone-400" dir="ltr">
        {marks.map(day => (
          <span
            key={day}
            className="num absolute -translate-x-1/2"
            style={{ left: `${((day - 0.5) / totals.length) * 100}%` }}
          >
            {day}
          </span>
        ))}
      </div>
    </section>
  );
};

export default DailyChart;
