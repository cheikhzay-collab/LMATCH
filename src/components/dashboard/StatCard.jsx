import React from 'react';

const StatCard = React.memo(({ icon: Icon, label, value, colorClass }) => {
  return (
    <div className="glass-panel stat-card">
      <div className={`stat-icon ${colorClass}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="stat-label">{label}</p>
        <div className="stat-value">{value}</div>
      </div>
    </div>
  );
});

StatCard.displayName = 'StatCard';

export default StatCard;
