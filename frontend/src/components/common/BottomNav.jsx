import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useQuickAdd } from '../../contexts/QuickAddContext';
import { NAV_TABS, activeSlot, slotCenter, slotSide } from '../../utils/nav';
import Icon from './Icon';

// The bar is one solid shape, so nothing scrolling behind it ever shows through. The cradle
// holding the «+» is painted on it (Ali's idea): a disc in the page colour, cut at the bar's top
// edge, with a soft inner shadow along its rim so it reads as a dip in the bar.
const CRADLE_SHADOW = 'inset 0 -5px 8px -3px rgba(20,24,60,0.16)';
// The bar's shadow darkens the page just above its top edge. The cradle gets the same shade at
// its top, so the painted cradle and the real page meet without a visible step (light mode only:
// the shadow does not show on the night background).
const CRADLE_SHADE =
  '[background-image:linear-gradient(to_bottom,transparent_50%,rgba(20,24,60,0.08)_50%,rgba(20,24,60,0)_75%)] dark:[background-image:none]';

// The active-tab marker (Ali's design): small green plates with rounded top corners hidden
// behind the white bar, raised just enough (PEEK) that their top edge shows as a fine line whose
// ends dip slightly. There is one plate on each side of the «+». Between two tabs on the same
// side the plate slides across; to a tab on the other side, it sinks behind the bar and the
// other side's plate rises under the new tab, so a marker never travels under the «+».
const SPRING = 'cubic-bezier(0.34, 1.56, 0.64, 1)'; // slight overshoot, then settles
const SLIDE_MS = 450;
const STRETCH_MS = 260; // the plate widens while it slides, then returns to its size
const SINK_MS = 200;
const RISE_MS = 380;
const PLATE_W = 34; // a little wider than the 22px icon under it
const PLATE_W_STRETCHED = 50;
const PEEK = 3; // how much of a plate shows above the bar
const PLATE_RADIUS = 8; // the line's ends dip over this length
const SIDES = ['start', 'end'];
const CRADLE_CLIP = 'inset(50% 0 0 0)'; // only the half below the bar's top edge

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Each page draws its own Sidebar, and so its own bar: the bar is mounted afresh on every
// navigation. It remembers where the marker last was, starts there, then glides to the new tab.
let lastShownSlot = -1;
// Where each side's plate last stood, so a plate rises where it sank (until it is moved).
const lastSideSlot = { start: 0, end: NAV_TABS.length - 1 };

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
  const [fromSlot, setFromSlot] = useState(-1); // the tab the marker is leaving

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
        setFromSlot(shownSlot);
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

  const activeSide = slotSide(shownSlot);
  if (activeSide) lastSideSlot[activeSide] = shownSlot;
  // A slide (same side) stretches the plate; a hand-over to the other side does not.
  const sliding = moving && slotSide(fromSlot) === activeSide;

  return (
    <nav
      aria-label="التنقل"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 drop-shadow-[0_-4px_16px_rgba(20,24,60,0.16)]"
    >
      {SIDES.map(side => {
        const shown = side === activeSide;
        const width = shown && sliding ? PLATE_W_STRETCHED : PLATE_W;
        // A rising plate is placed under its new tab at once (it is hidden there), then rises.
        const slide = shown && slotSide(fromSlot) === side;
        return (
          <span
            key={side}
            aria-hidden="true"
            data-testid={shown ? 'nav-plate' : undefined}
            className="pointer-events-none absolute h-7 bg-brand-500 motion-reduce:!transition-none"
            style={{
              top: -PEEK,
              insetInlineStart: `calc(${slotCenter(lastSideSlot[side])}% - ${width / 2}px)`,
              width,
              borderStartStartRadius: PLATE_RADIUS,
              borderStartEndRadius: PLATE_RADIUS,
              transform: shown ? 'none' : `translateY(${PEEK + 2}px)`,
              transition: [
                slide ? `inset-inline-start ${SLIDE_MS}ms ${SPRING}` : 'inset-inline-start 0s',
                `width ${sliding ? STRETCH_MS : SLIDE_MS}ms ${sliding ? 'ease-out' : SPRING}`,
                shown
                  ? `transform ${RISE_MS}ms ${SPRING} ${moving ? SINK_MS / 2 : 0}ms`
                  : `transform ${SINK_MS}ms ease-in`,
              ].join(', '),
            }}
          />
        );
      })}
      <div className="absolute inset-0 rounded-t-[26px] bg-white dark:bg-night-card" />
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute left-1/2 top-0 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-canvas dark:bg-night ${CRADLE_SHADE}`}
        style={{ clipPath: CRADLE_CLIP, boxShadow: CRADLE_SHADOW }}
      />
      <div
        className="relative grid grid-cols-5 items-center h-[72px]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
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
