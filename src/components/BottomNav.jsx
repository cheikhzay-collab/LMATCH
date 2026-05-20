import React, { useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, Trophy, GraduationCap,
  Library, Users, UploadCloud, Settings, LogOut, Sun, Moon,
  Zap, BrainCircuit, Camera
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function BottomNav() {
  const { user, logout, theme, toggleTheme } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const indicatorRef = useRef(null);
  const navRef = useRef(null);

  const isStudent = user?.role === 'student';
  const isAdmin   = user?.role === 'admin';

  const studentItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Accueil' },
    { to: '/schools',   icon: GraduationCap,  label: 'Écoles'  },
    { to: '/scanner',   icon: Camera,         label: 'Scanner' },
    { to: '/study',     icon: BookOpen,        label: 'Réviser' },
    { to: '/ranking',   icon: Trophy,          label: 'Rank'    },
  ];

  const adminItems = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Overview' },
    { to: '/admin/exams',     icon: Library,          label: 'QCMs'     },
    { to: '/scanner',         icon: Camera,           label: 'Scanner'  },
    { to: '/admin/users',     icon: Users,            label: 'Élèves'   },
    { to: '/admin/upload',    icon: UploadCloud,      label: 'Upload'   },
  ];

  const items = isStudent ? studentItems : adminItems;

  // Slide the active indicator
  useEffect(() => {
    const nav = navRef.current;
    const indicator = indicatorRef.current;
    if (!nav || !indicator) return;
    const activeEl = nav.querySelector('.mob-nav-item.active');
    if (!activeEl) return;
    const navRect = nav.getBoundingClientRect();
    const itemRect = activeEl.getBoundingClientRect();
    const left = itemRect.left - navRect.left + (itemRect.width - 36) / 2;
    indicator.style.transform = `translateX(${left}px)`;
  }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <nav className="mobile-bottom-nav" aria-label="Navigation principale">
      {/* Sliding pill indicator */}
      <div className="mob-nav-indicator" ref={indicatorRef} />

      {/* Nav items */}
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

        {/* Theme toggle */}
        <button
          className="mob-nav-item"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
        >
          <div className="mob-nav-icon-wrap">
            {theme === 'dark'
              ? <Sun size={22} strokeWidth={1.8} />
              : <Moon size={22} strokeWidth={1.8} />
            }
          </div>
          <span className="mob-nav-label">Thème</span>
        </button>
      </div>
    </nav>
  );
}
