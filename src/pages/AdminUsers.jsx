import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { deleteUser } from '../services/userService';
import { Trash } from 'lucide-react';

// inside component
const handleDelete = async (uid, e) => {
  e.stopPropagation();
  if (!window.confirm('هل تريد حذف هذا المستخدم بشكل دائم؟')) return;
  const success = await deleteUser(uid);
  if (success) {
    await refreshAdminData();
  }
};


export default function AdminUsers() {
  const { users, updateUserTier, refreshAdminData } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();

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

  const toggleTier = (userId, currentTier) => {
    const newTier = currentTier === 'premium' ? 'freemium' : 'premium';
    updateUserTier(userId, newTier);
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
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
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
      </header>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>

      {/* ── Stats Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative', width: '350px' }}>
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
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
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
                    <div style={{ 
                      width: '40px', height: '40px', borderRadius: '50%', 
                      background: 'linear-gradient(45deg, var(--primary), var(--accent))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: 'white', fontSize: '0.9rem'
                    }}>
                      {u.name?.charAt(0) || '?'}
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
  );
}
