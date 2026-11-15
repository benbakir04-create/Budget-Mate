import { useEffect, useState } from 'react';

// «الميزان»: a half dial over the balance. The arc fills from the right (where Arabic reading
// starts) with what is left of the month's money, and a needle swings to it on first load.
const R = 84;
const ARC = `M ${100 + R} 100 A ${R} ${R} 0 0 0 ${100 - R} 100`;

const BalanceGauge = ({ pct, label }) => {
  const level = Math.min(Math.max(Number(pct) || 0, 0), 100);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(level));
    return () => cancelAnimationFrame(frame);
  }, [level]);

  const ticks = [0, 25, 50, 75, 100].map(p => {
    const a = (p / 100) * Math.PI;
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    return {
      p,
      x1: 100 + (R + 10) * cos,
      y1: 100 - (R + 10) * sin,
      x2: 100 + (R + 15) * cos,
      y2: 100 - (R + 15) * sin,
    };
  });

  return (
    <div className="relative mx-auto w-full max-w-[230px]" role="img" aria-label={label}>
      <svg viewBox="-6 -2 212 112" className="w-full overflow-visible">
        <path
          d={ARC}
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.22"
          strokeWidth="14"
          strokeLinecap="round"
        />
        <path
          d={ARC}
          pathLength="100"
          fill="none"
          className="text-sun-300 motion-safe:transition-[stroke-dasharray] motion-safe:duration-1000 motion-safe:ease-out"
          stroke="currentColor"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${shown} 100`}
        />
        {ticks.map(t => (
          <line
            key={t.p}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke="currentColor"
            strokeOpacity="0.45"
            strokeWidth="2"
            strokeLinecap="round"
          />
        ))}
        <g
          className="motion-safe:transition-transform motion-safe:duration-1000 motion-safe:ease-[cubic-bezier(0.34,1.4,0.64,1)]"
          style={{
            transform: `rotate(${-(shown / 100) * 180}deg)`,
            transformOrigin: '100px 100px',
          }}
        >
          <line
            x1="100"
            y1="100"
            x2={100 + R - 20}
            y2="100"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </g>
        <circle cx="100" cy="100" r="9" fill="currentColor" />
        <circle cx="100" cy="100" r="3.5" className="text-brand-600" fill="currentColor" />
      </svg>
    </div>
  );
};

export default BalanceGauge;
