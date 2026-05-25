import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, Trophy, GraduationCap,
  Library, Users, UploadCloud, LogOut, Sun, Moon, Camera,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function BottomNav() {
  const { user, logout, theme, toggleTheme } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const indicatorRef = useRef(null);
  const navRef       = useRef(null);
  const [showSheet, setShowSheet] = useState(false);

  const isStudent = user?.role === 'student';

  const studentItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Accueil'  },
    { to: '/schools',   icon: GraduationCap,   label: 'Écoles'   },
    { to: '/scanner',   icon: Camera,          label: 'Scanner'  },
    { to: '/study',     icon: BookOpen,         label: 'Réviser'  },
    { to: '/ranking',   icon: Trophy,           label: 'Rank'     },
  ];

  const adminItems = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Overview' },
    { to: '/admin/exams',     icon: Library,          label: 'QCMs'    },
    { to: '/scanner',         icon: Camera,           label: 'Scanner' },
    { to: '/admin/users',     icon: Users,            label: 'Élèves'  },
    { to: '/admin/upload',    icon: UploadCloud,      label: 'Upload'  },
  ];

  const items = isStudent ? studentItems : adminItems;

  /* Sliding pill indicator */
  useEffect(() => {
    const nav = navRef.current;
    const indicator = indicatorRef.current;
    if (!nav || !indicator) return;
    const activeEl = nav.querySelector('.mob-nav-item.active');
    if (!activeEl) return;
    const navRect  = nav.getBoundingClientRect();
    const itemRect = activeEl.getBoundingClientRect();
    indicator.style.transform = `translateX(${itemRect.left - navRect.left + (itemRect.width - 36) / 2}px)`;
  }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/'); setShowSheet(false); };

  /* Avatar initial */
  const initial = (user?.name || user?.email || '?')[0].toUpperCase();

  return (
    <>
      {/* ── Bottom navigation bar ── */}
      <nav className="mobile-bottom-nav" aria-label="Navigation principale">
        <div className="mob-nav-indicator" ref={indicatorRef} />

        <div className="mob-nav-items" ref={navRef}>
          {items.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `mob-nav-item${isActive ? ' active' : ''}`}
              end={to === '/dashboard' || to === '/admin/dashboard'}
            >
              <div className="mob-nav-icon-wrap">
                <Icon size={22} strokeWidth={1.8} />
              </div>
              <span className="mob-nav-label">{label}</span>
            </NavLink>
          ))}

          {/* Avatar button → opens profile sheet */}
          <button
            className="mob-nav-item"
            onClick={() => setShowSheet(true)}
            title="Profil & Déconnexion"
            style={{ position: 'relative' }}
          >
            <div className="mob-nav-icon-wrap" style={{ position: 'relative' }}>
              {/* Avatar circle */}
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--violet), var(--emerald))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.78rem', fontWeight: 900, color: '#fff',
                border: '2px solid rgba(255,255,255,0.12)',
              }}>
                {initial}
              </div>
            </div>
            <span className="mob-nav-label">Moi</span>
          </button>
        </div>
      </nav>

      {/* ── Profile / Logout bottom sheet ── */}
      {showSheet && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setShowSheet(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 450,
              background: 'rgba(2, 6, 23, 0.6)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
            }}
          />

          {/* Sheet */}
          <div
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 460,
              background: 'var(--bg-card)',
              borderRadius: '1.75rem 1.75rem 0 0',
              border: '1px solid var(--border)',
              borderBottom: 'none',
              paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))',
              boxShadow: '0 -12px 48px rgba(0,0,0,0.4)',
              animation: 'sheetSlideUp 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          >
            {/* Drag handle */}
            <div style={{
              width: 40, height: 4, borderRadius: 99,
              background: 'var(--border)',
              margin: '0.875rem auto 0',
            }} />

            {/* ── User card ── */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.875rem',
              padding: '1.25rem 1.5rem 1.125rem',
              borderBottom: '1px solid var(--border)',
            }}>
              {/* Avatar */}
              <div style={{
                width: 52, height: 52, borderRadius: '15px', flexShrink: 0,
                background: 'linear-gradient(135deg, var(--violet), var(--emerald))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.5rem', fontWeight: 900, color: '#fff',
                boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
              }}>
                {initial}
              </div>

              {/* Name + email */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontWeight: 800, fontSize: '1rem', margin: 0,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  color: 'var(--text-main)',
                }}>
                  {user?.name || 'Utilisateur'}
                </p>
                <p style={{
                  color: 'var(--text-muted)', fontSize: '0.78rem', margin: '3px 0 0',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {user?.email}
                </p>
              </div>

              {/* Tier badge */}
              <span 
                onClick={() => {
                  if (isStudent) {
                    navigate('/subscription');
                    setShowSheet(false);
                  }
                }}
                style={{
                  padding: '0.28rem 0.7rem', borderRadius: 99,
                  fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em',
                  background: user?.tier === 'premium' ? 'var(--violet-soft)' : 'var(--bg-glass)',
                  color:      user?.tier === 'premium' ? 'var(--violet)'      : 'var(--text-muted)',
                  border: `1px solid ${user?.tier === 'premium' ? 'rgba(99,102,241,0.3)' : 'var(--border)'}`,
                  flexShrink: 0,
                  cursor: isStudent ? 'pointer' : 'default'
                }}
                title={isStudent ? "Gérer mon abonnement" : undefined}
              >
                {user?.tier === 'premium' ? '⚡ Pro' : 'Free'}
              </span>
            </div>

            {/* ── Actions ── */}
            <div style={{ padding: '0.875rem 1.25rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>

              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.875rem',
                  padding: '0.875rem 1rem',
                  background: 'var(--bg-glass)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  cursor: 'pointer', width: '100%',
                  fontFamily: 'inherit', textAlign: 'left',
                  transition: 'background 0.15s',
                }}
              >
                <div style={{
                  width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                  background: 'var(--bg-hover)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {theme === 'dark'
                    ? <Sun  size={19} color="var(--warning)" />
                    : <Moon size={19} color="var(--violet)"  />
                  }
                </div>
                <span style={{ fontWeight: 700, fontSize: '0.93rem', color: 'var(--text-main)', flex: 1 }}>
                  {theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
                </span>
              </button>

              {/* ── Logout ── */}
              <button
                onClick={handleLogout}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.875rem',
                  padding: '0.875rem 1rem',
                  background: 'var(--danger-soft)',
                  border: '1px solid rgba(239,68,68,0.22)',
                  borderRadius: 'var(--radius-lg)',
                  cursor: 'pointer', width: '100%',
                  fontFamily: 'inherit', textAlign: 'left',
                  transition: 'background 0.15s',
                }}
              >
                <div style={{
                  width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                  background: 'rgba(239,68,68,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <LogOut size={19} color="var(--danger)" />
                </div>
                <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--danger)', flex: 1 }}>
                  Se déconnecter
                </span>
              </button>

              {/* Cancel */}
              <button
                onClick={() => setShowSheet(false)}
                style={{
                  padding: '0.75rem', background: 'transparent', border: 'none',
                  borderRadius: 'var(--radius-lg)', cursor: 'pointer',
                  fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-muted)',
                  fontFamily: 'inherit', marginTop: '0.125rem',
                }}
              >
                Annuler
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
