import { LayoutDashboard, Users, BookOpen, CircleDollarSign, TrendingUp, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminOverview() {
  const { users, exams } = useAuth();
  const navigate = useNavigate();

  const totalPremium = users.filter(u => u.tier === 'premium').length;
  const totalRevenue = totalPremium * 99; // 99 Dh per premium user

  const revenueData = [
    { name: 'Jan', rev: 1200 },
    { name: 'Fév', rev: 1900 },
    { name: 'Mar', rev: 2400 },
    { name: 'Avr', rev: 3100 },
    { name: 'Mai', rev: 4500 },
    { name: 'Juin', rev: totalRevenue * 10 }, // Simulated jump
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.6rem 1rem', borderRadius: 'var(--radius-md)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
          <p style={{ margin: 0, fontWeight: 800, fontSize: '0.95rem', color: '#fff' }}>{`${payload[0].value} Dh`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="animate-fade-in">
      <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: '12px', background: 'linear-gradient(135deg, var(--violet), var(--emerald))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LayoutDashboard size={22} color="#fff" />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>Vue d'ensemble</h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0 }}>Bienvenue dans le centre de contrôle de L'Match.</p>
        </div>
        
        {/* Quick OMR Scan Button */}
        <button 
          className="btn"
          onClick={() => navigate('/scanner')}
          style={{ 
            background: 'linear-gradient(135deg, var(--violet), var(--emerald))', 
            border: 'none', 
            fontWeight: 800, 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            boxShadow: '0 10px 25px rgba(124, 58, 237, 0.25)',
            transform: 'translateY(0)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(124, 58, 237, 0.35)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 25px rgba(124, 58, 237, 0.25)'; }}
        >
          <Camera size={16} /> Scanner QCM (OMR)
        </button>
      </header>

      <div className="dashboard-grid">
        <div className="col-span-3 glass-panel stat-card">
          <div className="stat-icon primary"><Users size={24} /></div>
          <div>
            <p className="stat-label">Total Élèves</p>
            <div className="stat-value">{users.length * 120}</div>
          </div>
        </div>
        <div className="col-span-3 glass-panel stat-card">
          <div className="stat-icon accent"><CircleDollarSign size={24} /></div>
          <div>
            <p className="stat-label">Revenu Mensuel (MRR)</p>
            <div className="stat-value">{totalRevenue * 120} Dh</div>
          </div>
        </div>
        <div className="col-span-3 glass-panel stat-card">
          <div className="stat-icon warning"><TrendingUp size={24} /></div>
          <div>
            <p className="stat-label">Abonnés Premium</p>
            <div className="stat-value">{totalPremium * 120}</div>
          </div>
        </div>
        <div className="col-span-3 glass-panel stat-card">
          <div className="stat-icon danger"><BookOpen size={24} /></div>
          <div>
            <p className="stat-label">Concours en Base</p>
            <div className="stat-value">{exams.length}</div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="col-span-8 glass-panel">
          <h3 style={{ marginBottom: '1.5rem' }}>Évolution des Revenus</h3>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--violet)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--violet)" stopOpacity={0}/>
                  </linearGradient>
                  <filter id="glowLine" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Area type="monotone" dataKey="rev" stroke="var(--violet)" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" filter="url(#glowLine)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="col-span-4 glass-panel">
          <h3 style={{ marginBottom: '1.5rem' }}>Activité Récente</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent)' }}></div>
              <div>
                <p style={{ fontSize: '0.9rem' }}>Nouveau paiement Premium</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Il y a 2 heures</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary)' }}></div>
              <div>
                <p style={{ fontSize: '0.9rem' }}>Upload: Médecine 2024</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Hier</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--warning)' }}></div>
              <div>
                <p style={{ fontSize: '0.9rem' }}>Inscription de 45 élèves</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Hier</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
