import { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useQuickAdd } from '../../contexts/QuickAddContext';
import Icon from './Icon';

const TABS = [
  { to: '/dashboard', icon: 'home', label: 'الرئيسية' },
  { to: '/transactions', icon: 'list', label: 'العمليات' },
  null,
  { to: '/budget', icon: 'target', label: 'الميزانيات' },
  { to: '/funds', icon: 'wallet', label: 'الصندوق' },
];

// The bar's white shape with a round cradle cut out of its top edge for the «+».
const CRADLE_MASK = 'radial-gradient(circle 40px at 50% 0, transparent 39px, #000 40px)';

// Phone only: a white bar docked to the bottom, with a curved cradle holding a round «+»
// (Ali's pick among the light options).
const BottomNav = () => {
  const { openQuickAdd } = useQuickAdd();

  // Leaves room at the bottom of every page so the bar never hides the last row.
  useEffect(() => {
    document.body.classList.add('has-bottom-nav');
    return () => document.body.classList.remove('has-bottom-nav');
  }, []);

  return (
    <nav
      aria-label="التنقل"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 drop-shadow-[0_-4px_14px_rgba(20,24,60,0.10)]"
    >
      <div
        className="absolute inset-0 rounded-t-[26px] bg-white dark:bg-night-card"
        style={{ WebkitMask: CRADLE_MASK, mask: CRADLE_MASK }}
      />
      <div
        className="relative grid grid-cols-5 items-center h-[72px]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {TABS.map(tab =>
          tab ? (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 text-[11px] ${
                  isActive ? 'text-brand-500 font-semibold' : 'text-stone-400 dark:text-stone-500'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    name={tab.icon}
                    className="h-[22px] w-[22px]"
                    strokeWidth={isActive ? 2.4 : 2}
                  />
                  {tab.label}
                </>
              )}
            </NavLink>
          ) : (
            <button
              key="add"
              type="button"
              onClick={openQuickAdd}
              aria-label="مصروف جديد"
              className="justify-self-center -mt-16 h-[62px] w-[62px] rounded-full grid place-items-center text-white bg-gradient-to-br from-brand-500 to-brand-700 shadow-[0_10px_22px_rgba(18,162,110,0.35)]"
            >
              <Icon name="plus" className="h-7 w-7" strokeWidth={2.4} />
            </button>
          )
        )}
      </div>
    </nav>
  );
};

export default BottomNav;
