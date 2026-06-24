import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Users, Crown, Activity, TrendingUp, RefreshCw, Search, User, ChevronRight } from 'lucide-react';

const isUserOnline = (user) => {
  if (!user || !user.updatedAt) return false;
  const lastActive = new Date(user.updatedAt);
  const diffMs = new Date() - lastActive;
  return diffMs < 5 * 60 * 1000; // 5 minutes threshold
};

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isMobile;
}

export default function AdminUsers() {
  const { users, refreshAdminData, syncStudentsList } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (refreshAdminData) {
      refreshAdminData();
    }
  }, [refreshAdminData]);

  const handleRefresh = async () => {
    if (!refreshAdminData) return;
    setIsRefreshing(true);
    try {
      await refreshAdminData();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSync = async () => {
    if (!syncStudentsList) return;
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const res = await syncStudentsList();
      setSyncResult(res);
    } catch (e) {
      alert("Échec de la synchronisation: " + (e.message || e));
    } finally {
      setIsSyncing(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = [
    { label: 'Total Étudiants', value: users.length, icon: Users, color: 'var(--primary)' },
    { label: 'Utilisateurs Premium', value: users.filter(u => u.tier === 'premium').length, icon: Crown, color: 'var(--warning)' },
    { label: 'Activité Globale', value: '85%', icon: Activity, color: 'var(--emerald)' },
    { label: 'Nouveaux (7j)', value: '+12', icon: TrendingUp, color: 'var(--accent)' },
  ];

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
      {/* ── Page Header ── */}
      <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: '12px', background: 'linear-gradient(135deg, var(--violet), var(--emerald))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={22} color="#fff" />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>Gestion des Étudiants</h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0 }}>Cliquez sur un élève pour consulter son profil et suivre sa progression.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleSync}
            disabled={isSyncing || isRefreshing}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.6rem 1.2rem',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(52, 211, 153, 0.1))',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '10px',
              color: 'var(--emerald)',
              fontWeight: 700, fontSize: '0.875rem',
              cursor: isSyncing ? 'wait' : 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--emerald)'; e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.18), rgba(52, 211, 153, 0.18))'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)'; e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(52, 211, 153, 0.1))'; }}
          >
            <RefreshCw size={15} style={{ animation: isSyncing ? 'spin 0.7s linear infinite' : 'none' }} />
            {isSyncing ? 'Mise à jour...' : 'Synchroniser la Base'}
          </button>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing || isSyncing}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.6rem 1.2rem',
              background: 'var(--bg-glass)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              color: 'var(--text-muted)',
              fontWeight: 600, fontSize: '0.875rem',
              cursor: isRefreshing ? 'wait' : 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--violet)'; e.currentTarget.style.color = 'var(--violet)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <RefreshCw size={15} style={{ animation: isRefreshing ? 'spin 0.7s linear infinite' : 'none' }} />
            {isRefreshing ? 'Chargement...' : 'Actualiser'}
          </button>
        </div>
      </header>
      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulseGreen {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
          70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
      `}</style>

      {/* ── Sync Result Alert ── */}
      {syncResult && (
        <div className="glass-panel animate-fade-in" style={{
          padding: '1rem 1.5rem',
          marginBottom: '1.5rem',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          background: 'rgba(16, 185, 129, 0.05)',
          borderRadius: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <p style={{ margin: 0, color: 'var(--emerald)', fontWeight: 600, fontSize: '0.92rem' }}>
            ✨ Synchronisation réussie ! {syncResult.synchronized_count} élève(s) synchronisé(s) depuis la table d'authentification.
          </p>
          <button 
            onClick={() => setSyncResult(null)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Stats Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: isMobile ? '0.75rem' : '1.5rem', marginBottom: '2.5rem' }}>
        {stats.map((stat, idx) => (
          <div key={idx} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ 
              width: '48px', height: '48px', borderRadius: '12px', background: `${stat.color}15`, 
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color 
            }}>
              <stat.icon size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>{stat.label}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Table Controls ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ position: 'relative', width: isMobile ? '100%' : '350px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Rechercher un élève..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              width: '100%', padding: '0.75rem 1rem 0.75rem 3rem', background: 'var(--bg-glass)', 
              border: '1px solid var(--border)', borderRadius: '12px', color: 'white', outline: 'none'
            }}
          />
        </div>
      </div>

      {/* ── Users Table ── */}
      <div className="glass-panel" style={{ overflow: 'hidden', padding: 0 }}>
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '1.25rem 1.5rem', fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Étudiant</th>
              <th style={{ padding: '1.25rem 1.5rem', fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Inscription</th>
              <th style={{ padding: '1.25rem 1.5rem', fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Score Global</th>
              <th style={{ padding: '1.25rem 1.5rem', fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Statut Plan</th>
              <th style={{ padding: '1.25rem 1.5rem', fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Users size={40} style={{ margin: '0 auto 1rem', opacity: 0.3, display: 'block' }} />
                  <p style={{ margin: 0, fontWeight: 600 }}>
                    {searchTerm ? 'Aucun élève trouvé pour cette recherche.' : 'Aucun élève inscrit pour le moment.'}
                  </p>
                  {!searchTerm && (
                    <button onClick={handleRefresh} style={{ marginTop: '0.75rem', padding: '0.5rem 1rem', background: 'var(--violet)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
                      Actualiser la liste
                    </button>
                  )}
                </td>
              </tr>
            ) : filteredUsers.map(u => (
              <tr 
                key={u.id} 
                className="table-row-hover" 
                onClick={() => navigate(`/admin/users/${u.id}`)}
                style={{ borderBottom: '1px solid var(--border)', transition: 'all 0.2s', cursor:'pointer' }}
              >
                <td style={{ padding: '1.25rem 1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ position: 'relative' }}>
                      <div style={{ 
                        width: '40px', height: '40px', borderRadius: '50%', 
                        background: 'linear-gradient(45deg, var(--primary), var(--accent))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: 'white', fontSize: '0.9rem'
                      }}>
                        {u.name?.charAt(0) || '?'}
                      </div>
                      {isUserOnline(u) && (
                        <span 
                          style={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            background: '#10B981',
                            border: '2px solid var(--bg-card)',
                            boxShadow: '0 0 8px #10B981',
                            animation: 'pulseGreen 2s infinite'
                          }}
                          title="En ligne"
                        />
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{u.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  {u.joined || '15 Mai 2026'}
                </td>
                <td style={{ padding: '1.25rem 1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--emerald)' }}>{u.xp} XP</span>
                    <TrendingUp size={14} color="var(--emerald)" />
                  </div>
                </td>
                <td style={{ padding: '1.25rem 1.5rem' }}>
                  {u.tier === 'premium' ? (
                    <span style={{ 
                      display: 'inline-flex', alignItems: 'center', gap: '0.4rem', 
                      color: 'var(--warning)', background: 'rgba(245, 158, 11, 0.1)', 
                      padding: '0.4rem 0.8rem', borderRadius: '0.75rem', fontSize: '0.75rem', fontWeight: 900 
                    }}>
                      <Crown size={14} /> PREMIUM
                    </span>
                  ) : (
                    <span style={{ 
                      display: 'inline-flex', alignItems: 'center', gap: '0.4rem', 
                      color: 'var(--text-muted)', background: 'rgba(255, 255, 255, 0.05)', 
                      padding: '0.4rem 0.8rem', borderRadius: '0.75rem', fontSize: '0.75rem', fontWeight: 900 
                    }}>
                      <User size={14} /> GRATUIT
                    </span>
                  )}
                </td>
                <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                  <ChevronRight size={20} color="var(--text-muted)" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
