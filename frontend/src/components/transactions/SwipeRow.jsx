import { useRef, useState } from 'react';
import Icon from '../common/Icon';

const OPEN = 88;

// On the phone a row slides right to show a red «حذف» behind it. On a wide screen nothing
// moves; the row keeps its own delete button.
const SwipeRow = ({ onDelete, label, disabled, children }) => {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const start = useRef(null);

  if (disabled) return children;

  const onPointerDown = e => {
    if (e.pointerType === 'mouse') return;
    start.current = { x: e.clientX, y: e.clientY, base: offset, decided: false, horizontal: false };
  };
  const onPointerMove = e => {
    const s = start.current;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (!s.decided && Math.abs(dx) + Math.abs(dy) > 8) {
      s.decided = true;
      s.horizontal = Math.abs(dx) > Math.abs(dy);
      if (s.horizontal) setDragging(true);
    }
    if (s.horizontal) setOffset(Math.min(Math.max(s.base + dx, 0), OPEN + 24));
  };
  const onPointerEnd = () => {
    if (start.current?.horizontal) setOffset(o => (o > OPEN / 2 ? OPEN : 0));
    start.current = null;
    setDragging(false);
  };

  return (
    <div className="relative overflow-hidden md:overflow-visible">
      <button
        type="button"
        onClick={() => {
          setOffset(0);
          onDelete();
        }}
        tabIndex={offset ? 0 : -1}
        aria-hidden={!offset}
        aria-label={`حذف ${label}`}
        className="md:hidden absolute inset-y-0 left-0 w-[88px] flex flex-col items-center justify-center gap-0.5 bg-alert-500 text-white text-xs font-semibold"
      >
        <Icon name="trash" className="h-5 w-5" />
        حذف
      </button>
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        style={{ transform: offset ? `translateX(${offset}px)` : undefined, touchAction: 'pan-y' }}
        className={`relative bg-white dark:bg-night-card ${dragging ? '' : 'transition-transform duration-300 ease-out'}`}
      >
        {children}
      </div>
    </div>
  );
};

export default SwipeRow;
