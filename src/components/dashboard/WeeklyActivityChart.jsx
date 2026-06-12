import React from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp } from 'lucide-react';

const ChartTooltip = React.memo(({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ 
        background: 'rgba(15, 23, 42, 0.85)', 
        backdropFilter: 'blur(12px)', 
        border: '1px solid rgba(255,255,255,0.1)', 
        padding: '0.6rem 1.25rem', 
        borderRadius: 'var(--radius-md)', 
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)' 
      }}>
        <p style={{ margin: 0, fontWeight: 800, fontSize: '0.9rem', color: '#818cf8' }}>
          {`${payload[0].value} révisions`}
        </p>
      </div>
    );
  }
  return null;
});
ChartTooltip.displayName = 'ChartTooltip';

const WeeklyActivityChart = React.memo(({ data = [] }) => {
  return (
    <div className="glass-panel">
      <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
        <TrendingUp size={16} color="var(--emerald)" /> Votre Semaine
      </h3>
      <div style={{ height: 160 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barSize={18}>
            <defs>
              <linearGradient id="colorEmerald" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--emerald)" stopOpacity={1}/>
                <stop offset="95%" stopColor="var(--emerald)" stopOpacity={0.6}/>
              </linearGradient>
              <linearGradient id="colorViolet" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--violet)" stopOpacity={1}/>
                <stop offset="95%" stopColor="var(--violet)" stopOpacity={0.6}/>
              </linearGradient>
              <linearGradient id="colorNavy" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--navy-600)" stopOpacity={1}/>
                <stop offset="95%" stopColor="var(--navy-700)" stopOpacity={0.5}/>
              </linearGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            <XAxis dataKey="name" stroke="var(--text-subtle)" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {data.map((entry, i) => {
                const fill = entry.count >= 20 ? 'url(#colorEmerald)' : entry.count > 0 ? 'url(#colorViolet)' : 'url(#colorNavy)';
                const isHigh = entry.count >= 20;
                return <Cell key={i} fill={fill} filter={isHigh ? 'url(#glow)' : ''} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

WeeklyActivityChart.displayName = 'WeeklyActivityChart';

export default WeeklyActivityChart;
