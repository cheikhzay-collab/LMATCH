import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, BrainCircuit, BookOpen, UploadCloud,
  LogOut, Trophy, Library, Users, Settings, Zap, Sun, Moon, GraduationCap, Sparkles, BookMarked, Camera, Megaphone, Crown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { user, logout, theme, toggleTheme } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); };

  const isStudent = user?.role === 'student';
  const isAdmin   = user?.role === 'admin';

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '2.5rem', padding: '0 0.25rem' }}>
        <div style={{
          width: 36, height: 36, borderRadius: '10px',
          background: 'linear-gradient(135deg, var(--violet), var(--emerald))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0
        }}>
          <BrainCircuit size={20} color="#fff" />
        </div>
        <span style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>
          L'<span style={{ background: 'linear-gradient(135deg, var(--violet), var(--emerald))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>CONQ</span>
        </span>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
        {!user && (
          <>
            <p style={{
              color: 'var(--text-subtle)', fontSize: '0.7rem', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.1em',
              padding: '0 0.875rem', marginBottom: '0.5rem', marginTop: '0.25rem'
            }}>
              Visiteur
            </p>
            <NavLink to="/schools" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <GraduationCap size={18} /> Grandes Écoles
            </NavLink>
          </>
        )}

        {isStudent && (
          <>
            <p style={{
              color: 'var(--text-subtle)', fontSize: '0.7rem', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.1em',
              padding: '0 0.875rem', marginBottom: '0.5rem', marginTop: '0.25rem'
            }}>
              Espace Élève
            </p>
            <NavLink to="/dashboard" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <LayoutDashboard size={18} /> Tableau de bord
            </NavLink>
            <NavLink to="/schools" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <GraduationCap size={18} /> Grandes Écoles
            </NavLink>
            <NavLink to="/scanner" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <Camera size={18} /> Scanner QCM
            </NavLink>
            <NavLink to="/study" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <BookOpen size={18} /> Révision SRS
            </NavLink>
            <NavLink to="/ranking" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <Trophy size={18} /> Classement
            </NavLink>
            <NavLink to="/subscription" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <Crown size={18} /> Mon Abonnement
            </NavLink>
          </>
        )}

        {isAdmin && (
          <>
            <p style={{
              color: 'var(--text-subtle)', fontSize: '0.7rem', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.1em',
              padding: '0 0.875rem', marginBottom: '0.5rem', marginTop: '0.25rem'
            }}>
              Centre de Contrôle
            </p>
            <NavLink to="/admin/dashboard" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <LayoutDashboard size={18} /> Vue d'ensemble
            </NavLink>
            <NavLink to="/schools" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <GraduationCap size={18} /> Grandes Écoles
            </NavLink>
            <NavLink to="/scanner" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <Camera size={18} /> Scanner QCM
            </NavLink>
            <NavLink to="/admin/exams" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <Library size={18} /> Bibliothèque QCM
            </NavLink>
            <NavLink to="/admin/users" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <Users size={18} /> Élèves
            </NavLink>
            <NavLink to="/admin/upload" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <UploadCloud size={18} /> Upload QCM
            </NavLink>
            <NavLink to="/admin/ai-import" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <Sparkles size={18} /> Import IA
            </NavLink>
            <NavLink to="/admin/ebooks" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <BookMarked size={18} /> E-Books
            </NavLink>
            <NavLink to="/admin/settings" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <Settings size={18} /> Paramètres
            </NavLink>
          </>
        )}
      </nav>

      {/* User card */}
      {!user ? (
        <button 
          onClick={() => navigate('/login')}
          className="btn animate-fade-in"
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, var(--violet), #818cf8)',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-lg)',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)'
          }}
        >
          <Zap size={15} /> Connexion / Inscription
        </button>
      ) : (
        <div style={{
          background: 'var(--bg-glass)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '0.875rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
            {/* Avatar */}
            <div style={{
              width: 36, height: 36, borderRadius: '10px', flexShrink: 0,
              background: isAdmin
                ? 'linear-gradient(135deg, var(--violet), #818cf8)'
                : 'linear-gradient(135deg, var(--emerald), #34d399)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: '0.9rem', color: '#fff'
            }}>
              {user?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p style={{ fontWeight: 700, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                {isStudent && (
                  <span 
                    className={`badge ${user?.tier === 'premium' ? 'badge-pro' : 'badge-free'}`}
                    onClick={() => navigate('/subscription')}
                    style={{ cursor: 'pointer' }}
                    title="Gérer mon abonnement"
                  >
                    {user?.tier === 'premium' ? <><Zap size={10} />Pro</> : 'Free'}
                  </span>
                )}
                {isAdmin && <span className="badge badge-emerald">Admin</span>}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
              style={{
                background: 'transparent', border: 'none',
                color: theme === 'dark' ? 'var(--warning)' : 'var(--violet)',
                cursor: 'pointer', padding: '4px', borderRadius: '6px',
                transition: 'all 0.2s', display: 'flex', alignItems: 'center'
              }}
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-subtle)', cursor: 'pointer', padding: '4px', borderRadius: '6px', transition: 'color 0.2s', display: 'flex', alignItems: 'center' }}
              title="Déconnexion"
              onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-subtle)'}
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
