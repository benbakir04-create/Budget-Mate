import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useQuickAdd } from '../../contexts/QuickAddContext';
import { NAV_TABS, activeSlot, slotCenter } from '../../utils/nav';
import Icon from './Icon';

// The bar's white shape with a round cradle cut out of its top edge for the «+».
const CRADLE_MASK = 'radial-gradient(circle 40px at 50% 0, transparent 39px, #000 40px)';

// The active-tab marker (Ali's design): a small green plate with rounded top corners hidden
// behind the white bar, raised just enough (PEEK) that its top edge shows as a fine line.
// It slides from tab to tab. Its rounded corners make the line's ends dip slightly, and on
// the two edge tabs it reaches the bar's side, so the bar's own rounded corner reveals it
// bending around, thinning to nothing down the side. Nothing is drawn: it is one shape.
const SPRING = 'cubic-bezier(0.34, 1.56, 0.64, 1)'; // slight overshoot, then settles
const SLIDE_MS = 450;
const STRETCH_MS = 260; // the plate widens while it travels, then returns to its size
const PLATE_W = 34; // a little wider than the 22px icon under it
const PLATE_W_STRETCHED = 50;
const PEEK = 3; // how much of the plate shows above the bar
const BAR_RADIUS = 26; // rounded-t-[26px] on the bar
const PLATE_RADIUS = 8; // the line's ends dip over this length
const EDGE_RADIUS = BAR_RADIUS + PEEK; // follows the bar's corner, PEEK px outside it
// The plate is hidden inside the cradle too, so it never shows around the «+» as it passes.
const PLATE_MASK = `radial-gradient(circle 40px at 50% ${PEEK}px, transparent 39px, #000 40px)`;
const BEAM_W = 64;
const BEAM_H = 52;
// Very faint emerald light falling from the line onto the icon (brand-500 at 12%).
const BEAM_BG = 'linear-gradient(to bottom, rgba(18,162,110,0.12), rgba(18,162,110,0))';
const BEAM_SHAPE = 'polygon(28% 0, 72% 0, 100% 100%, 0 100%)';
const LAST_SLOT = NAV_TABS.length - 1;

// Where the plate sits for a slot, as inline-start offset and width (the bar is RTL, so
// inline-start is the right side). Edge slots stretch the plate out to the bar's side.
const plateBox = (slot, width) => {
  const center = slotCenter(slot);
  if (slot === 0) return { start: '0px', width: `calc(${center}% + ${width / 2}px)` };
  if (slot === LAST_SLOT) {
    return {
      start: `calc(${center}% - ${width / 2}px)`,
      width: `calc(${100 - center}% + ${width / 2}px)`,
    };
  }
  return { start: `calc(${center}% - ${width / 2}px)`, width: `${width}px` };
};

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

  const plate = plateBox(shownSlot, moving ? PLATE_W_STRETCHED : PLATE_W);
  const center = shownSlot >= 0 ? slotCenter(shownSlot) : 0;

  return (
    <nav
      aria-label="التنقل"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 drop-shadow-[0_-4px_14px_rgba(20,24,60,0.10)]"
    >
      {shownSlot >= 0 && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 h-7"
          style={{ top: -PEEK, WebkitMask: PLATE_MASK, mask: PLATE_MASK }}
        >
          <span
            data-testid="nav-plate"
            className="absolute top-0 h-full bg-brand-500 motion-reduce:!transition-none"
            style={{
              insetInlineStart: plate.start,
              width: plate.width,
              borderStartStartRadius: shownSlot === 0 ? EDGE_RADIUS : PLATE_RADIUS,
              borderStartEndRadius: shownSlot === LAST_SLOT ? EDGE_RADIUS : PLATE_RADIUS,
              transition: [
                `inset-inline-start ${SLIDE_MS}ms ${SPRING}`,
                `width ${moving ? STRETCH_MS : SLIDE_MS}ms ${moving ? 'ease-out' : SPRING}`,
                `border-radius ${SLIDE_MS}ms ease`,
              ].join(', '),
            }}
          />
        </div>
      )}
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
