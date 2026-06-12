import React from 'react';

const CircularTimer = React.memo(({ timeLeft, totalTime }) => {
  const r = 40;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, timeLeft / totalTime));
  const offset = circ * (1 - pct);
  const critical = timeLeft <= 300;
  const color = critical ? 'var(--danger)' : timeLeft <= 1200 ? 'var(--warning)' : 'var(--violet)';
  const h = Math.floor(timeLeft / 3600);
  const m = Math.floor((timeLeft % 3600) / 60);
  const s = timeLeft % 60;
  const label = h > 0
    ? `${h}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`
    : `${m}:${s.toString().padStart(2,'0')}`;

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      gap: '0.75rem',
      padding: '0.5rem 0'
    }}>
      <div style={{ position: 'relative', width: 90, height: 90 }}>
        <svg width={90} height={90} viewBox="0 0 90 90" style={{ position: 'absolute', inset: 0 }}>
          {/* Track */}
          <circle cx="45" cy="45" r={r} fill="none" stroke="var(--bg-hover)" strokeWidth="5" />
          {/* Fill */}
          <circle
            cx="45" cy="45" r={r} fill="none"
            stroke={color}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            transform="rotate(-90 45 45)"
            style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease' }}
          />
          {/* Time label */}
          <text
            x="45" y="48"
            textAnchor="middle" dominantBaseline="middle"
            fill="var(--text-main)"
            fontSize="14"
            fontWeight="800"
            fontFamily="'Plus Jakarta Sans', sans-serif"
          >
            {label}
          </text>
        </svg>
      </div>
      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
        Temps restant
      </span>
    </div>
  );
});

CircularTimer.displayName = 'CircularTimer';

export default CircularTimer;
