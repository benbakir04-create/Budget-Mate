import { useEffect, useState } from 'react';

// A progress ring that fills on first show. pct can pass 100 (an overspent budget): the ring
// stays full and the caller colors it. Whatever is passed as children sits in the middle.
const Ring = ({
  pct,
  size = 64,
  stroke = 7,
  colorClass = 'text-brand-500',
  trackClass = 'text-soft dark:text-white/10',
  label,
  children,
}) => {
  const level = Math.min(Math.max(Number(pct) || 0, 0), 100);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(level));
    return () => cancelAnimationFrame(frame);
  }, [level]);

  const r = 50 - stroke / 2;
  return (
    <span
      className="relative inline-grid place-items-center shrink-0"
      style={{ width: size, height: size }}
      role={label ? 'img' : undefined}
      aria-label={label}
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90 -scale-y-100">
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className={trackClass}
        />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          pathLength="100"
          strokeDasharray={`${shown} 100`}
          className={`${colorClass} motion-safe:transition-[stroke-dasharray] motion-safe:duration-1000 motion-safe:ease-out`}
        />
      </svg>
      <span className="relative">{children}</span>
    </span>
  );
};

export default Ring;
