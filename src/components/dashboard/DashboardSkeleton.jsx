import React from 'react';

export default function DashboardSkeleton() {
  return (
    <div className="animate-pulse-subtle">
      {/* ── Header Skeleton ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.6rem' }}>
            <div className="shimmer-bg" style={{ width: 40, height: 40, borderRadius: '12px' }} />
            <div className="shimmer-bg" style={{ width: 180, height: 28, borderRadius: '6px' }} />
          </div>
          <div className="shimmer-bg" style={{ width: 280, height: 16, borderRadius: '4px' }} />
        </div>
        
        {/* Quick Actions Skeleton */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div className="shimmer-bg" style={{ width: 240, height: 44, borderRadius: 'var(--radius-lg)' }} />
          <div className="shimmer-bg" style={{ width: 200, height: 44, borderRadius: 'var(--radius-lg)' }} />
        </div>
      </div>

      {/* ── Stats Bento Row Skeleton ── */}
      <div className="dashboard-grid stats-row" style={{ marginBottom: '1.5rem' }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="col-span-3 glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.5rem' }}>
            <div className="shimmer-bg" style={{ width: 56, height: 56, borderRadius: 'var(--radius-lg)', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="shimmer-bg" style={{ width: '60%', height: 12, borderRadius: '4px', marginBottom: '0.5rem' }} />
              <div className="shimmer-bg" style={{ width: '40%', height: 20, borderRadius: '4px' }} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Main content grid Skeleton ── */}
      <div className="dashboard-grid">
        {/* Left Column - History Skeleton */}
        <div className="col-span-8" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div className="shimmer-bg" style={{ width: 200, height: 20, borderRadius: '4px' }} />
              <div className="shimmer-bg" style={{ width: 100, height: 14, borderRadius: '4px' }} />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[1, 2, 3, 4].map((idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 0', borderBottom: idx < 4 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                    <div className="shimmer-bg" style={{ width: 40, height: 40, borderRadius: '50%' }} />
                    <div style={{ flex: 1 }}>
                      <div className="shimmer-bg" style={{ width: '40%', height: 14, borderRadius: '4px', marginBottom: '0.4rem' }} />
                      <div className="shimmer-bg" style={{ width: '25%', height: 10, borderRadius: '4px' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <div className="shimmer-bg" style={{ width: 60, height: 16, borderRadius: '4px' }} />
                    <div className="shimmer-bg" style={{ width: 80, height: 32, borderRadius: 'var(--radius-md)' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right sidebar Skeleton */}
        <div className="col-span-4" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Weekly Activity chart placeholder */}
          <div className="glass-panel" style={{ height: 220, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div className="shimmer-bg" style={{ width: 140, height: 16, borderRadius: '4px' }} />
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '120px', padding: '0 0.5rem' }}>
              {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                <div key={day} className="shimmer-bg" style={{ width: '10%', height: `${20 + Math.random() * 60}%`, borderRadius: '4px 4px 0 0' }} />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 0.2rem' }}>
              {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
                <div key={i} className="shimmer-bg" style={{ width: 14, height: 10, borderRadius: '2px' }} />
              ))}
            </div>
          </div>

          {/* Weak topics placeholder */}
          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            <div className="shimmer-bg" style={{ width: 110, height: 16, borderRadius: '4px', marginBottom: '1.25rem' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[1, 2, 3].map((idx) => (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <div className="shimmer-bg" style={{ width: '50%', height: 12, borderRadius: '4px' }} />
                    <div className="shimmer-bg" style={{ width: '20%', height: 12, borderRadius: '4px' }} />
                  </div>
                  <div className="shimmer-bg" style={{ width: '100%', height: 6, borderRadius: '99px' }} />
                </div>
              ))}
            </div>
            <div className="shimmer-bg" style={{ width: '100%', height: 40, borderRadius: 'var(--radius-lg)', marginTop: '1.25rem' }} />
          </div>

          {/* Advice card placeholder */}
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', gap: '0.75rem' }}>
            <div className="shimmer-bg" style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="shimmer-bg" style={{ width: '40%', height: 14, borderRadius: '4px', marginBottom: '0.5rem' }} />
              <div className="shimmer-bg" style={{ width: '90%', height: 10, borderRadius: '4px', marginBottom: '0.3rem' }} />
              <div className="shimmer-bg" style={{ width: '75%', height: 10, borderRadius: '4px' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
