import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useQuickAdd } from '../../contexts/QuickAddContext';
import { NAV_TABS, activeSlot, slotCenter } from '../../utils/nav';
import Icon from './Icon';

// The bar's white shape with a round cradle cut out of its top edge for the «+».
const CRADLE_MASK = 'radial-gradient(circle 40px at 50% 0, transparent 39px, #000 40px)';

// Motion of the active-tab marker (Ali's pick: a fine line over the icon).
const SPRING = 'cubic-bezier(0.34, 1.56, 0.64, 1)'; // slight overshoot, then settles
const SLIDE_MS = 450;
const STRETCH_MS = 260; // the line stretches while it travels, then returns to its length
const LINE_W = 30; // a little wider than the 22px icon under it
const LINE_W_STRETCHED = 46;
const BEAM_W = 64;
const BEAM_H = 52;
// Very faint emerald light falling from the line onto the icon (brand-500 at 12%).
const BEAM_BG = 'linear-gradient(to bottom, rgba(18,162,110,0.12), rgba(18,162,110,0))';
const BEAM_SHAPE = 'polygon(28% 0, 72% 0, 100% 100%, 0 100%)';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Each page draws its own Sidebar, and so its own bar: the bar is mounted afresh on every
// navigation. It remembers where the marker last was, starts there, then glides to the new tab.
let lastShownSlot = -1;

// Phone only: a white bar docked to the bottom, with a curved cradle holding a round «+»
// (Ali's pick among the light options).
const BottomNav = () => {
  const { openQuickAdd } = useQuickAdd();
  const { pathname } = useLocation();
  const slot = activeSlot(pathname);
  const [shownSlot, setShownSlot] = useState(() =>
    lastShownSlot >= 0 && slot >= 0 && !prefersReducedMotion() ? lastShownSlot : slot
  );
  const [moving, setMoving] = useState(false);

  // Leaves room at the bottom of every page so the bar never hides the last row.
  useEffect(() => {
    document.body.classList.add('has-bottom-nav');
    return () => document.body.classList.remove('has-bottom-nav');
  }, []);

  // Glide to the current tab. The marker is first painted at its old place (two frames),
  // so the browser animates the change; the line stretches only while it travels.
  useEffect(() => {
    lastShownSlot = slot;
    if (shownSlot === slot) return undefined;
    if (shownSlot < 0 || slot < 0 || prefersReducedMotion()) {
      setShownSlot(slot);
      return undefined;
    }
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        setShownSlot(slot);
        setMoving(true);
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [slot, shownSlot]);

  useEffect(() => {
    if (!moving) return undefined;
    const timer = setTimeout(() => setMoving(false), STRETCH_MS);
    return () => clearTimeout(timer);
  }, [moving]);

  const lineWidth = moving ? LINE_W_STRETCHED : LINE_W;
  const center = shownSlot >= 0 ? slotCenter(shownSlot) : 0;

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
        {shownSlot >= 0 && (
          <>
            <span
              aria-hidden="true"
              data-testid="nav-beam"
              className="pointer-events-none absolute top-0 motion-reduce:!transition-none"
              style={{
                width: BEAM_W,
                height: BEAM_H,
                insetInlineStart: `calc(${center}% - ${BEAM_W / 2}px)`,
                background: BEAM_BG,
                clipPath: BEAM_SHAPE,
                opacity: moving ? 0 : 1,
                transition: `inset-inline-start ${SLIDE_MS}ms ${SPRING}, opacity ${
                  moving ? '120ms ease' : '260ms ease 150ms'
                }`,
              }}
            />
            <span
              aria-hidden="true"
              data-testid="nav-line"
              className="pointer-events-none absolute top-[2px] h-[3px] rounded-full bg-brand-500 motion-reduce:!transition-none"
              style={{
                width: lineWidth,
                insetInlineStart: `calc(${center}% - ${lineWidth / 2}px)`,
                transition: `inset-inline-start ${SLIDE_MS}ms ${SPRING}, width ${STRETCH_MS}ms ease-out`,
              }}
            />
          </>
        )}
        {NAV_TABS.map((tab, index) => {
          // Visuals follow the marker (not the URL) so the old tab fades as the new one lights up.
          const isActive = index === shownSlot;
          return tab ? (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={`relative flex flex-col items-center gap-1 text-[11px] transition-colors duration-300 ${
                isActive ? 'text-brand-500 font-semibold' : 'text-stone-400 dark:text-stone-500'
              }`}
            >
              <span
                className="grid place-items-center transition-transform duration-[400ms] motion-reduce:transition-none"
                style={{
                  transform: isActive ? 'translateY(-2px) scale(1.14)' : 'none',
                  transitionTimingFunction: SPRING,
                }}
              >
                <Icon
                  name={tab.icon}
                  className={`h-[22px] w-[22px] ${isActive ? '[&_path]:fill-brand-500/15' : ''}`}
                  strokeWidth={isActive ? 2.2 : 2}
                />
              </span>
              {tab.label}
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
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
